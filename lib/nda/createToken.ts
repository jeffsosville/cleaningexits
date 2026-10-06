import { randomBytes } from 'crypto';
import { getCrmSupabase } from '@/lib/crmSupabase';
import { getOurListingById } from '@/data/ourListings';
import { getVerticalId } from '@/lib/crmInbound';

/**
 * Ported from atmbrokerage-next/lib/nda/createToken.ts.
 *
 * One difference that matters: ATM resolves deal_id by looking up
 * `atm_routes` by slug. CleaningExits listings live in git (data/ourListings.ts),
 * not in a table, so the deal_id comes off the listing record's `crmDealId`.
 * Set that once per listing after creating the deal in the CRM; without it the
 * NDA still records, but the buyer's Deal Hub renders empty.
 */

export type CreateTokenInput = {
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_company?: string | null;
  buyer_budget_range?: string | null;
  interest_notes?: string | null;
  source_listing_slug: string;
  source_url: string;
  referrer?: string | null;
  user_agent?: string | null;
  listing_title: string;
  listing_asking_price_display: string | null;
  ip_address?: string | null;
  nda_version?: string | null;
  nda_text?: string | null;
};

export type CreateTokenResult = {
  success: boolean;
  token?: string;
  dealHubUrl?: string;
  error?: string;
};

const NOTIFY_FROM = 'CleaningExits <notifications@cleaningexits.com>';
const NOTIFY_TO = ['john@atmbrokerage.com', 'hello@cleaningexits.com'];
const REPLY_TO = 'hello@cleaningexits.com';

export async function createNDAToken(
  input: CreateTokenInput
): Promise<CreateTokenResult> {
  const supabase = getCrmSupabase();
  const token = randomBytes(16).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const listing = await getOurListingById(input.source_listing_slug);
  const dealId: string | null = listing?.crmDealId ?? null;

  if (!dealId) {
    console.error(
      `[NDA] UNMATCHED slug="${input.source_listing_slug}". ` +
      `Set crmDealId on this listing in data/ourListings.ts so the Deal Hub populates.`
    );
  }

  // PRIMARY WRITE — deal_tokens (the Deal Hub reads this)
  const { error: insertError } = await supabase.from('deal_tokens').insert({
    // The CRM also derives this from the deal, but set it so an unmatched NDA still lands in the right vertical
    vertical_id: await getVerticalId(),
    token,
    deal_id: dealId,
    listing_id: dealId,
    expires_at: expiresAt.toISOString(),
    buyer_name: input.buyer_name,
    buyer_email: input.buyer_email,
    buyer_phone: input.buyer_phone,
    buyer_company: input.buyer_company ?? null,
    buyer_budget_range: input.buyer_budget_range ?? null,
    interest_notes: input.interest_notes ?? null,
    source_listing_slug: input.source_listing_slug,
    source_url: input.source_url,
    referrer: input.referrer ?? null,
    user_agent: input.user_agent ?? null,
    ip_address: input.ip_address ?? null,
    nda_version: input.nda_version ?? null,
    nda_text: input.nda_text ?? null,
    status: 'active',
    signed_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('createNDAToken insert error:', insertError.message);
    return { success: false, error: insertError.message };
  }

  const dealHubBase =
    process.env.DEAL_HUB_URL ?? 'https://atm-brokerage-crm.vercel.app';
  const dealHubUrl = `${dealHubBase}/deals/${token}`;

  // Secondary write — deal_buyer_access (best effort; never block the buyer)
  try {
    await supabase.from('deal_buyer_access').insert({
      token,
      deal_id: dealId,
      buyer_name: input.buyer_name,
      buyer_email: input.buyer_email,
      buyer_phone: input.buyer_phone,
    });
  } catch (err) {
    console.error('deal_buyer_access write failed (non-fatal):', err);
  }

  await sendEmails(input, dealHubUrl, token, !!dealId);

  try {
    await subscribeToMailchimp({
      email: input.buyer_email,
      first_name: input.buyer_name.split(' ')[0] ?? '',
      last_name: input.buyer_name.split(' ').slice(1).join(' ') || '',
      phone: input.buyer_phone,
      company: input.buyer_company ?? '',
    });
  } catch (err) {
    console.error('Mailchimp subscribe failed (non-fatal):', err);
  }

  return { success: true, token, dealHubUrl };
}

async function sendEmails(
  input: CreateTokenInput,
  dealHubUrl: string,
  token: string,
  matched: boolean
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('RESEND_API_KEY missing - NDA recorded but no email sent.');
    return;
  }

  // Resend's REST API directly rather than the SDK, which pulls in
  // @react-email/render and breaks the build for no benefit here.
  const send = async (payload: Record<string, unknown>) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error('Resend error', res.status, (await res.text()).slice(0, 300));
    }
  };

  try {
    await send({
      from: NOTIFY_FROM,
      to: [input.buyer_email],
      reply_to: REPLY_TO,
      subject: `Your access to the ${input.listing_title} data room`,
      html: buyerHtml(input, dealHubUrl),
      text: buyerText(input, dealHubUrl),
    });
  } catch (err) {
    console.error('Buyer email failed:', err);
  }

  try {
    await send({
      from: NOTIFY_FROM,
      to: NOTIFY_TO,
      reply_to: input.buyer_email,
      subject: `[NDA${matched ? '' : ' - UNMATCHED'}] ${input.buyer_name} - ${input.listing_title}`,
      html: brokerHtml(input, dealHubUrl, token, matched),
    });
  } catch (err) {
    console.error('Broker email failed:', err);
  }
}

async function subscribeToMailchimp(args: {
  email: string; first_name: string; last_name: string;
  phone: string; company: string;
}): Promise<void> {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;
  if (!apiKey || !listId) return;
  const dataCenter = apiKey.split('-')[1];
  if (!dataCenter) return;

  const crypto = await import('crypto');
  const emailHash = crypto
    .createHash('md5')
    .update(args.email.toLowerCase())
    .digest('hex');
  const auth = `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`;
  const base = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members/${emailHash}`;

  await fetch(base, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({
      email_address: args.email,
      status_if_new: 'subscribed',
      status: 'subscribed',
      merge_fields: {
        FNAME: args.first_name, LNAME: args.last_name,
        PHONE: args.phone, COMPANY: args.company,
      },
      tags: ['nda-signed', 'cleaning'],
    }),
  });

  await fetch(`${base}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: JSON.stringify({
      tags: [
        { name: 'nda-signed', status: 'active' },
        { name: 'cleaning', status: 'active' },
      ],
    }),
  });
}

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buyerHtml(i: CreateTokenInput, url: string): string {
  const price = i.listing_asking_price_display ? ` - ${i.listing_asking_price_display}` : '';
  return `
<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#1a1612;line-height:1.6;max-width:600px;margin:0 auto;padding:24px;">
<p>Hi ${esc(i.buyer_name)},</p>
<p>Thanks for submitting your NDA for the <strong>${esc(i.listing_title)}${esc(price)}</strong>.</p>
<p>You now have access to the data room:</p>
<p style="margin:24px 0;"><a href="${url}" style="background:#b45309;color:#fff;padding:14px 22px;text-decoration:none;border-radius:4px;font-weight:600;display:inline-block;">Open the Data Room</a></p>
<p style="font-size:13px;color:#4a443b;">Or paste this into your browser: <a href="${url}" style="color:#b45309;">${url}</a></p>
<p>Questions go through the data room and we will respond promptly.</p>
<p>Thanks again,<br>&mdash; The CleaningExits Team</p>
<p style="font-size:12px;color:#8a8275;margin-top:32px;border-top:1px solid #e5e0d5;padding-top:16px;">
<a href="https://cleaningexits.com" style="color:#8a8275;">cleaningexits.com</a> &middot; <a href="mailto:hello@cleaningexits.com" style="color:#8a8275;">hello@cleaningexits.com</a> &middot; +1 888-430-5535
</p></body></html>`.trim();
}

function buyerText(i: CreateTokenInput, url: string): string {
  const price = i.listing_asking_price_display ? ` - ${i.listing_asking_price_display}` : '';
  return `Hi ${i.buyer_name},

Thanks for submitting your NDA for the ${i.listing_title}${price}.

You now have access to the data room:

${url}

Questions go through the data room and we will respond promptly.

-- The CleaningExits Team
cleaningexits.com | hello@cleaningexits.com | +1 888-430-5535
`;
}

function brokerHtml(
  i: CreateTokenInput, url: string, token: string, matched: boolean
): string {
  const price = i.listing_asking_price_display ? ` (${i.listing_asking_price_display})` : '';
  const banner = matched ? '' : `
<div style="background:#fef2f2;border:1px solid #fecaca;padding:12px 16px;border-radius:4px;margin-bottom:24px;color:#991b1b;">
<strong>This NDA could not be matched to a CRM deal.</strong><br>
The buyer's Deal Hub will be empty. Set <code>crmDealId</code> for
<code>${esc(i.source_listing_slug)}</code> in data/ourListings.ts.
</div>`;

  return `
<!DOCTYPE html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#1a1612;line-height:1.55;max-width:640px;margin:0 auto;padding:24px;">
<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#b45309;margin-bottom:8px;">New NDA Lead - CleaningExits</div>
<h2 style="margin:0 0 24px 0;font-size:22px;">${esc(i.buyer_name)} - ${esc(i.listing_title)}${esc(price)}</h2>
${banner}
<table style="border-collapse:collapse;width:100%;margin-bottom:24px;">
<tr><td style="padding:6px 16px 6px 0;font-weight:bold;width:130px;">Name:</td><td style="padding:6px 0;">${esc(i.buyer_name)}</td></tr>
<tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Email:</td><td style="padding:6px 0;"><a href="mailto:${esc(i.buyer_email)}">${esc(i.buyer_email)}</a></td></tr>
<tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Phone:</td><td style="padding:6px 0;"><a href="tel:${esc(i.buyer_phone)}">${esc(i.buyer_phone)}</a></td></tr>
${i.buyer_company ? `<tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Company:</td><td style="padding:6px 0;">${esc(i.buyer_company)}</td></tr>` : ''}
${i.buyer_budget_range ? `<tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Budget:</td><td style="padding:6px 0;">${esc(i.buyer_budget_range)}</td></tr>` : ''}
<tr><td style="padding:6px 16px 6px 0;font-weight:bold;">Listing:</td><td style="padding:6px 0;"><a href="${i.source_url}">${esc(i.listing_title)}</a></td></tr>
</table>
${i.interest_notes ? `<div style="background:#fef7ed;border-left:3px solid #b45309;padding:16px 20px;margin-bottom:24px;">
<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#8a8275;margin-bottom:8px;">Why they are interested</div>
<div style="white-space:pre-wrap;">${esc(i.interest_notes)}</div></div>` : ''}
<p style="margin-top:24px;"><a href="${url}" style="background:#1a1612;color:#fff;padding:12px 18px;text-decoration:none;border-radius:4px;font-weight:600;display:inline-block;">View Their Deal Hub</a></p>
<p style="font-size:12px;color:#8a8275;margin-top:32px;border-top:1px solid #e5e0d5;padding-top:16px;">
Token: <code>${esc(token)}</code><br>Source: ${esc(i.source_url)}
</p></body></html>`.trim();
}
