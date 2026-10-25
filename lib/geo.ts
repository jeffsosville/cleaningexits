// lib/geo.ts
// State normalization for the programmatic geo pages.
//
// cleaning_listings_direct.state is free text straight from broker sites:
// "NY", "New York", "Chicago, IL", "Maricopa County", "Upper East Side".
// Every distinct value used to become its own /cleaning-businesses-for-sale/{state}
// page, which produced ~140 "states" (99 of them junk) and fed Google hundreds
// of near-empty pages. Everything geo now goes through toStateCode().

export const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming'
};

const NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [name.toLowerCase(), code])
);

/**
 * Map a raw state value (or URL slug) to a two-letter code, or null when it
 * can't be resolved to a real state. Accepts "ny", "NY", "New York",
 * "new-york", "new york", and trailing-code forms like "Chicago, IL".
 * County/metro values with no state attached ("Maricopa County") return null.
 */
export function toStateCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = decodeURIComponent(String(raw)).trim();
  if (!s) return null;

  const upper = s.toUpperCase();
  if (upper.length === 2 && STATE_NAMES[upper]) return upper;

  const name = s.toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (NAME_TO_CODE[name]) return NAME_TO_CODE[name];

  // "Chicago, IL" / "Sonoma County, CA" / "Bettendorf, Iowa"
  const tail = s.split(',').pop()?.trim() || '';
  if (tail && tail !== s) return toStateCode(tail);

  return null;
}

/** Raw values that resolve to this code, for `.in('state', ...)` queries. */
export function stateVariants(code: string): string[] {
  const name = STATE_NAMES[code];
  return name ? [code, name] : [code];
}

// Must stay identical to the city page's own slug rule: the page reverses it
// with an ilike match, so stripping punctuation here would break lookups.
export function slugifyCity(city: string): string {
  return city.toLowerCase().trim().replace(/\s+/g, '-');
}

/** "st.-louis" -> "St. Louis". Inverse of slugifyCity, used for display and
 * for the ilike lookup on the city page. */
export function cityNameFromSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Broker text names the same place several ways, and each spelling used to
// become its own city page: Brooklyn and Kings County, "Louis, MO" (a
// truncated St. Louis). Each alias 301s to its canonical slug, and the
// canonical page pulls in the alias's listings. Keys are `{state}/{slug}`.
export const CITY_ALIASES: Record<string, string> = {
  'ny/kings-county': 'brooklyn',
  'ny/queens-county': 'queens',
  'ny/new-york-county': 'manhattan',
  'ny/richmond-county': 'staten-island',
  'ny/bronx-county': 'bronx',
  'mo/louis': 'st.-louis',
  'mo/st-louis': 'st.-louis',
  'mo/saint-louis': 'st.-louis',
};

export function canonicalCitySlug(state: string, slug: string): string {
  return CITY_ALIASES[`${state.toLowerCase()}/${slug}`] || slug;
}

/** The canonical slug plus every alias that folds into it. */
export function citySlugVariants(state: string, canonical: string): string[] {
  const prefix = `${state.toLowerCase()}/`;
  const aliases = Object.entries(CITY_ALIASES)
    .filter(([key, target]) => target === canonical && key.startsWith(prefix))
    .map(([key]) => key.slice(prefix.length));
  return [canonical, ...aliases];
}

/** City pages below this many listings ship with noindex,follow. */
export const CITY_INDEX_MIN = 3;

/** Old /cleaning-businesses-for-sale/{state} pages redirect to /for-sale/{state}
 * once the state clears the gated page's threshold (siteConfig.geoThreshold). */
export const STATE_REDIRECT_MIN = 15;
