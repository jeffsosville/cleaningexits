from curl_cffi import requests
import json
import time
import os
from colorama import Fore, Style, init
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import re

# Initialize colorama
init(autoreset=True)

class BizBuySellScraper:
    def __init__(self, proxy:str=None):
        self.session = requests.Session(
            impersonate="chrome"
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
            'X-Correlation-Id': 'b5492b02-712f-4ee8-be99-cc27c8668908'
        }
        self.token = None
        if proxy:
            self.proxies = {
                "http": proxy if proxy.startswith("http") else f"http://{proxy}",
                "https": proxy if proxy.startswith("http") else f"http://{proxy}"
            }
            print(f"{Fore.GREEN}[+] Using proxy: {proxy.split('@')[1] if '@' in proxy else proxy}")
        else:
            self.proxies = None
            print(f"{Fore.YELLOW}[!] No proxy configured - using direct connection")

        self.get_auth_token()

    def get_auth_token(self):
        """Get authentication token from BizBuySell."""
        print(f"{Fore.CYAN}[*] Obtaining authentication token...")

        try:
            response = self.session.get(
                'https://www.bizbuysell.com/businesses-for-sale/new-york-ny/',
                headers=self.headers,
                proxies=self.proxies
            )

            # Extract token from cookies
            cookies = response.cookies
            self.token = cookies.get('_track_tkn')

            if self.token:
                print(f"{Fore.GREEN}[+] Authentication token obtained successfully")
            else:
                print(f"{Fore.RED}[-] Failed to get authentication token")

        except Exception as e:
            print(f"{Fore.RED}[-] Error obtaining token: {str(e)}")

    def get_all_states(self):
        """Fetch all 50 US states from the API."""
        if not self.token:
            print(f"{Fore.RED}[-] No authentication token available. Cannot proceed.")
            return []

        print(f"{Fore.CYAN}[*] Fetching all US states...")

        api_headers = self.headers.copy()
        api_headers['Authorization'] = f'Bearer {self.token}'

        payload = {
            "siteId": 20,
            "languageId": 10,
            "query": "",
            "geographyTypes": [20]
        }

        try:
            response = self.session.post(
                'https://api.bizbuysell.com/resource/v2/Regions',
                headers=api_headers,
                json=payload,
                proxies=self.proxies
            )

            if response.status_code == 200:
                data = response.json()
                states = data.get("value", [])
                print(f"{Fore.GREEN}[+] Successfully retrieved {len(states)} states")
                return states
            else:
                print(f"{Fore.RED}[-] Failed to get states. Status code: {response.status_code}")
                return []

        except Exception as e:
            print(f"{Fore.RED}[-] Error fetching states: {str(e)}")
            return []

    def check_listing_count_by_state(self, state, listing_types=[40, 30, 80, 20]):
        """Check the number of listings for a specific state."""
        if not self.token:
            print(f"{Fore.RED}[-] No authentication token available. Cannot proceed.")
            return None

        api_headers = self.headers.copy()
        api_headers['Authorization'] = f'Bearer {self.token}'

        payload = {
            "bfsSearchCriteria": {
                "siteId": 20,
                "languageId": 10,
                "categories": None,
                "locations": [state],
                "excludeLocations": [],
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
                "relatedFranchises": False,
                "listingTypeIds": listing_types,
                "designationTypeIds": None,
                "sortList": None,
                "absenteeOwnerListings": 0,
                "seoSearchType": None
            }
        }

        try:
            response = self.session.post(
                'https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults',
                headers=api_headers,
                json=payload,
                proxies=self.proxies
            )

            if response.status_code == 200:
                data = response.json()
                result_counts = data.get("value", {}).get("bfsSearchResultCounts", {}).get("resultCounts", [])
                return {"state": state, "counts": result_counts, "payload": payload}
            else:
                print(f"{Fore.RED}[-] Failed to get listing counts for {state['regionName']}. Status code: {response.status_code}")
                return None

        except Exception as e:
            print(f"{Fore.RED}[-] Error checking listing count: {str(e)}")
            return None

    def scrape_listings_by_state(self, state, listing_types=[40, 30, 80, 20], max_pages=200, workers=3, request_delay=0.5):
        """Scrape business listings for a specific state with rate limiting."""
        if not self.token:
            print(f"{Fore.RED}[-] No authentication token available. Cannot proceed.")
            return []

        print(f"{Fore.CYAN}[*] Starting to scrape listings for {state['regionName']} with {workers} workers (delay: {request_delay}s)...")

        api_headers = self.headers.copy()
        api_headers['Authorization'] = f'Bearer {self.token}'

        payload_template = {
            "bfsSearchCriteria": {
                "siteId": 20,
                "languageId": 10,
                "categories": None,
                "locations": [state],
                "excludeLocations": [],
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
                "relatedFranchises": False,
                "listingTypeIds": listing_types,
                "designationTypeIds": None,
                "sortList": None,
                "absenteeOwnerListings": 0,
                "seoSearchType": None
            }
        }

        all_listings = []
        listing_ids = set()
        lock = Lock()

        def fetch_page(page_number):
            # Add delay to avoid rate limiting
            time.sleep(request_delay)

            payload = json.loads(json.dumps(payload_template))  # deep copy
            payload["bfsSearchCriteria"]["pageNumber"] = page_number

            try:
                response = requests.post(
                    'https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults',
                    headers=api_headers,
                    json=payload,
                    impersonate="chrome",
                    proxies=self.proxies
                )

                if response.status_code == 200:
                    data = response.json()
                    listings = data.get("value", {}).get("bfsSearchResult", {}).get("value", [])
                    new_listings = []
                    with lock:
                        for listing in listings:
                            listing_id = f"{listing.get('urlStub')}--{listing.get('header')}"
                            if listing_id and listing_id not in listing_ids:
                                listing_ids.add(listing_id)
                                new_listings.append(listing)
                    return new_listings
                else:
                    print(f"{Fore.RED}[-] Failed to get data for page {page_number}. Status code: {response.status_code}")
            except Exception as e:
                print(f"{Fore.RED}[-] Error fetching page {page_number}: {str(e)}")
            return []

        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(fetch_page, page) for page in range(1, max_pages + 1)]
            for i, future in enumerate(as_completed(futures)):
                page_listings = future.result()
                if page_listings:
                    print(f"{Fore.GREEN}[+] {state['regionName']} - Page {i + 1} scraped successfully! Found {len(page_listings)} new listings.")
                    all_listings.extend(page_listings)

        print(f"{Fore.GREEN}[+] Scraping complete for {state['regionName']}! Total unique listings: {len(all_listings)}")
        return all_listings

    def save_results(self, listings, filename="bizbuysell_listings.json"):
        """Save results to JSON file."""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(listings, f, indent=4)
            print(f"{Fore.GREEN}[+] Results saved to {filename}")

        except Exception as e:
            print(f"{Fore.RED}[-] Error saving results: {str(e)}")


if __name__ == "__main__":
    import sys
    import argparse

    print(f"{Fore.CYAN}{'='*50}")
    print(f"{Fore.CYAN}{' '*15}BizBuySell Listing Scraper")
    print(f"{Fore.CYAN}{'='*50}")

    parser = argparse.ArgumentParser(description="BizBuySell State-by-State Scraper with Proxy Support")
    parser.add_argument('--proxy', type=str, help='Proxy in format user:pass@host:port')
    parser.add_argument('--vertical', type=str, default=None, help='Filter by vertical (cleaning, landscape, hvac)')
    parser.add_argument('--workers', type=int, default=3, help='Number of concurrent workers per state (default: 3)')
    parser.add_argument('--state-workers', type=int, default=3, help='Number of states to process concurrently (default: 3)')
    parser.add_argument('--delay', type=float, default=0.5, help='Delay between requests in seconds (default: 0.5)')
    parser.add_argument('--max-pages', type=int, default=200, help='Max pages per state (default: 200)')
    parser.add_argument('--json', action='store_true', help='Save to JSON (always enabled for this scraper)')

    args = parser.parse_args()

    # Get proxy from argument or environment variable
    proxy = args.proxy or os.getenv('PROXY')

    if not proxy:
        print(f"{Fore.YELLOW}[!] No proxy provided. Use --proxy flag or set PROXY environment variable.")
        print(f"{Fore.YELLOW}[!] Proceeding without proxy (may hit rate limits)...")

    # Create scraper instance
    scraper = BizBuySellScraper(proxy)

    # Create logs directories
    os.makedirs('logs/excess_count', exist_ok=True)
    os.makedirs('logs/errors', exist_ok=True)

    # Get all states
    states = scraper.get_all_states()
    if not states:
        print(f"{Fore.RED}[-] Failed to get states. Exiting.")
        exit(1)

    all_listings = []
    listing_types = [40, 30, 80, 20]  # Business for sale, franchise, asset sale, business opportunity

    # Create locks for thread-safe operations
    count_lock = Lock()
    all_listings_lock = Lock()
    progress_lock = Lock()

    # Define a function to process each state
    def process_state(state_data):
        i, state = state_data
        try:
            print(f"{Fore.CYAN}[*] [{i}/{len(states)}] Checking listing counts for {state['regionName']}")

            result = scraper.check_listing_count_by_state(state, listing_types)
            if not result:
                print(f"{Fore.RED}[-] Failed to get listing counts for {state['regionName']}")
                return None

            counts = result["counts"]
            excessive_count = False

            for count_info in counts:
                listing_type = count_info["listingTypeId"]
                count = count_info["resultCount"]
                print(f"{Fore.YELLOW}  - Type {listing_type}: {count} listings")

                if count > 10000:
                    excessive_count = True
                    print(f"{Fore.RED}    ! Excessive count detected for type {listing_type}")

            if excessive_count:
                with count_lock:
                    payload_file = f"logs/excess_count/payload_{i}_{state['stateCode']}.json"
                    with open(payload_file, 'w', encoding='utf-8') as f:
                        json.dump(result["payload"], f, indent=4)
                    print(f"{Fore.YELLOW}  ! Saved excessive count payload to {payload_file}")
                return None

            print(f"{Fore.CYAN}[*] Scraping listings for {state['regionName']}")
            state_listings = scraper.scrape_listings_by_state(
                state,
                listing_types,
                max_pages=args.max_pages,
                workers=args.workers,
                request_delay=args.delay
            )

            state_file = f"bizbuysell_listings_{state['stateCode']}.json"
            with count_lock:
                scraper.save_results(state_listings, state_file)

            time.sleep(2)  # Delay between states
            return state_listings

        except Exception as e:
            print(f"{Fore.RED}[-] Error processing state {state['regionName']}: {str(e)}")
            with count_lock:
                error_file = f"logs/errors/error_{state['stateCode']}.txt"
                os.makedirs(os.path.dirname(error_file), exist_ok=True)
                with open(error_file, 'w', encoding='utf-8') as f:
                    f.write(f"Error processing state {state['regionName']}: {str(e)}\n")
            return None

    # Process states concurrently
    state_worker_count = args.state_workers
    print(f"{Fore.CYAN}[*] Starting concurrent processing with {state_worker_count} state workers...")
    print(f"{Fore.CYAN}[*] Each state will use {args.workers} workers with {args.delay}s delay between requests")

    processed_states_count = 0
    total_states_count = len(states)

    with ThreadPoolExecutor(max_workers=state_worker_count) as executor:
        state_items = list(enumerate(states, 1))
        future_to_state = {executor.submit(process_state, state_item): state_item for state_item in state_items}

        for future in as_completed(future_to_state):
            with progress_lock:
                processed_states_count += 1
                progress_percent = (processed_states_count / total_states_count) * 100
                print(f"{Fore.CYAN}[*] Progress: {processed_states_count}/{total_states_count} states processed ({progress_percent:.1f}%)")

            state_listings = future.result()
            if state_listings:
                with all_listings_lock:
                    all_listings.extend(state_listings)

    scraper.save_results(all_listings, "bizbuysell_all_listings.json")
    print(f"{Fore.GREEN}[+] Process complete! Found {len(all_listings)} unique listings across all states.")
