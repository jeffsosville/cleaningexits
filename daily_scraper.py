import os
import json
import time
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from curl_cffi import requests
from colorama import Fore, Style, init
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from supabase import create_client, Client
import logging

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
        """Initialize Supabase client"""
        try:
            self.client: Client = create_client(supabase_url, supabase_key)
            logger.info("✅ Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Supabase client: {e}")
            raise

    def flatten_nested_dict(self, data: Dict[str, Any], parent_key: str = '', separator: str = '.') -> Dict[str, Any]:
        """Flatten nested dictionary structures"""
        items = []
        for k, v in data.items():
            new_key = f"{parent_key}{separator}{k}" if parent_key else k
            if isinstance(v, dict) and v:  # Only flatten non-empty dicts
                items.extend(self.flatten_nested_dict(v, new_key, separator=separator).items())
            else:
                items.append((new_key, v))
        return dict(items)

    def transform_listing(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        """Transform raw listing data to match database schema"""
        # Flatten the listing data
        flattened = self.flatten_nested_dict(listing)
        
        # Create surrogate key from listNumber and urlStub
        list_number = listing.get('listNumber', '')
        url_stub = listing.get('urlStub', '')
        surrogate_key = hashlib.md5(f"{list_number}_{url_stub}".encode()).hexdigest()
        
        # Map the flattened data to database columns
        transformed = {
            'header': listing.get('header'),
            'location': listing.get('location'),
            'locationCrumbs': listing.get('locationCrumbs'),
            'price': listing.get('price'),
            'description': listing.get('description'),
            'type': listing.get('type'),
            'img': listing.get('img'),
            'listNumber': listing.get('listNumber'),
            'specificId': listing.get('specificId'),
            'urlStub': listing.get('urlStub'),
            'cashFlow': listing.get('cashFlow'),
            'listingTypeId': listing.get('listingTypeId'),
            'ebitda': listing.get('ebitda'),
            'financingTypeId': listing.get('financingTypeId'),
            'leaseRateDuration': listing.get('leaseRateDuration'),
            'leaseRatePerSquareFoot': listing.get('leaseRatePerSquareFoot'),
            'searchOffset': listing.get('searchOffset'),
            'adLevelId': listing.get('adLevelId'),
            'siteSpecificId': listing.get('siteSpecificId'),
            'isDiamondReinforcement': str(listing.get('isDiamondReinforcement')) if listing.get('isDiamondReinforcement') is not None else None,
            'brokerCompany': listing.get('brokerCompany'),
            'brokerIntroduction': listing.get('brokerIntroduction'),
            'brokerContactPhoto': listing.get('brokerContactPhoto'),
            'brokerContactFullName': listing.get('brokerContactFullName'),
            'isInlineAd': str(listing.get('isInlineAd')) if listing.get('isInlineAd') is not None else None,
            'listingPriceReduced': str(listing.get('listingPriceReduced')) if listing.get('listingPriceReduced') is not None else None,
            'contactInfo': json.dumps(listing.get('contactInfo')) if listing.get('contactInfo') else None,
            'detailRequests': json.dumps(listing.get('detailRequests')) if listing.get('detailRequests') else None,
            'diamondMetaData': json.dumps(listing.get('diamondMetaData')) if listing.get('diamondMetaData') else None,
            'region': listing.get('region'),
            'hotProperty': str(listing.get('hotProperty')) if listing.get('hotProperty') is not None else None,
            'recentlyUpdated': str(listing.get('recentlyUpdated')) if listing.get('recentlyUpdated') is not None else None,
            'recentlyAdded': str(listing.get('recentlyAdded')) if listing.get('recentlyAdded') is not None else None,
            'isInlineBroker': str(listing.get('isInlineBroker')) if listing.get('isInlineBroker') is not None else None,
            'brokerCompanyPhoto': listing.get('brokerCompanyPhoto'),
            'brokerCertifications': listing.get('brokerCertifications'),
            'realEstateIncludedInAskingPrice': str(listing.get('realEstateIncludedInAskingPrice')) if listing.get('realEstateIncludedInAskingPrice') is not None else None,
            'initialFee': listing.get('initialFee'),
            'initialCapital': listing.get('initialCapital'),
            'externalUrl': listing.get('externalUrl'),
            'auctionStartDate': listing.get('auctionStartDate'),
            'auctionEndDate': listing.get('auctionEndDate'),
            'auctionDateDisplay': listing.get('auctionDateDisplay'),
            'auctionPlacardHighlights': listing.get('auctionPlacardHighlights'),
            'account': listing.get('account'),
            'activeListingsCount': str(listing.get('activeListingsCount')) if listing.get('activeListingsCount') is not None else None,
            'soldListingsCount': str(listing.get('soldListingsCount')) if listing.get('soldListingsCount') is not None else None,
            'isFdResale': str(listing.get('isFdResale')) if listing.get('isFdResale') is not None else None,
            'userTypeId': str(listing.get('userTypeId')) if listing.get('userTypeId') is not None else None,
            'relatedSearchUrlStub': listing.get('relatedSearchUrlStub'),
            'expirationTypeId': str(listing.get('expirationTypeId')) if listing.get('expirationTypeId') is not None else None,
            'advertiserId': str(listing.get('advertiserId')) if listing.get('advertiserId') is not None else None,
            'placementTypeId': str(listing.get('placementTypeId')) if listing.get('placementTypeId') is not None else None,
            'sponsorLevelId': str(listing.get('sponsorLevelId')) if listing.get('sponsorLevelId') is not None else None,
            'categoryDetails': json.dumps(listing.get('categoryDetails')) if listing.get('categoryDetails') else None,
            'scraped_at': datetime.now(timezone.utc).isoformat(),
            'surrogate_key': surrogate_key
        }

        # Add flattened nested fields
        contact_info = listing.get('contactInfo', {})
        if contact_info:
            transformed['contactInfo.contactInfoPersonId'] = str(contact_info.get('contactInfoPersonId')) if contact_info.get('contactInfoPersonId') is not None else None
            transformed['contactInfo.contactFullName'] = contact_info.get('contactFullName')
            phone_info = contact_info.get('contactPhoneNumber', {})
            if phone_info:
                transformed['contactInfo.contactPhoneNumber.telephone'] = phone_info.get('telephone')
                transformed['contactInfo.contactPhoneNumber.tpnPhone'] = phone_info.get('tpnPhone')
                transformed['contactInfo.contactPhoneNumber.tpnPhoneExt'] = phone_info.get('tpnPhoneExt')
            transformed['contactInfo.contactPhoto'] = contact_info.get('contactPhoto')
            transformed['contactInfo.brokerCompany'] = contact_info.get('brokerCompany')
            transformed['contactInfo.brokerProfileUrl'] = contact_info.get('brokerProfileUrl')

        detail_requests = listing.get('detailRequests', {})
        if detail_requests:
            transformed['detailRequests.requestContactAvailableFunds'] = str(detail_requests.get('requestContactAvailableFunds')) if detail_requests.get('requestContactAvailableFunds') is not None else None
            transformed['detailRequests.requestContactZip'] = detail_requests.get('requestContactZip')
            transformed['detailRequests.requestContactTimeFrame'] = str(detail_requests.get('requestContactTimeFrame')) if detail_requests.get('requestContactTimeFrame') is not None else None

        diamond_meta = listing.get('diamondMetaData', {})
        if diamond_meta:
            transformed['diamondMetaData.bbsListNumber'] = str(diamond_meta.get('bbsListNumber')) if diamond_meta.get('bbsListNumber') is not None else None
            transformed['diamondMetaData.headline'] = diamond_meta.get('headline')
            transformed['diamondMetaData.askingPrice'] = str(diamond_meta.get('askingPrice')) if diamond_meta.get('askingPrice') is not None else None
            transformed['diamondMetaData.adLevel'] = str(diamond_meta.get('adLevel')) if diamond_meta.get('adLevel') is not None else None
            transformed['diamondMetaData.bbsPrimaryBizTypeId'] = str(diamond_meta.get('bbsPrimaryBizTypeId')) if diamond_meta.get('bbsPrimaryBizTypeId') is not None else None
            transformed['diamondMetaData.checkboxAdTagline'] = diamond_meta.get('checkboxAdTagline')
            transformed['diamondMetaData.bqPrimaryBizTypeId'] = str(diamond_meta.get('bqPrimaryBizTypeId')) if diamond_meta.get('bqPrimaryBizTypeId') is not None else None
            transformed['diamondMetaData.bqListNumber'] = str(diamond_meta.get('bqListNumber')) if diamond_meta.get('bqListNumber') is not None else None
            transformed['diamondMetaData.bqPrimaryBizTypeName'] = diamond_meta.get('bqPrimaryBizTypeName')
            transformed['diamondMetaData.bbsPrimaryBizTypeName'] = diamond_meta.get('bbsPrimaryBizTypeName')
            transformed['diamondMetaData.location'] = diamond_meta.get('location')
            transformed['diamondMetaData.locationSt'] = diamond_meta.get('locationSt')
            transformed['diamondMetaData.regionId'] = str(diamond_meta.get('regionId')) if diamond_meta.get('regionId') is not None else None

        return transformed

    def upsert_listings(self, listings: List[Dict[str, Any]]) -> bool:
        """Insert or update listings in the database"""
        if not listings:
            logger.warning("No listings to insert")
            return True

        try:
            # Transform listings
            transformed_listings = []
            for listing in listings:
                try:
                    transformed = self.transform_listing(listing)
                    transformed_listings.append(transformed)
                except Exception as e:
                    logger.error(f"Error transforming listing {listing.get('listNumber', 'Unknown')}: {e}")
                    continue

            if not transformed_listings:
                logger.warning("No valid listings after transformation")
                return True

            # Batch upsert
            batch_size = 100
            total_inserted = 0
            
            for i in range(0, len(transformed_listings), batch_size):
                batch = transformed_listings[i:i + batch_size]
                try:
                    result = self.client.table('daily_listings').upsert(
                        batch,
                        on_conflict='surrogate_key'
                    ).execute()
                    
                    total_inserted += len(batch)
                    logger.info(f"✅ Upserted batch of {len(batch)} listings (Total: {total_inserted}/{len(transformed_listings)})")
                    
                except Exception as e:
                    logger.error(f"❌ Error upserting batch {i//batch_size + 1}: {e}")
                    continue

            logger.info(f"🎉 Successfully processed {total_inserted} listings")
            return True

        except Exception as e:
            logger.error(f"❌ Error in upsert_listings: {e}")
            return False

    def get_recent_listings_count(self, hours: int = 24) -> int:
        """Get count of listings scraped in the last N hours"""
        try:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            result = self.client.table('daily_listings').select('listNumber', count='exact').gte('scraped_at', cutoff_time.isoformat()).execute()
            return result.count or 0
        except Exception as e:
            logger.error(f"Error getting recent listings count: {e}")
            return 0

class BizBuySellScraper:
    def __init__(self):
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
            'X-Correlation-Id': 'b5492b02-712f-4ee8-be99-cc27c8668908'
        }
        self.token = None
        self.get_auth_token()

    def get_auth_token(self):
        logger.info("🔑 Obtaining authentication token...")
        try:
            response = self.session.get(
                'https://www.bizbuysell.com/businesses-for-sale/new-york-ny/',
                headers=self.headers
            )
            cookies = response.cookies
            self.token = cookies.get('_track_tkn')
            if self.token:
                logger.info("✅ Authentication token obtained successfully")
            else:
                logger.error("❌ Failed to get authentication token")
        except Exception as e:
            logger.error(f"❌ Error obtaining token: {str(e)}")

    def scrape_listings(self, max_pages=100, workers=10):
        if not self.token:
            logger.error("❌ No authentication token available. Cannot proceed.")
            return []

        logger.info(f"🚀 Starting to scrape listings with {workers} workers...")

        api_headers = self.headers.copy()
        api_headers['Authorization'] = f'Bearer {self.token}'

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
                    if new_listings:
                        logger.info(f"📄 Page {page_number}: Found {len(new_listings)} new listings")
                    return new_listings
                else:
                    logger.warning(f"⚠️ Failed to get data for page {page_number}. Status code: {response.status_code}")
            except Exception as e:
                logger.error(f"❌ Error fetching page {page_number}: {str(e)}")
            return []

        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(fetch_page, page) for page in range(1, max_pages + 1)]
            for future in as_completed(futures):
                page_listings = future.result()
                if page_listings:
                    all_listings.extend(page_listings)

        logger.info(f"🎉 Scraping complete! Total unique listings scraped: {len(all_listings)}")
        return all_listings

class DailyScrapeAutomator:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.scraper = BizBuySellScraper()
        self.db = DatabaseManager(supabase_url, supabase_key)
    
    def run_daily_scrape(self, max_pages: int = 500, workers: int = 10, save_json: bool = True):
        """Run the complete daily scraping process"""
        start_time = datetime.now()
        logger.info(f"🚀 Starting daily scrape at {start_time}")
        
        try:
            # Scrape listings
            listings = self.scraper.scrape_listings(max_pages=max_pages, workers=workers)
            
            if not listings:
                logger.warning("⚠️ No listings found during scraping")
                return False
            
            # Save to JSON if requested
            if save_json:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"bizbuysell_listings_{timestamp}.json"
                try:
                    with open(filename, 'w', encoding='utf-8') as f:
                        json.dump(listings, f, indent=4)
                    logger.info(f"💾 Results saved to {filename}")
                except Exception as e:
                    logger.error(f"❌ Error saving JSON: {e}")
            
            # Insert into database
            success = self.db.upsert_listings(listings)
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            if success:
                logger.info(f"✅ Daily scrape completed successfully in {duration}")
                logger.info(f"📊 Processed {len(listings)} listings")
                return True
            else:
                logger.error(f"❌ Daily scrape failed during database insertion")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error in daily scrape process: {e}")
            return False

def main():
    # Get environment variables
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    
    if not supabase_url or not supabase_key:
        logger.error("❌ Missing required environment variables: SUPABASE_URL and SUPABASE_KEY")
        return
    
    # Create automator and run daily scrape
    automator = DailyScrapeAutomator(supabase_url, supabase_key)
    success = automator.run_daily_scrape(
        max_pages=500,
        workers=10,
        save_json=True
    )
    
    if success:
        logger.info("🎉 Daily automation completed successfully!")
    else:
        logger.error("💥 Daily automation failed!")

if __name__ == "__main__":
    main()
