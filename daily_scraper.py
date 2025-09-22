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

    def safe_int(self, value: Any) -> Optional[int]:
        """Safely convert value to integer, handling decimals and None"""
        if value is None or value == '' or value == 'None':
            return None
        try:
            # Handle different input types
            if isinstance(value, int):
                return value
            if isinstance(value, float):
                return int(value)
            if isinstance(value, str):
                # Remove any whitespace and check for empty
                value = value.strip()
                if not value or value.lower() in ['null', 'none', 'nan']:
                    return None
                # Convert string to float first, then int
                return int(float(value))
            # For any other type, try string conversion
            return int(float(str(value)))
        except (ValueError, TypeError, OverflowError):
            logger.debug(f"Could not convert '{value}' (type: {type(value)}) to int")
            return None

    def safe_float(self, value: Any) -> Optional[float]:
        """Safely convert value to float"""
        if value is None or value == '':
            return None
        try:
            return float(str(value))
        except (ValueError, TypeError):
            logger.debug(f"Could not convert '{value}' to float")
            return None

    def safe_str(self, value: Any) -> Optional[str]:
        """Safely convert value to string"""
        if value is None:
            return None
        if isinstance(value, (dict, list)):
            return json.dumps(value)
        str_val = str(value).strip()
        return str_val if str_val else None

    def transform_listing(self, listing: Dict[str, Any]) -> Dict[str, Any]:
        """Transform raw listing data to match database schema with proper data types"""
        # Create surrogate key from listNumber and urlStub
        list_number = self.safe_int(listing.get('listNumber'))
        url_stub = self.safe_str(listing.get('urlStub'))
        surrogate_key = hashlib.md5(f"{list_number}_{url_stub}".encode()).hexdigest()
        
        # Map the data with proper type conversion
        transformed = {
            'header': self.safe_str(listing.get('header')),
            'location': self.safe_str(listing.get('location')),
            'locationCrumbs': self.safe_str(listing.get('locationCrumbs')),
            'price': self.safe_int(listing.get('price')),
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
            'ingested_at': datetime.now(timezone.utc).isoformat(),
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

    def clean_data_types(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Aggressively clean data types to ensure proper types before database insertion"""
        cleaned = {}
        
        # Define which fields should be integers
        integer_fields = {
            'price', 'listNumber', 'specificId', 'type', 'searchOffset', 
            'adLevelId', 'siteSpecificId', 'listingTypeId'
        }
        
        for key, value in data.items():
            if key in integer_fields:
                # Force integer conversion
                cleaned_value = self.safe_int(value)
                if cleaned_value is not None:
                    # Double-check it's actually an int
                    if not isinstance(cleaned_value, int):
                        logger.error(f"CRITICAL: {key} is not int after conversion: {cleaned_value} ({type(cleaned_value)})")
                        cleaned_value = int(cleaned_value) if cleaned_value is not None else None
                cleaned[key] = cleaned_value
            else:
                cleaned[key] = value
                
        return cleaned

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
                    
                    # Extra validation and type forcing
                    integer_fields = ['price', 'listNumber', 'specificId', 'type', 'searchOffset', 'adLevelId', 'siteSpecificId', 'listingTypeId']
                    for field in integer_fields:
                        value = transformed.get(field)
                        if value is not None:
                            if not isinstance(value, int):
                                logger.error(f"❌ Field '{field}' should be int but got {type(value)}: {value}")
                                # Force conversion one more time
                                try:
                                    if isinstance(value, str) and '.' in value:
                                        transformed[field] = int(float(value))
                                    else:
                                        transformed[field] = int(value)
                                    logger.info(f"✅ Fixed {field}: {transformed[field]} ({type(transformed[field])})")
                                except:
                                    transformed[field] = None
                                    logger.warning(f"⚠️ Could not fix {field}, setting to None")
                            
                            # Final verification
                            final_value = transformed[field]
                            if final_value is not None and not isinstance(final_value, int):
                                logger.error(f"🚨 CRITICAL: {field} still not int: {final_value} ({type(final_value)})")
                    
                    transformed_listings.append(transformed)
                except Exception as e:
                    logger.error(f"Error transforming listing {listing.get('listNumber', 'Unknown')}: {e}")
                    import traceback
                    traceback.print_exc()
                    continue

            if not transformed_listings:
                logger.warning("No valid listings after transformation")
                return True

            # Batch upsert with better error handling
            batch_size = 50  # Reduced batch size for easier debugging
            total_inserted = 0
            
            for i in range(0, len(transformed_listings), batch_size):
                batch = transformed_listings[i:i + batch_size]
                try:
                    # Nuclear option: manually convert all integer fields right before insert
                    cleaned_batch = []
                    for record in batch:
                        cleaned_record = record.copy()
                        
                        # Force these fields to be actual Python int objects
                        int_fields = ['price', 'listNumber', 'specificId', 'type', 'searchOffset', 'adLevelId', 'siteSpecificId', 'listingTypeId']
                        for field in int_fields:
                            value = cleaned_record.get(field)
                            if value is not None:
                                if isinstance(value, str):
                                    try:
                                        # Remove any decimal points and convert
                                        if '.' in value:
                                            cleaned_record[field] = int(float(value))
                                        else:
                                            cleaned_record[field] = int(value)
                                    except:
                                        cleaned_record[field] = None
                                elif isinstance(value, float):
                                    cleaned_record[field] = int(value)
                                elif not isinstance(value, int):
                                    try:
                                        cleaned_record[field] = int(value)
                                    except:
                                        cleaned_record[field] = None
                        
                        cleaned_batch.append(cleaned_record)
                    
                    # Final verification
                    for record in cleaned_batch:
                        for key, value in record.items():
                            if key in ['price', 'listNumber', 'specificId', 'type', 'searchOffset', 'adLevelId', 'siteSpecificId', 'listingTypeId']:
                                if value is not None and not isinstance(value, int):
                                    logger.error(f"🔥 FINAL CHECK FAILED: {key} = {value} ({type(value)})")
                    
                    result = self.client.table('daily_listings').upsert(
                        cleaned_batch,
                        on_conflict='surrogate_key'
                    ).execute()
                    
                    total_inserted += len(batch)
                    logger.info(f"✅ Upserted batch of {len(batch)} listings (Total: {total_inserted}/{len(transformed_listings)})")
                    
                except Exception as e:
                    logger.error(f"❌ Error upserting batch {i//batch_size + 1}: {e}")
                    
                    # Debug the problematic batch
                    logger.error(f"Debugging batch with {len(batch)} records...")
                    for idx, record in enumerate(batch[:2]):  # Check first 2 records
                        logger.error(f"Record {idx} types:")
                        integer_fields = ['price', 'listNumber', 'specificId', 'type', 'searchOffset', 'adLevelId', 'siteSpecificId', 'listingTypeId']
                        for field in integer_fields:
                            value = record.get(field)
                            logger.error(f"  {field}: {value} ({type(value)})")
                    continue

            logger.info(f"🎉 Successfully processed {total_inserted} listings")
            return total_inserted > 0

        except Exception as e:
            logger.error(f"❌ Error in upsert_listings: {e}")
            import traceback
            traceback.print_exc()
            return False

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
            # Try multiple approaches to get the token
            response = self.session.get(
                'https://www.bizbuysell.com/businesses-for-sale/new-york-ny/',
                headers=self.headers
            )
            
            # Debug response
            logger.info(f"Response status: {response.status_code}")
            logger.debug(f"Response cookies: {dict(response.cookies)}")
            
            # Try different token names
            possible_tokens = ['_track_tkn', 'track_tkn', 'auth_token', 'token']
            for token_name in possible_tokens:
                token = response.cookies.get(token_name)
                if token:
                    self.token = token
                    logger.info(f"✅ Found token '{token_name}': {token[:20]}...")
                    return
            
            # Try to extract from page content
            if '_track_tkn' in response.text:
                import re
                token_match = re.search(r'_track_tkn["\']?\s*[:=]\s*["\']?([^"\';\s]+)', response.text)
                if token_match:
                    self.token = token_match.group(1)
                    logger.info(f"✅ Extracted token from page content: {self.token[:20]}...")
                    return
            
            logger.error("❌ No authentication token found")
            
        except Exception as e:
            logger.error(f"❌ Error obtaining token: {str(e)}")
            import traceback
            traceback.print_exc()

    def test_api_endpoint(self):
        """Test if the API endpoint is working"""
        if not self.token:
            logger.error("No token available for testing")
            return False
        
        api_headers = self.headers.copy()
        api_headers['Authorization'] = f'Bearer {self.token}'
        
        # Simple test payload
        test_payload = {
            "bfsSearchCriteria": {
                "siteId": 20,
                "languageId": 10,
                "pageNumber": 1,
                "daysListedAgo": 1
            }
        }
        
        try:
            logger.info("🧪 Testing API endpoint...")
            response = self.session.post(
                'https://api.bizbuysell.com/bff/v2/BbsBfsSearchResults',
                headers=api_headers,
                json=test_payload,
                timeout=30
            )
            
            logger.info(f"Test response status: {response.status_code}")
            logger.debug(f"Test response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info("✅ API test successful!")
                logger.info(f"Response structure: {list(data.keys()) if isinstance(data, dict) else type(data)}")
                return True
            else:
                logger.error(f"❌ API test failed. Status: {response.status_code}")
                logger.error(f"Response text: {response.text[:500]}")
                return False
                
        except Exception as e:
            logger.error(f"❌ API test error: {e}")
            import traceback
            traceback.print_exc()
            return False

    def scrape_listings(self, max_pages=100, workers=10):
        if not self.token:
            logger.error("❌ No authentication token available. Cannot proceed.")
            return []

        # Test API first
        if not self.test_api_endpoint():
            logger.error("❌ API test failed. Aborting scrape.")
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
                        logger.info(f"📄 Page {page_number}: Found {len(new_listings)} new listings")
                    elif page_number <= 10:  # Only log for first 10 pages to avoid spam
                        logger.info(f"📄 Page {page_number}: No new listings found")
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
            import traceback
            traceback.print_exc()
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
