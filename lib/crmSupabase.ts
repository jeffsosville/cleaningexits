import { createClient } from '@supabase/supabase-js';

/**
 * Server-side client for the ATM CRM Supabase project — the application
 * database holding deals, tokens, and buyer records across every vertical.
 *
 * NOT the same project as NEXT_PUBLIC_SUPABASE_URL, which on CleaningExits
 * points at the site's own listings database. NDAs, in-house listings and
 * inquiries all live in the CRM so they reach the same inbound queue as ATM.
 *
 * Service role key — never import into a client component.
 */
export function getCrmSupabase() {
  const url = process.env.CRM_SUPABASE_URL;
  const key = process.env.CRM_SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing CRM_SUPABASE_URL or CRM_SUPABASE_SERVICE_KEY. ' +
      'These point at the ATM CRM project, not DealLedger.'
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
