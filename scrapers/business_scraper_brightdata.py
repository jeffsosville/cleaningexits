from curl_cffi import requests
import json
import os
import time
from colorama import Fore, Style, init
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import argparse

init(autoreset=True)

STATE_REGION_IDS = {
    "AK": 1, "AL": 2, "AR": 3, "AZ": 4, "CA": 5, "CO": 6, "CT": 7, "DC": 8, "DE": 9, "FL": 10,
    "GA": 11, "HI": 12, "IA": 13, "ID": 14, "IL": 15, "IN": 16, "KS": 17, "KY": 18, "LA": 19,
    "MA": 20, "MD": 21, "ME": 22, "MI": 23, "MN": 24, "MO": 25, "MS": 26, "MT": 27, "NC": 28,
    "ND": 29, "NE": 30, "NH": 31, "NJ": 32, "NM": 33, "NV": 34, "NY": 35, "OH": 36, "OK": 37,
    "OR": 38, "PA": 39, "RI": 40, "SC": 41, "SD": 42, "TN": 43, "TX": 44, "UT": 45, "VA": 46,
    "VT": 47, "WA": 48, "WI": 49, "WV": 50, "WY": 51
}

class BizBuySellScraper:
    def __init__(self, proxy=None, request_delay=0.5):
        """
        Initialize scraper with optional Bright Data proxy support.

        Args:
            proxy: Proxy string in format 'username:password@host:port'
            request_delay: Delay between requests in seconds (default 0.5)
        """
        self.request_delay = request_delay

        # Setup proxy with SSL verification disabled for Bright Data
        proxies = {}
        if proxy:
            print(f"{Fore.GREEN}[+] Using proxy: {proxy.split('@')[1] if '@' in proxy else proxy}")
            proxy_url = f"http://{proxy}"
            proxies = {
                'http': proxy_url,
                'https': proxy_url
            }
        else:
            print(f"{Fore.YELLOW}[!] No proxy - using direct connection")

        # Create session with SSL verification disabled (required for Bright Data)
        self.session = requests.Session(
            impersonate="chrome",
            proxies=proxies if proxies else {},
            verify=False  # Disable SSL verification for Bright Data compatibility
        )

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
        }
        self.token = None
        self.get_auth_token()

    def get_auth_token(self):
        """Get authentication token from BizBuySell."""
        print(f"{Fore.CYAN}[*] Obtaining authentication token...")
        try:
            response = self.session.get(
                'https://www.bizbuysell.com/businesses-for-sale/new-york-ny/',
                headers=self.headers,
                timeout=30
            )
            cookies = response.cookies
            self.token = cookies.get('_track_tkn')

            if self.token:
                print(f"{Fore.GREEN}[+] Authentication token obtained successfully")
            else:
                print(f"{Fore.RED}[-] Failed to get authentication token")

        except Exception as e:
            print(f"{Fore.RED}[-] Error obtaining token: {str(e)}")

    def get_all_states(self):
        """Fetch all US states from BizBuySell API."""
        print(f"{Fore.CYAN}[*] Fetching all US states...")

        if not self.token:
            print(f"{Fore.RED}[-] No token available")
            return []

        api_headers = self.headers.copy()
        api_headers['Authorization'] = f'Bearer {self.token}'

        try:
            time.sleep(self.request_delay)
            response = self.session.get(
                'https://api.bizbuysell.com/bff/v2/BbsListing/GetUsStates',
                headers=api_headers,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                states = data.get('value', {}).get('usStates', {}).get('value', [])
                print(f"{Fore.GREEN}[+] Successfully retrieved {len(states)} states")
                return states
            else:
                print(f"{Fore.RED}[-] Failed to get states. Status: {response.status_code}")
                return []
        except Exception as e:
            print(f"{Fore.RED}[-] Error getting states: {str(e)}")
            return []

    def scrape_state(self, state_code, max_pages=500, workers=3):
        """Scrape all listings for a specific state."""
        region_id = STATE_REGION_IDS.get(state_code)
        if not region_id:
            print(f"{Fore.RED}[-] Invalid state code: {state_code}")
            return []

        print(f"{Fore.CYAN}[*] [{state_code}] Starting scrape with {workers} workers...")

        api_headers = self.headers.copy()
        api_headers['Authorization'] = f'Bearer {self.token}'

        payload_template = {
            "bfsSearchCriteria": {
                "siteId": 20,
                "languageId": 10,
                "categories": None,
                "locations": [{
                    "geoType": 20,
                    "regionId": region_id,
                    "countryCode": "US",
                    "countryId": "US",
                    "stateCode": state_code
                }],
                "excludeLocations": None,
                "askingPriceMax": 0,
                "askingPriceMin": 0,
                "pageNumber": 1,
                "keyword": None,
                "cashFlowMin": 0,
                "cashFlowMax": 0,
                "grossIncomeMin": 0,
                "grossIncomeMax": 0,
                "daysListedAgo": 0,
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

        all_listings = []
        listing_ids = set()
        lock = Lock()
        consecutive_empty = 0
        max_consecutive_empty = 3

        # Get first page to determine total
        payload = json.loads(json.dumps(payload_template))
        payload["bfsSearchCriteria"]["pageNumber"] = 1

        try:
            time.sleep(self.request_delay)
            response = self.session.post(
                'https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults',
                headers=api_headers,
                json=payload,
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                total_count = data.get("value", {}).get("bfsSearchResult", {}).get("totalCount", 0)
                results_per_page = len(data.get("value", {}).get("bfsSearchResult", {}).get("value", []))

                if results_per_page > 0:
                    # If totalCount is 0 or unreliable, scrape all max_pages
                    if total_count > 0:
                        estimated_pages = min((total_count + results_per_page - 1) // results_per_page, max_pages)
                        print(f"{Fore.CYAN}[*] [{state_code}] Total: {total_count} listings, Est pages: {estimated_pages}")
                    else:
                        # No total count - scrape max_pages and stop at empty pages
                        estimated_pages = max_pages
                        print(f"{Fore.CYAN}[*] [{state_code}] Total count unknown, scraping up to {max_pages} pages")

                    # Process first page
                    for listing in data.get("value", {}).get("bfsSearchResult", {}).get("value", []):
                        listing_id = f"{listing.get('urlStub')}--{listing.get('header')}"
                        if listing_id and listing_id not in listing_ids:
                            listing_ids.add(listing_id)
                            all_listings.append(listing)

                    print(f"{Fore.GREEN}[+] [{state_code}] Page 1: {len(all_listings)} listings")
                else:
                    print(f"{Fore.YELLOW}[!] [{state_code}] No results found")
                    return []
            else:
                print(f"{Fore.RED}[-] [{state_code}] Failed initial request. Status: {response.status_code}")
                return []
        except Exception as e:
            print(f"{Fore.RED}[-] [{state_code}] Error in initial request: {str(e)}")
            return []

        # Scrape remaining pages
        def fetch_page(page_number):
            nonlocal consecutive_empty

            time.sleep(self.request_delay)

            payload = json.loads(json.dumps(payload_template))
            payload["bfsSearchCriteria"]["pageNumber"] = page_number

            try:
                response = self.session.post(
                    'https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults',
                    headers=api_headers,
                    json=payload,
                    timeout=30
                )
                if response.status_code == 200:
                    data = response.json()
                    listings = data.get("value", {}).get("bfsSearchResult", {}).get("value", [])

                    if not listings:
                        with lock:
                            consecutive_empty += 1
                        return []

                    with lock:
                        consecutive_empty = 0

                    new_listings = []
                    with lock:
                        for listing in listings:
                            listing_id = f"{listing.get('urlStub')}--{listing.get('header')}"
                            if listing_id and listing_id not in listing_ids:
                                listing_ids.add(listing_id)
                                new_listings.append(listing)

                    if new_listings:
                        print(f"{Fore.GREEN}[+] [{state_code}] Page {page_number}: {len(new_listings)} new (Total: {len(all_listings)})")

                    return new_listings
                elif response.status_code == 403:
                    print(f"{Fore.RED}[-] [{state_code}] Page {page_number}: Rate limited (403)")
                    time.sleep(2)
                else:
                    print(f"{Fore.RED}[-] [{state_code}] Page {page_number}: Status {response.status_code}")
            except Exception as e:
                print(f"{Fore.RED}[-] [{state_code}] Page {page_number}: {str(e)}")
            return []

        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {executor.submit(fetch_page, page): page for page in range(2, estimated_pages + 1)}

            for future in as_completed(futures):
                if consecutive_empty >= max_consecutive_empty:
                    print(f"{Fore.YELLOW}[!] [{state_code}] Stopping after {max_consecutive_empty} empty pages")
                    break

                page_listings = future.result()
                if page_listings:
                    all_listings.extend(page_listings)

        print(f"{Fore.GREEN}[+] [{state_code}] Complete! Total: {len(all_listings)} listings")
        return all_listings

    def scrape_all_states(self, max_pages=500, workers=3, state_workers=3):
        """Scrape all 50 states."""
        all_listings = []
        lock = Lock()

        print(f"{Fore.CYAN}[*] Scraping all states ({state_workers} concurrent)")

        def scrape_wrapper(state_code):
            listings = self.scrape_state(state_code, max_pages, workers)
            with lock:
                all_listings.extend(listings)

            # Save individual state file
            if listings:
                filename = f"bizbuysell_listings_{state_code}.json"
                try:
                    with open(filename, 'w', encoding='utf-8') as f:
                        json.dump(listings, f, indent=2)
                    print(f"{Fore.GREEN}[+] [{state_code}] Saved to {filename}")
                except Exception as e:
                    print(f"{Fore.RED}[-] [{state_code}] Save error: {str(e)}")

            return len(listings)

        with ThreadPoolExecutor(max_workers=state_workers) as executor:
            futures = {executor.submit(scrape_wrapper, state): state for state in STATE_REGION_IDS.keys()}

            completed = 0
            total = len(STATE_REGION_IDS)

            for future in as_completed(futures):
                state = futures[future]
                completed += 1
                try:
                    count = future.result()
                    print(f"{Fore.CYAN}[*] Progress: {completed}/{total} states ({(completed/total)*100:.1f}%)")
                except Exception as e:
                    print(f"{Fore.RED}[-] [{state}] Error: {str(e)}")

        return all_listings

    def save_results(self, listings, filename):
        """Save results to JSON."""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(listings, f, indent=2)
            print(f"{Fore.GREEN}[+] Saved {len(listings)} listings to {filename}")
        except Exception as e:
            print(f"{Fore.RED}[-] Error saving: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='BizBuySell Scraper with Bright Data Support')
    parser.add_argument('--proxy', type=str, help='Proxy: username:password@host:port')
    parser.add_argument('--vertical', type=str, default='all', help='Vertical filter (default: all)')
    parser.add_argument('--state', type=str, help='Single state code (e.g., CA)')
    parser.add_argument('--workers', type=int, default=3, help='Workers per state (default: 3)')
    parser.add_argument('--state-workers', type=int, default=3, help='Concurrent states (default: 3)')
    parser.add_argument('--delay', type=float, default=0.5, help='Request delay seconds (default: 0.5)')
    parser.add_argument('--max-pages', type=int, default=500, help='Max pages per state (default: 500)')

    args = parser.parse_args()

    proxy = args.proxy or os.environ.get('PROXY')

    print(f"{Fore.CYAN}{'='*50}")
    print(f"{Fore.CYAN}{' '*15}BizBuySell Listing Scraper")
    print(f"{Fore.CYAN}{'='*50}")

    scraper = BizBuySellScraper(proxy=proxy, request_delay=args.delay)

    if not scraper.token:
        print(f"{Fore.RED}[-] Failed to get token. Exiting.")
        return

    # Scrape
    if args.state:
        state = args.state.upper()
        listings = scraper.scrape_state(state, args.max_pages, args.workers)
        filename = f"bizbuysell_{args.vertical}_{state}.json"
    else:
        listings = scraper.scrape_all_states(args.max_pages, args.workers, args.state_workers)
        filename = f"bizbuysell_{args.vertical}_all_states.json"

    scraper.save_results(listings, filename)

    print(f"\n{Fore.GREEN}{'='*50}")
    print(f"{Fore.GREEN}COMPLETE: {len(listings)} listings")
    print(f"{Fore.GREEN}File: {filename}")
    print(f"{Fore.GREEN}{'='*50}")

if __name__ == "__main__":
    main()
