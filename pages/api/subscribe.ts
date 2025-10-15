// pages/api/subscribe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Valid email is required" });
  }

  try {
    // Check if already subscribed
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, confirmed")
      .eq("email", email.toLowerCase())
      .single();

    if (existing?.confirmed) {
      return res.status(200).json({ 
        message: "You're already subscribed!" 
      });
    }

    // Generate tokens
    const confirmationToken = crypto.randomUUID();
    const unsubscribeToken = crypto.randomUUID();

    // Insert or update subscriber
    const { error: dbError } = await supabase
      .from("subscribers")
      .upsert({
        email: email.toLowerCase(),
        confirmation_token: confirmationToken,
        unsubscribe_token: unsubscribeToken,
        confirmed: false,
        subscribed_at: new Date().toISOString(),
      }, {
        onConflict: "email"
      });

    if (dbError) throw dbError;

    // Send confirmation email
    const confirmUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/confirm?token=${confirmationToken}`;
    
    await resend.emails.send({
      from: "Cleaning Exits <hello@cleaningexits.com>",
      to: email,
      subject: "Confirm your subscription to Cleaning Exits",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #059669; margin-bottom: 10px;">Welcome to Cleaning Exits!</h1>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            You're one step away from receiving the <strong>Weekly Top 10</strong> cleaning business listings every Monday.
          </p>
          <p style="margin: 30px 0;">
            <a href="${confirmUrl}" 
               style="display: inline-block; background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Confirm Subscription
            </a>
          </p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; font-weight: 600; color: #374151;">What you'll get:</p>
            <ul style="margin: 0; padding-left: 20px; color: #6B7280;">
              <li style="margin-bottom: 8px;">Top 10 verified cleaning businesses every Monday</li>
              <li style="margin-bottom: 8px;">Real listings — no franchises, no lead-gen funnels</li>
              <li style="margin-bottom: 8px;">Direct links to opportunities</li>
            </ul>
          </div>
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            If you didn't sign up for this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;" />
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            Cleaning Exits • Verified cleaning business listings<br />
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ 
      message: "Check your email to confirm subscription" 
    });

  } catch (error: any) {
    console.error("Subscribe error:", error);
    return res.status(500).json({ 
      error: "Failed to subscribe. Please try again." 
    });
  }
}
