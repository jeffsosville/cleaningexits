import os
import json
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import requests  # Use standard requests instead of curl_cffi
from colorama import init
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from supabase import create_client, Client
import logging
import time
import random

# Initialize colorama
init(autoreset=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self, supabase_url: str, supabase_key: str):
        try:
            self.client: Client = create_client(supabase_url, supabase_key)
            logger.info("Supabase client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            raise

    def safe_int(self, value: Any) -> Optional[int]:
        if value is None or value == '' or value == 'None':
            return None
        try:
            if isinstance(value, int):
                return value
            if isinstance(value, float):
                return int(value)
            if isinstance(value, str):
                value = value.strip()
                if not value or value.lower() in ['null', 'none', 'nan']:
                    return None
                return int(float(value))
            return int(float(str(value)))
        except (ValueError, TypeError, OverflowError):
            return None

    def safe_float(self, value: Any) -> Optional[float]:
        if value is None or value == '' or value == 'None':
            return None
        try:
            if isinstance(value, (int, float)):
                return float(value)
            if isinstance(value, str):
                value = value.strip()
                if not value or value.lower() in ['null', 'none', 'nan']:
                    return None
                return float(value)
            return float(str(value))
        except (ValueError, TypeError, OverflowError):
            return None

    def safe_str(self, value: Any) -> Optional[str]:
        if value is None:
            return None
        if isinstance(value, (dict, list)):
            return json.dumps(value)
        str_val = str(value).strip()
        return str_val if str_val else None

    def transform_listing(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        list_number = self.safe_int(listing.get('listNumber'))
        url_stub = self.safe_str(listing.get('urlStub'))
        surrogate_key = hashlib.md5(f"{list_number}_{url_stub}".encode()).hexdigest()
        
        transformed = {
            'header': self.safe_str(listing.get('header')),
            'location': self.safe_str(listing.get('location')),
            'locationCrumbs': self.safe_str(listing.get('locationCrumbs')),
            'price': self.safe_float(listing.get('price')),
            'description': self.safe_str(listing.get('description')),
            'type': self.safe_int(listing.get('type')),
            'img': self.safe_str(listing.get('img')),
            'listNumber': self.safe_int(listing.get('listNumber')),
            'specificId': self.safe_int(listing.get('specificId')),
            'urlStub': self.safe_str(listing.get('urlStub')),
            'cashFlow': self.safe_str(listing.get('cashFlow')),
            'listingTypeId': self.safe_int(listing.get('listingTypeId')),
            'ebitda': self.safe_str(listing.get('ebitda')),
            'financingTypeId': self.safe_str(listing.get('financingTypeId')),
            'leaseRateDuration': self.safe_str(listing.get('leaseRateDuration')),
            'leaseRatePerSquareFoot': self.safe_str(listing.get('leaseRatePerSquareFoot')),
            'searchOffset': self.safe_int(listing.get('searchOffset')),
            'adLevelId': self.safe_int(listing.get('adLevelId')),
            'siteSpecificId': self.safe_int(listing.get('siteSpecificId')),
            'isDiamondReinforcement': self.safe_str(listing.get('isDiamondReinforcement')),
            'brokerCompany': self.safe_str(listing.get('brokerCompany')),
            'brokerIntroduction': self.safe_str(listing.get('brokerIntroduction')),
            'brokerContactPhoto': self.safe_str(listing.get('brokerContactPhoto')),
            'brokerContactFullName': self.safe_str(listing.get('brokerContactFullName')),
            'isInlineAd': self.safe_str(listing.get('isInlineAd')),
            'listingPriceReduced': self.safe_str(listing.get('listingPriceReduced')),
            'contactInfo': self.safe_str(listing.get('contactInfo')),
            'detailRequests': self.safe_str(listing.get('detailRequests')),
            'diamondMetaData': self.safe_str(listing.get('diamondMetaData')),
            'region': self.safe_str(listing.get('region')),
            'hotProperty': self.safe_str(listing.get('hotProperty')),
            'recentlyUpdated': self.safe_str(listing.get('recentlyUpdated')),
            'recentlyAdded': self.safe_str(listing.get('recentlyAdded')),
            'isInlineBroker': self.safe_str(listing.get('isInlineBroker')),
            'brokerCompanyPhoto': self.safe_str(listing.get('brokerCompanyPhoto')),
            'brokerCertifications': self.safe_str(listing.get('brokerCertifications')),
            'realEstateIncludedInAskingPrice': self.safe_str(listing.get('realEstateIncludedInAskingPrice')),
            'initialFee': self.safe_str(listing.get('initialFee')),
            'initialCapital': self.safe_str(listing.get('initialCapital')),
            'externalUrl': self.safe_str(listing.get('externalUrl')),
            'auctionStartDate': self.safe_str(listing.get('auctionStartDate')),
            'auctionEndDate': self.safe_str(listing.get('auctionEndDate')),
            'auctionDateDisplay': self.safe_str(listing.get('auctionDateDisplay')),
            'auctionPlacardHighlights': self.safe_str(listing.get('auctionPlacardHighlights')),
            'account': self.safe_str(listing.get('account')),
            'activeListingsCount': self.safe_str(listing.get('activeListingsCount')),
            'soldListingsCount': self.safe_str(listing.get('soldListingsCount')),
            'isFdResale': self.safe_str(listing.get('isFdResale')),
            'userTypeId': self.safe_str(listing.get('userTypeId')),
            'relatedSearchUrlStub': self.safe_str(listing.get('relatedSearchUrlStub')),
            'expirationTypeId': self.safe_str(listing.get('expirationTypeId')),
            'advertiserId': self.safe_str(listing.get('advertiserId')),
            'placementTypeId': self.safe_str(listing.get('placementTypeId')),
            'sponsorLevelId': self.safe_str(listing.get('sponsorLevelId')),
            'categoryDetails': self.safe_str(listing.get('categoryDetails')),
            'scraped_at': datetime.now(timezone.utc).isoformat(),
            'surrogate_key': surrogate_key
        }

        # Add flattened nested fields
        contact_info = listing.get('contactInfo', {}) or {}
        if isinstance(contact_info, dict):
            transformed['contactInfo.contactInfoPersonId'] = self.safe_str(contact_info.get('contactInfoPersonId'))
            transformed['contactInfo.contactFullName'] = self.safe_str(contact_info.get('contactFullName'))
            phone_info = contact_info.get('contactPhoneNumber', {}) or {}
            if isinstance(phone_info, dict):
                transformed['contactInfo.contactPhoneNumber.telephone'] = self.safe_str(phone_info.get('telephone'))
                transformed['contactInfo.contactPhoneNumber.tpnPhone'] = self.safe_str(phone_info.get('tpnPhone'))
                transformed['contactInfo.contactPhoneNumber.tpnPhoneExt'] = self.safe_str(phone_info.get('tpnPhoneExt'))
            transformed['contactInfo.contactPhoto'] = self.safe_str(contact_info.get('contactPhoto'))
            transformed['contactInfo.brokerCompany'] = self.safe_str(contact_info.get('brokerCompany'))
            transformed['contactInfo.brokerProfileUrl'] = self.safe_str(contact_info.get('brokerProfileUrl'))

        detail_requests = listing.get('detailRequests', {}) or {}
        if isinstance(detail_requests, dict):
            transformed['detailRequests.requestContactAvailableFunds'] = self.safe_str(detail_requests.get('requestContactAvailableFunds'))
            transformed['detailRequests.requestContactZip'] = self.safe_str(detail_requests.get('requestContactZip'))
            transformed['detailRequests.requestContactTimeFrame'] = self.safe_str(detail_requests.get('requestContactTimeFrame'))

        diamond_meta = listing.get('diamondMetaData', {}) or {}
        if isinstance(diamond_meta, dict):
            transformed['diamondMetaData.bbsListNumber'] = self.safe_str(diamond_meta.get('bbsListNumber'))
            transformed['diamondMetaData.headline'] = self.safe_str(diamond_meta.get('headline'))
            transformed['diamondMetaData.askingPrice'] = self.safe_str(diamond_meta.get('askingPrice'))
            transformed['diamondMetaData.adLevel'] = self.safe_str(diamond_meta.get('adLevel'))
            transformed['diamondMetaData.bbsPrimaryBizTypeId'] = self.safe_str(diamond_meta.get('bbsPrimaryBizTypeId'))
            transformed['diamondMetaData.checkboxAdTagline'] = self.safe_str(diamond_meta.get('checkboxAdTagline'))
            transformed['diamondMetaData.bqPrimaryBizTypeId'] = self.safe_str(diamond_meta.get('bqPrimaryBizTypeId'))
            transformed['diamondMetaData.bqListNumber'] = self.safe_str(diamond_meta.get('bqListNumber'))
            transformed['diamondMetaData.bqPrimaryBizTypeName'] = self.safe_str(diamond_meta.get('bqPrimaryBizTypeName'))
            transformed['diamondMetaData.bbsPrimaryBizTypeName'] = self.safe_str(diamond_meta.get('bbsPrimaryBizTypeName'))
            transformed['diamondMetaData.location'] = self.safe_str(diamond_meta.get('location'))
            transformed['diamondMetaData.locationSt'] = self.safe_str(diamond_meta.get('locationSt'))
            transformed['diamondMetaData.regionId'] = self.safe_str(diamond_meta.get('regionId'))

        return transformed

    def insert_listings(self, listings: List[Dict[str, Any]]) -> bool:
        if not listings:
            logger.warning("No listings to insert")
            return True
        
        # Deduplicate by surrogate_key in this batch
        unique_listings = {}
        for listing in listings:
            transformed = self.transform_listing(listing)
            surrogate_key = transformed.get('surrogate_key')
            if surrogate_key:
                unique_listings[surrogate_key] = transformed
        
        logger.info(f"Deduplicated {len(listings)} to {len(unique_listings)} unique listings")
        
        total_inserted = 0
        total_skipped = 0
        
        for i, transformed in enumerate(unique_listings.values()):
            try:
                self.client.table('daily_listings').insert([transformed]).execute()
                total_inserted += 1
                
                if (i + 1) % 50 == 0:
                    logger.info(f"Progress: {i + 1}/{len(unique_listings)} processed")
                    
            except Exception as e:
                # Skip any duplicate or error
                total_skipped += 1
                continue
        
        logger.info(f"Insert complete: {total_inserted} new, {total_skipped} skipped")
        return total_inserted > 0

class BizBuySellScraper:
    def __init__(self):
        # Use standard requests with session pooling
        self.session = requests.Session()
        
        # More conservative headers to avoid detection
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
        })
        
        self.token = None
        self.get_auth_token()

    def get_auth_token(self):
        logger.info("Obtaining authentication token...")
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                # Add random delay to avoid rate limiting
                if attempt > 0:
                    delay = random.uniform(2, 5)
                    logger.info(f"Retry {attempt + 1}/{max_retries} after {delay:.1f}s delay")
                    time.sleep(delay)
                
                response = self.session.get(
                    'https://www.bizbuysell.com/businesses-for-sale/new-york-ny/',
                    timeout=30,
                    allow_redirects=True
                )
                
                response.raise_for_status()
                
                # Look for token in cookies
                possible_tokens = ['_track_tkn', 'track_tkn', 'auth_token', 'token']
                for token_name in possible_tokens:
                    token = self.session.cookies.get(token_name)
                    if token:
                        self.token = token
                        logger.info(f"Authentication token obtained: {token[:20]}...")
                        return
                
                # Look for token in page content
                if '_track_tkn' in response.text:
                    import re
                    token_match = re.search(r'_track_tkn["\']?\s*[:=]\s*["\']?([^"\';\s]+)', response.text)
                    if token_match:
                        self.token = token_match.group(1)
                        logger.info(f"Token extracted from page: {self.token[:20]}...")
                        return
                
                logger.warning(f"No token found in attempt {attempt + 1}")
                
            except Exception as e:
                logger.error(f"Error getting token (attempt {attempt + 1}): {e}")
                if attempt == max_retries - 1:
                    logger.error("All token attempts failed")

    def test_api(self):
        if not self.token:
            return False
        
        # Update headers for API calls
        api_headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://www.bizbuysell.com',
            'Referer': 'https://www.bizbuysell.com/',
        }
        
        test_payload = {
            "bfsSearchCriteria": {
                "siteId": 20,
                "languageId": 10,
                "pageNumber": 1,
                "daysListedAgo": 1
            }
        }
        
        try:
            response = self.session.post(
                'https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults',
                headers=api_headers,
                json=test_payload,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info("API test successful")
                return True
            else:
                logger.error(f"API test failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"API test error: {e}")
            return False

    def scrape_listings(self, max_pages=100, workers=5):  # Reduced workers to be more conservative
        if not self.token:
            logger.error("No authentication token available")
            return []

        if not self.test_api():
            logger.error("API test failed")
            return []

        logger.info(f"Starting to scrape {max_pages} pages with {workers} workers")

        # API headers
        api_headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://www.bizbuysell.com',
            'Referer': 'https://www.bizbuysell.com/',
        }

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
                "daysListedAgo": 1,
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
            payload = json.loads(json.dumps(payload_template))
            payload["bfsSearchCriteria"]["pageNumber"] = page_number
            
            # Add small random delay to avoid overwhelming the server
            time.sleep(random.uniform(0.1, 0.5))
            
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
                    new_listings = []
                    with lock:
                        for listing in listings:
                            listing_id = f"{listing.get('urlStub')}--{listing.get('header')}"
                            if listing_id and listing_id not in listing_ids:
                                listing_ids.add(listing_id)
                                new_listings.append(listing)
                    if new_listings:
                        logger.info(f"Page {page_number}: {len(new_listings)} new listings")
                    return new_listings
                else:
                    logger.warning(f"Page {page_number} failed: {response.status_code}")
            except Exception as e:
                logger.error(f"Error fetching page {page_number}: {e}")
            return []

        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(fetch_page, page) for page in range(1, max_pages + 1)]
            for future in as_completed(futures):
                page_listings = future.result()
                if page_listings:
                    all_listings.extend(page_listings)

        logger.info(f"Scraping complete: {len(all_listings)} unique listings")
        return all_listings

class DailyScrapeAutomator:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.scraper = BizBuySellScraper()
        self.db = DatabaseManager(supabase_url, supabase_key)
    
    def run_daily_scrape(self, max_pages: int = 500, workers: int = 5, save_json: bool = True):
        start_time = datetime.now()
        logger.info(f"Starting daily scrape at {start_time}")
        
        try:
            listings = self.scraper.scrape_listings(max_pages=max_pages, workers=workers)
            
            if not listings:
                logger.warning("No listings found during scraping")
                return False
            
            if save_json:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"bizbuysell_listings_{timestamp}.json"
                try:
                    with open(filename, 'w', encoding='utf-8') as f:
                        json.dump(listings, f, indent=4)
                    logger.info(f"Results saved to {filename}")
                except Exception as e:
                    logger.error(f"Error saving JSON: {e}")
            
            success = self.db.insert_listings(listings)
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            if success:
                logger.info(f"Daily scrape completed successfully in {duration}")
                logger.info(f"Processed {len(listings)} listings")
                return True
            else:
                logger.error("Daily scrape failed during database insertion")
                return False
                
        except Exception as e:
            logger.error(f"Error in daily scrape process: {e}")
            return False

def main():
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    max_pages = int(os.getenv('MAX_PAGES', '500'))
    workers = int(os.getenv('WORKERS', '5'))  # Reduced default workers
    
    if not supabase_url or not supabase_key:
        logger.error("Missing required environment variables: SUPABASE_URL and SUPABASE_KEY")
        return
    
    logger.info(f"Configuration: MAX_PAGES={max_pages}, WORKERS={workers}")
    
    try:
        automator = DailyScrapeAutomator(supabase_url, supabase_key)
        success = automator.run_daily_scrape(
            max_pages=max_pages,
            workers=workers,
            save_json=True
        )
        
        if success:
            logger.info("Daily automation completed successfully!")
        else:
            logger.error("Daily automation failed!")
            exit(1)
            
    except Exception as e:
        logger.error(f"Fatal error in main: {e}")
        exit(1)

if __name__ == "__main__":
    main()
