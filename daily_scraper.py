import os
import json
import time
import hashlib
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from curl_cffi import requests
from colorama import Fore, Style, init
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from supabase import create_client, Client
import logging

# Initialize colorama
init(autoreset=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler('scraper.log'), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

CLEANING_KEYWORDS = [
    "clean", "cleaning", "janitor", "janitorial", "maid", "housekeep",
    "carpet", "floor", "window", "pressure wash", "power wash",
    "restoration", "remediation", "mold", "water damage", "fire damage",
    "sanitation", "disinfect", "detailing", "laundry", "laundromat"
]

def _is_cleaning_listing(l: Dict[str, Any]) -> bool:
    text = " ".join([
        str(l.get("header") or ""),
        str(l.get("description") or ""),
        str(l.get("categoryDetails") or "")
    ]).lower()
    return any(k in text for k in CLEANING_KEYWORDS)

def _to_int(x) -> Optional[int]:
    if x is None or x == "":
        return None
    try:
        return int(float(str(x).replace(",", "")))
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

    def transform_listing(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        # surrogate key (urlStub + header)
        list_number = listing.get('listNumber') or listing.get('listnumber') or ""
        url_stub = listing.get('urlStub') or listing.get('urlstub') or ""
        header = listing.get('header') or ""
        surrogate_key = hashlib.md5(f"{url_stub}__{header}".encode()).hexdigest()

        transformed = {
            "surrogate_key": surrogate_key,
            "listnumber": str(list_number) if list_number else None,
            "header": listing.get("header"),
            "city_state": listing.get("location"),

            # sanitize all numeric fields
            "asking_price": _to_int(listing.get("price")),
            "cash_flow": _to_int(listing.get("cashFlow")),
            "ebitda": _to_int(listing.get("ebitda")),
            "initial_fee": _to_int(listing.get("initialFee")),
            "initial_capital": _to_int(listing.get("initialCapital")),

            "summary": listing.get("description"),
            "url": listing.get("urlStub"),
            "image_url": None,
            "broker": listing.get("brokerCompany") or listing.get("brokerContactFullName"),
            "broker_contact": None,
            "region": listing.get("region"),
            "scraped_at": datetime.now(timezone.utc).isoformat(),

            "contact_info": listing.get("contactInfo") or None,
            "detail_requests": listing.get("detailRequests") or None,
            "diamond_metadata": listing.get("diamondMetaData") or None,

            "account": listing.get("account"),
            "listingtypeid": listing.get("listingTypeId"),
            "categorydetails": listing.get("categoryDetails") or None,
        }
        return transformed

    def upsert_listings(self, listings: List[Dict[str, Any]]) -> bool:
        if not listings:
            logger.warning("No listings to insert")
            return True

        transformed_listings = []
        for raw in listings:
            try:
                if not _is_cleaning_listing(raw):
                    continue
                t = self.transform_listing(raw)
                transformed_listings.append(t)
            except Exception as e:
                logger.error(f"Error transforming listing {raw.get('listNumber', 'Unknown')}: {e}")

        if not transformed_listings:
            logger.info("No cleaning listings to upsert.")
            return True

        batch_size = 100
        total = len(transformed_listings)
        done = 0
        for i in range(0, total, batch_size):
            batch = transformed_listings[i:i + batch_size]
            try:
                self.client.table('daily_listings').upsert(
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
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            r = self.client.table('daily_listings') \
                .select('surrogate_key', count='exact') \
                .gte('scraped_at', cutoff_time.isoformat()) \
                .execute()
            return r.count or 0
        except Exception as e:
            logger.error(f"Error getting recent listings count: {e}")
            return 0

class BizBuySellScraper:
    def __init__(self):
        self.session = requests.Session(impersonate="chrome")
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://www.bizbuysell.com',
            'Referer': 'https://www.bizbuysell.com/',
            'Content-Type': 'application/json',
        }
        self.token = None
        self.get_auth_token()

    def get_auth_token(self):
        logger.info("🔑 Obtaining authentication token...")
        try:
            resp = self.session.get('https://www.bizbuysell.com/', headers=self.headers, timeout=20)
            self.token = resp.cookies.get('_track_tkn')
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
        api_headers['Authorization'] = f'Bearer {self.token}'

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
                "daysListedAgo": 30,
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
                    'https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults',
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

        from concurrent.futures import as_completed
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
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        logger.error("❌ Missing SUPABASE_URL or SUPABASE_KEY")
        return

    automator = DailyScrapeAutomator(supabase_url, supabase_key)
    success = automator.run_daily_scrape(max_pages=500, workers=10, save_json=True)
    if success:
        logger.info("🎉 Daily automation completed successfully!")
    else:
        logger.error("💥 Daily automation failed!")

if __name__ == "__main__":
    main()
