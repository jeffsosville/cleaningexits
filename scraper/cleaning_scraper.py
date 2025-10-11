#!/usr/bin/env python3
"""
BizBuySell Listing Scraper (hybrid, stable)
- Impersonates Chrome via curl_cffi
- Tries _track_tkn cookie; gracefully falls back if absent
- Retries w/ backoff, threads, dedupe
- Saves JSON + CSV
- Optionally pushes to Supabase via scraper/ingest.py (push_daily_candidates)
  - Toggle with env PUSH_TO_SUPABASE=1
  - Requires scraper/.env.local with SUPABASE_URL + SUPABASE_SERVICE_KEY
"""

import os
import json
import csv
import time
import hashlib
import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from threading import Lock
from concurrent.futures import ThreadPoolExecutor, as_completed

from colorama import Fore, Style, init
from curl_cffi import requests

# --- robust optional Supabase import (works from root OR scraper/) ---
PUSH_TO_SUPABASE = os.getenv("PUSH_TO_SUPABASE", "0") == "1"
push_daily_candidates = None
if PUSH_TO_SUPABASE:
    try:
        # When running from project root:  python -m scraper.cleaning_scraper
        from scraper.ingest import push_daily_candidates as _pdc
        push_daily_candidates = _pdc
    except Exception:
        try:
            # When running inside scraper/:  python cleaning_scraper.py
            from ingest import push_daily_candidates as _pdc
            push_daily_candidates = _pdc
        except Exception as e:
            print(f"[!] Supabase ingest not available; skipping push (adjust import): {e}")


# Tunables via ENV (use sane defaults)
MAX_PAGES = int(os.getenv("MAX_PAGES", "500"))
WORKERS = int(os.getenv("WORKERS", "10"))
DAYS_LISTED_AGO = int(os.getenv("DAYS_LISTED_AGO", "1"))  # last N days
PAGE_PAUSE = float(os.getenv("PAGE_PAUSE", "0.25"))       # politeness delay

class BizBuySellScraper:
    def __init__(self):
        # cURL impersonation: "chrome120" / "chrome" both fine
        self.session = requests.Session(impersonate="chrome120")
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Sec-Ch-Ua': '"Chromium";v="135", "Not-A.Brand";v="8"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Site': 'same-site',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Origin': 'https://www.bizbuysell.com',
            'Referer': 'https://www.bizbuysell.com/',
            'Content-Type': 'application/json',
            'X-Correlation-Id': 'b5492b02-712f-4ee8-be99-cc27c8668908'
        }
        self.token: Optional[str] = None
        self.get_auth_token()  # hybrid: ok if it fails

    # ------------------------- token (hybrid) -------------------------
    def get_auth_token(self):
        print(f"{Fore.CYAN}[*] Obtaining authentication token (cookie)…")
        try:
            r = self.session.get(
                'https://www.bizbuysell.com/businesses-for-sale/new-york-ny/',
                headers=self.headers,
                timeout=30,
                allow_redirects=True
            )
            self.token = (
                r.cookies.get('_track_tkn')
                or r.cookies.get('track_tkn')
                or None
            )
            if self.token:
                print(f"{Fore.GREEN}[+] _track_tkn cookie found; will use Authorization")
            else:
                print(f"{Fore.YELLOW}[!] No _track_tkn cookie; proceeding without Authorization")
        except Exception as e:
            print(f"{Fore.YELLOW}[!] Token fetch error: {e}; proceeding without Authorization")
            self.token = None

    # ------------------------- HTTP helpers --------------------------
    def _post_with_retry(self, url: str, headers: Dict[str, str], payload: Dict[str, Any],
                         tries: int = 5, base: float = 0.8, cap: float = 12.0) -> Optional[requests.Response]:
        """POST with 429/5xx backoff."""
        for attempt in range(1, tries + 1):
            try:
                resp = self.session.post(url, headers=headers, json=payload, timeout=45)
                if resp.status_code == 429:
                    delay = min(cap, base * (2 ** (attempt - 1)) + random.uniform(0, 0.4))
                    print(f"{Fore.YELLOW}[429] backoff {delay:.1f}s (attempt {attempt}/{tries})")
                    time.sleep(delay)
                    continue
                if 500 <= resp.status_code < 600:
                    delay = min(cap, base * (2 ** (attempt - 1)) + random.uniform(0, 0.4))
                    print(f"{Fore.YELLOW}[{resp.status_code}] server error; retry in {delay:.1f}s (attempt {attempt}/{tries})")
                    time.sleep(delay)
                    continue
                resp.raise_for_status()
                return resp
            except Exception as e:
                delay = min(cap, base * (2 ** (attempt - 1)) + random.uniform(0, 0.4))
                print(f"{Fore.YELLOW}[!] POST failed {e}; retry in {delay:.1f}s (attempt {attempt}/{tries})")
                time.sleep(delay)
        return None

    # ------------------------- core scrape ---------------------------
    def scrape_listings(self, max_pages: int = MAX_PAGES, workers: int = WORKERS) -> List[Dict[str, Any]]:
        print(f"{Fore.CYAN}[*] Starting to scrape listings with {workers} workers…")
        api_headers = self.headers.copy()
        if self.token:
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
                "daysListedAgo": DAYS_LISTED_AGO,
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

        def fetch_page(page_number: int) -> List[Dict[str, Any]]:
            payload = json.loads(json.dumps(payload_template))  # deep copy
            payload["bfsSearchCriteria"]["pageNumber"] = page_number
            resp = self._post_with_retry(API_URL, api_headers, payload)
            if not resp:
                return []
            try:
                data = resp.json()
            except Exception:
                return []
            rows = data.get("value", {}).get("bfsSearchResult", {}).get("value", []) or []
            new_listings = []
            with lock:
                for listing in rows:
                    key = f"{listing.get('urlStub')}--{listing.get('header')}"
                    if key and key not in listing_ids:
                        listing_ids.add(key)
                        new_listings.append(listing)
            # small politeness pause
            time.sleep(PAGE_PAUSE)
            return new_listings

        # Threaded fan-out over pages
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futures = [ex.submit(fetch_page, p) for p in range(1, max_pages + 1)]
            for fut in as_completed(futures):
                page_listings = fut.result()
                if page_listings:
                    all_listings.extend(page_listings)

        print(f"{Fore.GREEN}[+] Scraping complete! Total unique listings scraped: {len(all_listings)}")
        return all_listings

    # ------------------------- save outputs --------------------------
    def save_json(self, listings: List[Dict[str, Any]], filename: str = "bizbuysell_listings.json"):
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(listings, f, indent=4)
            print(f"{Fore.GREEN}[+] Saved JSON → {filename}")
        except Exception as e:
            print(f"{Fore.RED}[-] Error saving JSON: {e}")

    def save_csv(self, listings: List[Dict[str, Any]], filename: str = "bizbuysell_listings.csv"):
        if not listings:
            print(f"{Fore.YELLOW}[!] No listings to write to CSV")
            return
        fields = ["header", "urlStub", "location", "price", "cashFlow", "ebitda"]
        with open(filename, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            for l in listings:
                w.writerow({k: l.get(k) for k in fields})
        print(f"{Fore.GREEN}[+] Saved CSV  → {filename}")

    # ------------------------- normalize → Supabase rows -------------
    @staticmethod
    def _normalize_for_daily(l: Dict[str, Any], now_iso: str) -> Dict[str, Any]:
        ident = str(l.get("listNumber") or f"{l.get('urlStub')}--{l.get('header')}")
        uid = hashlib.sha256(ident.encode("utf-8")).hexdigest()

        img = l.get("img")
        image_url = img[0] if isinstance(img, list) and img else (img if isinstance(img, str) else None)

        return {
            "id": uid,
            "title": l.get("header"),
            "city_state": l.get("location"),
            "asking_price": l.get("price"),
            "cash_flow": l.get("cashFlow"),
            "ebitda": l.get("ebitda"),
            "summary": l.get("description"),
            "url": l.get("urlStub"),
            "image_url": image_url,
            "broker": l.get("brokercompany") or l.get("brokerCompany"),
            "broker_contact": l.get("brokercontactfullname") or l.get("brokerContactFullName"),
            "scraped_at": now_iso,
        }

    def maybe_push_supabase(self, listings: List[Dict[str, Any]]):
        if not PUSH_TO_SUPABASE or not push_daily_candidates:
            print(f"{Fore.YELLOW}[!] Supabase push disabled or ingest not found; skipping push")
            return
        now_iso = datetime.now(timezone.utc).isoformat()
        rows = [self._normalize_for_daily(l, now_iso) for l in listings]
        print(f"{Fore.CYAN}[*] Preparing {len(rows)} rows for Supabase…")
        try:
            inserted = push_daily_candidates(rows)
            print(f"{Fore.GREEN}[+] Upserted {inserted} rows into daily_cleaning_raw ✅")
            print(f"{Fore.YELLOW}    → Views like daily_cleaning_today will reflect automatically.")
        except Exception as e:
            print(f"{Fore.RED}[-] Failed to insert into Supabase: {e}")

# ------------------------- main --------------------------
if __name__ == "__main__":
    print(f"{Fore.CYAN}{'='*58}")
    print(f"{Fore.CYAN}{' '*11}BizBuySell Listing Scraper (hybrid mode)")
    print(f"{Fore.CYAN}{'='*58}")

    scraper = BizBuySellScraper()
    listings = scraper.scrape_listings(max_pages=MAX_PAGES, workers=WORKERS)

    # save locally
    scraper.save_json(listings, "bizbuysell_listings.json")
    scraper.save_csv(listings, "bizbuysell_listings.csv")

    # optional Supabase push
    scraper.maybe_push_supabase(listings)

    print(f"{Fore.GREEN}[+] Process complete! Found {len(listings)} unique listings.")
