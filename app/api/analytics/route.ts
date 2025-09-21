// app/api/analytics/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Listing } from '../../../types/listings';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get total listings count
    const { count: totalCount } = await supabase
      .from('daily_listings')
      .select('*', { count: 'exact', head: true });

    // Get today's listings count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('daily_listings')
      .select('*', { count: 'exact', head: true })
      .gte('scraped_at', today.toISOString());

    // Get average price
    const { data: priceData } = await supabase
      .from('daily_listings')
      .select('price')
      .not('price', 'is', null)
      .gt('price', 0);

    const averagePrice = priceData && priceData.length > 0
      ? priceData.reduce((sum, item) => sum + (item.price || 0), 0) / priceData.length
      : 0;

    // Get top locations
    const { data: locationData } = await supabase
      .from('daily_listings')
      .select('location')
      .not('location', 'is', null);

    const locationCounts = locationData?.reduce((acc, item) => {
      if (item.location) {
        acc[item.location] = (acc[item.location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>) || {};

    const topLocations = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([location, count]) => ({ location, count }));

    return NextResponse.json({
      totalListings: totalCount || 0,
      todayListings: todayCount || 0,
      averagePrice: Math.round(averagePrice),
      topLocations
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
