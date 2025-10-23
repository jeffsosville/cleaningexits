"""
JSON Combiner and Database Import Utility

Combines multiple JSON files and optionally imports to PostgreSQL.
Supports vertical filtering and deduplication.
"""

import json
import glob
import os
import hashlib
import re
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import Json
from dotenv import load_dotenv
from colorama import Fore, Style, init

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
            'pressure washing', 'commercial cleaning', 'residential cleaning'
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
            'irrigation', 'hardscape', 'tree service', 'snow removal'
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
            'ventilation', 'refrigeration', 'climate control'
        ],
        'exclude_keywords': [
            'restaurant', 'food service', 'cleaning', 'janitorial',
            'landscaping', 'lawn care', 'pool', 'spa'
        ]
    }
}


# ============================================================================
# COMBINER CLASS
# ============================================================================

class JSONCombiner:
    def __init__(self, vertical_slug='cleaning', use_database=False):
        self.vertical_slug = vertical_slug
        self.vertical_config = VERTICAL_CONFIGS.get(vertical_slug)
        self.use_database = use_database

        # Initialize PostgreSQL connection if needed
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

        self.stats = {
            'files_processed': 0,
            'total_listings': 0,
            'unique_listings': 0,
            'matched_vertical': 0,
            'filtered_out': 0,
            'saved': 0,
            'errors': 0
        }

    def matches_vertical(self, listing):
        """Check if listing matches vertical keywords"""
        if not self.vertical_config:
            return True  # No filtering if no vertical config

        title = (listing.get('header') or listing.get('title') or '').lower()
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
        """Calculate quality score (0-100)"""
        score = 50

        if revenue:
            if revenue > 1000000: score += 20
            elif revenue > 500000: score += 15
            elif revenue > 250000: score += 10
            elif revenue > 100000: score += 5

        if cash_flow:
            if cash_flow > 200000: score += 20
            elif cash_flow > 100000: score += 15
            elif cash_flow > 50000: score += 10
            elif cash_flow > 25000: score += 5

        if price and revenue and revenue > 0:
            multiple = price / revenue
            if 0.5 <= multiple <= 3.0: score += 10
            elif 3.0 < multiple <= 5.0: score += 5

        return min(max(score, 0), 100)

    def normalize_listing(self, raw_listing):
        """Normalize listing to database schema"""
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
            'is_active': True,
            'quality_score': quality_score,
            'scraped_at': datetime.now(timezone.utc).isoformat(),
        }

    def combine_json_files(self, prefix="bizbuysell_", output_file=None):
        """Combine multiple JSON files into one"""
        combined_data = []
        seen_ids = set()

        pattern = f"{prefix}*.json"
        files = glob.glob(pattern)

        if not files:
            print(f"{Fore.YELLOW}[!] No files found matching pattern: {pattern}")
            return combined_data

        print(f"{Fore.CYAN}[*] Found {len(files)} files matching '{pattern}'")

        for file in files:
            print(f"{Fore.CYAN}[*] Processing: {file}")
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)

                    if isinstance(data, list):
                        for listing in data:
                            # Create unique ID for deduplication
                            list_number = str(listing.get('listNumber', ''))
                            url_stub = listing.get('urlStub', '')
                            title = listing.get('header', '')
                            unique_id = f"{list_number}--{url_stub}--{title}"

                            if unique_id not in seen_ids:
                                seen_ids.add(unique_id)
                                combined_data.append(listing)
                                self.stats['unique_listings'] += 1

                            self.stats['total_listings'] += 1

                        self.stats['files_processed'] += 1
                    else:
                        print(f"{Fore.YELLOW}[!] Warning: {file} does not contain a list. Skipping.")
            except json.JSONDecodeError as e:
                print(f"{Fore.RED}[-] Error decoding {file}: {e}")
            except Exception as e:
                print(f"{Fore.RED}[-] Error processing {file}: {e}")

        # Save combined JSON if output file specified
        if output_file:
            with open(output_file, "w", encoding="utf-8") as f_out:
                json.dump(combined_data, f_out, indent=2, ensure_ascii=False)
                print(f"{Fore.GREEN}[+] Combined {len(combined_data)} unique entries into {output_file}")

        return combined_data

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
        print(f"{Fore.GREEN}[+] Database save complete!")

    def run(self, prefix="bizbuysell_", output_file=None, filter_vertical=True):
        """
        Main execution flow

        Args:
            prefix: File prefix to match (default: "bizbuysell_")
            output_file: Output JSON file name (optional)
            filter_vertical: If True, filter by vertical keywords
        """
        print(f"{Fore.CYAN}{'='*70}")
        print(f"{Fore.CYAN}JSON Combiner - {self.vertical_config['name'] if self.vertical_config else 'All Listings'}")
        print(f"{Fore.CYAN}{'='*70}\n")

        try:
            # Combine JSON files
            combined_data = self.combine_json_files(prefix=prefix, output_file=output_file)

            if not combined_data:
                print(f"{Fore.YELLOW}[!] No data to process")
                return

            # Filter by vertical if enabled
            if filter_vertical and self.vertical_config:
                print(f"{Fore.CYAN}[*] Filtering for {self.vertical_config['name']}...")
                filtered = []
                for listing in combined_data:
                    if self.matches_vertical(listing):
                        filtered.append(self.normalize_listing(listing))
                        self.stats['matched_vertical'] += 1
                    else:
                        self.stats['filtered_out'] += 1

                combined_data = filtered
            else:
                # Normalize without filtering
                combined_data = [self.normalize_listing(l) for l in combined_data]
                self.stats['matched_vertical'] = len(combined_data)

            # Save to database if enabled
            if self.use_database and combined_data:
                self.save_to_postgres(combined_data)

            # Print summary
            print(f"\n{Fore.GREEN}{'='*70}")
            print(f"{Fore.GREEN}COMBINATION COMPLETE")
            print(f"{Fore.GREEN}{'='*70}")
            print(f"{Fore.GREEN}Files Processed: {self.stats['files_processed']}")
            print(f"{Fore.GREEN}Total Listings: {self.stats['total_listings']}")
            print(f"{Fore.GREEN}Unique Listings: {self.stats['unique_listings']}")
            print(f"{Fore.GREEN}Matched Vertical: {self.stats['matched_vertical']}")
            print(f"{Fore.GREEN}Filtered Out: {self.stats['filtered_out']}")
            if self.use_database:
                print(f"{Fore.GREEN}Saved to DB: {self.stats['saved']}")
                print(f"{Fore.GREEN}Errors: {self.stats['errors']}")
            print(f"{Fore.GREEN}{'='*70}\n")

        finally:
            if self.db_conn:
                self.db_conn.close()


# ============================================================================
# CLI INTERFACE
# ============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="JSON Combiner and Database Import Utility")
    parser.add_argument('--prefix', type=str, default='bizbuysell_',
                        help='File prefix to match (default: bizbuysell_)')
    parser.add_argument('--output', type=str,
                        help='Output JSON file name (optional)')
    parser.add_argument('--vertical', type=str, choices=['cleaning', 'landscape', 'hvac'],
                        default='cleaning',
                        help='Vertical to filter by (default: cleaning)')
    parser.add_argument('--no-filter', action='store_true',
                        help='Disable vertical filtering')
    parser.add_argument('--database', action='store_true',
                        help='Save to PostgreSQL database')
    parser.add_argument('--json-only', action='store_true',
                        help='Only combine JSON files, do not save to database')

    args = parser.parse_args()

    # Determine database usage
    use_database = args.database and not args.json_only

    # Create combiner instance
    combiner = JSONCombiner(
        vertical_slug=args.vertical,
        use_database=use_database
    )

    # Run combiner
    combiner.run(
        prefix=args.prefix,
        output_file=args.output,
        filter_vertical=not args.no_filter
    )
