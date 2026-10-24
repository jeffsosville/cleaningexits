// One way to add someone to this vertical's list, shared by every site.
// Rows live in the business-listings `subscribers` table, one per (email, vertical);
// `upsert_subscriber` (SQL) handles merging, unsubscribe suppression and the consent log.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { BRAND } from './brand';

let client: SupabaseClient | null = null;
export function subscribersDb(): SupabaseClient {
  if (!client) {
    const url = process.env.SUBSCRIBERS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUBSCRIBERS_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Subscriber database is not configured');
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}

export { NDA_OPT_IN_TEXT } from './brand';

export type SubscribeInput = {
  email: string;
  source: string;
  role?: 'buyer' | 'seller';
  /** true when consent is already given (NDA opt-in box); false = double opt-in by email */
  confirmed?: boolean;
  /** true for a deliberate signup form; false for a pre-checked box (never re-adds an unsubscribe) */
  explicit?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  listingSlug?: string | null;
  tags?: string[];
  profile?: Record<string, string | null | undefined>;
  consentText?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type SubscribeResult = {
  status: 'created' | 'updated' | 'suppressed';
  confirmed: boolean;
  confirmationToken: string | null;
  unsubscribeToken: string | null;
};

export async function subscribe(i: SubscribeInput): Promise<SubscribeResult> {
  const { data, error } = await subscribersDb().rpc('upsert_subscriber', {
    p_email: i.email,
    p_vertical: BRAND.vertical,
    p_source: i.source,
    p_role: i.role || 'buyer',
    p_confirmed: !!i.confirmed,
    p_explicit: i.explicit !== false,
    p_first_name: i.firstName || null,
    p_last_name: i.lastName || null,
    p_phone: i.phone || null,
    p_listing_slug: i.listingSlug || null,
    p_tags: i.tags || [],
    p_profile: i.profile || {},
    p_consent_text: i.consentText || null,
    p_ip: i.ip || null,
    p_user_agent: i.userAgent || null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    status: row.status,
    confirmed: row.confirmed,
    confirmationToken: row.confirmation_token,
    unsubscribeToken: row.unsubscribe_token,
  };
}

export async function logConsent(email: string, action: 'confirm' | 'unsubscribe', source: string) {
  await subscribersDb().from('email_consent').insert({ email: email.toLowerCase(), vertical: BRAND.vertical, action, source });
}

export const unsubscribeUrl = (token: string | null) => `${BRAND.site}/unsubscribe?token=${token || ''}`;

/** Double opt-in email for the site signup form. */
export async function sendConfirmEmail(email: string, firstName: string | null | undefined, r: SubscribeResult) {
  if (!process.env.RESEND_API_KEY || !r.confirmationToken) return;
  const confirmUrl = `${BRAND.site}/confirm?token=${r.confirmationToken}`;
  await resendSend({
    from: BRAND.from,
    to: email,
    reply_to: BRAND.replyTo,
    subject: `Confirm your ${BRAND.firm} subscription`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937;line-height:1.6">
<p>${firstName ? `Hi ${esc(firstName)},` : 'Hi,'}</p>
<p>Confirm your email and you'll get the ${BRAND.firm} weekly: new ${BRAND.nounPlural} for sale, the best opportunities in the market, and what they're selling for.</p>
<p style="margin:28px 0"><a href="${confirmUrl}" style="background:${BRAND.accent};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Confirm subscription</a></p>
<p style="color:#6b7280;font-size:13px">If you didn't sign up, ignore this email and you won't hear from us.</p>
<p style="color:#9ca3af;font-size:12px">${BRAND.firm} · <a href="${unsubscribeUrl(r.unsubscribeToken)}" style="color:#9ca3af">Unsubscribe</a></p>
</div>`,
  });
}

export function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Resend's REST API directly (the SDK pulls in @react-email/render, which these sites don't install).
type ResendEmail = { from: string; to: string; reply_to?: string; subject: string; html: string; text?: string; headers?: Record<string, string> };
async function resendCall(path: string, body: unknown) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}
export const resendSend = (e: ResendEmail) => resendCall('/emails', e);
/** Up to 100 emails per call. */
export const resendBatch = (emails: ResendEmail[]) => resendCall('/emails/batch', emails);
