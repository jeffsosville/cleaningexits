#!/usr/bin/env python3
"""
Generate Deep Dive Analysis for Top 10 CleaningExits Listings
Run this manually whenever you want to generate/update deep dives
"""

from supabase import create_client
import sys

SUPABASE_URL = "https://ctvrauiiskucinibnfaj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dnJhdWlpc2t1Y2luaWJuZmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTcwNzMsImV4cCI6MjA3NTA5MzA3M30.fQtgTKSPMFWLZfbeMkRv5QjmIgcVAnMHQP8MCBrJygE"


def calculate_valuation(cash_flow, revenue, has_ebitda=False):
    """Calculate valuation range based on business metrics"""
    if not cash_flow or cash_flow <= 0:
        return None, None, None
    
    # Base multiple
    base_multiple = 2.8
    
    # Adjust based on cash flow amount
    if cash_flow >= 500000:
        base_multiple = 3.5
    elif cash_flow >= 300000:
        base_multiple = 3.2
    elif cash_flow >= 150000:
        base_multiple = 3.0
    
    # Premium for having EBITDA data
    if has_ebitda:
        base_multiple += 0.3
    
    # Calculate margin if we have revenue
    margin = None
    if revenue and revenue > 0:
        margin = (cash_flow / revenue) * 100
        if margin >= 25:
            base_multiple += 0.5
        elif margin >= 20:
            base_multiple += 0.3
    
    low = cash_flow * (base_multiple - 0.5)
    high = cash_flow * (base_multiple + 0.5)
    likely = cash_flow * base_multiple
    
    return low, high, likely


def calculate_sba_financing(asking_price, cash_flow):
    """Calculate SBA financing breakdown"""
    if not asking_price or not cash_flow:
        return None
    
    down_payment = asking_price * 0.10
    working_capital = 50000
    total_cash = down_payment + working_capital
    loan_amount = asking_price * 0.90
    
    # Monthly payment calculation (8% over 10 years)
    rate = 0.08 / 12
    periods = 120
    monthly_payment = loan_amount * (rate * (1 + rate)**periods) / ((1 + rate)**periods - 1)
    annual_debt = monthly_payment * 12
    
    net_cash_flow = cash_flow - annual_debt
    cash_on_cash = (net_cash_flow / total_cash) * 100 if total_cash > 0 else 0
    
    return {
        'down_payment': down_payment,
        'working_capital': working_capital,
        'total_cash': total_cash,
        'loan_amount': loan_amount,
        'monthly_payment': monthly_payment,
        'annual_debt': annual_debt,
        'net_cash_flow': net_cash_flow,
        'cash_on_cash': cash_on_cash
    }


def generate_deep_dive_html(listing):
    """Generate comprehensive deep dive analysis HTML"""
    
    header = listing.get('header', 'Commercial Cleaning Business')
    location = listing.get('location', 'United States')
    price = listing.get('price')
    cash_flow = listing.get('cash_flow')
    revenue = listing.get('revenue')
    ebitda = listing.get('ebitda')
    notes = listing.get('notes', '')
    
    # Calculate margin if we have data
    margin = None
    margin_text = ""
    if cash_flow and revenue and revenue > 0:
        margin = (cash_flow / revenue) * 100
        margin_text = f"""
        <div class="metric-highlight">
            <strong>Profit Margin: {margin:.1f}%</strong>
            <p>{"Exceptional - well above industry average of 15-18%" if margin >= 20 else "Solid performance in the cleaning industry"}</p>
        </div>
        """
    
    # Calculate valuation
    low, high, likely = calculate_valuation(cash_flow, revenue, bool(ebitda))
    
    # Calculate SBA financing
    sba = None
    if price and cash_flow:
        sba = calculate_sba_financing(price, cash_flow)
    
    html = f"""
    <div class="deep-dive-analysis">
        <h2>Why This Deal Stands Out</h2>
        <div class="executive-summary">
            <p>This {location} cleaning business represents a compelling acquisition opportunity for serious buyers. Let's break down exactly why this caught our attention.</p>
        </div>

        <h3>The Numbers</h3>
        <div class="financial-overview">
            <ul>
                {"<li><strong>Revenue:</strong> $" + f"{revenue:,}" + "</li>" if revenue else ""}
                {"<li><strong>Cash Flow (SDE):</strong> $" + f"{cash_flow:,}" + "</li>" if cash_flow else ""}
                {"<li><strong>EBITDA:</strong> $" + f"{ebitda:,}" + "</li>" if ebitda else ""}
                {"<li><strong>Asking Price:</strong> $" + f"{price:,}" + "</li>" if price else ""}
            </ul>
            {margin_text}
        </div>
"""

    # Add valuation section if we have data
    if low and high and likely:
        multiple = price / cash_flow if price and cash_flow else 0
        html += f"""
        <h3>The Valuation Play</h3>
        <div class="valuation-analysis">
            <p>Let's run the math on what makes this pricing attractive:</p>
            
            <div class="valuation-breakdown">
                <p><strong>Typical multiples for this profile:</strong></p>
                <ul>
                    <li>Base multiple for cleaning businesses: 2.5-3.5x SDE</li>
                    {"<li>Premium for strong margins: +0.3-0.5x</li>" if margin and margin >= 20 else ""}
                    {"<li>Premium for EBITDA documentation: +0.3x</li>" if ebitda else ""}
                </ul>
                
                <p><strong>Expected valuation range:</strong></p>
                <ul>
                    <li>Conservative: ${low:,.0f} (low multiple)</li>
                    <li>Most likely: ${likely:,.0f} (market multiple)</li>
                    <li>Optimistic: ${high:,.0f} (premium multiple)</li>
                </ul>
                
                {"<p><strong>Asking price of $" + f"{price:,}" + " represents " + f"{multiple:.1f}x SDE" + "</strong> - " + ("a fair market rate" if multiple <= 3.5 else "slightly premium pricing") + "</p>" if price and cash_flow else ""}
            </div>
        </div>
"""

    # Add SBA financing section if we have data
    if sba:
        html += f"""
        <h3>The SBA Financing Math</h3>
        <div class="sba-financing">
            <p>Here's what the deal looks like with 90% SBA financing:</p>
            
            <div class="financing-breakdown">
                <p><strong>Buyer Investment Required:</strong></p>
                <ul>
                    <li>Down payment (10%): ${sba['down_payment']:,.0f}</li>
                    <li>Working capital reserve: ${sba['working_capital']:,.0f}</li>
                    <li><strong>Total cash required: ${sba['total_cash']:,.0f}</strong></li>
                </ul>
                
                <p><strong>Monthly Obligations:</strong></p>
                <ul>
                    <li>SBA loan: ${sba['loan_amount']:,.0f} at 8% over 10 years</li>
                    <li>Monthly payment: ${sba['monthly_payment']:,.0f}</li>
                    <li>Annual debt service: ${sba['annual_debt']:,.0f}</li>
                </ul>
                
                <p><strong>First Year Cash Flow:</strong></p>
                <ul>
                    <li>Seller's Discretionary Earnings: ${cash_flow:,.0f}</li>
                    <li>Less: Debt service: -${sba['annual_debt']:,.0f}</li>
                    <li><strong>Net to owner: ${sba['net_cash_flow']:,.0f}</strong></li>
                </ul>
                
                <div class="cash-on-cash">
                    <p><strong>Cash-on-Cash Return: {sba['cash_on_cash']:.0f}%</strong> in year one on your ${sba['total_cash']:,.0f} investment.</p>
                    <p class="note">Plus you're building equity by paying down ${sba['loan_amount']:,.0f} in debt with the business's cash flow.</p>
                </div>
            </div>
        </div>
"""

    # Add competitive advantages section
    html += """
        <h3>Competitive Advantages</h3>
        <div class="competitive-advantages">
            <p>What makes this business defensible:</p>
            <ul>
                <li><strong>Established operations</strong> - Not a startup, proven revenue model</li>
                <li><strong>Recurring revenue</strong> - Cleaning contracts provide predictable cash flow</li>
                <li><strong>Barrier to entry</strong> - Building a client base takes years</li>
                <li><strong>Asset-light model</strong> - Low overhead, high cash conversion</li>
            </ul>
        </div>
    """

    # Add action section
    html += f"""
        <h3>Take Action on This Opportunity</h3>
        <div class="cta-section">
            <p>Ready to learn more about this listing?</p>
            <div class="cta-buttons">
                <a href="{listing.get('url', '#')}" class="btn-primary" target="_blank" rel="noopener">View Full Listing →</a>
                <a href="/contact" class="btn-secondary">Need SBA Financing?</a>
            </div>
        </div>

        <div class="disclaimer">
            <p><small>This analysis is for informational purposes only and does not constitute investment advice. All numbers are based on publicly available listing information and should be verified during due diligence. Always consult with legal, financial, and tax professionals before making any business acquisition decision.</small></p>
        </div>
    </div>
    
    <style>
        .deep-dive-analysis {{
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
        }}
        
        .deep-dive-analysis h2 {{
            font-size: 32px;
            font-weight: 700;
            margin: 40px 0 20px;
            color: #0f766e;
        }}
        
        .deep-dive-analysis h3 {{
            font-size: 24px;
            font-weight: 600;
            margin: 32px 0 16px;
            color: #0f766e;
        }}
        
        .executive-summary {{
            background: #f0fdfa;
            padding: 24px;
            border-radius: 8px;
            border-left: 4px solid #0f766e;
            margin: 24px 0;
            font-size: 18px;
        }}
        
        .financial-overview, .valuation-analysis, .sba-financing, .competitive-advantages {{
            background: #ffffff;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin: 20px 0;
        }}
        
        .metric-highlight {{
            background: #fef3c7;
            padding: 16px;
            border-radius: 6px;
            margin: 16px 0;
            border-left: 3px solid #f59e0b;
        }}
        
        .valuation-breakdown, .financing-breakdown {{
            margin: 16px 0;
        }}
        
        .cash-on-cash {{
            background: #dcfce7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
            border: 2px solid #10b981;
        }}
        
        .cash-on-cash strong {{
            font-size: 24px;
            color: #065f46;
        }}
        
        .note {{
            font-size: 14px;
            color: #6b7280;
            margin-top: 8px;
        }}
        
        .cta-section {{
            background: #f9fafb;
            padding: 32px;
            border-radius: 8px;
            text-align: center;
            margin: 32px 0;
        }}
        
        .cta-buttons {{
            display: flex;
            gap: 16px;
            justify-content: center;
            margin-top: 20px;
        }}
        
        .btn-primary, .btn-secondary {{
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s;
        }}
        
        .btn-primary {{
            background: #0f766e;
            color: white;
        }}
        
        .btn-primary:hover {{
            background: #0d9488;
        }}
        
        .btn-secondary {{
            background: white;
            color: #0f766e;
            border: 2px solid #0f766e;
        }}
        
        .btn-secondary:hover {{
            background: #f0fdfa;
        }}
        
        .disclaimer {{
            margin: 40px 0;
            padding: 20px;
            background: #f9fafb;
            border-radius: 6px;
            font-size: 13px;
            color: #6b7280;
        }}
        
        ul {{
            margin: 12px 0;
            padding-left: 24px;
        }}
        
        li {{
            margin: 8px 0;
        }}
    </style>
    """
    
    return html


def main():
    print("="*80)
    print("CLEANINGEXITS TOP 10 DEEP DIVE GENERATOR")
    print("="*80)
    print()
    
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        print("Fetching top 10 listings...")
        result = supabase.table("top_10_commercial_cleaning").select("*").execute()
        listings = result.data
        
        if not listings:
            print("No listings found in top_10_commercial_cleaning view!")
            return
        
        print(f"Found {len(listings)} listings to process\n")
        
        for i, listing in enumerate(listings, 1):
            header = listing.get('header', 'Untitled')
            print(f"Processing {i}/{len(listings)}: {header[:60]}...")
            
            # Generate deep dive
            deep_dive_html = generate_deep_dive_html(listing)
            
            # Update the record in cleaning_listings_merge
            update_result = supabase.table("cleaning_listings_merge").update({
                'deep_dive_html': deep_dive_html
            }).eq('id', listing['id']).execute()
            
            print(f"  ✓ Generated {len(deep_dive_html):,} characters of analysis")
        
        print(f"\n{'='*80}")
        print(f"SUCCESS! Updated {len(listings)} listings with deep dive analysis")
        print(f"{'='*80}")
        print("\nNext steps:")
        print("1. Update your Next.js listing page to display deep_dive_html")
        print("2. Deploy to see the deep dives live on your site")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you're connected to the internet")
        print("2. Verify your Supabase credentials are correct")
        print("3. Check that top_10_commercial_cleaning view exists")
        sys.exit(1)


if __name__ == "__main__":
    main()
