"""
Specialized Scrapers V2 - WITH MULTI-TENANT SUPPORT
Wraps specialized scrapers (Murphy, Transworld, Sunbelt, VR, FCBB, Hedgestone)
Adds: vertical filtering, keyword matching, scraper_runs tracking
"""

import os
import uuid
from typing import List, Dict, Optional
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

# Import original specialized scrapers
from specialized_scrapers_integration import (
    scrape_specialized_broker as _scrape_specialized_broker,
    get_specialized_broker_names
)

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
            'landscaping', 'lawn care', 'pool', 'spa', 'salon'
        ]
    },
    'landscape': {
        'name': 'Landscape Services',
        'include_keywords': [
            'landscape', 'landscaping', 'lawn care', 'lawn maintenance',
            'irrigation', 'hardscape', 'tree service', 'snow removal',
            'lawn mowing', 'garden', 'turf care', 'lawn treatment',
            'landscape design', 'outdoor living'
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
            'heat pump', 'ac repair', 'hvac contractor', 'hvac service'
        ],
        'exclude_keywords': [
            'restaurant', 'food service', 'cleaning', 'janitorial',
            'landscaping', 'lawn care', 'pool', 'spa', 'plumbing', 'electrical'
        ]
    }
}


# ============================================================================
# MULTI-TENANT WRAPPER
# ============================================================================

class SpecializedScraperV2:
    """Multi-tenant wrapper for specialized scrapers"""

    def __init__(self, vertical_slug: str = 'cleaning'):
        if vertical_slug not in VERTICAL_CONFIGS:
            raise ValueError(f"Invalid vertical: {vertical_slug}. Must be one of: {list(VERTICAL_CONFIGS.keys())}")

        self.vertical_slug = vertical_slug
        self.vertical_config = VERTICAL_CONFIGS[vertical_slug]

        # Initialize Supabase
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        self.supabase: Client = create_client(supabase_url, supabase_key)

        self.scraper_run_id = None
        self.stats = {
            'total_scraped': 0,
            'matched_vertical': 0,
            'filtered_out': 0,
            'saved': 0
        }

    def create_scraper_run(self, broker_source: str):
        """Create a scraper run record"""
        self.scraper_run_id = str(uuid.uuid4())
        try:
            self.supabase.table('scraper_runs').insert({
                'id': self.scraper_run_id,
                'vertical_slug': self.vertical_slug,
                'broker_source': broker_source,
                'scraper_type': 'specialized',
                'started_at': datetime.now(timezone.utc).isoformat(),
                'status': 'running',
                'total_listings_found': 0,
                'new_listings': 0,
                'updated_listings': 0,
                'failed_listings': 0
            }).execute()
            print(f"  Created scraper run: {self.scraper_run_id}")
        except Exception as e:
            print(f"  Warning: Could not create scraper run: {e}")

    def update_scraper_run(self, status: str = 'completed', error_message: str = None):
        """Update scraper run with final stats"""
        if not self.scraper_run_id:
            return

        try:
            self.supabase.table('scraper_runs').update({
                'completed_at': datetime.now(timezone.utc).isoformat(),
                'status': status,
                'total_listings_found': self.stats['total_scraped'],
                'new_listings': self.stats['matched_vertical'],
                'updated_listings': 0,
                'failed_listings': self.stats['total_scraped'] - self.stats['matched_vertical'],
                'error_message': error_message
            }).eq('id', self.scraper_run_id).execute()
        except Exception as e:
            print(f"  Warning: Could not update scraper run: {e}")

    def matches_vertical(self, listing: Dict) -> bool:
        """Check if listing matches vertical keywords"""
        # Get searchable text
        title = (listing.get('title') or '').lower()
        description = (listing.get('description') or listing.get('text') or '').lower()
        business_type = (listing.get('business_type') or '').lower()
        location = (listing.get('location') or '').lower()
        search_text = f"{title} {description} {business_type} {location}"

        # Check exclude keywords first
        for keyword in self.vertical_config['exclude_keywords']:
            if keyword.lower() in search_text:
                return False

        # Check include keywords
        for keyword in self.vertical_config['include_keywords']:
            if keyword.lower() in search_text:
                return True

        return False

    def scrape_broker(self, broker: Dict, verbose: bool = True) -> Optional[List[Dict]]:
        """Scrape a specialized broker with vertical filtering"""

        # Determine broker source name
        name = (broker.get('name') or '').lower()
        url = (broker.get('url') or '').lower()

        broker_source = 'Unknown'
        if 'murphy' in name or 'murphybusiness.com' in url:
            broker_source = 'Murphy Business'
        elif 'hedgestone' in name or 'hedgestone.com' in url:
            broker_source = 'Hedgestone'
        elif 'transworld' in name or 'tworld.com' in url:
            broker_source = 'Transworld'
        elif 'sunbelt' in name or 'sunbeltnetwork.com' in url:
            broker_source = 'Sunbelt'
        elif 'vr business' in name or 'vrbbusa.com' in url or 'vrbusinessbrokers' in url:
            broker_source = 'VR Business Brokers'
        elif 'first choice' in name or 'fcbb' in name or 'fcbb.com' in url:
            broker_source = 'FCBB'

        # Create scraper run
        self.create_scraper_run(broker_source)

        try:
            # Call original scraper
            if verbose:
                print(f"\n  Scraping {broker_source} for {self.vertical_config['name']}...")

            listings = _scrape_specialized_broker(broker, verbose=verbose)

            if not listings:
                self.update_scraper_run(status='failed', error_message='No listings returned')
                return []

            self.stats['total_scraped'] = len(listings)

            # Filter by vertical
            matched_listings = []
            for listing in listings:
                if self.matches_vertical(listing):
                    # Add vertical_slug and scraper_run_id
                    listing['vertical_slug'] = self.vertical_slug
                    listing['scraper_run_id'] = self.scraper_run_id

                    # Normalize field names (specialized scrapers use different formats)
                    if 'listing_id' in listing and 'id' not in listing:
                        listing['id'] = listing['listing_id']
                    if 'asking_price' not in listing and 'price' in listing:
                        listing['asking_price'] = listing['price']
                    if 'annual_revenue' not in listing and 'revenue' in listing:
                        listing['annual_revenue'] = listing['revenue']

                    # Set status
                    if 'status' not in listing:
                        listing['status'] = 'pending'

                    # Set timestamps
                    if 'scraped_at' not in listing:
                        listing['scraped_at'] = datetime.now(timezone.utc).isoformat()

                    matched_listings.append(listing)
                else:
                    self.stats['filtered_out'] += 1

            self.stats['matched_vertical'] = len(matched_listings)

            if verbose:
                if matched_listings:
                    print(f"  ✓ Matched {len(matched_listings)}/{len(listings)} listings to {self.vertical_config['name']} vertical")
                    if self.stats['filtered_out'] > 0:
                        print(f"  ⚠ Filtered out {self.stats['filtered_out']} non-matching listings")
                else:
                    print(f"  ✗ No listings matched {self.vertical_config['name']} vertical (filtered out {self.stats['filtered_out']})")

            # Update scraper run
            self.update_scraper_run(status='completed')

            return matched_listings

        except Exception as e:
            self.update_scraper_run(status='failed', error_message=str(e))
            if verbose:
                print(f"  ✗ Error scraping {broker_source}: {e}")
            return []

    def save_to_supabase(self, listings: List[Dict], verbose: bool = True):
        """Save listings to Supabase"""
        if not listings:
            if verbose:
                print("  No listings to save")
            return

        if verbose:
            print(f"\n  Saving {len(listings)} listings to Supabase...")

        batch_size = 100
        for i in range(0, len(listings), batch_size):
            batch = listings[i:i+batch_size]
            try:
                self.supabase.table('listings').upsert(
                    batch,
                    on_conflict='id'
                ).execute()

                self.stats['saved'] += len(batch)

                if verbose:
                    print(f"    ✓ Saved batch {i//batch_size + 1} ({len(batch)} listings)")
            except Exception as e:
                if verbose:
                    print(f"    ✗ Failed to save batch {i//batch_size + 1}: {e}")

        if verbose:
            print(f"  ✓ Saved {self.stats['saved']}/{len(listings)} listings")


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def scrape_specialized_broker_v2(broker: Dict, vertical_slug: str = 'cleaning', verbose: bool = True) -> Optional[List[Dict]]:
    """
    Scrape a specialized broker with vertical filtering

    Args:
        broker: Dict with 'account', 'name', 'url'
        vertical_slug: 'cleaning' | 'landscape' | 'hvac'
        verbose: Print progress messages

    Returns:
        List of listings matching the vertical, or empty list
    """
    scraper = SpecializedScraperV2(vertical_slug=vertical_slug)
    return scraper.scrape_broker(broker, verbose=verbose)


def scrape_all_specialized_brokers(vertical_slug: str = 'cleaning', save_to_db: bool = True, verbose: bool = True) -> List[Dict]:
    """
    Scrape all specialized brokers for a vertical

    Args:
        vertical_slug: 'cleaning' | 'landscape' | 'hvac'
        save_to_db: Save results to Supabase
        verbose: Print progress messages

    Returns:
        Combined list of all listings
    """
    scraper = SpecializedScraperV2(vertical_slug=vertical_slug)

    # Define specialized brokers
    specialized_brokers = [
        {'account': '999', 'name': 'Murphy Business', 'url': 'https://murphybusiness.com'},
        {'account': '994', 'name': 'Hedgestone', 'url': 'https://www.hedgestone.com'},
        {'account': '998', 'name': 'Transworld', 'url': 'https://www.tworld.com'},
        {'account': '997', 'name': 'Sunbelt', 'url': 'https://www.sunbeltnetwork.com'},
        {'account': '996', 'name': 'VR Business Brokers', 'url': 'https://www.vrbusinessbrokers.com'},
        {'account': '995', 'name': 'FCBB', 'url': 'https://fcbb.com'},
    ]

    all_listings = []

    if verbose:
        print(f"\n{'='*70}")
        print(f"SPECIALIZED SCRAPERS V2 - {VERTICAL_CONFIGS[vertical_slug]['name'].upper()}")
        print(f"{'='*70}")
        print(f"Scraping {len(specialized_brokers)} specialized brokers...")
        print(f"{'='*70}\n")

    for broker in specialized_brokers:
        listings = scraper.scrape_broker(broker, verbose=verbose)
        if listings:
            all_listings.extend(listings)

    if verbose:
        print(f"\n{'='*70}")
        print(f"SPECIALIZED SCRAPERS COMPLETE")
        print(f"{'='*70}")
        print(f"Total listings: {len(all_listings)}")
        print(f"Matched vertical: {len(all_listings)}")
        print(f"{'='*70}\n")

    # Save to database if requested
    if save_to_db and all_listings:
        scraper.save_to_supabase(all_listings, verbose=verbose)

    return all_listings


# ============================================================================
# CLI INTERFACE
# ============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Specialized Scrapers V2 - Multi-Tenant")
    parser.add_argument(
        '--vertical',
        type=str,
        choices=['cleaning', 'landscape', 'hvac'],
        default='cleaning',
        help='Vertical to scrape (default: cleaning)'
    )
    parser.add_argument(
        '--broker',
        type=str,
        choices=['murphy', 'hedgestone', 'transworld', 'sunbelt', 'vr', 'fcbb', 'all'],
        default='all',
        help='Which specialized broker to scrape (default: all)'
    )
    parser.add_argument(
        '--no-save',
        action='store_true',
        help='Do not save to database (just scrape and print)'
    )

    args = parser.parse_args()

    # Map broker names to configs
    broker_configs = {
        'murphy': {'account': '999', 'name': 'Murphy Business', 'url': 'https://murphybusiness.com'},
        'hedgestone': {'account': '994', 'name': 'Hedgestone', 'url': 'https://www.hedgestone.com'},
        'transworld': {'account': '998', 'name': 'Transworld', 'url': 'https://www.tworld.com'},
        'sunbelt': {'account': '997', 'name': 'Sunbelt', 'url': 'https://www.sunbeltnetwork.com'},
        'vr': {'account': '996', 'name': 'VR Business Brokers', 'url': 'https://www.vrbusinessbrokers.com'},
        'fcbb': {'account': '995', 'name': 'FCBB', 'url': 'https://fcbb.com'},
    }

    if args.broker == 'all':
        # Scrape all specialized brokers
        listings = scrape_all_specialized_brokers(
            vertical_slug=args.vertical,
            save_to_db=not args.no_save,
            verbose=True
        )

        print(f"\n✓ Complete! Total listings: {len(listings)}")

    else:
        # Scrape single broker
        broker = broker_configs[args.broker]
        scraper = SpecializedScraperV2(vertical_slug=args.vertical)
        listings = scraper.scrape_broker(broker, verbose=True)

        if listings and not args.no_save:
            scraper.save_to_supabase(listings, verbose=True)

        print(f"\n✓ Complete! {len(listings)} listings scraped")
