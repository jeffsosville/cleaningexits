/**
 * Single source of truth for the NDA text shown at the checkbox.
 *
 * Bump NDA_VERSION whenever NDA_AGREEMENT_TEXT changes. createToken stores both
 * the version and the exact text the buyer agreed to on the deal_tokens row, so
 * you can always prove which terms a given buyer accepted.
 */
export const NDA_VERSION = '2026-08-09';

export const NDA_AGREEMENT_TEXT =
  'I agree to keep all listing and Deal Hub information strictly confidential. ' +
  'I will not share, distribute, or use it for any purpose other than evaluating ' +
  'a potential acquisition, and I will not contact, solicit, or attempt to ' +
  'transact directly with the seller or any party identified through this listing ' +
  'except through CleaningExits. By checking this box, I am electronically signing ' +
  'this agreement and intend to be legally bound by its full terms.';

export const NDA_COOKIE_NAME = 'cex_nda_access';
export const NDA_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export type NDAAccessMap = Record<string, string>;

export function parseAccessMap(raw: string | undefined): NDAAccessMap {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Accumulate access per listing so signing a second listing keeps the first. */
export function addTokenToCookieMap(
  existing: string | undefined,
  slug: string,
  token: string
): string {
  const map = parseAccessMap(existing);
  map[slug] = token;
  return JSON.stringify(map);
}
