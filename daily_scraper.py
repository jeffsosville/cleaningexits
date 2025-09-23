import os
import json
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from curl_cffi import requests
from colorama import init
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
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
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

        # ... (rest of the fetch_listings method) ...

    # ... (other methods like save_to_supabase, save_to_json, etc. are omitted for brevity as they are unchanged) ...

# Main execution block
if __name__ == "__main__":
    scraper = BizBuySellScraper()
    scraper.run()
