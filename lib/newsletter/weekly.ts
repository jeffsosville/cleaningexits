// The weekly email for this vertical. Same code on every vertical site; content comes from:
//  - our own listings (CRM inhouse_listings, via data/ourListings)
//  - live third-party listings from DealLedger (vertical_feed_listings RPC; vertical_feeds table decides what counts)
import { createClient } from '@supabase/supabase-js';
import { getOurListings, type OurListing } from '@/data/ourListings';
import { BRAND } from './brand';
import { subscribersDb, unsubscribeUrl, esc, resendBatch } from './subscribers';

// DealLedger is a public, read-only warehouse; the feed function is granted to the anon role.
const DL_URL = process.env.DEALLEDGER_SUPABASE_URL || 'https://kqckuedsyyosmccushyd.supabase.co';
const DL_KEY = process.env.DEALLEDGER_SUPABASE_SERVICE_KEY || 'sb_publishable_7fEXQi5b5r08tYrFq069Yw_OS7aqobk';

export type FeedListing = {
  id: string; title: string; city: string | null; state: string | null;
  price: number | null; cash_flow: number | null; revenue: number | null;
  url: string; broker: string | null; first_seen: string | null; days_on_market: number | null;
  quality_tier: string | null; is_new: boolean; meets_min_cash_flow: boolean;
};

export type WeeklyContent = {
  weekOf: string;
  ours: OurListing[];
  fresh: FeedListing[];
  top: FeedListing[];
  stats: { live: number; newThisWeek: number; medianPrice: number | null; medianMultiple: number | null; topState: string | null };
};

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
// A cash flow at or above the asking price is almost always a data-entry error on the source listing.
const plausible = (l: FeedListing) => !l.price || !l.cash_flow || l.cash_flow < l.price;

export async function buildWeekly(): Promise<WeeklyContent> {
  const dl = createClient(DL_URL, DL_KEY, { auth: { persistSession: false } });
  const [{ data, error }, ours] = await Promise.all([
    dl.rpc('vertical_feed_listings', { p_vertical: BRAND.vertical, p_days: 14 }),
    getOurListings().catch(() => [] as OurListing[]),
  ]);
  if (error) throw error;
  const all = ((data || []) as FeedListing[]).filter(plausible);

  const fresh = all.filter((l) => l.is_new).sort((a, b) => (b.cash_flow || 0) - (a.cash_flow || 0)).slice(0, 6);
  const freshIds = new Set(fresh.map((l) => l.id));
  // Main-street deals our readers can actually buy; skip the $5M+ outliers.
  const top = all.filter((l) => l.meets_min_cash_flow && !freshIds.has(l.id) && (l.price || 0) <= 5_000_000)
    .sort((a, b) => (b.cash_flow || 0) - (a.cash_flow || 0)).slice(0, 8);

  const priced = all.filter((l) => l.price && l.cash_flow && l.cash_flow > 0);
  const states: Record<string, number> = {};
  all.forEach((l) => { if (l.state) states[l.state] = (states[l.state] || 0) + 1; });

  return {
    weekOf: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }),
    ours: ours.filter((l) => l.status !== 'sold'),
    fresh,
    top,
    stats: {
      live: all.length,
      newThisWeek: all.filter((l) => l.is_new).length,
      medianPrice: median(priced.map((l) => l.price as number)),
      medianMultiple: median(priced.map((l) => (l.price as number) / (l.cash_flow as number))),
      topState: Object.entries(states).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
    },
  };
}

const money = (n: number | null | undefined) =>
  n == null ? '—' : n >= 1e6 ? `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${n}`;
const place = (c?: string | null, s?: string | null) => [c, s].filter(Boolean).join(', ');

function row(title: string, href: string, meta: string, badge?: string) {
  return `<tr><td style="padding:12px 0;border-bottom:1px solid #e5e7eb">
<a href="${esc(href)}" style="color:#111827;font-weight:600;text-decoration:none;font-size:15px">${esc(title)}</a>${badge ? ` <span style="background:${BRAND.accent};color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;vertical-align:middle">${badge}</span>` : ''}
<div style="color:#6b7280;font-size:13px;margin-top:3px">${meta}</div></td></tr>`;
}
const feedMeta = (l: FeedListing) =>
  [place(l.city, l.state), `Asking ${money(l.price)}`, l.cash_flow ? `Cash flow ${money(l.cash_flow)}` : null, l.broker ? esc(l.broker) : null]
    .filter(Boolean).join(' · ');
const section = (title: string, rows: string) =>
  rows ? `<h2 style="font-size:17px;margin:28px 0 4px;color:#111827">${title}</h2><table width="100%" cellpadding="0" cellspacing="0">${rows}</table>` : '';

export function renderWeekly(c: WeeklyContent, unsubscribeToken: string | null): { subject: string; html: string; text: string } {
  const s = c.stats;
  const subject = c.ours.length
    ? `${BRAND.firm} weekly: ${c.ours[0].title}${s.newThisWeek ? ` + ${s.newThisWeek} new on the market` : ''}`
    : `${BRAND.firm} weekly: ${s.newThisWeek} new ${BRAND.nounPlural} for sale`;

  const ours = c.ours.map((l) => row(l.title, `${BRAND.site}/listing/${l.id}`,
    [place(l.city, l.state), l.price ? `Asking ${money(l.price)}` : 'Price on request', l.cash_flow ? `Cash flow ${money(l.cash_flow)}` : null].filter(Boolean).join(' · '),
    l.status === 'under_loi' ? 'UNDER LOI' : 'EXCLUSIVE')).join('');
  const fresh = c.fresh.map((l) => row(l.title, l.url, feedMeta(l), 'NEW')).join('');
  const top = c.top.map((l) => row(l.title, l.url, feedMeta(l))).join('');
  const unsub = unsubscribeUrl(unsubscribeToken);
  const address = process.env.NEWSLETTER_POSTAL_ADDRESS || '';

  const html = `<!doctype html><html><body style="margin:0;background:#f3f4f6">
<div style="max-width:620px;margin:0 auto;background:#fff;padding:28px 28px 20px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.5">
<div style="font-size:22px;font-weight:700;color:${BRAND.accent}">${BRAND.firm}</div>
<div style="color:#6b7280;font-size:13px">The weekly · ${esc(c.weekOf)}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#f9fafb;border-radius:8px"><tr>
${[[String(s.live), 'live listings'], [String(s.newThisWeek), 'new this week'], [money(s.medianPrice), 'median ask'], [s.medianMultiple ? `${s.medianMultiple.toFixed(1)}x` : '—', 'median multiple']]
  .map(([v, k]) => `<td style="padding:14px 8px;text-align:center"><div style="font-size:20px;font-weight:700">${v}</div><div style="font-size:11px;color:#6b7280;text-transform:uppercase">${k}</div></td>`).join('')}
</tr></table>
${section(`Our listings`, ours)}
${section('New this week', fresh)}
${section('Strongest cash flow on the market', top)}
<div style="margin:30px 0 8px;padding:18px;border:1px solid ${BRAND.accent};border-radius:8px">
<div style="font-weight:700;margin-bottom:6px">Thinking about selling?</div>
<div style="font-size:14px;color:#374151">Confidential, no obligation. <a href="${BRAND.site}${BRAND.sellerCta.href}" style="color:${BRAND.accent};font-weight:600">${BRAND.sellerCta.label}</a></div>
</div>
<p style="font-size:12px;color:#9ca3af;margin-top:24px">Third-party listings are summarized from public broker sites and link to the original listing; verify all details with the listing broker.<br>
You're getting this because you subscribed or signed an NDA on ${BRAND.site.replace('https://', '')}. <a href="${unsub}" style="color:#9ca3af">Unsubscribe</a>${address ? `<br>${esc(address)}` : ''}</p>
</div></body></html>`;

  const lines = (title: string, items: string[]) => (items.length ? `\n${title}\n${items.join('\n')}\n` : '');
  const text = `${BRAND.firm} weekly · ${c.weekOf}
${s.live} live listings · ${s.newThisWeek} new this week · median ask ${money(s.medianPrice)}
${lines('OUR LISTINGS', c.ours.map((l) => `- ${l.title} (${money(l.price)}): ${BRAND.site}/listing/${l.id}`))}${lines('NEW THIS WEEK', c.fresh.map((l) => `- ${l.title} (${money(l.price)}): ${l.url}`))}${lines('STRONGEST CASH FLOW', c.top.map((l) => `- ${l.title} (${money(l.price)}, CF ${money(l.cash_flow)}): ${l.url}`))}
Thinking about selling? ${BRAND.site}${BRAND.sellerCta.href}

Unsubscribe: ${unsub}${address ? `\n${address}` : ''}`;
  return { subject, html, text };
}

/** Sends this week's email to every confirmed subscriber on this vertical's list not sent in the last 5 days. */
export async function sendWeekly(opts: { dryRun?: boolean; onlyEmail?: string } = {}) {
  const content = await buildWeekly();
  const db = subscribersDb();
  const cutoff = new Date(Date.now() - 5 * 864e5).toISOString();
  let q = db.from('subscribers').select('id, email, unsubscribe_token, send_count')
    .eq('vertical', BRAND.vertical).eq('confirmed', true).is('unsubscribed_at', null)
    .or(`last_sent_at.is.null,last_sent_at.lt.${cutoff}`);
  if (opts.onlyEmail) q = q.eq('email', opts.onlyEmail.toLowerCase());
  const { data: subs, error } = await q.limit(5000);
  if (error) throw error;
  if (opts.dryRun) return { recipients: subs?.length || 0, sent: 0, failed: 0, stats: content.stats, ours: content.ours.length, fresh: content.fresh.length, top: content.top.length };
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY missing');

  let sent = 0, failed = 0;
  for (let i = 0; i < (subs || []).length; i += 100) {
    const batch = subs!.slice(i, i + 100);
    const emails = batch.map((s) => {
      const r = renderWeekly(content, s.unsubscribe_token);
      return {
        from: BRAND.from, reply_to: BRAND.replyTo, to: s.email, subject: r.subject, html: r.html, text: r.text,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl(s.unsubscribe_token)}>` },
      };
    });
    try { await resendBatch(emails); } catch (sendErr) { failed += batch.length; console.error('weekly batch failed', sendErr); continue; }
    sent += batch.length;
    const now = new Date().toISOString();
    await Promise.all(batch.map((s) => db.from('subscribers').update({ last_sent_at: now, send_count: (s.send_count || 0) + 1 }).eq('id', s.id)));
  }
  return { recipients: subs?.length || 0, sent, failed, stats: content.stats };
}
