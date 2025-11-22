// pages/api/send-weekly-newsletter.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const resend = new Resend(process.env.RESEND_API_KEY);

type Listing = {
  title: string | null;
  city: string | null;
  state: string | null;
  price: number | null;
  revenue: number | null;
  cash_flow: number | null;
  listing_url: string | null;
  description: string | null;
  source_broker: string | null;
  scraped_at: string | null;
};

const money = (n?: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

function calculateMultiple(price: number | null, cashflow: number | null): string {
  if (!price || !cashflow || cashflow <= 0) return "—";
  const multiple = price / cashflow;
  return `${multiple.toFixed(1)}x`;
}

function generateEmailHTML(
  topListings: Listing[], 
  junkListings: Listing[],
  stats: {
    totalNew: number;
    totalVerified: number;
    avgPrice: number;
    avgMultiple: number;
    hottestState: string;
  },
  weekOf: string, 
  unsubscribeToken: string
) {
  
  // Top listings section
  const topListingsHTML = topListings.map((listing, i) => `
    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; gap: 12px; align-items: start;">
        <div style="background: #059669; color: white; border-radius: 50%; width: 32px; height: 32px; min-width: 32px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0;">
          ${i + 1}
        </div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 6px 0; font-size: 16px; color: #111827; line-height: 1.3;">
            <a href="${listing.listing_url || '#'}" style="color: #059669; text-decoration: none;">
              ${listing.title || "Untitled"}
            </a>
          </h3>
          ${listing.city || listing.state ? `
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px;">
              📍 ${listing.city ? `${listing.city}, ` : ""}${listing.state || ""}
            </p>
          ` : ''}
          <div style="display: flex; gap: 12px; flex-wrap: wrap; font-size: 13px; color: #374151; margin-bottom: 6px;">
            <span><strong>Price:</strong> ${money(listing.price)}</span>
            ${listing.cash_flow ? `<span><strong>Cashflow:</strong> ${money(listing.cash_flow)}</span>` : ''}
            ${listing.price && listing.cash_flow ? `<span><strong>Multiple:</strong> ${calculateMultiple(listing.price, listing.cash_flow)}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Junk drawer section
  const junkHTML = junkListings.length > 0 ? `
    <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h2 style="color: #92400E; margin: 0 0 12px 0; font-size: 18px;">
        🗑️ The Junk Drawer
      </h2>
      <p style="color: #78350F; margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">
        These showed up on BizBuySell this week. Notice the red flags: impossible multiples, missing broker info, or franchise lead-gen traps disguised as "businesses."
      </p>
      ${junkListings.map((listing, i) => `
        <div style="background: white; border: 1px solid #F59E0B; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
          <div style="font-size: 14px; color: #92400E; margin-bottom: 4px;">
            <strong>${listing.title || "Untitled"}</strong>
          </div>
          <div style="font-size: 13px; color: #78350F;">
            ${listing.price ? `${money(listing.price)}` : "No price"} ${listing.cash_flow ? `• Cashflow: ${money(listing.cash_flow)}` : ""} ${listing.price && listing.cash_flow ? `• ${calculateMultiple(listing.price, listing.cash_flow)} multiple` : ""}
            ${listing.source_broker ? ` • ${listing.source_broker}` : " • No broker info"}
          </div>
        </div>
      `).join('')}
      <p style="color: #78350F; margin: 12px 0 0 0; font-size: 13px; font-style: italic;">
        This is why we manually verify every listing. Real businesses have real financials from real brokers.
      </p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="text-align: center; padding: 24px 0 16px 0;">
            <h1 style="color: #059669; margin: 0 0 4px 0; font-size: 28px;">Cleaning Exits</h1>
            <p style="color: #6B7280; margin: 0; font-size: 14px;">Weekly Market Report • ${weekOf}</p>
          </div>

          <!-- Market Snapshot -->
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border-radius: 12px; padding: 20px; margin-bottom: 20px; color: white;">
            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">📊 Market Snapshot</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">${stats.totalNew}</div>
                <div style="font-size: 13px; opacity: 0.9;">New listings this week</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">${stats.totalVerified}</div>
                <div style="font-size: 13px; opacity: 0.9;">Total verified</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">${money(stats.avgPrice)}</div>
                <div style="font-size: 13px; opacity: 0.9;">Avg asking price</div>
              </div>
              <div>
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">${stats.avgMultiple.toFixed(1)}x</div>
                <div style="font-size: 13px; opacity: 0.9;">Avg multiple</div>
              </div>
            </div>
            ${stats.hottestState ? `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 13px; opacity: 0.9;">🔥 Hottest market: <strong>${stats.hottestState}</strong></div>
              </div>
            ` : ''}
          </div>

          <!-- Intro -->
          <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #E5E7EB;">
            <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
              Here are this week's <strong>top ${topListings.length} cleaning business opportunities</strong> — manually verified, real financials, legitimate brokers. No franchise funnels, no lead-gen noise.
            </p>
          </div>

          <!-- Top Listings -->
          <div style="margin-bottom: 20px;">
            <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 20px;">🔥 Top Opportunities</h2>
            ${topListingsHTML}
          </div>

          <!-- Junk Drawer -->
          ${junkHTML}

          <!-- What This Means -->
          <div style="background: #F3F4F6; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 18px;">💡 What This Means</h2>
            <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
              ${stats.totalNew > 10 
                ? `Strong market activity this week with ${stats.totalNew} new listings. The ${stats.avgMultiple.toFixed(1)}x average multiple suggests ${stats.avgMultiple > 3.5 ? 'premium valuations' : 'reasonable pricing'} — good ${stats.avgMultiple > 3.5 ? 'for sellers' : 'buying opportunities'}.`
                : `Slower week with ${stats.totalNew} new listings, but quality remains high. Multiples averaging ${stats.avgMultiple.toFixed(1)}x show ${stats.avgMultiple > 3.5 ? 'strong seller confidence' : 'buyer-friendly valuations'}.`
              }
              ${stats.hottestState ? ` ${stats.hottestState} continues to show the most activity.` : ''}
            </p>
          </div>

          <!-- Footer CTA -->
          <div style="background: white; border: 2px solid #059669; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; font-weight: 500;">
              Browse all ${stats.totalVerified} verified listings
            </p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}" 
               style="display: inline-block; background: #059669; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
              Visit CleaningExits.com
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px; line-height: 1.5;">
            <p style="margin: 0 0 8px 0;">
              You're receiving this because you subscribed to Cleaning Exits weekly updates.
            </p>
            <p style="margin: 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?token=${unsubscribeToken}" 
                 style="color: #9CA3AF; text-decoration: underline;">
                Unsubscribe
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Auth disabled for manual sends - re-enable when setting up automated cron
  /*
  const { authorization } = req.headers;
  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  */

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("subscribers")
      .select("email, unsubscribe_token")
      .eq("confirmed", true)
      .is("unsubscribed_at", null);

    if (subError) throw subError;

    if (!subscribers || subscribers.length === 0) {
      return res.status(200).json({ message: "No subscribers to send to" });
    }

    // Get listings from the past 7 days for "new this week"
    const DAYS_7_MS = 7 * 24 * 60 * 60 * 1000;
    const days7agoISO = new Date(Date.now() - DAYS_7_MS).toISOString();
    
    // Get all listings from past 90 days for top picks
    const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
    const days90agoISO = new Date(Date.now() - DAYS_90_MS).toISOString();
    
    const includeOr = "title.ilike.%cleaning%,title.ilike.%janitorial%,title.ilike.%maid%,title.ilike.%housekeeping%,title.ilike.%custodial%";
    
    const EXCLUDES = [
      "%dry%clean%", "%insurance%", "%franchise%", "%restaurant%", "%pharmacy%",
      "%convenience%", "%grocery%", "%bakery%", "%printing%", "%marketing%",
      "%construction%", "%roofing%", "%plumbing%", "%hvac%", "%landscap%",
      "%pest%", "%security%", "%catering%"
    ];

    // Get top 10-12 listings (best by cashflow/price)
    let topQuery = supabase
      .from("listings")
      .select("title, city, state, price, cash_flow, revenue, description, listing_url, source_broker, scraped_at")
      .or(includeOr)
      .gte("scraped_at", days90agoISO)
      .eq("is_active", true)
      .not("cash_flow", "is", null)
      .gte("cash_flow", 50000); // Minimum $50K cashflow for top picks

    for (const x of EXCLUDES) topQuery = topQuery.not("title", "ilike", x);

    const { data: topListings, error: topError } = await topQuery
      .order("cash_flow", { ascending: false })
      .limit(12);

    if (topError) throw topError;

    // Get new listings this week for stats
    let newQuery = supabase
      .from("listings")
      .select("title, city, state, price, cash_flow, revenue, description, listing_url, source_broker, scraped_at")
      .or(includeOr)
      .gte("scraped_at", days7agoISO)
      .eq("is_active", true);

    for (const x of EXCLUDES) newQuery = newQuery.not("title", "ilike", x);

    const { data: newListings, error: newError } = await newQuery;
    if (newError) throw newError;

    // Get total verified count
    let totalQuery = supabase
      .from("listings")
      .select("id", { count: 'exact', head: true })
      .or(includeOr)
      .eq("is_active", true);

    for (const x of EXCLUDES) totalQuery = totalQuery.not("title", "ilike", x);

    const { count: totalVerified } = await totalQuery;

    // Calculate stats
    const listingsWithFinancials = (newListings || []).filter(l => l.price && l.cash_flow && l.cash_flow > 0);
    const avgPrice = listingsWithFinancials.length > 0
      ? listingsWithFinancials.reduce((sum, l) => sum + (l.price || 0), 0) / listingsWithFinancials.length
      : 0;
    
    const multiples = listingsWithFinancials.map(l => (l.price || 0) / (l.cash_flow || 1));
    const avgMultiple = multiples.length > 0
      ? multiples.reduce((sum, m) => sum + m, 0) / multiples.length
      : 0;

    // Find hottest state
    const stateCounts: Record<string, number> = {};
    (newListings || []).forEach(l => {
      if (l.state) stateCounts[l.state] = (stateCounts[l.state] || 0) + 1;
    });
    const hottestState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    const stats = {
      totalNew: (newListings || []).length,
      totalVerified: totalVerified || 0,
      avgPrice,
      avgMultiple,
      hottestState
    };

    // Get some "junk" listings for educational purposes (low multiples, missing broker, etc.)
    const { data: allRecentListings } = await supabase
      .from("listings")
      .select("title, city, state, price, cash_flow, revenue, listing_url, source_broker, description, scraped_at")
      .gte("scraped_at", days7agoISO)
      .eq("is_active", true)
      .limit(100);

    const junkListings = (allRecentListings || [])
      .filter(l => {
        if (!l.price || !l.cash_flow) return false;
        const multiple = l.price / l.cash_flow;
        // Flag as junk if multiple is suspiciously low (<1.5x) or missing broker
        return multiple < 1.5 || !l.source_broker || l.source_broker === 'FSBO';
      })
      .slice(0, 3); // Show 3 examples

    if (!topListings || topListings.length === 0) {
      return res.status(200).json({ message: "No listings to send" });
    }

    // Generate email HTML
    const weekOf = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Send emails in batches
    const batchSize = 100;
    let sentCount = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const emailPromises = batch.map(sub => {
        const html = generateEmailHTML(topListings, junkListings, stats, weekOf, sub.unsubscribe_token);

        return resend.emails.send({
          from: "Cleaning Exits <hello@cleaningexits.com>",
          to: sub.email,
          subject: `${stats.totalNew} New Cleaning Businesses This Week`,
          html,
        });
      });

      await Promise.all(emailPromises);
      sentCount += batch.length;
    }

    return res.status(200).json({ 
      message: `Successfully sent to ${sentCount} subscribers`,
      listingsCount: topListings.length,
      stats
    });

  } catch (error: any) {
    console.error("Send weekly error:", error);
    return res.status(500).json({ 
      error: "Failed to send weekly email",
      details: error.message 
    });
  }
}
