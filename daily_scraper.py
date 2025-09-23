import os
import json
import hashlib
import csv
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from curl_cffi import requests
from colorama import init, Fore, Style
from concurrent.futures import ThreadPoolExecutor, as_completed
from supabase import create_client, Client
import logging
import time
import random

# Initialize colorama for colored logging
init(autoreset=True)

# Set up logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BizBuySellScraper:
    def __init__(self):
        """Initializes the scraper with necessary configurations and user agents."""
        
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Mozilla/50 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
        ]
        
        # Keywords to identify cleaning businesses
        self.cleaning_keywords = [
            "cleaning", "janitorial", "custodial", "sanitation", "maintenance",
            "carpet cleaning", "window cleaning", "commercial cleaning",
            "residential cleaning", "maid service", "housekeeping",
            "pressure washing", "restoration", "disinfection"
        ]
        
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.max_pages = int(os.getenv("MAX_PAGES", 500))
        self.workers = int(os.getenv("WORKERS", 5))
        
        self.supabase = self.get_supabase_client()
        
        # UPDATED: Use a supported user agent for impersonation
        self.session = requests.Session(impersonate="chrome101")
        
        proxy_url = os.getenv('PROXY_URL')
        if proxy_url:
            # Strip any leading/trailing whitespace or newlines
            proxy_url = proxy_url.strip()
            # Use `http://` or `https://` prefix
            if not proxy_url.startswith(('http://', 'https://')):
                proxy_url = 'http://' + proxy_url
            self.session.proxies = {'http': proxy_url, 'https': proxy_url}
            logger.info("Proxy configured for the scraper session.")

        self.auth_token = None
        self.auth_token_timestamp = None
        self.base_url = "https://www.bizbuysell.com/api"

    def get_supabase_client(self):
        """Creates and returns a Supabase client."""
        if not self.supabase_url or not self.supabase_key:
            logger.error("Supabase URL or Key not found in environment variables.")
            return None
        return create_client(self.supabase_url, self.supabase_key)
        
    def get_auth_token(self):
        """
        Obtains a new authentication token from the BizBuySell API.
        This is a critical step to prevent 403 Forbidden errors.
        """
        if self.auth_token and self.auth_token_timestamp and (datetime.now(timezone.utc) - self.auth_token_timestamp).total_seconds() < 3600:
            logger.info("Using cached token.")
            return
        
        url = f"{self.base_url}/search/listings?listType=business-for-sale&sort=updated_desc"
        headers = {
            "Accept": "application/json, text/plain, */*",
            "X-App-Id": "1",
            "User-Agent": random.choice(self.user_agents),
            "Accept-Language": "en-US,en;q=0.9",
        }
        
        max_retries = 5
        for attempt in range(1, max_retries + 1):
            try:
                logger.info("Obtaining authentication token...")
                response = self.session.get(url, headers=headers, timeout=10)
                response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
                
                if "X-Auth-Token" in response.headers:
                    self.auth_token = response.headers["X-Auth-Token"]
                    self.auth_token_timestamp = datetime.now(timezone.utc)
                    logger.info("Authentication token obtained successfully.")
                    return
                else:
                    logger.error("X-Auth-Token not found in response headers.")
                    
            except requests.exceptions.HTTPError as http_err:
                logger.error(f"HTTP Error {http_err.response.status_code}: {http_err.response.text}")
            except requests.exceptions.RequestException as req_err:
                logger.error(f"Error getting token (attempt {attempt}): {req_err}")
                
            if attempt < max_retries:
                delay = random.uniform(2, 8)  # Random delay to mimic human behavior
                logger.info(f"Retry {attempt + 1}/{max_retries} after {delay:.1f}s delay")
                time.sleep(delay)
        
        logger.error("All token attempts failed")
        
    def fetch_listings(self):
        """Fetches listings from the BizBuySell API based on keywords and categories."""
        if not self.auth_token:
            logger.error("No token; cannot scrape.")
            return []

        # Rest of the method...
        
    def save_to_json(self, listings, filename="cleaning_business_listings.json"):
        """Saves the scraped data to a JSON file."""
        data = {
            "metadata": {
                "total_listings": len(listings),
                "search_keywords": self.cleaning_keywords,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            },
            "listings": listings,
        }
        
        try:
            with open(filename, 'w') as f:
                json.dump(data, f, indent=4)
            logger.info(f"[+] Saved JSON → {filename}")
        except Exception as e:
            logger.error(f"Error saving JSON file: {e}")

    def save_to_supabase(self, listings: List[Dict[str, Any]], table_name: str = "business_listings"):
        """Saves a list of listings to a Supabase table, upserting to avoid duplicates."""
        if not self.supabase:
            logger.error("Supabase client is not available.")
            return

        for listing in listings:
            try:
                # Use a combination of unique fields to form a unique ID for upserting
                unique_id = hashlib.sha256(str(listing['listNumber']).encode('utf-8')).hexdigest()
                listing['id'] = unique_id

                # Upsert the listing into Supabase
                response = self.supabase.table(table_name).upsert(listing).execute()

                if response.data:
                    logger.info(f"Listing {listing.get('listNumber', 'N/A')} upserted to Supabase.")
                else:
                    logger.warning(f"Failed to upsert listing {listing.get('listNumber', 'N/A')}: {response.error}")

            except Exception as e:
                logger.error(f"Error saving listing to Supabase: {e}")
                
    def run(self):
        """
        Orchestrates the entire scraping process.
        """
        logger.info(f"Configuration: MAX_PAGES={self.max_pages}, WORKERS={self.workers}")
        
        logger.info("============================================================")
        logger.info(f"{Fore.GREEN}{Style.BRIGHT}BizBuySell Cleaning Business Scraper{Style.RESET_ALL}")
        logger.info("============================================================")
        
        # Step 1: Get authentication token
        self.get_auth_token()
        
        if not self.auth_token:
            logger.error("[-] No token; cannot scrape.")
            return
            
        # Step 2: Fetch listings
        logger.info(f"[*] Starting to fetch listings with {self.workers} workers...")
        listings = self.fetch_listings()
        logger.info(f"[+] Found {len(listings)} cleaning listings.")
        
        # Step 3: Save to Supabase and JSON
        if listings:
            self.save_to_supabase(listings)
            self.save_to_json(listings)
        else:
            logger.info("[!] No new listings to save.")
            
        logger.info(f"{Fore.GREEN}[+] Complete.{Style.RESET_ALL}")
        
# Main execution block
if __name__ == "__main__":
    scraper = BizBuySellScraper()
    scraper.run()
