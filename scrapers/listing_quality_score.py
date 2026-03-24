import os
from supabase import create_client
import re

SUPABASE_URL = "https://ctvrauiiskucinibnfaj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dnJhdWlpc2t1Y2luaWJuZmFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTcwNzMsImV4cCI6MjA3NTA5MzA3M30.fQtgTKSPMFWLZfbeMkRv5QjmIgcVAnMHQP8MCBrJygE"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

FRANCHISE_KEYWORDS = [
    'franchise', 'territory', 'opportunity', 'fdd', 'franchisor',
    'master license', 'area developer', 'turnkey system'
]

TEMPLATE_PHRASES = [
    'contact us for more information',
    'please contact for details', 
    'motivated seller',
    'serious inquiries only',
    'priced to sell',
    'great opportunity awaits'
]

SPAM_BROKERS = [
    'bizbuysell', 'sunbelt', 'transworld'  # not spam, but BBS-sourced = not direct
]

def score_listing(listing):
    score = 50  # baseline
    signals = []

    title = (listing.get('header') or '').lower()
    desc = (listing.get('description') or '').lower()
    url = (listing.get('url') or '').lower()
    price = listing.get('price')
    cash_flow = listing.get('cash_flow')
    revenue = listing.get('revenue')
    city = listing.get('city')
    state = listing.get('state')
    broker = (listing.get('broker') or '').lower()

    # --- POSITIVE SIGNALS ---

    # Financials present
    if price and price > 0:
        score += 10
        signals.append('+10 asking price present')
    
    if cash_flow and cash_flow > 0:
        score += 10
        signals.append('+10 cash flow present')
    
    if revenue and revenue > 0:
        score += 5
        signals.append('+5 revenue present')

    # Location present
    if city:
        score += 5
        signals.append('+5 city present')
    if state:
        score += 5
        signals.append('+5 state present')

    # Reasonable multiple (price/cash_flow between 1x-5x)
    if price and cash_flow and cash_flow > 0:
        multiple = price / cash_flow
        if 1.0 <= multiple <= 5.0:
            score += 10
            signals.append(f'+10 reasonable multiple ({multiple:.1f}x)')
        elif multiple > 10:
            score -= 15
            signals.append(f'-15 suspect multiple ({multiple:.1f}x)')

    # Direct broker URL (not BizBuySell)
    if url and 'bizbuysell' not in url and 'bizquest' not in url:
        score += 10
        signals.append('+10 direct broker URL')

    # Description length (real listings have real descriptions)
    if len(desc) > 200:
        score += 5
        signals.append('+5 substantial description')

    # --- NEGATIVE SIGNALS ---

    # Franchise keywords
    for kw in FRANCHISE_KEYWORDS:
        if kw in title or kw in desc:
            score -= 20
            signals.append(f'-20 franchise keyword: {kw}')
            break

    # Template phrases
    for phrase in TEMPLATE_PHRASES:
        if phrase in desc:
            score -= 10
            signals.append(f'-10 template phrase detected')
            break

    # Duplicate-style title (ALL CAPS or very short)
    if title == title.upper() and len(title) > 10:
        score -= 5
        signals.append('-5 all-caps title')
    
    if len(title) < 15:
        score -= 10
        signals.append('-10 suspiciously short title')

    # Missing price AND cash flow
    if not price and not cash_flow:
        score -= 15
        signals.append('-15 no financials at all')

    # Clamp score
    score = max(0, min(100, score))

    # Assign tier
    if score >= 75:
        tier = 'Verified'
    elif score >= 50:
        tier = 'Likely Real'
    elif score >= 25:
        tier = 'Unverified'
    else:
        tier = 'Likely Junk'

    return score, tier, signals


def run():
    print("Fetching listings from cleaning_listings_merge...")
    
    all_listings = []
    page = 0
    page_size = 1000
    
    while True:
        res = supabase.table('cleaning_listings_merge')\
            .select('*')\
            .eq('status', 'active')\
            .range(page * page_size, (page + 1) * page_size - 1)\
            .execute()
        
        if not res.data:
            break
        all_listings.extend(res.data)
        print(f"  Fetched {len(all_listings)} listings...")
        if len(res.data) < page_size:
            break
        page += 1

    print(f"\nScoring {len(all_listings)} listings...")

    tier_counts = {'Verified': 0, 'Likely Real': 0, 'Unverified': 0, 'Likely Junk': 0}
    updates = []

    for listing in all_listings:
        score, tier, signals = score_listing(listing)
        tier_counts[tier] += 1
        updates.append({
            'id': listing['id'],
            'quality_score': score,
            'quality_tier': tier
        })

    # Add quality_score and quality_tier columns if not present
    # (safe to run even if they exist)
    print("\nWriting scores back to cleaning_listings_merge...")
    
    success = 0
    for i in range(0, len(updates), 100):
        batch = updates[i:i+100]
        for record in batch:
            supabase.table('cleaning_listings_merge')\
                .update({'quality_score': record['quality_score'], 'quality_tier': record['quality_tier']})\
                .eq('id', record['id'])\
                .execute()
        success += len(batch)
        print(f"  Updated {success}/{len(updates)}")

    print(f"\n{'='*50}")
    print("QUALITY DISTRIBUTION")
    print('='*50)
    total = len(all_listings)
    for tier, count in tier_counts.items():
        pct = (count/total*100) if total else 0
        print(f"  {tier:15} {count:5} ({pct:.1f}%)")
    print(f"  {'TOTAL':15} {total:5}")
    print('='*50)
    print("\nDone. Scores written to cleaning_listings_merge.")

if __name__ == '__main__':
    run()
