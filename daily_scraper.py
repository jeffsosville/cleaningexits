import os
import json
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from curl_cffi import requests
from colorama import init
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from supabase import create_client, Client
import logging

# Initialize colorama
init(autoreset=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("scraper.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


class DatabaseManager:
    def __init__(self, supabase_url: str, supabase_key: str):
        try:
            self.client: Client = create_client(supabase_url, supabase_key)
            logger.info("✅ Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Supabase client: {e}")
            raise

    def safe_int(self, value: Any) -> Optional[int]:
        """Convert safely to int"""
        if value is None or value == "" or str(value).lower() in ["none", "null", "nan"]:
            return None
        try:
            return int(float(value))
        except Exception:
            return None

    def safe_str(self, value: Any) -> Optional[str]:
        """Convert safely to string"""
        if value is None:
            return None
        if isinstance(value, (dict, list)):
            return json.dumps(value)
        val = str(value).strip()
        return val if val else None

    def transform_listing(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        """Map fields with safe conversion"""
        list_number = self.safe_int(listing.get("listNumber"))
        url_stub = self.safe_str(listing.get("urlStub"))
        surrogate_key = hashlib.md5(f"{list_number}_{url_stub}".encode()).hexdigest()

        transformed = {
            "header": self.safe_str(listing.get("header")),
            "location": self.safe_str(listing.get("location")),
            "locationCrumbs": self.safe_str(listing.get("locationCrumbs")),
            "price": self.safe_int(listing.get("price")),
            "description": self.safe_str(listing.get("description")),
            "type": self.safe_int(listing.get("type")),
            "img": self.safe_str(listing.get("img")),
            "listNumber": list_number,
            "specificId": self.safe_int(listing.get("specificId")),
            "urlStub": url_stub,
            "cashFlow": self.safe_str(listing.get("cashFlow")),
            "listingTypeId": self.safe_int(listing.get("listingTypeId")),
            "ebitda": self.safe_str(listing.get("ebitda")),
            "financingTypeId": self.safe_str(listing.get("financingTypeId")),
            "leaseRateDuration": self.safe_str(listing.get("leaseRateDuration")),
            "leaseRatePerSquareFoot": self.safe_str(listing.get("leaseRatePerSquareFoot")),
            "searchOffset": self.safe_int(listing.get("searchOffset")),
            "adLevelId": self.safe_int(listing.get("adLevelId")),
            "siteSpecificId": self.safe_int(listing.get("siteSpecificId")),
            "isDiamondReinforcement": self.safe_str(listing.get("isDiamondReinforcement")),
            "brokerCompany": self.safe_str(listing.get("brokerCompany")),
            "brokerIntroduction": self.safe_str(listing.get("brokerIntroduction")),
            "brokerContactPhoto": self.safe_str(listing.get("brokerContactPhoto")),
            "brokerContactFullName": self.safe_str(listing.get("brokerContactFullName")),
            "isInlineAd": self.safe_str(listing.get("isInlineAd")),
            "listingPriceReduced": self.safe_str(listing.get("listingPriceReduced")),
            "contactInfo": self.safe_str(listing.get("contactInfo")),
            "detailRequests": self.safe_str(listing.get("detailRequests")),
            "diamondMetaData": self.safe_str(listing.get("diamondMetaData")),
            "region": self.safe_str(listing.get("region")),
            "hotProperty": self.safe_str(listing.get("hotProperty")),
            "recentlyUpdated": self.safe_str(listing.get("recentlyUpdated")),
            "recentlyAdded": self.safe_str(listing.get("recentlyAdded")),
            "isInlineBroker": self.safe_str(listing.get("isInlineBroker")),
            "brokerCompanyPhoto": self.safe_str(listing.get("brokerCompanyPhoto")),
            "brokerCertifications": self.safe_str(listing.get("brokerCertifications")),
            "realEstateIncludedInAskingPrice": self.safe_str(listing.get("realEstateIncludedInAskingPrice")),
            "initialFee": self.safe_str(listing.get("initialFee")),
            "initialCapital": self.safe_str(listing.get("initialCapital")),
            "externalUrl": self.safe_str(listing.get("externalUrl")),
            "auctionStartDate": self.safe_str(listing.get("auctionStartDate")),
            "auctionEndDate": self.safe_str(listing.get("auctionEndDate")),
            "auctionDateDisplay": self.safe_str(listing.get("auctionDateDisplay")),
            "auctionPlacardHighlights": self.safe_str(listing.get("auctionPlacardHighlights")),
            "account": self.safe_str(listing.get("account")),
            "activeListingsCount": self.safe_str(listing.get("activeListingsCount")),
            "soldListingsCount": self.safe_str(listing.get("soldListingsCount")),
            "isFdResale": self.safe_str(listing.get("isFdResale")),
            "userTypeId": self.safe_str(listing.get("userTypeId")),
            "relatedSearchUrlStub": self.safe_str(listing.get("relatedSearchUrlStub")),
            "expirationTypeId": self.safe_str(listing.get("expirationTypeId")),
            "advertiserId": self.safe_str(listing.get("advertiserId")),
            "placementTypeId": self.safe_str(listing.get("placementTypeId")),
            "sponsorLevelId": self.safe_str(listing.get("sponsorLevelId")),
            "categoryDetails": self.safe_str(listing.get("categoryDetails")),
            "ingested_at": datetime.now(timezone.utc).isoformat(),
            "surrogate_key": surrogate_key,
        }

        return transformed

    def upsert_listings(self, listings: List[Dict[str, Any]]) -> bool:
        if not listings:
            logger.warning("No listings to insert")
            return True

        transformed_listings = []
        for l in listings:
            try:
                transformed_listings.append(self.transform_listing(l))
            except Exception as e:
                logger.error(f"❌ Error transforming listing: {e}")

        if not transformed_listings:
            return True

        int_fields = [
            "price",
            "listNumber",
            "specificId",
            "type",
            "searchOffset",
            "adLevelId",
            "siteSpecificId",
            "listingTypeId",
        ]

        total_inserted = 0
        batch_size = 50
        for i in range(0, len(transformed_listings), batch_size):
            batch = transformed_listings[i : i + batch_size]

            # 🔑 Final sanitize pass
            cleaned_batch = []
            for record in batch:
                rec = record.copy()
                for f in int_fields:
                    v = rec.get(f)
                    if v is not None:
                        try:
                            rec[f] = int(float(v))
                        except Exception:
                            rec[f] = None
                cleaned_batch.append(rec)

            try:
                self.client.table("daily_listings").upsert(
                cleaned_batch, on_conflict=["listNumber", "surrogate_key"]
                ).execute()


                ).execute()
                total_inserted += len(cleaned_batch)
                logger.info(
                    f"✅ Upserted {len(cleaned_batch)} listings (Total {total_inserted})"
                )
            except Exception as e:
                logger.error(f"❌ Error upserting batch {i//batch_size+1}: {e}")

        logger.info(f"🎉 Finished upserting {total_inserted} listings")
        return total_inserted > 0


class BizBuySellScraper:
    def __init__(self):
        self.session = requests.Session(impersonate="chrome")
        self.headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://www.bizbuysell.com",
            "Referer": "https://www.bizbuysell.com/",
            "Content-Type": "application/json",
        }
        self.token = None
        self.get_auth_token()

    def get_auth_token(self):
        try:
            resp = self.session.get("https://www.bizbuysell.com/", headers=self.headers)
            self.token = resp.cookies.get("_track_tkn")
            if self.token:
                logger.info("✅ Got token")
            else:
                logger.error("❌ No token found")
        except Exception as e:
            logger.error(f"❌ Error getting token: {e}")

    def scrape_listings(self, max_pages=100, workers=10):
        if not self.token:
            return []
        api_headers = dict(self.headers)
        api_headers["Authorization"] = f"Bearer {self.token}"

        payload_template = {
            "bfsSearchCriteria": {
                "siteId": 20,
                "languageId": 10,
                "pageNumber": 1,
                "daysListedAgo": 1,
            }
        }

        all_listings = []
        listing_ids = set()
        lock = Lock()

        def fetch_page(pn):
            payload = json.loads(json.dumps(payload_template))
            payload["bfsSearchCriteria"]["pageNumber"] = pn
            try:
                r = self.session.post(
                    "https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults",
                    headers=api_headers,
                    json=payload,
                    timeout=30,
                )
                if r.status_code != 200:
                    return []
                data = r.json()
                listings = (
                    data.get("value", {})
                    .get("bfsSearchResult", {})
                    .get("value", [])
                )
                new = []
                with lock:
                    for l in listings:
                        lid = f"{l.get('urlStub')}--{l.get('header')}"
                        if lid not in listing_ids:
                            listing_ids.add(lid)
                            new.append(l)
                return new
            except Exception:
                return []

        with ThreadPoolExecutor(max_workers=workers) as ex:
            futures = [ex.submit(fetch_page, p) for p in range(1, max_pages + 1)]
            for f in as_completed(futures):
                all_listings.extend(f.result() or [])

        logger.info(f"🎉 Scraping complete. {len(all_listings)} listings")
        return all_listings


class DailyScrapeAutomator:
    def __init__(self, supabase_url, supabase_key):
        self.scraper = BizBuySellScraper()
        self.db = DatabaseManager(supabase_url, supabase_key)

    def run_daily_scrape(self, max_pages=500, workers=10, save_json=True):
        listings = self.scraper.scrape_listings(max_pages, workers)
        if not listings:
            return False
        if save_json:
            fname = f"bizbuysell_listings_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(fname, "w", encoding="utf-8") as f:
                json.dump(listings, f)
        return self.db.upsert_listings(listings)


def main():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        logger.error("❌ Missing SUPABASE_URL or SUPABASE_KEY")
        return
    automator = DailyScrapeAutomator(url, key)
    if automator.run_daily_scrape():
        logger.info("🎉 Daily automation completed successfully!")
    else:
        logger.error("💥 Daily automation failed!")


if __name__ == "__main__":
    main()
