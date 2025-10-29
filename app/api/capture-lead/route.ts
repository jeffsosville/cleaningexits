// app/api/capture-lead/route.ts
// Next.js App Router API endpoint for lead capture

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

    // STEP 1: Add to subscribers table (for weekly Top 10 newsletter)
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

    // STEP 2: Get full listing details from database
    const { data: listing, error: listingError } = await supabase
      .from('cleaning_listings_merge')
      .select('*')
      .eq('id', listing_id)
      .single();

    if (listingError) {
      console.error('Listing fetch error:', listingError);
    }

    // STEP 3: Calculate financing numbers
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
    const roi = price > 0 ? ((sde / price) * 100).toFixed(1) : 'N/A';

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
      email_sequence_name: 'cleaning-exits-full-details',
      last_email_sent_at: new Date().toISOString(),
      emails_sent: 1,
      next_follow_up_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      captured_at: new Date().toISOString(),
      user_agent: request.headers.get('user-agent'),
      referrer: request.headers.get('referer'),
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                  request.headers.get('x-real-ip') || 
                  'unknown'
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

    // STEP 5: Prepare email data for Instantly.ai
    const instantlyPayload = {
      email,
      phone: phone || '',
      firstName: email.split('@')[0],
      
      listing_id,
      listing_title: leadData.listing_title || 'Cleaning Business',
      listing_url: leadData.listing_url || '',
      listing_location: leadData.listing_location || 'Location TBD',
      listing_price: price ? `$${price.toLocaleString()}` : 'Contact',
      
      revenue: revenue ? `$${revenue.toLocaleString()}` : 'N/A',
      cash_flow: sde ? `$${sde.toLocaleString()}` : 'N/A',
      roi_percentage: roi,
      
      broker_name: listing?.broker_account || 'Broker',
      broker_contact: 'Contact details in listing',
      
      price_to_sde_multiple: multiple,
      estimated_monthly_payment: monthlyPayment > 0 ? `$${Math.round(monthlyPayment).toLocaleString()}` : 'TBD',
      cash_after_debt: cashAfterDebt > 0 ? `$${Math.round(cashAfterDebt).toLocaleString()}` : 'TBD',
      down_payment: downPayment > 0 ? `$${Math.round(downPayment).toLocaleString()}` : 'TBD',
      loan_amount: loanAmount > 0 ? `$${Math.round(loanAmount).toLocaleString()}` : 'TBD',
      
      risk_assessment: parseFloat(multiple) > 4 ? 'Higher than average multiple' : 
                      parseFloat(multiple) < 2.5 ? 'Below market multiple' : 
                      'Within market range',
      
      campaign: 'listing_detail_capture',
      sequence: 'cleaning-exits-full-details',
      lead_id: lead.id,
      source: source || 'listing_detail'
    };

    // STEP 6: Send to Instantly.ai (if configured)
    if (process.env.INSTANTLY_WEBHOOK_URL) {
      try {
        const instantlyResponse = await fetch(process.env.INSTANTLY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(process.env.INSTANTLY_API_KEY && {
              'Authorization': `Bearer ${process.env.INSTANTLY_API_KEY}`
            })
          },
          body: JSON.stringify(instantlyPayload)
        });

        if (!instantlyResponse.ok) {
          console.error('Instantly webhook failed:', await instantlyResponse.text());
        }
      } catch (instantlyError) {
        console.error('Instantly webhook error:', instantlyError);
      }
    }

    // STEP 7: Send Slack notification (if configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        const slackMessage = {
          text: '🎯 New Buyer Lead Captured!',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '🎯 New Buyer Lead Captured!'
              }
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Email:*\n${email}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Phone:*\n${phone || 'Not provided'}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Listing:*\n${leadData.listing_title}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Price:*\n$${price.toLocaleString()}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Location:*\n${leadData.listing_location}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Lead Score:*\n${leadData.lead_score}/100`
                }
              ]
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*SDE:* $${sde.toLocaleString()} | *Multiple:* ${multiple}x | *ROI:* ${roi}%`
              }
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'View Listing'
                  },
                  url: leadData.listing_url || 'https://cleaningexits.com'
                }
              ]
            }
          ]
        };

        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });
      } catch (slackError) {
        console.error('Slack notification error:', slackError);
      }
    }

    // STEP 8: Return success
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
