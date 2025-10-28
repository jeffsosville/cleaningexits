# CleaningExits Top 10 Deep Dive System

## Overview
This system automatically generates comprehensive, Utah-janitorial-style deep dive analyses for your top 10 featured listings.

## How It Works

### 1. Deep Dive Generator Script (`generate_deep_dives.py`)
- Pulls listings from `top_10_commercial_cleaning` view
- Generates comprehensive HTML analysis for each
- Stores result in new `deep_dive_html` column in `cleaning_listings_merge` table
- Run manually whenever you want to update deep dives

### 2. Database Changes Needed

First, add the new column to your table:

```sql
-- Add deep_dive_html column to cleaning_listings_merge
ALTER TABLE cleaning_listings_merge 
ADD COLUMN deep_dive_html TEXT;
```

### 3. Running the Generator

From your local machine (where network access works):

```bash
# Install dependencies
pip install supabase

# Run the generator
python generate_deep_dives.py
```

This will:
- Fetch all top 10 listings
- Generate deep dive for each
- Update the database
- Take about 1-2 minutes total

### 4. Frontend Integration (Next.js)

In your listing detail page component, check for the deep dive:

```typescript
// app/listings/[id]/page.tsx

export default async function ListingPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: listing } = await supabase
    .from('cleaning_listings_merge')
    .select('*')
    .eq('id', params.id)
    .single()
  
  return (
    <div>
      {/* Your existing listing header, price, cash flow, etc. */}
      
      {listing.deep_dive_html ? (
        // TOP 10 LISTING - Show full deep dive
        <div 
          dangerouslySetInnerHTML={{ __html: listing.deep_dive_html }}
          className="deep-dive-container"
        />
      ) : (
        // REGULAR LISTING - Show basic info only
        <div className="basic-listing-info">
          <h2>About This Business</h2>
          <p>{listing.notes}</p>
        </div>
      )}
      
      {/* Rest of your page */}
    </div>
  )
}
```

## What Gets Generated

Each deep dive includes:

1. **Executive Hook** - Why this deal stands out
2. **The Numbers** - Revenue, cash flow, margins with context
3. **Valuation Analysis** - Multiple calculation with reasoning
4. **SBA Financing Math** - Down payment, monthly payments, cash-on-cash ROI
5. **Competitive Advantages** - What makes it defensible
6. **Call to Action** - Buttons to view listing, contact for financing
7. **Disclaimer** - Legal protection

## Customization

### Adjust Valuation Logic
Edit the `calculate_valuation()` function to change multiples:

```python
def calculate_valuation(cash_flow, revenue, has_ebitda=False):
    base_multiple = 2.8  # Adjust base multiple
    
    if cash_flow >= 500000:
        base_multiple = 3.5  # Adjust premium for larger deals
    # etc...
```

### Modify SBA Terms
Edit the `calculate_sba_financing()` function:

```python
down_payment = asking_price * 0.10  # Change down payment %
rate = 0.08 / 12  # Change interest rate
periods = 120  # Change loan term (10 years = 120 months)
```

### Update HTML Template
Edit the `generate_deep_dive_html()` function to change structure/styling.

## Automation (Future)

To automate this later, you can:

1. **Trigger on new top 10**: Add Supabase trigger when listings enter top 10
2. **Scheduled**: Run via cron job (daily/weekly) to refresh all analyses
3. **On-demand**: Add button in admin panel to regenerate specific listing

For now, just run manually whenever top 10 changes or you want to update content.

## Testing

1. Run the script
2. Check one listing: `SELECT deep_dive_html FROM cleaning_listings_merge WHERE id = 'YOUR_ID' LIMIT 1`
3. View the listing page in your frontend
4. Verify the deep dive renders properly

## Notes

- Only top 10 get deep dives (keeps content exclusive)
- Regular listings show basic info only
- All styling is inline (no external CSS needed)
- Mobile-responsive by default
- Safe to re-run (just overwrites existing deep dives)
