# cleaning_scraper.py
from curl_cffi import requests
import json, csv, time, os, random
from colorama import Fore, Style, init
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

# Initialize colorama
init(autoreset=True)

class BizBuySellCleaningScraper:
    def __init__(self):
        # Impersonate a real browser via curl_cffi
        self.session = requests.Session(impersonate="chrome120")
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Origin": "https://www.bizbuysell.com",
            "Referer": "https://www.bizbuysell.com/",
            "Content-Type": "application/json",
        }
        self.token = None

        # Cleaning-related keywords for filtering
        self.cleaning_keywords = [
            "cleaning", "janitorial", "custodial", "sanitation", "maintenance",
            "carpet cleaning", "window cleaning", "commercial cleaning",
            "residential cleaning", "maid service", "housekeeping",
            "pressure washing", "restoration", "disinfection"
        ]

        # Placeholder category IDs — update when you discover real ones
        self.cleaning_category_ids = [300, 301]

        self.get_auth_token()

    def get_auth_token(self, max_retries: int = 3) -> None:
        print(f"{Fore.CYAN}[*] Obtaining authentication token...")
        for attempt in range(1, max_retries + 1):
            try:
                if attempt > 1:
                    delay = random.uniform(2, 5)
                    print(f"{Fore.YELLOW}… retry {attempt}/{max_retries} after {delay:.1f}s")
                    time.sleep(delay)

                r = self.session.get(
                    "https://www.bizbuysell.com/businesses-for-sale/new-york-ny/",
                    headers=self.headers, timeout=30, allow_redirects=True
                )
                r.raise_for_status()

                # Common cookie names seen in the wild
                for name in ["_track_tkn", "track_tkn", "auth_token", "token"]:
                    token = self.session.cookies.get(name)
                    if token:
                        self.token = token
                        print(f"{Fore.GREEN}[+] Token obtained")
                        return

                # Fallback: look in HTML
                if "_track_tkn" in r.text:
                    import re
                    m = re.search(r'_track_tkn["\']?\s*[:=]\s*["\']?([^"\';\s]+)', r.text)
                    if m:
                        self.token = m.group(1)
                        print(f"{Fore.GREEN}[+] Token extracted from HTML")
                        return

                print(f"{Fore.YELLOW}[!] No token found on attempt {attempt}")
            except Exception as e:
                print(f"{Fore.RED}[-] Token error (attempt {attempt}): {e}")

        print(f"{Fore.RED}[-] All token attempts failed")

    def is_cleaning_related(self, listing: Dict[str, Any]) -> bool:
        fields = [
            listing.get("header", ""),
            listing.get("description", ""),
            listing.get("businessDescription", ""),
            listing.get("category", ""),
            listing.get("subCategory", ""),
            listing.get("businessType", ""),
            listing.get("title", "")
        ]
        text = " ".join(str(x) for x in fields if x).lower()

        if any(k in text for k in self.cleaning_keywords):
            return True

        cat_id = listing.get("categoryId") or listing.get("primaryCategoryId")
        if cat_id and cat_id in self.cleaning_category_ids:
            return True

        return False

    def _search(self, headers: Dict[str, str], payload_base: Dict[str, Any], pages: int) -> List[Dict[str, Any]]:
        out = []
        for pn in range(1, pages + 1):
            payload = json.loads(json.dumps(payload_base))
            payload["bfsSearchCriteria"]["pageNumber"] = pn
            try:
                r = self.session.post(
                    "https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults",
                    headers=headers, json=payload, timeout=30
                )
                if r.status_code != 200:
                    print(f"{Fore.YELLOW}[!] Page {pn} status {r.status_code}")
                    break

                data = r.json()
                page_listings = data.get("value", {}).get("bfsSearchResult", {}).get("value", [])
                if not page_listings:
                    break
                out.extend(page_listings)
                time.sleep(0.4)  # gentle rate limit
            except Exception as e:
                print(f"{Fore.RED}[-] Page {pn} error: {e}")
                break
        return out

    def scrape_cleaning_listings(self, max_pages=100, workers=5, use_keyword_search=True) -> List[Dict[str, Any]]:
        if not self.token:
            print(f"{Fore.RED}[-] No token; cannot scrape.")
            return []

        api_headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Origin": "https://www.bizbuysell.com",
            "Referer": "https://www.bizbuysell.com/",
        }

        print(f"{Fore.CYAN}[*] Scraping with workers={workers}, max_pages={max_pages}")

        base_template = {
            "bfsSearchCriteria": {
                "siteId": 20, "languageId": 10, "pageNumber": 1,
                "categories": None, "locations": None, "excludeLocations": None,
                "askingPriceMax": 0, "askingPriceMin": 0, "keyword": None,
                "cashFlowMin": 0, "cashFlowMax": 0, "grossIncomeMin": 0, "grossIncomeMax": 0,
                "daysListedAgo": 1, "establishedAfterYear": 0, "listingsWithNoAskingPrice": 0,
                "homeBasedListings": 0, "includeRealEstateForLease": 0, "listingsWithSellerFinancing": 0,
                "realEstateIncluded": 0, "showRelocatableListings": False, "relatedFranchises": 0,
                "listingTypeIds": None, "designationTypeIds": None, "sortList": None, "absenteeOwnerListings": 0,
                "seoSearchType": None
            }
        }

        listings = []
        seen = set()

        # 1) Keyword search
        if use_keyword_search:
            print(f"{Fore.CYAN}[*] Keyword search…")
            for kw in ["cleaning", "janitorial", "custodial", "maid service"]:
                t = json.loads(json.dumps(base_template))
                t["bfsSearchCriteria"]["keyword"] = kw
                chunk = self._search(api_headers, t, max_pages // 4 or 1)
                for l in chunk:
                    lid = f"{l.get('urlStub')}--{l.get('header')}"
                    if lid and lid not in seen:
                        seen.add(lid)
                        listings.append(l)

        # 2) Category search (if IDs are valid)
        if self.cleaning_category_ids:
            print(f"{Fore.CYAN}[*] Category search…")
            t = json.loads(json.dumps(base_template))
            t["bfsSearchCriteria"]["categories"] = self.cleaning_category_ids
            chunk = self._search(api_headers, t, max_pages // 2 or 1)
            for l in chunk:
                lid = f"{l.get('urlStub')}--{l.get('header')}"
                if lid and lid not in seen:
                    seen.add(lid)
                    listings.append(l)

        # 3) General search w/ filter (fallback)
        print(f"{Fore.CYAN}[*] General search + filter…")
        def fetch_page(pn: int) -> List[Dict[str, Any]]:
            t = json.loads(json.dumps(base_template))
            t["bfsSearchCriteria"]["pageNumber"] = pn
            try:
                r = self.session.post(
                    "https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults",
                    headers=api_headers, json=t, timeout=30
                )
                if r.status_code != 200:
                    return []
                data = r.json()
                raw = data.get("value", {}).get("bfsSearchResult", {}).get("value", [])
                return [x for x in raw if self.is_cleaning_related(x)]
            except Exception:
                return []

        with ThreadPoolExecutor(max_workers=workers) as ex:
            futures = [ex.submit(fetch_page, p) for p in range(1, max_pages + 1)]
            for fut in as_completed(futures):
                for l in (fut.result() or []):
                    lid = f"{l.get('urlStub')}--{l.get('header')}"
                    if lid and lid not in seen:
                        seen.add(lid)
                        listings.append(l)

        print(f"{Fore.GREEN}[+] Done. Cleaning listings: {len(listings)}")
        return listings

    def save_json(self, listings: List[Dict[str, Any]], filename="cleaning_business_listings.json") -> None:
        out = {
            "metadata": {
                "total_listings": len(listings),
                "search_keywords": self.cleaning_keywords,
                "search_categories": self.cleaning_category_ids,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            },
            "listings": listings,
        }
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(out, f, indent=4)
        print(f"{Fore.GREEN}[+] Saved JSON → {filename}")

    def save_csv(self, listings: List[Dict[str, Any]], filename="cleaning_business_listings.csv") -> None:
        if not listings:
            print(f"{Fore.YELLOW}[!] No listings to write to CSV")
            return
        # Pick a sane subset of fields (add/remove as you like)
        fields = [
            "header", "urlStub", "location", "price", "cashFlow", "ebitda",
            "listingTypeId", "adLevelId", "siteSpecificId",
            "diamondMetaData", "category", "subCategory"
        ]
        # Flatten diamondMetaData to a string if present
        def flat(row, key):
            v = row.get(key)
            if isinstance(v, (dict, list)):
                return json.dumps(v, ensure_ascii=False)
            return v
        with open(filename, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            for l in listings:
                writer.writerow({k: flat(l, k) for k in fields})
        print(f"{Fore.GREEN}[+] Saved CSV  → {filename}")

if __name__ == "__main__":
    print(f"{Fore.CYAN}{'='*60}")
    print(f"{Fore.CYAN}{' '*15}BizBuySell Cleaning Business Scraper")
    print(f"{Fore.CYAN}{'='*60}")

    scraper = BizBuySellCleaningScraper()
    listings = scraper.scrape_cleaning_listings(max_pages=100, workers=5, use_keyword_search=True)
    scraper.save_json(listings, "cleaning_business_listings.json")
    scraper.save_csv(listings, "cleaning_business_listings.csv")

    print(f"{Fore.GREEN}[+] Complete. Found {len(listings)} cleaning listings.")
