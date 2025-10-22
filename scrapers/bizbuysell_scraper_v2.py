"""
BizBuySell Scraper V2 - Multi-Tenant Support
Integrates with vertical configuration system
Supports: cleaning, landscape, hvac verticals
"""

from curl_cffi import requests
import hashlib
import json
import time
import os
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
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
        'domain': 'cleaningexits.com',
        'include_keywords': [
            'cleaning', 'janitorial', 'custodial', 'sanitation', 'maintenance',
            'maid service', 'housekeeping', 'carpet cleaning', 'window cleaning',
            'pressure washing', 'commercial cleaning', 'residential cleaning',
            'floor care', 'disinfection', 'restoration'
        ],
        'exclude_keywords': [
            'restaurant', 'food service', 'hvac', 'plumbing', 'electrical',
            'landscaping', 'lawn care', 'pool', 'spa', 'salon'
        ],
        'bizbuysell_categories': [
            'cleaning-businesses',
            'janitorial-businesses',
            'commercial-cleaning',
            'residential-cleaning'
        ]
    },
    'landscape': {
        'name': 'Landscape Services',
        'domain': 'landscapeexits.com',
        'include_keywords': [
            'landscape', 'landscaping', 'lawn care', 'lawn maintenance',
            'irrigation', 'hardscape', 'tree service', 'snow removal',
            'lawn mowing', 'garden', 'turf care', 'lawn treatment',
            'landscape design', 'outdoor living'
        ],
        'exclude_keywords': [
            'restaurant', 'food service', 'hvac', 'plumbing', 'electrical',
            'cleaning', 'janitorial', 'pool', 'spa'
        ],
        'bizbuysell_categories': [
            'landscape-businesses',
            'lawn-care-businesses',
            'tree-service-businesses',
            'irrigation-businesses'
        ]
    },
    'hvac': {
        'name': 'HVAC Services',
        'domain': 'hvacexits.com',
        'include_keywords': [
            'hvac', 'heating', 'cooling', 'air conditioning', 'furnace',
            'ventilation', 'refrigeration', 'climate control', 'ductwork',
            'heat pump', 'ac repair', 'hvac contractor', 'hvac service'
        ],
        'exclude_keywords': [
            'restaurant', 'food service', 'cleaning', 'janitorial',
            'landscaping', 'lawn care', 'pool', 'spa', 'plumbing', 'electrical'
        ],
        'bizbuysell_categories': [
            'hvac-businesses',
            'air-conditioning-businesses',
            'heating-businesses',
            'refrigeration-businesses'
        ]
    }
}


# ============================================================================
# BIZBUYSELL SCRAPER CLASS
# ============================================================================

class BizBuySellScraperV2:
    """Multi-tenant BizBuySell scraper with vertical support"""

    def __init__(self, vertical_slug: str = 'cleaning'):
        if vertical_slug not in VERTICAL_CONFIGS:
            raise ValueError(f"Invalid vertical: {vertical_slug}. Must be one of: {list(VERTICAL_CONFIGS.keys())}")

        self.vertical_slug = vertical_slug
        self.vertical_config = VERTICAL_CONFIGS[vertical_slug]
        self.broker_source = 'BizBuySell'

        # Initialize session
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

        # Initialize Direct PostgreSQL Connection (bypasses PostgREST cache)
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
        self.db_conn.autocommit = False  # Use transactions

        # Tracking
        self.token = None
        self.scraper_run_id = None
        self.stats = {
            'total_found': 0,
            'new_listings': 0,
            'updated_listings': 0,
            'filtered_out': 0,
            'errors': 0
        }

    def log(self, level: str, message: str, context: Dict = None):
        """Log to console and scraper_logs table via direct PostgreSQL"""
        # Console logging
        colors = {
            'debug': Fore.CYAN,
            'info': Fore.GREEN,
            'warning': Fore.YELLOW,
            'error': Fore.RED
        }
        color = colors.get(level, Fore.WHITE)
        print(f"{color}[{level.upper()}] {message}")

        # Database logging (silently skip if table doesn't exist)
        if self.scraper_run_id:
            try:
                cursor = self.db_conn.cursor()
                cursor.execute("""
                    INSERT INTO scraper_logs (id, scraper_run_id, timestamp, level, message, context)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    str(uuid.uuid4()),
                    self.scraper_run_id,
                    datetime.now(timezone.utc),
                    level,
                    message,
                    Json(context or {})
                ))
                self.db_conn.commit()
                cursor.close()
            except Exception:
                pass  # Silently skip if table doesn't exist

    def create_scraper_run(self):
        """Create a scraper run record via direct PostgreSQL"""
        self.scraper_run_id = str(uuid.uuid4())
        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                INSERT INTO scraper_runs (
                    id, vertical_slug, broker_source, scraper_type, started_at, status,
                    total_listings_found, new_listings, updated_listings, failed_listings
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                self.scraper_run_id,
                self.vertical_slug,
                self.broker_source,
                'bizbuysell',
                datetime.now(timezone.utc),
                'running',
                0, 0, 0, 0
            ))
            self.db_conn.commit()
            cursor.close()
            self.log('info', f"Created scraper run: {self.scraper_run_id}")
        except Exception as e:
            # Table doesn't exist - continue without tracking
            self.scraper_run_id = None
            print(f"Warning: Could not create scraper run: {e}")

    def update_scraper_run(self, status: str = 'completed', error_message: str = None):
        """Update scraper run with final stats via direct PostgreSQL"""
        if not self.scraper_run_id:
            return

        try:
            cursor = self.db_conn.cursor()
            cursor.execute("""
                UPDATE scraper_runs
                SET completed_at = %s, status = %s, total_listings_found = %s,
                    new_listings = %s, updated_listings = %s, failed_listings = %s,
                    error_message = %s
                WHERE id = %s
            """, (
                datetime.now(timezone.utc),
                status,
                self.stats['total_found'],
                self.stats['new_listings'],
                self.stats['updated_listings'],
                self.stats['errors'],
                error_message,
                self.scraper_run_id
            ))
            self.db_conn.commit()
            cursor.close()
            self.log('info', f"Updated scraper run: {status}")
        except Exception:
            pass  # Silently skip if table doesn't exist

    def get_auth_token(self):
        """Obtain authentication token from BizBuySell"""
        self.log('info', 'Obtaining authentication token...')
        try:
            response = self.session.get(
                'https://www.bizbuysell.com/businesses-for-sale/new-york-ny/',
                headers=self.headers
            )
            cookies = response.cookies
            self.token = cookies.get('_track_tkn')
            if self.token:
                self.log('info', 'Authentication token obtained successfully')
            else:
                self.log('error', 'Failed to get authentication token')
        except Exception as e:
            self.log('error', f'Error obtaining token: {str(e)}')

    def matches_vertical(self, listing: Dict[str, Any]) -> bool:
        """Check if listing matches vertical keywords"""
        # Get searchable text
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

    def normalize_listing(self, raw_listing: Dict[str, Any]) -> Dict[str, Any]:
        """Convert BizBuySell listing to match ACTUAL Supabase production schema"""
        # Generate unique ID
        list_number = str(raw_listing.get('listNumber', ''))
        url_stub = raw_listing.get('urlStub', '')
        title_text = raw_listing.get('header', '')
        unique_str = f"{list_number}--{url_stub}--{title_text}"
        listing_id = hashlib.sha256(unique_str.encode()).hexdigest()

        # Generate slug from title
        import re
        slug = re.sub(r'[^a-z0-9]+', '-', title_text.lower()).strip('-')[:100]

        # Extract image URL
        img = raw_listing.get("img")
        image_url = None
        if isinstance(img, list) and img:
            image_url = img[0]
        elif isinstance(img, str):
            image_url = img

        # Parse financial values
        def parse_financial(value):
            if not value:
                return None
            try:
                if isinstance(value, (int, float)):
                    return float(value)
                # Remove $, commas, and convert
                cleaned = str(value).replace('$', '').replace(',', '').strip()
                return float(cleaned) if cleaned else None
            except:
                return None

        # Build listing URL
        listing_url = url_stub
        if not listing_url.startswith('http'):
            listing_url = f"https://www.bizbuysell.com{url_stub}"

        # Parse location (try to extract city/state)
        location = raw_listing.get("location", "")
        city = None
        state = None
        if location and ',' in location:
            parts = location.split(',')
            city = parts[0].strip() if len(parts) > 0 else None
            state = parts[1].strip() if len(parts) > 1 else None

        # Map to ACTUAL Supabase production schema (user confirmed)
        return {
            # Primary fields
            'id': listing_id,
            'vertical_id': None,  # Set by database default or trigger
            'vertical_slug': self.vertical_slug,
            'title': title_text,
            'description': raw_listing.get("description"),
            'slug': slug,

            # Location fields
            'city': city,
            'state': state,
            'country': 'US',
            'zip_code': None,  # Not provided by BizBuySell

            # Financial fields - ACTUAL Supabase column names
            'asking_price': parse_financial(raw_listing.get("price")),
            'revenue': parse_financial(raw_listing.get("grossSales")),
            'sde': parse_financial(raw_listing.get("cashFlow")),
            'ebitda': parse_financial(raw_listing.get("ebitda")),
            'cash_flow': parse_financial(raw_listing.get("cashFlow")),
            'inventory_value': None,  # Not provided by BizBuySell

            # Business details
            'year_established': None,  # Not provided by BizBuySell
            'employees_count': None,  # Not provided by BizBuySell
            'category': raw_listing.get("category"),
            'status': 'pending',

            # Source/broker fields - ACTUAL Supabase column names
            'broker_id': None,  # Set by database or leave null
            'source': 'BizBuySell',
            'external_id': list_number,
            'external_url': listing_url,

            # Media fields
            'images': [image_url] if image_url else [],
            'documents': [],

            # SEO fields
            'meta_title': title_text,
            'meta_description': raw_listing.get("description", "")[:160] if raw_listing.get("description") else None,

            # Custom fields (store extra BizBuySell data as JSON)
            'custom_fields': {
                'bizbuysell': {
                    'list_number': list_number,
                    'url_stub': url_stub,
                    'broker_company': raw_listing.get("brokerCompany"),
                    'broker_contact': (raw_listing.get("brokercontactfullname") or
                                     raw_listing.get("brokerContactFullName")),
                    'region': raw_listing.get("region"),
                    'hot_property': raw_listing.get("hotProperty") == "true",
                    'recently_added': raw_listing.get("recentlyAdded") == "true",
                    'recently_updated': raw_listing.get("recentlyUpdated") == "true",
                }
            },

            # Timestamps
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            # SKIP these 4 fields that cause cache errors:
            # - created_by
            # - updated_by
            # - published_at
            # - archived_at
        }

    def scrape_listings(self, max_pages: int = 100, workers: int = 10) -> List[Dict[str, Any]]:
        """Scrape listings from BizBuySell API"""
        if not self.token:
            self.log('error', 'No authentication token available. Cannot proceed.')
            return []

        self.log('info', f"Starting to scrape {self.vertical_config['name']} listings with {workers} workers...")

        api_headers = self.headers.copy()
        api_headers['Authorization'] = f'Bearer {self.token}'

        # Payload template
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
                "daysListedAgo": 60,
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
                    self.log('error', f'Failed to get data for page {page_number}. Status: {response.status_code}')
            except Exception as e:
                self.log('error', f'Error fetching page {page_number}: {str(e)}')
            return []

        # Parallel scraping
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(fetch_page, page) for page in range(1, max_pages + 1)]
            for future in as_completed(futures):
                page_listings = future.result()
                if page_listings:
                    all_listings.extend(page_listings)

        self.log('info', f'Scraping complete! Total unique listings scraped: {len(all_listings)}')
        return all_listings

    def filter_and_normalize(self, raw_listings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter listings by vertical keywords and normalize format"""
        self.log('info', f"Filtering {len(raw_listings)} listings for {self.vertical_config['name']}...")

        filtered_listings = []
        for raw_listing in raw_listings:
            if self.matches_vertical(raw_listing):
                try:
                    normalized = self.normalize_listing(raw_listing)
                    filtered_listings.append(normalized)
                except Exception as e:
                    self.log('error', f"Error normalizing listing: {e}")
                    self.stats['errors'] += 1
            else:
                self.stats['filtered_out'] += 1

        self.log('info', f"Filtered to {len(filtered_listings)} {self.vertical_config['name']} listings")
        self.log('info', f"Filtered out {self.stats['filtered_out']} non-matching listings")

        return filtered_listings

    def save_to_postgres(self, listings: List[Dict[str, Any]]):
        """Save listings to PostgreSQL directly (bypasses PostgREST cache)"""
        if not listings:
            self.log('warning', 'No listings to save')
            return

        self.log('info', f"Saving {len(listings)} listings to PostgreSQL...")

        cursor = self.db_conn.cursor()

        for i, listing in enumerate(listings, 1):
            try:
                # Use INSERT ... ON CONFLICT for upsert functionality
                cursor.execute("""
                    INSERT INTO listings (
                        id, vertical_id, vertical_slug, title, description, slug,
                        city, state, country, zip_code,
                        asking_price, revenue, sde, ebitda, cash_flow, inventory_value,
                        year_established, employees_count, category, status,
                        broker_id, source, external_id, external_url,
                        images, documents,
                        meta_title, meta_description,
                        custom_fields,
                        created_at, updated_at
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s,
                        %s, %s,
                        %s,
                        %s, %s
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        vertical_id = EXCLUDED.vertical_id,
                        vertical_slug = EXCLUDED.vertical_slug,
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        slug = EXCLUDED.slug,
                        city = EXCLUDED.city,
                        state = EXCLUDED.state,
                        country = EXCLUDED.country,
                        zip_code = EXCLUDED.zip_code,
                        asking_price = EXCLUDED.asking_price,
                        revenue = EXCLUDED.revenue,
                        sde = EXCLUDED.sde,
                        ebitda = EXCLUDED.ebitda,
                        cash_flow = EXCLUDED.cash_flow,
                        inventory_value = EXCLUDED.inventory_value,
                        year_established = EXCLUDED.year_established,
                        employees_count = EXCLUDED.employees_count,
                        category = EXCLUDED.category,
                        status = EXCLUDED.status,
                        broker_id = EXCLUDED.broker_id,
                        source = EXCLUDED.source,
                        external_id = EXCLUDED.external_id,
                        external_url = EXCLUDED.external_url,
                        images = EXCLUDED.images,
                        documents = EXCLUDED.documents,
                        meta_title = EXCLUDED.meta_title,
                        meta_description = EXCLUDED.meta_description,
                        custom_fields = EXCLUDED.custom_fields,
                        updated_at = EXCLUDED.updated_at
                """, (
                    listing['id'],
                    listing.get('vertical_id'),
                    listing['vertical_slug'],
                    listing['title'],
                    listing.get('description'),
                    listing.get('slug'),
                    listing.get('city'),
                    listing.get('state'),
                    listing.get('country'),
                    listing.get('zip_code'),
                    listing.get('asking_price'),
                    listing.get('revenue'),
                    listing.get('sde'),
                    listing.get('ebitda'),
                    listing.get('cash_flow'),
                    listing.get('inventory_value'),
                    listing.get('year_established'),
                    listing.get('employees_count'),
                    listing.get('category'),
                    listing.get('status'),
                    listing.get('broker_id'),
                    listing.get('source'),
                    listing.get('external_id'),
                    listing.get('external_url'),
                    Json(listing.get('images', [])),
                    Json(listing.get('documents', [])),
                    listing.get('meta_title'),
                    listing.get('meta_description'),
                    Json(listing.get('custom_fields', {})),
                    listing.get('created_at'),
                    listing.get('updated_at')
                ))

                self.stats['new_listings'] += 1

                if i % 50 == 0:
                    self.log('info', f"✓ Saved {i}/{len(listings)} listings")

            except Exception as e:
                self.log('error', f"✗ Failed to save listing {i}: {e}")
                self.stats['errors'] += 1

        # Commit all inserts
        try:
            self.db_conn.commit()
            self.log('info', f"✓ Committed all listings to database")
        except Exception as e:
            self.db_conn.rollback()
            self.log('error', f"✗ Failed to commit: {e}")

        cursor.close()

        self.log('info', f"Save complete! New: {self.stats['new_listings']}, Errors: {self.stats['errors']}")

    def run(self, max_pages: int = 100, workers: int = 10):
        """Main execution flow"""
        print(f"\n{Fore.CYAN}{'='*70}")
        print(f"{Fore.CYAN}BizBuySell Scraper V2 - Multi-Tenant")
        print(f"{Fore.CYAN}{'='*70}")
        print(f"{Fore.CYAN}Vertical: {self.vertical_config['name']} ({self.vertical_slug})")
        print(f"{Fore.CYAN}Max Pages: {max_pages}")
        print(f"{Fore.CYAN}Workers: {workers}")
        print(f"{Fore.CYAN}{'='*70}\n")

        try:
            # Create scraper run
            self.create_scraper_run()

            # Get auth token
            self.get_auth_token()
            if not self.token:
                raise Exception("Failed to obtain authentication token")

            # Scrape raw listings
            raw_listings = self.scrape_listings(max_pages=max_pages, workers=workers)
            self.stats['total_found'] = len(raw_listings)

            # Filter and normalize
            filtered_listings = self.filter_and_normalize(raw_listings)

            # Save to database via direct PostgreSQL connection
            self.save_to_postgres(filtered_listings)

            # Update scraper run
            self.update_scraper_run(status='completed')

            # Print summary
            print(f"\n{Fore.GREEN}{'='*70}")
            print(f"{Fore.GREEN}SCRAPING COMPLETE")
            print(f"{Fore.GREEN}{'='*70}")
            print(f"{Fore.GREEN}Vertical: {self.vertical_config['name']}")
            print(f"{Fore.GREEN}Total Found: {self.stats['total_found']}")
            print(f"{Fore.GREEN}Matched Vertical: {len(filtered_listings)}")
            print(f"{Fore.GREEN}Filtered Out: {self.stats['filtered_out']}")
            print(f"{Fore.GREEN}New Listings: {self.stats['new_listings']}")
            print(f"{Fore.GREEN}Errors: {self.stats['errors']}")
            print(f"{Fore.GREEN}{'='*70}\n")

        except Exception as e:
            self.log('error', f"Scraper failed: {e}")
            self.update_scraper_run(status='failed', error_message=str(e))
            raise
        finally:
            # Always close the database connection
            if hasattr(self, 'db_conn') and self.db_conn:
                self.db_conn.close()
                print(f"{Fore.CYAN}Database connection closed.")


# ============================================================================
# CLI INTERFACE
# ============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="BizBuySell Scraper V2 - Multi-Tenant")
    parser.add_argument(
        '--vertical',
        type=str,
        choices=['cleaning', 'landscape', 'hvac'],
        default='cleaning',
        help='Vertical to scrape (default: cleaning)'
    )
    parser.add_argument(
        '--max-pages',
        type=int,
        default=100,
        help='Maximum pages to scrape (default: 100)'
    )
    parser.add_argument(
        '--workers',
        type=int,
        default=10,
        help='Number of parallel workers (default: 10)'
    )

    args = parser.parse_args()

    # Run scraper
    scraper = BizBuySellScraperV2(vertical_slug=args.vertical)
    scraper.run(max_pages=args.max_pages, workers=args.workers)
