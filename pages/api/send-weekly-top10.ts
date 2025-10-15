// pages/api/send-weekly-top10.ts
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
};

const money = (n?: number | null) =>
  n == null
    ? "—"
    : n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });

function generateEmailHTML(top10: Listing[], weekOf: string, unsubscribeToken: string) {
  const listingsHTML = top10.map((listing, i) => `
    <div style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <div style="display: flex; gap: 16px; align-items: start;">
        <div style="background: #059669; color: white; border-radius: 50%; width: 36px; height: 36px; min-width: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; flex-shrink: 0; margin-top: 2px;">
          ${i + 1}
        </div>
        
        <div style="flex: 1;">
          <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">
            <a href="${listing.listing_url || '#'}" style="color: #059669; text-decoration: none;">
              ${listing.title || "Untitled"}
            </a>
          </h3>
          ${listing.city || listing.state ? `
            <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 14px;">
              📍 ${listing.city ? `${listing.city}, ` : ""}${listing.state || ""}
            </p>
          ` : ''}
          <div style="display: flex; gap: 16px; flex-wrap: wrap; font-size: 14px; color: #374151; margin-bottom: 8px;">
            <span><strong>Price:</strong> ${money(listing.price)}</span>
            ${listing.cash_flow ? `<span><strong>Cash Flow:</strong> ${money(listing.cash_flow)}</span>` : ''}
            ${listing.revenue ? `<span><strong>Revenue:</strong> ${money(listing.revenue)}</span>` : ''}
          </div>
          ${listing.description ? `
            <p style="margin: 8px 0 0 0; color: #6B7280; font-size: 14px; line-height: 1.5;">
              ${listing.description}
            </p>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');

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
          <div style="text-align: center; padding: 30px 0;">
            <h1 style="color: #059669; margin: 0 0 8px 0; font-size: 32px;">Cleaning Exits</h1>
            <p style="color: #6B7280; margin: 0; font-size: 16px;">Weekly Top 10 • ${weekOf}</p>
          </div>

          <!-- Intro -->
          <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #E5E7EB;">
            <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
              Here are this week's <strong>top 10 cleaning business listings</strong> — hand-curated, verified opportunities with no franchise funnels or lead-gen noise.
            </p>
          </div>

          <!-- Listings -->
          ${listingsHTML}

          <!-- Footer CTA -->
          <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">
              Browse more opportunities on the site
            </p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}" 
               style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Visit Cleaning Exits
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #9CA3AF; font-size: 12px;">
            <p style="margin: 0 0 8px 0;">
              You're receiving this because you subscribed to Cleaning Exits.
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

    // Get top 10 listings (same query as homepage)
    const DAYS_90_MS = 90 * 24 * 60 * 60 * 1000;
    const days90agoISO = new Date(Date.now() - DAYS_90_MS).toISOString();
    
    const includeOr = "title.ilike.%cleaning%,title.ilike.%janitorial%,title.ilike.%maid%,title.ilike.%housekeeping%,title.ilike.%custodial%";
    
    const EXCLUDES = [
      "%dry%clean%", "%insurance%", "%franchise%", "%restaurant%", "%pharmacy%",
      "%convenience%", "%grocery%", "%bakery%", "%printing%", "%marketing%",
      "%construction%", "%roofing%", "%plumbing%", "%hvac%", "%landscap%",
      "%pest%", "%security%", "%catering%"
    ];

    let q = supabase
      .from("listings")
      .select("title, city, state, price, cash_flow, revenue, description, listing_url")
      .or(includeOr)
      .gte("scraped_at", days90agoISO)
      .eq("is_active", true);

    for (const x of EXCLUDES) q = q.not("title", "ilike", x);

    const { data: listings, error: listError } = await q
      .order("cash_flow", { ascending: false, nullsFirst: false })
      .order("price", { ascending: false, nullsFirst: false })
      .limit(10);

    if (listError) throw listError;

    if (!listings || listings.length === 0) {
      return res.status(200).json({ message: "No listings to send" });
    }

    // Generate email HTML
    const weekOf = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Send emails in batches
    const batchSize = 100; // Resend limit
    let sentCount = 0;

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const emailPromises = batch.map(sub => {
        const html = generateEmailHTML(listings, weekOf, sub.unsubscribe_token);

        return resend.emails.send({
          from: "Cleaning Exits <hello@cleaningexits.com>",
          to: sub.email,
          subject: `Top 10 Cleaning Businesses This Week — ${weekOf}`,
          html,
        });
      });

      await Promise.all(emailPromises);
      sentCount += batch.length;
    }

    return res.status(200).json({ 
      message: `Successfully sent to ${sentCount} subscribers`,
      listingsCount: listings.length 
    });

  } catch (error: any) {
    console.error("Send weekly error:", error);
    return res.status(500).json({ 
      error: "Failed to send weekly email",
      details: error.message 
    });
  }
}
