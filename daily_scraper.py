import os
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from curl_cffi import requests
from colorama import init
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from supabase import create_client, Client
import logging

# --- Setup ---

init(autoreset=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("scraper.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# Only keep listings that look like "cleaning" businesses
CLEANING_KEYWORDS = [
    "clean", "cleaning", "janitor", "janitorial", "maid", "housekeep",
    "carpet", "floor", "window", "pressure wash", "power wash",
    "restoration", "remediation", "mold", "water damage", "fire damage",
    "sanitation", "disinfect", "detailing", "laundry", "laundromat"
]

NEGATIVE_KEYWORDS = [
    "restaurant", "bar", "tavern", "food", "hotel", "dental", "dentist",
    "yoga", "salon", "spa", "furniture", "pet", "veterinary", "wildlife",
    "coach", "growth coach", "lawn", "landscap", "hvac", "medical", "ramen"
]


def _looks_cleaning(l: Dict[str, Any]) -> bool:
    text = " ".join([
        str(l.get("header") or ""),
        str(l.get("description") or ""),
        str(l.get("categoryDetails") or "")
    ]).lower()
    return any(k in text for k in CLEANING_KEYWORDS) and not any(n in text for n in NEGATIVE_KEYWORDS)


def _to_bigint(x) -> Optional[int]:
    """Strip commas/decimals and return int (what your BIGINT columns expect)."""
    if x is None or x == "":
        return None
    try:
        s = str(x).replace(",", "")
        if "." in s:
            s = s.split(".")[0]  # drop decimal part entirely
        return int(s)
    except Exception:
        return None


class DatabaseManager:
    def __init__(self, supabase_url: str, supabase_key: str):
        try:
            self.client: Client = create_client(supabase_url, supabase_key)
            logger.info("✅ Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Supabase client: {e}")
            raise

    def _transform_for_table(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform raw BizBuySell listing into the shape of your existing
        public.daily_listings table (keeps original column names).
        Also appends surrogate_key + scraped_at.
        """
        # Stable surrogate key (same dedupe key you used in logs)
        url_stub = listing.get("urlStub") or ""
        header = listing.get("header") or ""
        surrogate_key = hashlib.md5(f"{url_stub}__{header}".encode()).hexdigest()

        # Start with a shallow copy so original keys (price, cashFlow, etc.) remain
        row = dict(listing)

        # Normalize numeric/BIGINT columns your table expects as integers
        # (add more if you later make other numeric columns BIGINT)
        NUMERIC_BIGINT_KEYS = [
            "price",
            "cashFlow",
            "ebitda",
            "initialFee",
            "initialCapital",
            "activeListingsCount",
            "soldListingsCount",
            "adLevelId",
            "userTypeId",
            "siteSpecificId",
            "listingTypeId",
            "placementTypeId",
            "sponsorLevelId",
            "expirationTypeId",
            "advertiserId",
        ]
        for k in NUMERIC_BIGINT_KEYS:
            if k in row:
                row[k] = _to_bigint(row.get(k))

        # Ensure booleans-as-text columns remain strings ("True"/"False") only if table is text
        # If your table uses boolean types for these, you can cast to bool instead.
        # Leaving as-is because your earlier schema dump showed text-like usage for many flags.

        # Add/override housekeeping fields
        row["surrogate_key"] = surrogate_key
        row["scraped_at"] = datetime.now(timezone.utc).isoformat()

        return row

    def upsert_listings(self, listings: List[Dict[str, Any]]) -> bool:
        if not listings:
            logger.warning("No listings to insert")
            return True

        # Filter to cleaning only, then transform
        transformed: List[Dict[str, Any]] = []
        for raw in listings:
            try:
                if not _looks_cleaning(raw):
                    continue
                t = self._transform_for_table(raw)
                transformed.append(t)
            except Exception as e:
                logger.error(f"Error transforming listing {raw.get('listNumber', 'Unknown')}: {e}")

        if not transformed:
            logger.info("No cleaning listings to upsert.")
            return True

        # Final guard: sanitize numeric fields again right before send (belt & suspenders)
        NUMERIC_BIGINT_KEYS = [
            "price", "cashFlow", "ebitda", "initialFee", "initialCapital",
            "activeListingsCount", "soldListingsCount", "adLevelId", "userTypeId",
            "siteSpecificId", "listingTypeId", "placementTypeId", "sponsorLevelId",
            "expirationTypeId", "advertiserId",
        ]
        for row in transformed:
            for k in NUMERIC_BIGINT_KEYS:
                if k in row:
                    row[k] = _to_bigint(row.get(k))

        # Batch upsert
        batch_size = 100
        total = len(transformed)
        done = 0
        for i in range(0, total, batch_size):
            batch = transformed[i:i + batch_size]
            try:
                self.client.table("daily_listings").upsert(
                    batch,
                    on_conflict="surrogate_key"
                ).execute()
                done += len(batch)
                logger.info(f"✅ Upserted batch {i//batch_size + 1} ({done}/{total})")
            except Exception as e:
                logger.error(f"❌ Error upserting batch {i//batch_size + 1}: {e}")

        logger.info(f"🎉 Successfully processed {done} cleaning listings")
        return True

    def get_recent_listings_count(self, hours: int = 24) -> int:
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
            r = self.client.table("daily_listings") \
                .select("surrogate_key", count="exact") \
                .gte("scraped_at", cutoff.isoformat()) \
                .execute()
            return r.count or 0
        except Exception as e:
            logger.error(f"Error getting recent listings count: {e}")
            return 0


class BizBuySellScraper:
    def __init__(self):
        self.session = requests.Session(impersonate="chrome")
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://www.bizbuysell.com",
            "Referer": "https://www.bizbuysell.com/",
            "Content-Type": "application/json",
        }
        self.token = None
        self.get_auth_token()

    def get_auth_token(self):
        logger.info("🔑 Obtaining authentication token...")
        try:
            resp = self.session.get("https://www.bizbuysell.com/", headers=self.headers, timeout=20)
            self.token = resp.cookies.get("_track_tkn")
            if self.token:
                logger.info("✅ Authentication token obtained")
            else:
                logger.error("❌ Failed to get authentication token")
        except Exception as e:
            logger.error(f"❌ Error obtaining token: {e}")

    def scrape_listings(self, max_pages=100, workers=10):
        if not self.token:
            logger.error("❌ No authentication token available. Cannot proceed.")
            return []

        logger.info(f"🚀 Scraping with {workers} workers, {max_pages} pages")

        api_headers = dict(self.headers)
        api_headers["Authorization"] = f"Bearer {self.token}"

        payload_template = {
            "bfsSearchCriteria": {
                "siteId": 20,
                "languageId": 10,
                "categories": None,
                "locations": None,
                "excludeLocations": None,
                "askingPriceMax": 0,
                "askingPriceMin": 0,
                "pageNumber": 1,
                "keyword": None,
                "cashFlowMin": 0,
                "cashFlowMax": 0,
                "grossIncomeMin": 0,
                "grossIncomeMax": 0,
                "daysListedAgo": 30,  # widen window while testing
                "establishedAfterYear": 0,
                "listingsWithNoAskingPrice": 0,
                "homeBasedListings": 0,
                "includeRealEstateForLease": 0,
                "listingsWithSellerFinancing": 0,
                "realEstateIncluded": 0,
                "showRelocatableListings": False,
                "relatedFranchises": 0,
                "listingTypeIds": None,
                "designationTypeIds": None,
                "sortList": None,
                "absenteeOwnerListings": 0,
                "seoSearchType": None
            }
        }

        all_listings: List[Dict[str, Any]] = []
        listing_ids = set()
        lock = Lock()

        def fetch_page(page_number: int):
            payload = json.loads(json.dumps(payload_template))
            payload["bfsSearchCriteria"]["pageNumber"] = page_number
            try:
                r = self.session.post(
                    "https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults",
                    headers=api_headers,
                    json=payload,
                    timeout=30,
                )
                if r.status_code != 200:
                    logger.warning(f"⚠️ Page {page_number} status {r.status_code}")
                    return []

                data = r.json()
                listings = data.get("value", {}).get("bfsSearchResult", {}).get("value", []) or []
                new_listings = []
                with lock:
                    for listing in listings:
                        listing_id = f"{listing.get('urlStub')}--{listing.get('header')}"
                        if listing_id and listing_id not in listing_ids:
                            listing_ids.add(listing_id)
                            new_listings.append(listing)
                if new_listings:
                    logger.info(f"📄 Page {page_number}: +{len(new_listings)}")
                return new_listings
            except Exception as e:
                logger.error(f"❌ Error fetching page {page_number}: {e}")
                return []

        with ThreadPoolExecutor(max_workers=workers) as ex:
            futures = [ex.submit(fetch_page, p) for p in range(1, max_pages + 1)]
            for f in as_completed(futures):
                page_list = f.result()
                if page_list:
                    all_listings.extend(page_list)

        logger.info(f"🎉 Scraping complete. Unique listings: {len(all_listings)}")
        return all_listings


class DailyScrapeAutomator:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.scraper = BizBuySellScraper()
        self.db = DatabaseManager(supabase_url, supabase_key)

    def run_daily_scrape(self, max_pages: int = 500, workers: int = 10, save_json: bool = True):
        start_time = datetime.now(timezone.utc)
        logger.info(f"🚀 Starting daily scrape at {start_time.isoformat()}")

        try:
            listings = self.scraper.scrape_listings(max_pages=max_pages, workers=workers)
            if not listings:
                logger.warning("⚠️ No listings scraped")
                return False

            if save_json:
                ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
                fname = f"bizbuysell_listings_{ts}.json"
                try:
                    with open(fname, "w", encoding="utf-8") as f:
                        json.dump(listings, f)
                    logger.info(f"💾 Saved raw JSON -> {fname}")
                except Exception as e:
                    logger.error(f"❌ Error saving JSON: {e}")

            ok = self.db.upsert_listings(listings)
            duration = datetime.now(timezone.utc) - start_time
            if ok:
                logger.info(f"✅ Daily scrape completed in {duration}")
                logger.info(f"📊 Total scraped (pre-filter): {len(listings)}")
                recent = self.db.get_recent_listings_count(24)
                logger.info(f"🕛 Last 24h in DB: {recent}")
                return True
            else:
                logger.error("❌ Failed during DB upsert")
                return False
        except Exception as e:
            logger.error(f"❌ Top-level error in daily scrape: {e}")
            return False


def main():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        logger.error("❌ Missing SUPABASE_URL or SUPABASE_KEY")
        return
    if ".supabase.co" not in supabase_url:
        logger.error(f"❌ SUPABASE_URL looks wrong: {supabase_url}")
        return

    automator = DailyScrapeAutomator(supabase_url, supabase_key)
    success = automator.run_daily_scrape(max_pages=500, workers=10, save_json=True)
    if success:
        logger.info("🎉 Daily automation completed successfully!")
    else:
        logger.error("💥 Daily automation failed!")


if __name__ == "__main__":
    main()
