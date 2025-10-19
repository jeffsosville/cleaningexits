import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  try {
    // Get the listing data
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('*')
      .eq('listing_id', id)
      .single();

    if (fetchError || !listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from('analyses')
      .select('id')
      .eq('listing_id', id)
      .single();

    if (existingAnalysis) {
      return res.status(200).json({ 
        message: 'Analysis already exists',
        analysis_id: existingAnalysis.id 
      });
    }

    // Build the prompt
    const prompt = `You are an expert business broker specializing in commercial cleaning businesses. Analyze this listing and provide a comprehensive valuation analysis.

LISTING DATA:
Title: ${listing.title || 'N/A'}
Price: ${listing.price ? `$${listing.price.toLocaleString()}` : 'Not disclosed'}
Revenue: ${listing.revenue ? `$${listing.revenue.toLocaleString()}` : 'Not disclosed'}
Cash Flow/SDE: ${listing.cash_flow ? `$${listing.cash_flow.toLocaleString()}` : 'Not disclosed'}
Location: ${listing.city || 'Unknown'}, ${listing.state || 'Unknown'}
Description: ${listing.description || 'No description provided'}

VALUATION FRAMEWORK:
Base multiples for cleaning businesses:
- Small operations (<$500K revenue): 2.0-2.5x SDE
- Mid-size ($500K-$2M revenue): 2.5-3.5x SDE  
- Large operations (>$2M revenue): 3.5-4.5x SDE

Adjustment factors:
- Client concentration: +0.5x if diversified, -0.5x if concentrated
- Contract quality: +0.3x for long-term contracts
- Revenue trends: +0.3x if growing, -0.3x if declining
- Owner involvement: +0.2x if absentee, -0.2x if owner-operator
- Systems & documentation: +0.2x if well-documented
- Employee retention: +0.2x if stable workforce
- Geographic market: +0.2x for high-growth markets

YOUR TASK:
Return a JSON object with this exact structure:

{
  "ai_summary": "2-3 sentence executive summary of this opportunity",
  "base_multiple": 3.0,
  "adjusted_multiple": 3.4,
  "valuation_low": 1500000,
  "valuation_high": 1800000,
  "confidence": 0.75,
  "confidence_reasons": ["reason 1", "reason 2"],
  "applied_adjustments": [
    {
      "factor": "Client Diversification",
      "delta": 0.3,
      "rationale": "Brief explanation"
    }
  ],
  "risk_table": [
    {
      "category": "Financial",
      "risk": "Specific risk identified",
      "severity": "Medium",
      "mitigation": "How to address this"
    }
  ],
  "extended_analysis": {
    "why_hot": "1-2 sentences on why this is an attractive opportunity",
    "revenue_analysis": {
      "total_revenue": 2500000,
      "sde": 470000,
      "margin_percentage": "18.8%",
      "recurring_percentage": "Estimated 90%",
      "key_insights": ["insight 1", "insight 2"]
    },
    "client_portfolio": {
      "total_clients": "Estimated 30-40",
      "retention_rate": "Est. 85-90%",
      "client_types": ["Office Buildings", "Medical Facilities"],
      "key_insights": ["insight 1", "insight 2"]
    },
    "operations_analysis": {
      "owner_involvement": "Estimated moderate",
      "employee_count": "Est. 40-60",
      "key_insights": ["insight 1", "insight 2"]
    },
    "growth_opportunities": [
      {
        "opportunity": "Expand to adjacent markets",
        "rationale": "Why this makes sense",
        "potential_impact": "Est. $200K additional revenue"
      }
    ],
    "risk_factors": [
      {
        "category": "Operational",
        "risk": "Specific risk",
        "severity": "Low",
        "mitigation": "How to address"
      }
    ]
  }
}

IMPORTANT:
- Make educated estimates when data is missing (mark as "Est." or "Estimated")
- Base valuation on SDE if available, revenue if not
- Provide 3-5 applied adjustments
- Include 3-5 risk factors
- Be specific and actionable in insights
- Confidence should be 0.6-0.8 for partial data, 0.8-0.95 for complete data
- Return ONLY valid JSON, no additional text`;

    // Call OpenAI
    console.log('Calling OpenAI for listing:', id);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert business valuation analyst specializing in commercial cleaning businesses. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(analysisText);

    // Save to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('analyses')
      .insert({
        listing_id: id,
        ai_summary: analysis.ai_summary,
        base_multiple: analysis.base_multiple,
        adjusted_multiple: analysis.adjusted_multiple,
        valuation_low: analysis.valuation_low,
        valuation_high: analysis.valuation_high,
        confidence: analysis.confidence,
        confidence_reasons: analysis.confidence_reasons,
        applied_adjustments: analysis.applied_adjustments,
        risk_table: analysis.risk_table || analysis.risk_factors, // Handle both formats
        extended_analysis: analysis.extended_analysis,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis:', saveError);
      throw saveError;
    }

    console.log('Analysis saved successfully:', savedAnalysis.id);

    return res.status(200).json({ 
      message: 'Analysis generated successfully',
      analysis_id: savedAnalysis.id,
      analysis: savedAnalysis
    });

  } catch (error: any) {
    console.error('Analysis generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate analysis',
      details: error.message 
    });
  }
}
