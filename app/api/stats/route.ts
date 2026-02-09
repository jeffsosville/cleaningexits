// app/api/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    // Base query builder
    const buildQuery = () => {
      let q = supabase
        .from('cleaning_listings_merge')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true);
      
      if (category && category !== 'all') {
        q = q.eq('category', category);
      }
      
      return q;
    };
    // 1. Total verified listings (with category filter)
    const { count: totalVerified } = await buildQuery();
    // 2. Added this week (with category filter)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    let weekQuery = supabase
      .from('cleaning_listings_merge')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)
      .gte('scraped_at', oneWeekAgo.toISOString());
    
    if (category && category !== 'all') {
      weekQuery = weekQuery.eq('category', category);
    }
    
    const { count: addedThisWeek } = await weekQuery;
    // 3. Verified today (with category filter)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayQuery = supabase
      .from('cleaning_listings_merge')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)
      .gte('scraped_at', today.toISOString());
    
    if (category && category !== 'all') {
      todayQuery = todayQuery.eq('category', category);
    }
    
    const { count: verifiedToday } = await todayQuery;
    // 4. Get counts per category (for filter badges)
    const { data: categoryData } = await supabase
      .from('cleaning_listings_merge')
      .select('category')
      .eq('is_verified', true);
    const categoryCounts: Record<string, number> = {
      all: categoryData?.length || 0,
      commercial_cleaning: 0,
      residential_cleaning: 0,
      laundromat: 0,
      dry_cleaner: 0,
      pest_control: 0,
      landscaping: 0,
      pool_service: 0,
      pressure_washing: 0,
      junk_removal: 0,
      other: 0,
    };
    categoryData?.forEach((item) => {
      const cat = item.category || 'other';
      if (categoryCounts.hasOwnProperty(cat)) {
        categoryCounts[cat]++;
      }
    });
    return NextResponse.json({
      totalVerified: totalVerified || 0,
      addedThisWeek: addedThisWeek || 0,
      verifiedToday: verifiedToday || 0,
      categoryCounts,
    }, {
      headers: {
        'Cache-Control': 's-maxage=604800, stale-while-revalidate=604800'
      }
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
