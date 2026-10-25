// lib/cityStats.ts
// Numbers for the city pages, computed from the same listings the page shows.
// Each page used to carry identical copy with the city name swapped in and a
// hardcoded "2.0-3.5x SDE". Google crawled those and declined to index them.
// Every figure here comes with its sample size; below MIN_N it isn't shown.

export type StatListing = {
  price: number | null;
  cash_flow: number | null;
  days_on_market?: number | null;
  category?: string | null;
};

export type Summary = {
  count: number;
  medianPrice: number | null;
  priceN: number;
  medianSde: number | null;
  medianMultiple: number | null;
  multipleN: number;
  medianDays: number | null;
  daysN: number;
};

export type CategoryRow = {
  key: string;
  label: string;
  count: number;
  medianPrice: number | null;
  medianMultiple: number | null;
  multipleN: number;
};

/** Smallest sample a median is published from. */
export const MIN_N = 3;

export const CATEGORY_LABELS: Record<string, [string, string]> = {
  commercial_cleaning: ['commercial cleaning company', 'commercial cleaning companies'],
  residential_cleaning: ['residential or specialty cleaning business', 'residential and specialty cleaning businesses'],
  laundromat: ['laundromat', 'laundromats'],
  dry_cleaner: ['dry cleaner', 'dry cleaners'],
  pressure_washing: ['pressure washing business', 'pressure washing businesses'],
  junk_removal: ['junk removal business', 'junk removal businesses']
};

const label = (key: string, n: number) => {
  const pair = CATEGORY_LABELS[key] || ['cleaning business', 'cleaning businesses'];
  return n === 1 ? pair[0] : pair[1];
};

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Same band the DealLedger stats views use: a multiple outside 0.5-10x is a
// data error (revenue entered as cash flow, a typo), not a market signal.
const multiples = (rows: StatListing[]) =>
  rows
    .filter(r => r.price && r.cash_flow && r.price > 0 && r.cash_flow > 0)
    .map(r => (r.price as number) / (r.cash_flow as number))
    .filter(m => m >= 0.5 && m <= 10);

export function summarize(rows: StatListing[]): Summary {
  const prices = rows.map(r => r.price).filter((p): p is number => !!p && p > 0);
  const sdes = rows.map(r => r.cash_flow).filter((c): c is number => !!c && c > 0);
  const mults = multiples(rows);
  const days = rows
    .map(r => r.days_on_market)
    .filter((d): d is number => typeof d === 'number' && d > 0);
  return {
    count: rows.length,
    medianPrice: prices.length >= MIN_N ? median(prices) : null,
    priceN: prices.length,
    medianSde: sdes.length >= MIN_N ? median(sdes) : null,
    medianMultiple: mults.length >= MIN_N ? median(mults) : null,
    multipleN: mults.length,
    medianDays: days.length >= MIN_N ? median(days) : null,
    daysN: days.length
  };
}

export function categoryRows(rows: StatListing[]): CategoryRow[] {
  const groups = new Map<string, StatListing[]>();
  rows.forEach(r => {
    const key = r.category || 'commercial_cleaning';
    groups.set(key, [...(groups.get(key) || []), r]);
  });
  return Array.from(groups.entries())
    .map(([key, list]) => {
      const s = summarize(list);
      return {
        key,
        label: label(key, 2),
        count: list.length,
        medianPrice: s.medianPrice,
        medianMultiple: s.medianMultiple,
        multipleN: s.multipleN
      };
    })
    .sort((a, b) => b.count - a.count);
}

/** "6 laundromats, 4 dry cleaners and 2 commercial cleaning companies" */
export function mixPhrase(cats: CategoryRow[]): string {
  const parts = cats.map(c => `${c.count} ${label(c.key, c.count)}`);
  if (parts.length <= 1) return parts[0] || '';
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/** Signed percent difference, rounded. null when either side is missing. */
export function pctDiff(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null;
  return Math.round(((a - b) / b) * 100);
}
