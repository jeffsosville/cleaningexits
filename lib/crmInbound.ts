import { getCrmSupabase } from '@/lib/crmSupabase';

/**
 * Website inquiries go straight into the CRM's inbound queue (inbound_items),
 * tagged with this site's vertical, so they land next to email, Drift, BizBuySell
 * and NDA activity instead of only in someone's inbox.
 */

export const VERTICAL_SLUG = 'cleaning';
export const SITE = 'cleaningexits.com';

let cachedVerticalId: string | null = null;

export async function getVerticalId(): Promise<string | null> {
  if (cachedVerticalId) return cachedVerticalId;
  const { data } = await getCrmSupabase()
    .from('verticals')
    .select('id')
    .eq('slug', VERTICAL_SLUG)
    .maybeSingle();
  cachedVerticalId = (data as { id: string } | null)?.id ?? null;
  return cachedVerticalId;
}

export type InboundInput = {
  kind: 'seller_lead' | 'buyer_question' | 'other';
  name: string;
  email: string;
  phone?: string | null;
  business?: string | null;
  location?: string | null;
  revenue?: string | null;
  message?: string | null;
  sourceUrl?: string | null;
};

export async function logInbound(i: InboundInput): Promise<{ ok: boolean; error?: string }> {
  const db = getCrmSupabase();
  const now = new Date();
  const email = i.email.trim().toLowerCase();
  const subject =
    i.kind === 'seller_lead' ? 'Selling your cleaning business' : 'Your CleaningExits inquiry';
  const text = [
    i.message && `Message: ${i.message}`,
    i.business && `Business: ${i.business}`,
    i.location && `Location: ${i.location}`,
    i.revenue && `Revenue: ${i.revenue}`,
    i.phone && `Phone: ${i.phone}`,
  ]
    .filter(Boolean)
    .join('\n');

  // Same person resubmitting within a week updates their open item instead of adding one
  const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString();
  const { data: prior } = await db
    .from('inbound_items')
    .select('id')
    .eq('source', 'website_form')
    .eq('lead_email', email)
    .in('status', ['new', 'drafted', 'awaiting_john'])
    .gte('received_at', weekAgo)
    .limit(1);
  if (prior && prior.length) {
    const { error } = await db
      .from('inbound_items')
      .update({ last_message_at: now.toISOString(), updated_at: now.toISOString() })
      .eq('id', (prior[0] as { id: string }).id);
    return error ? { ok: false, error: error.message } : { ok: true };
  }

  const { error } = await db.from('inbound_items').insert({
    vertical_id: await getVerticalId(),
    source: 'website_form',
    lead_channel: SITE,
    captured_by: 'website',
    from_email: email,
    lead_email: email,
    from_name: i.name,
    lead_name: i.name,
    lead_phone: i.phone || null,
    lead_business: i.business || null,
    lead_location: i.location || null,
    lead_revenue: i.revenue || null,
    source_url: i.sourceUrl || null,
    subject,
    snippet: `${SITE} form: ${text || '(no message)'}`.slice(0, 1000),
    summary: `${i.kind === 'seller_lead' ? 'Seller' : 'Inquiry'} from ${i.name}${i.business ? ` (${i.business})` : ''} via ${SITE}`,
    kind: i.kind,
    priority: i.kind === 'seller_lead' ? 'high' : 'normal',
    status: 'new',
    received_at: now.toISOString(),
    last_message_at: now.toISOString(),
    due_at: new Date(now.getTime() + 864e5).toISOString(),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}
