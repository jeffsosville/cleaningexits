//pages/api/capture-lead.ts
// This endpoint handles listing-specific lead captures
// It piggybacks on your existing /api/subscribe infrastructure

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    email, 
    phone, 
    listing_id, 
    source, 
    listing_price, 
    listing_title,
    listing_location,
    listing_url
  } = req.body;

  if (!email || !listing_id) {
    return res.status(400).json({ error: 'Email and listing_id required' });
  }

  try {
    // STEP 1: Add to subscribers table (for weekly Top 10 newsletter)
    // Auto-confirm listing leads since they're showing intent
    await supabase
      .from('subscribers')
      .upsert({
        email,
        confirmed: true, // Skip confirmation for high-intent leads
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

    // STEP 4: Store in buyer_leads table for CRM tracking
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
      lead_score: phone ? 25 : 10, // Higher score if phone provided
      email_sequence_started: true,
      email_sequence_name: 'cleaning-exits-full-details',
      last_email_sent_at: new Date().toISOString(),
      emails_sent: 1, // Email 0 sent immediately
      next_follow_up_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days
      captured_at: new Date().toISOString(),
      user_agent: req.headers['user-agent'],
      referrer: req.headers['referer'],
      ip_address: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
                  req.headers['x-real-ip'] || 
                  req.socket.remoteAddress
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
      firstName: email.split('@')[0], // Fallback to email username
      
      // Listing details
      listing_id,
      listing_title: leadData.listing_title || 'Cleaning Business',
      listing_url: leadData.listing_url || '',
      listing_location: leadData.listing_location || 'Location TBD',
      listing_price: price ? `$${price.toLocaleString()}` : 'Contact',
      
      // Financials
      revenue: revenue ? `$${revenue.toLocaleString()}` : 'N/A',
      cash_flow: sde ? `$${sde.toLocaleString()}` : 'N/A',
      roi_percentage: roi,
      
      // Broker info
      broker_name: listing?.broker_account || 'Broker',
      broker_contact: 'Contact details in listing',
      
      // Valuation metrics for email
      price_to_sde_multiple: multiple,
      estimated_monthly_payment: monthlyPayment > 0 ? `$${Math.round(monthlyPayment).toLocaleString()}` : 'TBD',
      cash_after_debt: cashAfterDebt > 0 ? `$${Math.round(cashAfterDebt).toLocaleString()}` : 'TBD',
      down_payment: downPayment > 0 ? `$${Math.round(downPayment).toLocaleString()}` : 'TBD',
      loan_amount: loanAmount > 0 ? `$${Math.round(loanAmount).toLocaleString()}` : 'TBD',
      
      // Risk assessment
      risk_assessment: parseFloat(multiple) > 4 ? 'Higher than average multiple' : 
                      parseFloat(multiple) < 2.5 ? 'Below market multiple' : 
                      'Within market range',
      
      // Campaign tracking
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
        // Don't fail the request if Instantly fails
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
        // Don't fail the request if Slack fails
      }
    }

    // STEP 8: Return success
    return res.status(200).json({ 
      success: true, 
      lead_id: lead.id,
      message: 'Lead captured successfully'
    });

  } catch (error) {
    console.error('Lead capture error:', error);
    return res.status(500).json({ 
      error: 'Failed to capture lead',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
