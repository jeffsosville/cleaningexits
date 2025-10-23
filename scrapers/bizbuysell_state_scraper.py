"""
BizBuySell State-Based Scraper
Scrapes all listings state-by-state for complete coverage
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
# US STATES CONFIGURATION
# ============================================================================

US_STATES = [
    {"name": "Alabama", "code": "AL"},
    {"name": "Alaska", "code": "AK"},
    {"name": "Arizona", "code": "AZ"},
    {"name": "Arkansas", "code": "AR"},
    {"name": "California", "code": "CA"},
    {"name": "Colorado", "code": "CO"},
    {"name": "Connecticut", "code": "CT"},
    {"name": "Delaware", "code": "DE"},
    {"name": "Florida", "code": "FL"},
    {"name": "Georgia", "code": "GA"},
    {"name": "Hawaii", "code": "HI"},
    {"name": "Idaho", "code": "ID"},
    {"name": "Illinois", "code": "IL"},
    {"name": "Indiana", "code": "IN"},
    {"name": "Iowa", "code": "IA"},
    {"name": "Kansas", "code": "KS"},
    {"name": "Kentucky", "code": "KY"},
    {"name": "Louisiana", "code": "LA"},
    {"name": "Maine", "code": "ME"},
    {"name": "Maryland", "code": "MD"},
    {"name": "Massachusetts", "code": "MA"},
    {"name": "Michigan", "code": "MI"},
    {"name": "Minnesota", "code": "MN"},
    {"name": "Mississippi", "code": "MS"},
    {"name": "Missouri", "code": "MO"},
    {"name": "Montana", "code": "MT"},
    {"name": "Nebraska", "code": "NE"},
    {"name": "Nevada", "code": "NV"},
    {"name": "New Hampshire", "code": "NH"},
    {"name": "New Jersey", "code": "NJ"},
    {"name": "New Mexico", "code": "NM"},
    {"name": "New York", "code": "NY"},
    {"name": "North Carolina", "code": "NC"},
    {"name": "North Dakota", "code": "ND"},
    {"name": "Ohio", "code": "OH"},
    {"name": "Oklahoma", "code": "OK"},
    {"name": "Oregon", "code": "OR"},
    {"name": "Pennsylvania", "code": "PA"},
    {"name": "Rhode Island", "code": "RI"},
    {"name": "South Carolina", "code": "SC"},
    {"name": "South Dakota", "code": "SD"},
    {"name": "Tennessee", "code": "TN"},
    {"name": "Texas", "code": "TX"},
    {"name": "Utah", "code": "UT"},
    {"name": "Vermont", "code": "VT"},
    {"name": "Virginia", "code": "VA"},
    {"name": "Washington", "code": "WA"},
    {"name": "West Virginia", "code": "WV"},
    {"name": "Wisconsin", "code": "WI"},
    {"name": "Wyoming", "code": "WY"},
    {"name": "District of Columbia", "code": "DC"}
]


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
            'landscaping', 'lawn care', 'pool', 'spa', 'salon', 'dry clean'
        ]
    },
    'landscape': {
        'name': 'Landscape Services',
        'domain': 'landscapeexits.com',
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
        'domain': 'hvacexits.com',
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
# BIZBUYSELL STATE SCRAPER CLASS
# ============================================================================

class BizBuySellStateScraper:
    """State-by-state BizBuySell scraper for complete coverage"""

    def __init__(self, vertical_slug: str = 'cleaning'):
        if vertical_slug not in VERTICAL_CONFIGS:
            raise ValueError(f"Invalid vertical: {vertical_slug}")

        self.vertical_slug = vertical_slug
        self.vertical_config = VERTICAL_CONFIGS[vertical_slug]
        self.broker_source = 'BizBuySell'

        # Initialize session
        self.session = requests.Session(impersonate="chrome")
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json',
            'X-Correlation-Id': str(uuid.uuid4())
        }

        # Initialize Direct PostgreSQL Connection
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

        # Tracking
        self.token = None
        self.scraper_run_id = None
        self.stats = {
            'total_found': 0,
            'new_listings': 0,
            'filtered_out': 0,
            'errors': 0,
            'states_scraped': 0
        }

    def log(self, level: str, message: str):
        """Log to console"""
        colors = {'debug': Fore.CYAN, 'info': Fore.GREEN, 'warning': Fore.YELLOW, 'error': Fore.RED}
        color = colors.get(level, Fore.WHITE)
        print(f"{color}[{level.upper()}] {message}")

    def get_auth_token(self):
        """Obtain authentication token from BizBuySell"""
        self.log('info', 'Obtaining authentication token...')
        try:
            response = self.session.get(
                'https://www.bizbuysell.com/businesses-for-sale/',
                headers=self.headers
            )
            cookies = response.cookies
            self.token = cookies.get('_track_tkn')
            if self.token:
                self.log('info', 'Authentication token obtained')
            else:
                self.log('error', 'Failed to get authentication token')
        except Exception as e:
            self.log('error', f'Error obtaining token: {e}')

    def scrape_state(self, state: Dict[str, str], max_pages: int = 100) -> List[Dict[str, Any]]:
        """Scrape all listings from a specific state"""
        state_name = state['name']
        state_code = state['code']

        self.log('info', f"Scraping {state_name} ({state_code})...")

        if not self.token:
            self.log('error', 'No authentication token available')
            return []

        api_headers = self.headers.copy()
        api_headers['Authorization'] = f'Bearer {self.token}'

        # Payload for state-specific search
        payload = {
            "bfsSearchCriteria": {
                "siteId": 20,
                "languageId": 10,
                "locations": [state_code],  # Filter by state
                "pageNumber": 1,
                "daysListedAgo": 0,  # Get all listings
                "listingsWithNoAskingPrice": 0
            }
        }

        all_listings = []
        page = 1

        while page <= max_pages:
            payload["bfsSearchCriteria"]["pageNumber"] = page

            try:
                response = self.session.post(
                    'https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults',
                    headers=api_headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    listings = data.get("value", {}).get("bfsSearchResult", {}).get("value", [])

                    if not listings:
                        self.log('info', f"{state_code}: No more listings on page {page}")
                        break

                    all_listings.extend(listings)
                    self.log('info', f"{state_code}: Page {page} - Found {len(listings)} listings (Total: {len(all_listings)})")
                    page += 1
                    time.sleep(0.5)  # Rate limiting
                else:
                    self.log('error', f"{state_code}: Failed page {page}, status {response.status_code}")
                    break

            except Exception as e:
                self.log('error', f"{state_code}: Error on page {page}: {e}")
                break

        return all_listings

    def matches_vertical(self, listing: Dict[str, Any]) -> bool:
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

    def normalize_listing(self, raw_listing: Dict[str, Any]) -> Dict[str, Any]:
        """Convert BizBuySell listing to database schema"""
        # Generate unique ID
        list_number = str(raw_listing.get('listNumber', ''))
        url_stub = raw_listing.get('urlStub', '')
        title_text = raw_listing.get('header', '')
        unique_str = f"{list_number}--{url_stub}--{title_text}"
        listing_id = hashlib.sha256(unique_str.encode()).hexdigest()

        # Generate slug
        import re
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

    def save_to_postgres(self, listings: List[Dict[str, Any]]):
        """Save listings to PostgreSQL"""
        if not listings:
            return

        self.log('info', f"Saving {len(listings)} listings...")
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
                        images, documents,
                        meta_title, meta_description, custom_fields,
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
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
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
                self.stats['new_listings'] += 1

                if i % 100 == 0:
                    self.db_conn.commit()
                    self.log('info', f"✓ Saved {i}/{len(listings)}")

            except Exception as e:
                self.log('error', f"Failed to save listing {i}: {e}")
                self.stats['errors'] += 1

        self.db_conn.commit()
        cursor.close()

    def run(self, states: List[str] = None, max_pages_per_state: int = 100):
        """Main execution - scrape all states"""
        print(f"\n{Fore.CYAN}{'='*70}")
        print(f"{Fore.CYAN}BizBuySell State Scraper - {self.vertical_config['name']}")
        print(f"{Fore.CYAN}{'='*70}\n")

        # Get auth token
        self.get_auth_token()
        if not self.token:
            raise Exception("Failed to obtain authentication token")

        # Filter states if specific ones requested
        states_to_scrape = US_STATES
        if states:
            states_to_scrape = [s for s in US_STATES if s['code'] in states]

        # Scrape each state
        for state in states_to_scrape:
            raw_listings = self.scrape_state(state, max_pages_per_state)
            self.stats['total_found'] += len(raw_listings)
            self.stats['states_scraped'] += 1

            # Filter and normalize
            filtered = []
            for listing in raw_listings:
                if self.matches_vertical(listing):
                    filtered.append(self.normalize_listing(listing))
                else:
                    self.stats['filtered_out'] += 1

            # Save to database
            if filtered:
                self.save_to_postgres(filtered)

            self.log('info', f"{state['code']}: Saved {len(filtered)} listings")

        # Summary
        print(f"\n{Fore.GREEN}{'='*70}")
        print(f"{Fore.GREEN}SCRAPING COMPLETE")
        print(f"{Fore.GREEN}{'='*70}")
        print(f"{Fore.GREEN}States Scraped: {self.stats['states_scraped']}")
        print(f"{Fore.GREEN}Total Found: {self.stats['total_found']}")
        print(f"{Fore.GREEN}Matched Vertical: {self.stats['new_listings']}")
        print(f"{Fore.GREEN}Filtered Out: {self.stats['filtered_out']}")
        print(f"{Fore.GREEN}Errors: {self.stats['errors']}")
        print(f"{Fore.GREEN}{'='*70}\n")

        self.db_conn.close()


# ============================================================================
# CLI INTERFACE
# ============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="BizBuySell State Scraper")
    parser.add_argument('--vertical', type=str, choices=['cleaning', 'landscape', 'hvac'],
                        default='cleaning', help='Vertical to scrape')
    parser.add_argument('--states', type=str, help='Comma-separated state codes (e.g., CA,NY,TX)')
    parser.add_argument('--max-pages', type=int, default=100,
                        help='Max pages per state (default: 100)')

    args = parser.parse_args()

    states = args.states.split(',') if args.states else None

    scraper = BizBuySellStateScraper(vertical_slug=args.vertical)
    scraper.run(states=states, max_pages_per_state=args.max_pages)
