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

# --- Logging / setup ---
init(autoreset=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("scraper.log"), logging.StreamHandler()],
)
logger = logging.getLogger(__name__)


# =========================
# Database layer (simple)
# =========================
class DatabaseManager:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.client: Client = create_client(supabase_url, supabase_key)
        logger.info("✅ Supabase client initialized")

    # ---- safe casts ----
    def safe_int(self, v: Any) -> Optional[int]:
        if v is None:
            return None
        s = str(v).strip()
        if s == "" or s.lower() in ("none", "null", "nan"):
            return None
        try:
            return int(float(s))
        except Exception:
            return None

    def safe_str(self, v: Any) -> Optional[str]:
        if v is None:
            return None
        if isinstance(v, (dict, list)):
            return json.dumps(v)
        s = str(v).strip()
        return s if s else None

    # ---- mapping / transform ----
    def transform_listing(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        list_number = self.safe_int(raw.get("listNumber"))
        url_stub = self.safe_str(raw.get("urlStub"))
        surrogate_key = hashlib.md5(f"{list_number}_{url_stub}".encode()).hexdigest()

        rec = {
            # core
            "surrogate_key": surrogate_key,
            "header": self.safe_str(raw.get("header")),
            "location": self.safe_str(raw.get("location")),
            "locationCrumbs": self.safe_str(raw.get("locationCrumbs")),
            "price": self.safe_int(raw.get("price")),  # <-- BIGINT: force int
            "description": self.safe_str(raw.get("description")),
            "type": self.safe_int(raw.get("type")),
            "img": self.safe_str(raw.get("img")),
            "listNumber": list_number,
            "specificId": self.safe_int(raw.get("specificId")),
            "urlStub": url_stub,
            "cashFlow": self.safe_str(raw.get("cashFlow")),  # text in table
            "listingTypeId": self.safe_int(raw.get("listingTypeId")),
            "ebitda": self.safe_str(raw.get("ebitda")),      # text in table
            "financingTypeId": self.safe_str(raw.get("financingTypeId")),
            "leaseRateDuration": self.safe_str(raw.get("leaseRateDuration")),
            "leaseRatePerSquareFoot": self.safe_str(raw.get("leaseRatePerSquareFoot")),
            "searchOffset": self.safe_int(raw.get("searchOffset")),
            "adLevelId": self.safe_int(raw.get("adLevelId")),
            "siteSpecificId": self.safe_int(raw.get("siteSpecificId")),
            "isDiamondReinforcement": self.safe_str(raw.get("isDiamondReinforcement")),
            "brokerCompany": self.safe_str(raw.get("brokerCompany")),
            "brokerIntroduction": self.safe_str(raw.get("brokerIntroduction")),
            "brokerContactPhoto": self.safe_str(raw.get("brokerContactPhoto")),
            "brokerContactFullName": self.safe_str(raw.get("brokerContactFullName")),
            "isInlineAd": self.safe_str(raw.get("isInlineAd")),
            "listingPriceReduced": self.safe_str(raw.get("listingPriceReduced")),
            "contactInfo": self.safe_str(raw.get("contactInfo")),
            "detailRequests": self.safe_str(raw.get("detailRequests")),
            "diamondMetaData": self.safe_str(raw.get("diamondMetaData")),
            "region": self.safe_str(raw.get("region")),
            "hotProperty": self.safe_str(raw.get("hotProperty")),
            "recentlyUpdated": self.safe_str(raw.get("recentlyUpdated")),
            "recentlyAdded": self.safe_str(raw.get("recentlyAdded")),
            "isInlineBroker": self.safe_str(raw.get("isInlineBroker")),
            "brokerCompanyPhoto": self.safe_str(raw.get("brokerCompanyPhoto")),
            "brokerCertifications": self.safe_str(raw.get("brokerCertifications")),
            "realEstateIncludedInAskingPrice": self.safe_str(raw.get("realEstateIncludedInAskingPrice")),
            "initialFee": self.safe_str(raw.get("initialFee")),
            "initialCapital": self.safe_str(raw.get("initialCapital")),
            "externalUrl": self.safe_str(raw.get("externalUrl")),
            "auctionStartDate": self.safe_str(raw.get("auctionStartDate")),
            "auctionEndDate": self.safe_str(raw.get("auctionEndDate")),
            "auctionDateDisplay": self.safe_str(raw.get("auctionDateDisplay")),
            "auctionPlacardHighlights": self.safe_str(raw.get("auctionPlacardHighlights")),
            "account": self.safe_str(raw.get("account")),
            "activeListingsCount": self.safe_str(raw.get("activeListingsCount")),
            "soldListingsCount": self.safe_str(raw.get("soldListingsCount")),
            "isFdResale": self.safe_str(raw.get("isFdResale")),
            "userTypeId": self.safe_str(raw.get("userTypeId")),
            "relatedSearchUrlStub": self.safe_str(raw.get("relatedSearchUrlStub")),
            "expirationTypeId": self.safe_str(raw.get("expirationTypeId")),
            "advertiserId": self.safe_str(raw.get("advertiserId")),
            "placementTypeId": self.safe_str(raw.get("placementTypeId")),
            "sponsorLevelId": self.safe_str(raw.get("sponsorLevelId")),
            "categoryDetails": self.safe_str(raw.get("categoryDetails")),
            "scraped_at": datetime.now(timezone.utc).isoformat(),
        }

        # Flatten a few nested commonly-used fields IF dict present
        ci = raw.get("contactInfo") or {}
        if isinstance(ci, dict):
            rec["contactInfo.contactInfoPersonId"] = self.safe_str(ci.get("contactInfoPersonId"))
            rec["contactInfo.contactFullName"] = self.safe_str(ci.get("contactFullName"))
            ph = ci.get("contactPhoneNumber") or {}
            if isinstance(ph, dict):
                rec["contactInfo.contactPhoneNumber.telephone"] = self.safe_str(ph.get("telephone"))
                rec["contactInfo.contactPhoneNumber.tpnPhone"] = self.safe_str(ph.get("tpnPhone"))
                rec["contactInfo.contactPhoneNumber.tpnPhoneExt"] = self.safe_str(ph.get("tpnPhoneExt"))
            rec["contactInfo.contactPhoto"] = self.safe_str(ci.get("contactPhoto"))
            rec["contactInfo.brokerCompany"] = self.safe_str(ci.get("brokerCompany"))
            rec["contactInfo.brokerProfileUrl"] = self.safe_str(ci.get("brokerProfileUrl"))

        dm = raw.get("diamondMetaData") or {}
        if isinstance(dm, dict):
            rec["diamondMetaData.bbsListNumber"] = self.safe_str(dm.get("bbsListNumber"))
            rec["diamondMetaData.headline"] = self.safe_str(dm.get("headline"))
            rec["diamondMetaData.askingPrice"] = self.safe_str(dm.get("askingPrice"))
            rec["diamondMetaData.adLevel"] = self.safe_str(dm.get("adLevel"))
            rec["diamondMetaData.bbsPrimaryBizTypeId"] = self.safe_str(dm.get("bbsPrimaryBizTypeId"))
            rec["diamondMetaData.checkboxAdTagline"] = self.safe_str(dm.get("checkboxAdTagline"))
            rec["diamondMetaData.bqPrimaryBizTypeId"] = self.safe_str(dm.get("bqPrimaryBizTypeId"))
            rec["diamondMetaData.bqListNumber"] = self.safe_str(dm.get("bqListNumber"))
            rec["diamondMetaData.bqPrimaryBizTypeName"] = self.safe_str(dm.get("bqPrimaryBizTypeName"))
            rec["diamondMetaData.bbsPrimaryBizTypeName"] = self.safe_str(dm.get("bbsPrimaryBizTypeName"))
            rec["diamondMetaData.location"] = self.safe_str(dm.get("location"))
            rec["diamondMetaData.locationSt"] = self.safe_str(dm.get("locationSt"))
            rec["diamondMetaData.regionId"] = self.safe_str(dm.get("regionId"))

        return rec

    # SIMPLE: insert individually; skip errors
    def insert_silently(self, listings: List[Dict[str, Any]]) -> bool:
        if not listings:
            logger.info("No listings to insert.")
            return True

        # transform + dedupe by surrogate_key
        items: Dict[str, Dict[str, Any]] = {}
        for raw in listings:
            try:
                t = self.transform_listing(raw)
                sk = t.get("surrogate_key")
                if sk:
                    items[sk] = t
            except Exception as e:
                # swallow transform errors
                continue

        records = list(items.values())
        total = len(records)
        if total == 0:
            logger.info("Nothing to insert after dedupe.")
            return True

        inserted = 0
        skipped = 0
        for i, rec in enumerate(records, start=1):
            try:
                # single-record insert
                self.client.table("daily_listings").insert(rec).execute()
                inserted += 1
            except Exception:
                # skip all errors (duplicates, etc.)
                skipped += 1

            if i % 50 == 0 or i == total:
                logger.info(f"Progress: {i}/{total} | ✅ {inserted} | ⏭️ {skipped}")

        logger.info(f"Done. Inserted: {inserted}, Skipped: {skipped}")
        return inserted > 0


# =========================
# Scraper (unchanged, simple)
# =========================
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

    def scrape_listings(self, max_pages=100, workers=10) -> List[Dict[str, Any]]:
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

        all_listings: List[Dict[str, Any]] = []
        listing_ids = set()
        lock = Lock()

        def fetch_page(pn: int) -> List[Dict[str, Any]]:
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
                        if lid and lid not in listing_ids:
                            listing_ids.add(lid)
                            new.append(l)
                return new
            except Exception:
                return []

        with ThreadPoolExecutor(max_workers=workers) as ex:
            futures = [ex.submit(fetch_page, p) for p in range(1, max_pages + 1)]
            for f in as_completed(futures):
                ls = f.result() or []
                if ls:
                    all_listings.extend(ls)

        logger.info(f"🎉 Scraping complete. {len(all_listings)} listings")
        return all_listings


# =========================
# Orchestrator
# =========================
class DailyScrapeAutomator:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.scraper = BizBuySellScraper()
        self.db = DatabaseManager(supabase_url, supabase_key)

    def run_daily_scrape(self, max_pages=500, workers=10, save_json=True) -> bool:
        listings = self.scraper.scrape_listings(max_pages=max_pages, workers=workers)
        if not listings:
            logger.warning("No listings found.")
            return False

        if save_json:
            fname = f"bizbuysell_listings_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            try:
                with open(fname, "w", encoding="utf-8") as f:
                    json.dump(listings, f)
                logger.info(f"💾 Saved {len(listings)} raw listings to {fname}")
            except Exception:
                pass

        # Simple: insert and skip errors
        return self.db.insert_silently(listings)


def main():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        logger.error("❌ Missing SUPABASE_URL or SUPABASE_KEY")
        return

    max_pages = int(os.getenv("MAX_PAGES", "500"))
    workers = int(os.getenv("WORKERS", "10"))
    logger.info(f"Config → MAX_PAGES={max_pages}, WORKERS={workers}")

    ok = DailyScrapeAutomator(url, key).run_daily_scrape(
        max_pages=max_pages, workers=workers, save_json=True
    )
    if ok:
        logger.info("🎉 Daily automation completed successfully!")
    else:
        logger.error("💥 Daily automation failed!")


if __name__ == "__main__":
    main()
