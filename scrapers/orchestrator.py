"""
Multi-Tenant Scraper Orchestrator
Runs all 3 scrapers across all 3 verticals:
- BizBuySell (API-based)
- Specialized Brokers (Murphy, Transworld, Sunbelt, VR, FCBB, Hedgestone)
- Unified Broker Network (ML-based pattern detection)

Verticals: cleaning, landscape, hvac
"""

import os
import sys
import time
import argparse
from datetime import datetime
from typing import List, Dict
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# ============================================================================
# CONFIGURATION
# ============================================================================

VERTICALS = ['cleaning', 'landscape', 'hvac']

VERTICAL_NAMES = {
    'cleaning': 'Cleaning Services',
    'landscape': 'Landscape Services',
    'hvac': 'HVAC Services'
}

SCRAPERS = {
    'bizbuysell': {
        'name': 'BizBuySell',
        'description': 'National business-for-sale marketplace (API-based)',
        'module': 'bizbuysell_scraper_v2',
        'class': 'BizBuySellScraperV2',
        'default_config': {
            'max_pages': 100,
            'workers': 10
        }
    },
    'specialized': {
        'name': 'Specialized Brokers',
        'description': 'Murphy, Transworld, Sunbelt, VR, FCBB, Hedgestone',
        'module': 'specialized_scrapers_v2',
        'function': 'scrape_all_specialized_brokers',
        'default_config': {
            'save_to_db': True,
            'verbose': True
        }
    },
    'unified': {
        'name': 'Unified Broker Network',
        'description': 'ML-based pattern detection for general brokers',
        'module': 'unified_broker_scraper_v2',
        'class': 'SelfLearningScraper',
        'default_config': {
            'top_n': 10,
            'category': None
        }
    }
}


# ============================================================================
# ORCHESTRATOR CLASS
# ============================================================================

class ScraperOrchestrator:
    """Orchestrates multi-tenant scraping across all verticals and scrapers"""

    def __init__(self, verticals: List[str] = None, scrapers: List[str] = None,
                 skip_errors: bool = True, delay_between_runs: int = 5):
        """
        Initialize orchestrator

        Args:
            verticals: List of verticals to scrape (default: all)
            scrapers: List of scrapers to run (default: all)
            skip_errors: Continue on errors (default: True)
            delay_between_runs: Seconds to wait between scraper runs (default: 5)
        """
        self.verticals = verticals or VERTICALS
        self.scrapers = scrapers or list(SCRAPERS.keys())
        self.skip_errors = skip_errors
        self.delay_between_runs = delay_between_runs

        # Validate inputs
        for vertical in self.verticals:
            if vertical not in VERTICALS:
                raise ValueError(f"Invalid vertical: {vertical}. Must be one of: {VERTICALS}")

        for scraper in self.scrapers:
            if scraper not in SCRAPERS:
                raise ValueError(f"Invalid scraper: {scraper}. Must be one of: {list(SCRAPERS.keys())}")

        # Tracking
        self.results = []
        self.start_time = None
        self.end_time = None

    def run_bizbuysell(self, vertical: str, config: Dict = None):
        """Run BizBuySell scraper for a vertical"""
        try:
            from bizbuysell_scraper_v2 import BizBuySellScraperV2

            cfg = SCRAPERS['bizbuysell']['default_config'].copy()
            if config:
                cfg.update(config)

            print(f"{Fore.CYAN}▶ Running BizBuySell scraper for {VERTICAL_NAMES[vertical]}...")
            print(f"{Fore.CYAN}  Config: {cfg}\n")

            scraper = BizBuySellScraperV2(vertical_slug=vertical)
            scraper.run(max_pages=cfg['max_pages'], workers=cfg['workers'])

            return {
                'vertical': vertical,
                'scraper': 'bizbuysell',
                'status': 'success',
                'listings': scraper.stats['new_listings'],
                'error': None
            }

        except Exception as e:
            error_msg = str(e)
            print(f"{Fore.RED}✗ BizBuySell scraper failed for {vertical}: {error_msg}\n")

            return {
                'vertical': vertical,
                'scraper': 'bizbuysell',
                'status': 'failed',
                'listings': 0,
                'error': error_msg
            }

    def run_specialized(self, vertical: str, config: Dict = None):
        """Run specialized scrapers for a vertical"""
        try:
            from specialized_scrapers_v2 import scrape_all_specialized_brokers

            cfg = SCRAPERS['specialized']['default_config'].copy()
            if config:
                cfg.update(config)

            print(f"{Fore.CYAN}▶ Running Specialized Brokers for {VERTICAL_NAMES[vertical]}...")
            print(f"{Fore.CYAN}  Brokers: Murphy, Hedgestone, Transworld, Sunbelt, VR, FCBB\n")

            listings = scrape_all_specialized_brokers(
                vertical_slug=vertical,
                save_to_db=cfg['save_to_db'],
                verbose=cfg['verbose']
            )

            return {
                'vertical': vertical,
                'scraper': 'specialized',
                'status': 'success',
                'listings': len(listings),
                'error': None
            }

        except Exception as e:
            error_msg = str(e)
            print(f"{Fore.RED}✗ Specialized scrapers failed for {vertical}: {error_msg}\n")

            return {
                'vertical': vertical,
                'scraper': 'specialized',
                'status': 'failed',
                'listings': 0,
                'error': error_msg
            }

    def run_unified(self, vertical: str, config: Dict = None):
        """Run unified broker network scraper for a vertical"""
        try:
            # Import the module
            import importlib
            import argparse

            # Create args object
            args = argparse.Namespace()
            args.permissive = True
            args.vertical = vertical
            args.category = config.get('category') if config else None

            from unified_broker_scraper_v2 import SelfLearningScraper

            cfg = SCRAPERS['unified']['default_config'].copy()
            if config:
                cfg.update(config)

            print(f"{Fore.CYAN}▶ Running Unified Broker Network for {VERTICAL_NAMES[vertical]}...")
            print(f"{Fore.CYAN}  Config: {cfg}\n")

            scraper = SelfLearningScraper(args, vertical_slug=vertical)
            scraper.run(top_n=cfg['top_n'], category=cfg['category'])

            return {
                'vertical': vertical,
                'scraper': 'unified',
                'status': 'success',
                'listings': scraper.stats['listings'],
                'error': None
            }

        except Exception as e:
            error_msg = str(e)
            print(f"{Fore.RED}✗ Unified scraper failed for {vertical}: {error_msg}\n")

            return {
                'vertical': vertical,
                'scraper': 'unified',
                'status': 'failed',
                'listings': 0,
                'error': error_msg
            }

    def run_scraper(self, scraper_type: str, vertical: str, config: Dict = None):
        """Run a specific scraper for a vertical"""
        if scraper_type == 'bizbuysell':
            return self.run_bizbuysell(vertical, config)
        elif scraper_type == 'specialized':
            return self.run_specialized(vertical, config)
        elif scraper_type == 'unified':
            return self.run_unified(vertical, config)
        else:
            raise ValueError(f"Unknown scraper type: {scraper_type}")

    def run(self, scraper_configs: Dict = None):
        """
        Run all configured scrapers across all verticals

        Args:
            scraper_configs: Optional dict of scraper-specific configs
                            {'bizbuysell': {'max_pages': 50}, ...}
        """
        self.start_time = datetime.now()

        print(f"\n{Fore.GREEN}{'='*70}")
        print(f"{Fore.GREEN}MULTI-TENANT SCRAPER ORCHESTRATOR")
        print(f"{Fore.GREEN}{'='*70}")
        print(f"{Fore.GREEN}Verticals: {', '.join([VERTICAL_NAMES[v] for v in self.verticals])}")
        print(f"{Fore.GREEN}Scrapers: {', '.join([SCRAPERS[s]['name'] for s in self.scrapers])}")
        print(f"{Fore.GREEN}Started: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{Fore.GREEN}{'='*70}\n")

        # Run each scraper for each vertical
        total_runs = len(self.verticals) * len(self.scrapers)
        current_run = 0

        for vertical in self.verticals:
            print(f"\n{Fore.YELLOW}{'='*70}")
            print(f"{Fore.YELLOW}VERTICAL: {VERTICAL_NAMES[vertical].upper()}")
            print(f"{Fore.YELLOW}{'='*70}\n")

            for scraper_type in self.scrapers:
                current_run += 1

                print(f"\n{Fore.CYAN}[{current_run}/{total_runs}] {SCRAPERS[scraper_type]['name']} → {VERTICAL_NAMES[vertical]}")
                print(f"{Fore.CYAN}{'-'*70}\n")

                # Get scraper-specific config
                config = None
                if scraper_configs and scraper_type in scraper_configs:
                    config = scraper_configs[scraper_type]

                # Run scraper
                try:
                    result = self.run_scraper(scraper_type, vertical, config)
                    self.results.append(result)

                    # Print result
                    if result['status'] == 'success':
                        print(f"{Fore.GREEN}✓ {SCRAPERS[scraper_type]['name']} completed: {result['listings']} listings")
                    else:
                        print(f"{Fore.RED}✗ {SCRAPERS[scraper_type]['name']} failed: {result['error']}")

                        if not self.skip_errors:
                            raise Exception(f"Scraper failed: {result['error']}")

                except Exception as e:
                    error_msg = str(e)
                    print(f"{Fore.RED}✗ Exception running {scraper_type}: {error_msg}")

                    self.results.append({
                        'vertical': vertical,
                        'scraper': scraper_type,
                        'status': 'failed',
                        'listings': 0,
                        'error': error_msg
                    })

                    if not self.skip_errors:
                        raise

                # Delay between runs
                if current_run < total_runs:
                    print(f"\n{Fore.CYAN}⏳ Waiting {self.delay_between_runs} seconds before next run...\n")
                    time.sleep(self.delay_between_runs)

        self.end_time = datetime.now()
        self.print_summary()

    def print_summary(self):
        """Print execution summary"""
        duration = (self.end_time - self.start_time).total_seconds()
        duration_str = f"{int(duration // 60)}m {int(duration % 60)}s"

        print(f"\n{Fore.GREEN}{'='*70}")
        print(f"{Fore.GREEN}ORCHESTRATION COMPLETE")
        print(f"{Fore.GREEN}{'='*70}")
        print(f"{Fore.GREEN}Duration: {duration_str}")
        print(f"{Fore.GREEN}Total Runs: {len(self.results)}")

        # Count successes and failures
        successes = sum(1 for r in self.results if r['status'] == 'success')
        failures = sum(1 for r in self.results if r['status'] == 'failed')
        total_listings = sum(r['listings'] for r in self.results)

        print(f"{Fore.GREEN}Successful: {successes}")
        print(f"{Fore.RED}Failed: {failures}")
        print(f"{Fore.GREEN}Total Listings: {total_listings}")
        print(f"{Fore.GREEN}{'='*70}\n")

        # Print results by vertical
        for vertical in self.verticals:
            vertical_results = [r for r in self.results if r['vertical'] == vertical]
            vertical_listings = sum(r['listings'] for r in vertical_results)

            print(f"\n{Fore.YELLOW}{VERTICAL_NAMES[vertical]}:")
            for result in vertical_results:
                status_icon = "✓" if result['status'] == 'success' else "✗"
                status_color = Fore.GREEN if result['status'] == 'success' else Fore.RED
                print(f"{status_color}  {status_icon} {SCRAPERS[result['scraper']]['name']:30s} {result['listings']:5d} listings")

            print(f"{Fore.YELLOW}  {'─'*50}")
            print(f"{Fore.YELLOW}  Total: {vertical_listings:5d} listings")

        print(f"\n{Fore.GREEN}{'='*70}\n")


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Multi-Tenant Scraper Orchestrator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run all scrapers for all verticals
  python orchestrator.py

  # Run only BizBuySell for cleaning vertical
  python orchestrator.py --verticals cleaning --scrapers bizbuysell

  # Run specialized and unified for all verticals
  python orchestrator.py --scrapers specialized unified

  # Run cleaning and landscape only
  python orchestrator.py --verticals cleaning landscape

  # Custom config: limit BizBuySell to 50 pages, unified to 5 brokers
  python orchestrator.py --bizbuysell-pages 50 --unified-top-n 5
        """
    )

    # Vertical and scraper selection
    parser.add_argument(
        '--verticals',
        nargs='+',
        choices=VERTICALS,
        default=VERTICALS,
        help='Which verticals to scrape (default: all)'
    )

    parser.add_argument(
        '--scrapers',
        nargs='+',
        choices=list(SCRAPERS.keys()),
        default=list(SCRAPERS.keys()),
        help='Which scrapers to run (default: all)'
    )

    # Orchestrator options
    parser.add_argument(
        '--no-skip-errors',
        action='store_true',
        help='Stop on first error instead of continuing'
    )

    parser.add_argument(
        '--delay',
        type=int,
        default=5,
        help='Seconds to wait between scraper runs (default: 5)'
    )

    # BizBuySell config
    parser.add_argument(
        '--bizbuysell-pages',
        type=int,
        default=100,
        help='Max pages for BizBuySell (default: 100)'
    )

    parser.add_argument(
        '--bizbuysell-workers',
        type=int,
        default=10,
        help='Worker threads for BizBuySell (default: 10)'
    )

    # Unified scraper config
    parser.add_argument(
        '--unified-top-n',
        type=int,
        default=10,
        help='Max brokers for unified scraper (default: 10)'
    )

    parser.add_argument(
        '--unified-category',
        type=str,
        help='Category filter for unified scraper (optional)'
    )

    args = parser.parse_args()

    # Build scraper configs
    scraper_configs = {
        'bizbuysell': {
            'max_pages': args.bizbuysell_pages,
            'workers': args.bizbuysell_workers
        },
        'unified': {
            'top_n': args.unified_top_n,
            'category': args.unified_category
        }
    }

    # Create and run orchestrator
    orchestrator = ScraperOrchestrator(
        verticals=args.verticals,
        scrapers=args.scrapers,
        skip_errors=not args.no_skip_errors,
        delay_between_runs=args.delay
    )

    orchestrator.run(scraper_configs=scraper_configs)


if __name__ == "__main__":
    main()
