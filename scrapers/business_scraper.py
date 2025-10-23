"""
BizBuySell Business Scraper - Production Ready
Original: jeffsosville/bbs-listings-scraper
Enhanced with:
- Direct PostgreSQL connection (bypasses PostgREST)
- Multi-tenant vertical filtering (cleaning, landscape, hvac)
- Required fields: is_active, quality_score, scraped_at
- State-by-state scraping capability
"""

from curl_cffi import requests
import json
import time
import os
import uuid
import hashlib
import re
from datetime import datetime, timezone
from colorama import Fore, Style, init
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv

# Initialize
init(autoreset=True)
load_dotenv()


# ============================================================================
# VERTICAL CONFIGURATIONS
# ============================================================================

VERTICAL_CONFIGS = {
    'cleaning': {
        'name': 'Cleaning Services',
        'include_keywords': [
            'cleaning', 'janitorial', 'custodial', 'sanitation', 'maintenance',
            'maid service', 'housekeeping', 'carpet cleaning', 'window cleaning',
            'pressure washing', 'commercial cleaning', 'residential cleaning',
            'floor care', 'disinfection', 'restoration'
        ],
        'exclude_keywords': [
            'restaurant', 'food service', 'hvac', 'plumbing', 'electrical',
            'landscaping', 'lawn care', 'pool', 'spa', 'salon', 'dry clean'
        ]
    },
    'landscape': {
        'name': 'Landscape Services',
        'include_keywords': [
            'landscape', 'landscaping', 'lawn care', 'lawn maintenance',
            'irrigation', 'hardscape', 'tree service', 'snow removal',
            'lawn mowing', 'garden', 'turf care', 'lawn treatment'
        ],
        'exclude_keywords': [
            'restaurant', 'food service', 'hvac', 'plumbing', 'electrical',
            'cleaning', 'janitorial', 'pool', 'spa'
        ]
    },
    'hvac': {
        'name': 'HVAC Services',
        'include_keywords': [
            'hvac', 'heating', 'cooling', 'air conditioning', 'furnace',
            'ventilation', 'refrigeration', 'climate control', 'ductwork',
            'heat pump', 'ac repair', 'hvac contractor'
        ],
        'exclude_keywords': [
            'restaurant', 'food service', 'cleaning', 'janitorial',
            'landscaping', 'lawn care', 'pool', 'spa', 'plumbing', 'electrical'
        ]
    }
}


# ============================================================================
# BIZBUYSELL SCRAPER
# ============================================================================

class BizBuySellScraper:
    def __init__(self, vertical_slug='cleaning', use_database=True):
        """
        Initialize scraper

        Args:
            vertical_slug: 'cleaning', 'landscape', or 'hvac'
            use_database: If True, save to PostgreSQL. If False, save to JSON file.
        """
        if vertical_slug not in VERTICAL_CONFIGS:
            raise ValueError(f"Invalid vertical: {vertical_slug}. Choose from: {list(VERTICAL_CONFIGS.keys())}")

        self.vertical_slug = vertical_slug
        self.vertical_config = VERTICAL_CONFIGS[vertical_slug]
        self.use_database = use_database

        self.session = requests.Session(impersonate="chrome")
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
            'X-Correlation-Id': str(uuid.uuid4())
        }

        # Initialize Direct PostgreSQL Connection (if using database)
        self.db_conn = None
        if self.use_database:
            postgres_password = os.getenv("POSTGRES_PASSWORD")
            if not postgres_password:
                raise ValueError("POSTGRES_PASSWORD must be set in .env file")

            self.db_conn = psycopg2.connect(
                host="db.tcsgmaozbhkldpwlorzk.supabase.co",
                port=5432,
                database="postgres",
                user="postgres",
                password=postgres_password
            )
            self.db_conn.autocommit = False

        self.token = None
        self.get_auth_token()

        self.stats = {
            'total_found': 0,
            'matched_vertical': 0,
            'filtered_out': 0,
            'saved': 0,
            'errors': 0
        }

    def get_auth_token(self):
        """Get authentication token from BizBuySell."""
        print(f"{Fore.CYAN}[*] Obtaining authentication token...")

        try:
            response = self.session.get(
                'https://www.bizbuysell.com/businesses-for-sale/new-york-ny/',
                headers=self.headers
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

    def matches_vertical(self, listing):
        """Check if listing matches vertical keywords"""
        title = (listing.get('header') or '').lower()
        description = (listing.get('description') or '').lower()
        category = (listing.get('category') or '').lower()
        search_text = f"{title} {description} {category}"

        # Check exclude keywords first
        for keyword in self.vertical_config['exclude_keywords']:
            if keyword.lower() in search_text:
                return False

        # Check include keywords
        for keyword in self.vertical_config['include_keywords']:
            if keyword.lower() in search_text:
                return True

        return False

    def calculate_quality_score(self, price, revenue, cash_flow):
        """Calculate quality score (0-100) for Top10 ranking"""
        score = 50  # Base score

        # Revenue bonus (up to +20)
        if revenue:
            if revenue > 1000000: score += 20
            elif revenue > 500000: score += 15
            elif revenue > 250000: score += 10
            elif revenue > 100000: score += 5

        # Cash flow bonus (up to +20)
        if cash_flow:
            if cash_flow > 200000: score += 20
            elif cash_flow > 100000: score += 15
            elif cash_flow > 50000: score += 10
            elif cash_flow > 25000: score += 5

        # Multiple bonus (up to +10)
        if price and revenue and revenue > 0:
            multiple = price / revenue
            if 0.5 <= multiple <= 3.0:
                score += 10
            elif 3.0 < multiple <= 5.0:
                score += 5

        return min(max(score, 0), 100)

    def normalize_listing(self, raw_listing):
        """Convert BizBuySell listing to database schema"""
        # Generate unique ID
        list_number = str(raw_listing.get('listNumber', ''))
        url_stub = raw_listing.get('urlStub', '')
        title_text = raw_listing.get('header', '')
        unique_str = f"{list_number}--{url_stub}--{title_text}"
        listing_id = hashlib.sha256(unique_str.encode()).hexdigest()

        # Generate slug
        slug = re.sub(r'[^a-z0-9]+', '-', title_text.lower()).strip('-')[:100]

        # Extract image
        img = raw_listing.get("img")
        image_url = img[0] if isinstance(img, list) and img else (img if isinstance(img, str) else None)

        # Parse financials
        def parse_financial(value):
            if not value:
                return None
            try:
                if isinstance(value, (int, float)):
                    return float(value)
                cleaned = str(value).replace('$', '').replace(',', '').strip()
                return float(cleaned) if cleaned else None
            except:
                return None

        # Build listing URL
        listing_url = url_stub if url_stub.startswith('http') else f"https://www.bizbuysell.com{url_stub}"

        # Parse location
        location = raw_listing.get("location", "")
        city, state = None, None
        if location and ',' in location:
            parts = location.split(',')
            city = parts[0].strip() if len(parts) > 0 else None
            state = parts[1].strip() if len(parts) > 1 else None

        # Parse financials
        price = parse_financial(raw_listing.get("price"))
        revenue = parse_financial(raw_listing.get("grossSales"))
        cash_flow = parse_financial(raw_listing.get("cashFlow"))
        ebitda = parse_financial(raw_listing.get("ebitda"))

        # Calculate quality score
        quality_score = self.calculate_quality_score(price, revenue, cash_flow)

        return {
            'id': listing_id,
            'vertical_id': None,
            'vertical_slug': self.vertical_slug,
            'title': title_text,
            'description': raw_listing.get("description"),
            'slug': slug,
            'city': city,
            'state': state,
            'country': 'US',
            'zip_code': None,
            'asking_price': price,
            'revenue': revenue,
            'sde': cash_flow,
            'ebitda': ebitda,
            'cash_flow': cash_flow,
            'inventory_value': None,
            'year_established': None,
            'employees_count': None,
            'category': raw_listing.get("category"),
            'status': 'pending',
            'broker_id': None,
            'source': 'BizBuySell',
            'external_id': list_number,
            'external_url': listing_url,
            'images': [image_url] if image_url else [],
            'documents': [],
            'meta_title': title_text,
            'meta_description': raw_listing.get("description", "")[:160] if raw_listing.get("description") else None,
            'custom_fields': {
                'bizbuysell': {
                    'list_number': list_number,
                    'url_stub': url_stub,
                    'broker_company': raw_listing.get("brokerCompany"),
                    'broker_contact': raw_listing.get("brokerContactFullName") or raw_listing.get("brokercontactfullname"),
                    'region': raw_listing.get("region"),
                    'hot_property': raw_listing.get("hotProperty") == "true",
                    'recently_added': raw_listing.get("recentlyAdded") == "true",
                    'recently_updated': raw_listing.get("recentlyUpdated") == "true",
                }
            },
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            # CRITICAL: Fields required for frontend display
            'is_active': True,
            'quality_score': quality_score,
            'scraped_at': datetime.now(timezone.utc).isoformat(),
        }

    def scrape_listings(self, max_pages=100, workers=10, state_filter=None):
        """
        Scrape business listings concurrently from BizBuySell.

        Args:
            max_pages: Maximum pages to scrape
            workers: Number of concurrent workers
            state_filter: Optional state code (e.g., 'CA', 'NY') or list of state codes
        """
        if not self.token:
            print(f"{Fore.RED}[-] No authentication token available. Cannot proceed.")
            return []

        state_msg = f" (State: {state_filter})" if state_filter else ""
        print(f"{Fore.CYAN}[*] Starting to scrape {self.vertical_config['name']} listings with {workers} workers{state_msg}...")

        # Add authorization header with token
        api_headers = self.headers.copy()
        api_headers['Authorization'] = f'Bearer {self.token}'

        # Build state filter
        locations = None
        if state_filter:
            if isinstance(state_filter, str):
                locations = [state_filter]
            elif isinstance(state_filter, list):
                locations = state_filter

        payload_template = {
            "bfsSearchCriteria": {
                "siteId": 20,
                "languageId": 10,
                "categories": None,
                "locations": locations,  # State filter
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

        def fetch_page(page_number):
            payload = json.loads(json.dumps(payload_template))  # deep copy
            payload["bfsSearchCriteria"]["pageNumber"] = page_number

            try:
                response = self.session.post(
                    'https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults',
                    headers=api_headers,
                    json=payload
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
            for future in as_completed(futures):
                page_listings = future.result()
                if page_listings:
                    all_listings.extend(page_listings)

        print(f"{Fore.GREEN}[+] Scraping complete! Total unique listings scraped: {len(all_listings)}")
        return all_listings

    def save_to_postgres(self, listings):
        """Save listings to PostgreSQL"""
        if not listings or not self.db_conn:
            return

        print(f"{Fore.CYAN}[*] Saving {len(listings)} listings to PostgreSQL...")
        cursor = self.db_conn.cursor()

        for i, listing in enumerate(listings, 1):
            try:
                cursor.execute("""
                    INSERT INTO listings (
                        id, vertical_id, vertical_slug, title, description, slug,
                        city, state, country, zip_code,
                        asking_price, revenue, sde, ebitda, cash_flow, inventory_value,
                        year_established, employees_count, category, status,
                        broker_id, source, external_id, external_url,
                        images, documents, meta_title, meta_description, custom_fields,
                        created_at, updated_at,
                        is_active, quality_score, scraped_at
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        asking_price = EXCLUDED.asking_price,
                        revenue = EXCLUDED.revenue,
                        cash_flow = EXCLUDED.cash_flow,
                        is_active = EXCLUDED.is_active,
                        quality_score = EXCLUDED.quality_score,
                        scraped_at = EXCLUDED.scraped_at,
                        updated_at = EXCLUDED.updated_at
                """, (
                    listing['id'], listing.get('vertical_id'), listing['vertical_slug'],
                    listing['title'], listing.get('description'), listing.get('slug'),
                    listing.get('city'), listing.get('state'), listing.get('country'), listing.get('zip_code'),
                    listing.get('asking_price'), listing.get('revenue'), listing.get('sde'),
                    listing.get('ebitda'), listing.get('cash_flow'), listing.get('inventory_value'),
                    listing.get('year_established'), listing.get('employees_count'),
                    listing.get('category'), listing.get('status'),
                    listing.get('broker_id'), listing.get('source'), listing.get('external_id'),
                    listing.get('external_url'), Json(listing.get('images', [])),
                    Json(listing.get('documents', [])), listing.get('meta_title'),
                    listing.get('meta_description'), Json(listing.get('custom_fields', {})),
                    listing.get('created_at'), listing.get('updated_at'),
                    listing.get('is_active'), listing.get('quality_score'), listing.get('scraped_at')
                ))
                self.stats['saved'] += 1

                if i % 100 == 0:
                    self.db_conn.commit()
                    print(f"{Fore.GREEN}[+] Saved {i}/{len(listings)}")

            except Exception as e:
                print(f"{Fore.RED}[-] Failed to save listing {i}: {e}")
                self.stats['errors'] += 1

        self.db_conn.commit()
        cursor.close()
        print(f"{Fore.GREEN}[+] Save complete!")

    def save_results(self, listings, filename="bizbuysell_listings.json"):
        """Save results to JSON file."""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(listings, f, indent=4)
            print(f"{Fore.GREEN}[+] Results saved to {filename}")

        except Exception as e:
            print(f"{Fore.RED}[-] Error saving results: {str(e)}")

    def run(self, max_pages=500, workers=10, state_filter=None, save_json=False):
        """
        Main execution flow

        Args:
            max_pages: Maximum pages to scrape
            workers: Number of concurrent workers
            state_filter: Optional state code(s) to filter by
            save_json: If True, also save to JSON file
        """
        print(f"{Fore.CYAN}{'='*70}")
        print(f"{Fore.CYAN}BizBuySell Scraper - {self.vertical_config['name']}")
        print(f"{Fore.CYAN}{'='*70}\n")

        try:
            # Scrape all listings
            raw_listings = self.scrape_listings(max_pages=max_pages, workers=workers, state_filter=state_filter)
            self.stats['total_found'] = len(raw_listings)

            # Filter and normalize
            filtered = []
            for listing in raw_listings:
                if self.matches_vertical(listing):
                    filtered.append(self.normalize_listing(listing))
                    self.stats['matched_vertical'] += 1
                else:
                    self.stats['filtered_out'] += 1

            # Save to database or JSON
            if self.use_database and filtered:
                self.save_to_postgres(filtered)
            elif save_json or not self.use_database:
                self.save_results(filtered, f"bizbuysell_{self.vertical_slug}_listings.json")

            # Print summary
            print(f"\n{Fore.GREEN}{'='*70}")
            print(f"{Fore.GREEN}SCRAPING COMPLETE")
            print(f"{Fore.GREEN}{'='*70}")
            print(f"{Fore.GREEN}Total Found: {self.stats['total_found']}")
            print(f"{Fore.GREEN}Matched Vertical: {self.stats['matched_vertical']}")
            print(f"{Fore.GREEN}Filtered Out: {self.stats['filtered_out']}")
            print(f"{Fore.GREEN}Saved: {self.stats['saved']}")
            print(f"{Fore.GREEN}Errors: {self.stats['errors']}")
            print(f"{Fore.GREEN}{'='*70}\n")

        finally:
            if self.db_conn:
                self.db_conn.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="BizBuySell Business Scraper")
    parser.add_argument('--vertical', type=str, choices=['cleaning', 'landscape', 'hvac'],
                        default='cleaning', help='Vertical to scrape (default: cleaning)')
    parser.add_argument('--max-pages', type=int, default=500,
                        help='Max pages to scrape (default: 500)')
    parser.add_argument('--workers', type=int, default=10,
                        help='Number of concurrent workers (default: 10)')
    parser.add_argument('--state', type=str,
                        help='State code to filter by (e.g., CA, NY, TX)')
    parser.add_argument('--json', action='store_true',
                        help='Save to JSON file instead of database')
    parser.add_argument('--both', action='store_true',
                        help='Save to both database and JSON file')

    args = parser.parse_args()

    # Create scraper instance
    use_database = not args.json
    scraper = BizBuySellScraper(
        vertical_slug=args.vertical,
        use_database=use_database
    )

    # Run scraper
    scraper.run(
        max_pages=args.max_pages,
        workers=args.workers,
        state_filter=args.state,
        save_json=args.both or args.json
    )
