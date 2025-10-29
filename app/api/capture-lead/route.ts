// app/api/capture-lead/route.ts
// Simple version with ONE confirmation email via Resend API (no SDK)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      email, 
      phone, 
      listing_id, 
      source, 
      listing_price, 
      listing_title,
      listing_location,
      listing_url
    } = body;

    if (!email || !listing_id) {
      return NextResponse.json(
        { error: 'Email and listing_id required' },
        { status: 400 }
      );
    }

    // STEP 1: Add to subscribers table
    await supabase
      .from('subscribers')
      .upsert({
        email,
        confirmed: true,
        confirmed_at: new Date().toISOString(),
        subscribed_at: new Date().toISOString()
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      });

    // STEP 2: Get full listing details
    const { data: listing, error: listingError } = await supabase
      .from('cleaning_listings_merge')
      .select('*')
      .eq('id', listing_id)
      .single();

    if (listingError) {
      console.error('Listing fetch error:', listingError);
    }

    // STEP 3: Calculate financing
    const sde = listing?.cash_flow || 0;
    const price = listing?.price || listing_price || 0;
    const revenue = listing?.revenue || 0;
    const multiple = sde > 0 ? (price / sde).toFixed(2) : 'N/A';
    const downPayment = price * 0.10;
    const loanAmount = price * 0.90;
    const monthlyRate = 0.08 / 12;
    const numPayments = 120;
    const monthlyPayment = loanAmount > 0 
      ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;
    const cashAfterDebt = sde - (monthlyPayment * 12);

    // STEP 4: Store in buyer_leads table
    const leadData = {
      email,
      phone: phone || null,
      listing_id,
      listing_title: listing_title || listing?.header,
      listing_url: listing_url || listing?.direct_broker_url || listing?.url,
      listing_price: price,
      listing_location: listing_location || (listing?.city && listing?.state ? `${listing.city}, ${listing.state}` : null),
      broker_name: listing?.broker_account,
      broker_account: listing?.broker_account,
      source: source || 'listing_detail',
      status: 'new',
      lead_score: phone ? 25 : 10,
      email_sequence_started: true,
      email_sequence_name: 'simple-confirmation',
      last_email_sent_at: new Date().toISOString(),
      emails_sent: 1,
      next_follow_up_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      captured_at: new Date().toISOString(),
      user_agent: request.headers.get('user-agent'),
      referrer: request.headers.get('referer'),
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    };

    const { data: lead, error: leadError } = await supabase
      .from('buyer_leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error('Lead insert error:', leadError);
      throw leadError;
    }

    // STEP 5: Send ONE confirmation email via Resend API directly
    if (process.env.RESEND_API_KEY) {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #059669; color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .content { background: #f9fafb; padding: 30px 20px; }
    .section { background: white; padding: 25px; margin: 20px 0; border-radius: 8px; border: 1px solid #e5e7eb; }
    .section h2 { color: #059669; margin-top: 0; font-size: 22px; }
    .metric { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .metric:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 15px; }
    .value { font-weight: bold; color: #111827; font-size: 15px; }
    .button { display: inline-block; background: #059669; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 15px 5px; font-weight: bold; }
    .questions { background: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .questions h3 { margin-top: 0; color: #92400e; font-size: 18px; }
    .questions ol { margin: 10px 0; padding-left: 25px; }
    .questions li { margin: 8px 0; }
    .footer { text-align: center; color: #6b7280; padding: 30px 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Listing Details</h1>
      <p>Complete financial breakdown + direct broker contact</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>${leadData.listing_title || 'Cleaning Business Opportunity'}</h2>
        <p><strong>Location:</strong> ${leadData.listing_location || 'See listing for details'}</p>
      </div>

      <div class="section">
        <h2>📊 Financial Overview</h2>
        <div class="metric">
          <span class="label">Asking Price:</span>
          <span class="value">${price > 0 ? `$${price.toLocaleString()}` : 'Contact Broker'}</span>
        </div>
        ${revenue > 0 ? `
        <div class="metric">
          <span class="label">Revenue:</span>
          <span class="value">$${revenue.toLocaleString()}</span>
        </div>` : ''}
        ${sde > 0 ? `
        <div class="metric">
          <span class="label">Cash Flow (SDE):</span>
          <span class="value">$${sde.toLocaleString()}</span>
        </div>
        <div class="metric">
          <span class="label">Price/SDE Multiple:</span>
          <span class="value">${multiple}x ${parseFloat(multiple) > 4 ? '(High)' : parseFloat(multiple) < 2.5 ? '(Low)' : '(Market)'}</span>
        </div>` : ''}
      </div>

      ${price > 0 && sde > 0 ? `
      <div class="section">
        <h2>💰 SBA Financing Scenario</h2>
        <p style="color: #6b7280; font-size: 14px; margin-top: 0;">Based on 90% financing, 8% interest, 10-year term</p>
        <div class="metric">
          <span class="label">Down Payment (10%):</span>
          <span class="value">$${Math.round(downPayment).toLocaleString()}</span>
        </div>
        <div class="metric">
          <span class="label">Loan Amount:</span>
          <span class="value">$${Math.round(loanAmount).toLocaleString()}</span>
        </div>
        <div class="metric">
          <span class="label">Est. Monthly Payment:</span>
          <span class="value">$${Math.round(monthlyPayment).toLocaleString()}</span>
        </div>
        <div class="metric">
          <span class="label">Cash Flow After Debt:</span>
          <span class="value">$${Math.round(cashAfterDebt).toLocaleString()}/year</span>
        </div>
      </div>` : ''}

      <div class="section">
        <h2>📞 Direct Broker Contact</h2>
        <p><strong>Listed through:</strong> ${listing?.broker_account || 'See listing for details'}</p>
        <p style="margin: 25px 0; text-align: center;">
          <a href="${leadData.listing_url}" class="button">View Full Listing →</a>
        </p>
      </div>

      <div class="questions">
        <h3>🎯 Critical Questions to Ask Before Contacting Broker</h3>
        <ol>
          <li>What % of revenue comes from your top 5 clients?</li>
          <li>Are cleaning contracts month-to-month or annual?</li>
          <li>What's your employee turnover rate?</li>
          <li>How many hours per week does the owner work?</li>
          <li>What's preventing you from 2x growth?</li>
        </ol>
      </div>

      <div class="section">
        <h2>🤝 How We Help (No Cost to You)</h2>
        <p>We represent YOUR interests as co-broker. Commission comes from the seller's side, so our guidance is free to you:</p>
        <ul style="line-height: 1.8;">
          <li>Due diligence framework</li>
          <li>Valuation verification</li>
          <li>Negotiation strategy</li>
          <li>SBA financing connections</li>
        </ul>
        <p style="margin: 25px 0; text-align: center;">
          <a href="${process.env.CALENDLY_LINK || 'https://cleaningexits.com'}" class="button">Schedule 15-Min Call</a>
        </p>
      </div>

      <div class="footer">
        <p><strong>Jeff & John Sosville</strong><br>
        Founders, Cleaning Exits<br>
        ${process.env.YOUR_EMAIL || 'info@cleaningexits.com'}${process.env.YOUR_PHONE ? '<br>' + process.env.YOUR_PHONE : ''}</p>
        
        <p style="margin-top: 30px; font-size: 13px; font-style: italic;">
          P.S. These listings move fast. If you're serious, contact the broker today and CC us so we can support your due diligence.
        </p>
        
        <p style="margin-top: 25px; font-size: 12px; color: #9ca3af;">
          You're receiving this because you requested details from CleaningExits.com.<br>
          You'll also receive our weekly Top 10 cleaning business listings every Monday.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
        `;

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Jeff at Cleaning Exits <jeff@cleaningexits.com>',
            to: email,
            subject: `Your Details: ${leadData.listing_title || 'Cleaning Business'} - ${leadData.listing_location || ''}`,
            html: emailHtml
          })
        });

        if (!resendResponse.ok) {
          console.error('Resend API error:', await resendResponse.text());
        }
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't fail the request if email fails
      }
    }

    // STEP 6: Send Slack notification (if configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🎯 New Lead: ${email} - ${leadData.listing_title} ($${price.toLocaleString()})`
          })
        });
      } catch (slackError) {
        console.error('Slack error:', slackError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      lead_id: lead.id,
      message: 'Lead captured successfully'
    });

  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to capture lead',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
