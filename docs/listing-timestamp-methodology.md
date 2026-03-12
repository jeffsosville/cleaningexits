# Listing Timestamp Methodology

## The Problem We're Solving

BizBuySell hides listing dates behind their `$150/month EDGE paywall`. Buyers have no idea if a listing is 3 days old or 3 years old. CleaningExits surfaces this for free — it's our primary moat.

## How We Know When a Listing Was Listed

BizBuySell assigns sequential listing numbers embedded in every listing URL:

```
https://www.bizbuysell.com/listing/some-slug/XXXXXXX/
```

The number `XXXXXXX` is a monotonically increasing integer. By tracking the rate at which new listing numbers appear over time, we can reverse-engineer approximately when any given listing was first published.

## Calibration Model

**Base point (empirically established):**
- Date: `2025-05-14`
- Listing number at that date: `2,367,857`
- Observed rate: `~357.1 new listings per day` across all categories

**Formula:**

```
estimated_listed = first_seen - ((listNumber - BASE_NUM) / RATE_PER_DAY)
```

Where:
- `first_seen` = the date our scraper first observed the listing
- `listNumber` = the integer ID in the BizBuySell URL
- `BASE_NUM` = 2,367,857
- `RATE_PER_DAY` = 357.1

**Accuracy: ±12 days**

This is sufficient to meaningfully segment listings into buckets like:
- Listed this week
- Listed this month  
- Listed 3–6 months ago
- Listed 6+ months ago (stale / price reduction candidate)

## Implementation

The `first_seen` column in the `listings` table (Supabase project `ctvrauiiskucinibnfaj`) is set on first scrape and never overwritten. The `last_seen` column updates on every scrape pass, allowing us to detect delistings.

The listing number is extracted from the URL at scrape time:

```python
import re

def extract_listing_number(url: str) -> int | None:
    match = re.search(r'/listing/[^/]+/(d+)/', url)
    return int(match.group(1)) if match else None
```

Estimated listing date calculation:

```python
from datetime import datetime, timedelta

BASE_DATE = datetime(2025, 5, 14)
BASE_NUM = 2_367_857
RATE_PER_DAY = 357.1

def estimate_listed_date(listing_number: int, first_seen: datetime) -> datetime:
    days_offset = (listing_number - BASE_NUM) / RATE_PER_DAY
    return first_seen - timedelta(days=days_offset)
```

## Why This Matters Competitively

BizBuySell's EDGE subscription ($150/month) is sold largely on the promise of seeing listing dates. Our methodology gives buyers this information for free.

Practical use cases:
- **Days on market badge** — show buyers how long a listing has been sitting (longer = more negotiating leverage)
- **Freshness sort** — let buyers filter to "listed this week" or "listed in last 30 days"
- **Stale listing detection** — listings with high days-on-market + no price change = motivated seller signal
- **Price history inference** — combining DOM estimate with current price reveals implied price trajectory

## Calibration Notes

The rate of 357.1/day is an average across all BizBuySell categories (not just laundromats). The laundromat-specific rate is much lower (~1–2 new listings/day), so for our vertical the listing number is mostly useful for estimating date rather than recency within a category.

The base point should be recalibrated periodically (every ~6 months) by spot-checking known listing dates against their listing numbers.

## Status

- [x] Calibration model established (May 2025)
- [x] `first_seen` field captured on all BBS scrapes
- [ ] Days-on-market badge surfaced on listing cards (PENDING)
- [ ] Freshness filter on browse page (PENDING)
- [ ] Stale listing flag in Supabase (PENDING)
