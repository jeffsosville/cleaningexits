import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORIES = [
  'commercial_cleaning','residential_cleaning','laundromat',
  'landscaping','dry_cleaner','pool_service',
  'pressure_washing','junk_removal','pest_control'
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const category = (req.query.category as string) || 'commercial_cleaning';

  // Total verified listings for this category
  const { count: totalVerified } = await supabase
    .from('cleaning_listings_merge')
    .select('*', { count: 'exact', head: true })
    .eq('category', category)
    .eq('is_verified', true);

  // All listings with days_on_market for this category
  const { data: domData } = await supabase
    .from('cleaning_listings_merge')
    .select('days_on_market')
    .eq('category', category)
    .not('days_on_market', 'is', null);

  // Median DOM
  let medianDom = null;
  if (domData && domData.length > 0) {
    const sorted = domData.map(r => r.days_on_market).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianDom = sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];
  }

  // % over 365 days
  let pctOver365 = null;
  if (domData && domData.length > 0) {
    const over365 = domData.filter(r => r.days_on_market > 365).length;
    pctOver365 = Math.round((over365 / domData.length) * 100);
  }

  // Category counts for filter pills
  const categoryCounts: Record<string, number> = {};
  await Promise.all(
    CATEGORIES.map(async (cat) => {
      const { count } = await supabase
        .from('cleaning_listings_merge')
        .select('*', { count: 'exact', head: true })
        .eq('category', cat)
        .eq('is_verified', true);
      categoryCounts[cat] = count || 0;
    })
  );

  res.status(200).json({ totalVerified, medianDom, pctOver365, categoryCounts });
}
