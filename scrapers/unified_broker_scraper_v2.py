"""
Complete Unified Production Scraper V2 - WITH MULTI-TENANT SUPPORT
Combines specialized franchise scrapers (Murphy, Transworld, Sunbelt, VR, FCBB) with ML-based scraping
UPDATED: Multi-tenant vertical support + keyword filtering + tracking tables
"""

import os, re, json, hashlib, asyncio, random, uuid
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse
from collections import defaultdict
from datetime import datetime, timezone

import pandas as pd
from bs4 import BeautifulSoup
from supabase import create_client
from playwright.async_api import async_playwright
from dotenv import load_dotenv
load_dotenv()

# Import specialized scrapers
from specialized_scrapers_integration import scrape_specialized_broker, get_specialized_broker_names


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


# -------------------------
# Enhanced financial extraction patterns
# -------------------------
PRICE_RE = re.compile(r'\$[\d,]+(?:\.\d{2})?', re.I)
REVENUE_PATTERNS = [
    r'revenue[:\s]*\$?([\d,]+)',
    r'gross sales[:\s]*\$?([\d,]+)',
    r'annual sales[:\s]*\$?([\d,]+)',
    r'sales[:\s]*\$?([\d,]+)',
]
CASHFLOW_PATTERNS = [
    r'cash flow[:\s]*\$?([\d,]+)',
    r'net income[:\s]*\$?([\d,]+)',
    r'ebitda[:\s]*\$?([\d,]+)',
    r'sde[:\s]*\$?([\d,]+)',
    r'owner benefit[:\s]*\$?([\d,]+)',
]

RE_REAL_ESTATE = re.compile(r'\bmls\s*#|\bidx\b|\d+\s*bed.*\d+\s*bath', re.I)
BUSINESS_HINTS = [
    'asking price','cash flow','revenue','business for sale','training','turnkey','profitable',
    'route type','financing','route details','distribution','delivery route','route business',
    'gross sales','net income','ebitda','asking','price','business opportunity','owner','operated',
    'franchise','inventory','equipment','lease','real estate included','seller financing',
    'terms available','business type','years in business','employees','customers','clientele',
    'ff&e','fixtures','goodwill','for sale by owner','restaurant','retail','service','manufacturing',
    'wholesale','distribution','franchise opportunity','absentee','semi-absentee','owner-operator'
]

def looks_businessy(text: str) -> bool:
    t = (text or "").lower()
    return any(k in t for k in BUSINESS_HINTS)

def parse_money_value(text: str) -> Optional[float]:
    """Parse $123,456 or 123456 into float"""
    if not text:
        return None
    try:
        cleaned = re.sub(r'[$,]', '', str(text))
        if 'k' in cleaned.lower():
            return float(cleaned.lower().replace('k', '')) * 1000
        if 'm' in cleaned.lower():
            return float(cleaned.lower().replace('m', '')) * 1000000
        return float(cleaned)
    except:
        return None

def extract_city_state(location: str) -> tuple:
    """Extract city and state from location string"""
    if not location:
        return None, None
    m = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b', location)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    state_match = re.search(r'\b([A-Z]{2})\b', location)
    if state_match:
        return None, state_match.group(1)
    return None, None


class PatternDatabase:
    """Stores and retrieves learned patterns in Supabase"""
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.patterns = {}
        self.load()

    def load(self):
        try:
            self._ensure_tables()
            response = self.supabase.table('scraper_patterns').select('*').execute()
            for row in response.data:
                self.patterns[row['domain']] = {
                    'pattern': row['pattern_signature'],
                    'success_count': row['success_count'],
                    'total_listings': row['total_listings'],
                    'first_seen': row['first_seen'],
                    'last_used': row['last_used']
                }
            print(f"Loaded {len(self.patterns)} patterns from Supabase knowledge base")
        except Exception as e:
            print(f"Warning: Could not load patterns from Supabase: {e}")
            print("Continuing without cached patterns...")

    def _ensure_tables(self):
        try:
            self.supabase.table('scraper_patterns').select('domain').limit(1).execute()
        except:
            print("\nNote: scraper_patterns table not found (will continue without pattern caching)")

    def record_success(self, url: str, pattern_signature: str, listings_count: int):
        domain = urlparse(url).netloc.replace('www.', '')
        try:
            self.supabase.table('scraper_patterns').upsert({
                'domain': domain,
                'pattern_signature': pattern_signature,
                'success_count': self.patterns.get(domain, {}).get('success_count', 0) + 1,
                'total_listings': self.patterns.get(domain, {}).get('total_listings', 0) + listings_count,
                'last_used': datetime.now().isoformat()
            }, on_conflict='domain').execute()

            self.supabase.table('scraper_history').insert({
                'domain': domain,
                'pattern_signature': pattern_signature,
                'listings_count': listings_count,
                'scraped_at': datetime.now().isoformat()
            }).execute()

            if domain not in self.patterns:
                self.patterns[domain] = {
                    'pattern': pattern_signature,
                    'success_count': 0,
                    'total_listings': 0,
                    'first_seen': datetime.now().isoformat(),
                    'last_used': datetime.now().isoformat()
                }

            self.patterns[domain]['success_count'] += 1
            self.patterns[domain]['total_listings'] += listings_count
            self.patterns[domain]['last_used'] = datetime.now().isoformat()

        except Exception as e:
            print(f"    Warning: Could not save pattern to Supabase: {e}")

    def get_pattern_for_domain(self, domain: str) -> Optional[Dict]:
        return self.patterns.get(domain)

    def predict_pattern(self, url: str, available_patterns: List[str]) -> Optional[str]:
        domain = urlparse(url).netloc.replace('www.', '')
        if domain in self.patterns:
            return self.patterns[domain]['pattern']

        similar = self._find_similar_domains(domain)
        if not similar:
            return None

        from collections import defaultdict as dd
        pattern_scores = dd(float)
        for similar_domain, similarity_score in similar[:5]:
            if similar_domain in self.patterns:
                pattern = self.patterns[similar_domain]['pattern']
                if pattern in available_patterns:
                    weight = similarity_score * self.patterns[similar_domain]['success_count']
                    pattern_scores[pattern] += weight

        if pattern_scores:
            best = max(pattern_scores, key=pattern_scores.get)
            print(f"    ML Prediction: Using pattern similar to {similar[0][0]}")
            return best
        return None

    def _find_similar_domains(self, target_domain: str) -> List[tuple]:
        sims = []
        for domain in self.patterns.keys():
            similarity = self._domain_similarity(target_domain, domain)
            if similarity > 0.3:
                sims.append((domain, similarity))
        sims.sort(key=lambda x: x[1], reverse=True)
        return sims

    def _domain_similarity(self, d1: str, d2: str) -> float:
        def trigrams(s): return set(s[i:i+3] for i in range(len(s)-2))
        t1, t2 = trigrams(d1), trigrams(d2)
        if not t1 or not t2: return 0.0
        return len(t1 & t2) / len(t1 | t2)

    def get_stats(self) -> Dict:
        try:
            patterns_count = len(self.patterns)
            total_scrapes = sum(p['success_count'] for p in self.patterns.values())
            total_listings = sum(p['total_listings'] for p in self.patterns.values())
            response = self.supabase.table('scraper_history').select('id', count='exact').execute()
            history_count = response.count if hasattr(response, 'count') else 0
            return {
                'total_patterns': patterns_count,
                'total_scrapes': total_scrapes,
                'total_listings': total_listings,
                'history_records': history_count,
                'domains_learned': list(self.patterns.keys())
            }
        except:
            return {
                'total_patterns': len(self.patterns),
                'total_scrapes': sum(p['success_count'] for p in self.patterns.values()),
                'total_listings': sum(p['total_listings'] for p in self.patterns.values()),
                'history_records': 0,
                'domains_learned': list(self.patterns.keys())
            }


class FailureAnalyzer:
    """Analyzes and logs broker scraping failures"""

    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self._ensure_failure_table()

    def _ensure_failure_table(self):
        """Create failure tracking table if it doesn't exist"""
        try:
            self.supabase.table('scraper_failures').select('id').limit(1).execute()
        except:
            print("\nNote: scraper_failures table not found (will continue without failure logging)")

    def classify_failure(self, error: str, http_status: Optional[int],
                        html: Optional[str]) -> tuple:
        """Classify failure type and provide reason"""
        error_lower = (error or "").lower()
        html_lower = (html or "").lower() if html else ""

        if http_status == 403:
            return 'HTTP_403', "Site blocking (403) - anti-bot protection"
        elif http_status == 404:
            return 'HTTP_404', "Page not found (404) - URL may be outdated"
        elif http_status and http_status >= 500:
            return 'HTTP_500', f"Server error ({http_status})"

        if 'timeout' in error_lower or 'timed out' in error_lower:
            return 'TIMEOUT', "Connection timeout"

        if 'ssl' in error_lower or 'certificate' in error_lower:
            return 'SSL_ERROR', "SSL certificate error"

        if html and ('recaptcha' in html_lower or 'captcha' in html_lower):
            return 'CAPTCHA', "CAPTCHA protection detected"

        if 'no pattern' in error_lower or 'no business listings' in error_lower:
            return 'NO_PATTERN', "Could not detect listing pattern"

        if html and len(html) < 10000:
            return 'JAVASCRIPT_HEAVY', "Minimal content - JavaScript-heavy"

        return 'UNKNOWN', f"Unknown: {error[:200]}"

    def log_failure(self, broker: Dict, failure_type: str, error_detail: str,
                   http_status: Optional[int] = None):
        """Log failure to database (silently fails if table doesn't exist)"""
        try:
            self.supabase.table('scraper_failures').insert({
                'broker_account': broker.get('account'),
                'broker_name': broker.get('name'),
                'broker_url': broker.get('url'),
                'failure_type': failure_type,
                'error_detail': error_detail[:500],
                'http_status': http_status,
                'failed_at': datetime.now().isoformat()
            }).execute()
        except:
            pass


class PatternDetector:
    """Detects repeating patterns in HTML"""
    @staticmethod
    def find_patterns(soup: BeautifulSoup) -> List[Dict]:
        signatures = defaultdict(list)
        for element in soup.find_all(['div', 'article', 'section', 'li', 'tr']):
            depth = len(list(element.parents))
            if depth < 3 or depth > 15:
                continue
            sig = PatternDetector._get_signature(element)
            if sig:
                signatures[sig].append(element)

        patterns = []
        for sig, elements in signatures.items():
            if len(elements) >= 3:
                valid = [el for el in elements if el.find('a', href=True) and len(el.get_text(strip=True)) > 50]
                if len(valid) >= 3:
                    patterns.append({
                        'signature': sig,
                        'elements': valid,
                        'count': len(valid),
                        'avg_text_length': sum(len(el.get_text()) for el in valid) / len(valid)
                    })
        patterns.sort(key=lambda x: x['count'], reverse=True)
        return patterns

    @staticmethod
    def _get_signature(element) -> str:
        try:
            parts = [element.name]
            child_tags = [c.name for c in element.find_all(recursive=False) if hasattr(c, 'name')]
            if child_tags:
                parts.append(f"children:{','.join(sorted(set(child_tags)))}")
            if element.find('a', href=True):
                parts.append('has_link')
            if element.find('img'):
                parts.append('has_img')
            text_len = len(element.get_text(strip=True))
            if text_len > 200:
                parts.append('text:long')
            elif text_len > 50:
                parts.append('text:medium')
            if re.search(r'\$[\d,]+', element.get_text()):
                parts.append('has_price')
            return '|'.join(parts)
        except:
            return ''


class SmartExtractor:
    """Extract structured data from HTML elements"""
    @staticmethod
    def extract(element, base_url: str) -> Optional[Dict]:
        try:
            text = element.get_text(' ', strip=True)
            if len(text) < 30:
                return None
            link = element.find('a', href=True) or element.find_parent('a', href=True)
            if not link:
                return None
            url = urljoin(base_url, link['href'])
            if any(skip in url.lower() for skip in ['#', 'javascript:', '/contact', '/about']):
                return None

            title = SmartExtractor._extract_title(element, text)
            price_text = SmartExtractor._extract_price_text(text)
            price = parse_money_value(price_text)
            location = SmartExtractor._extract_location(text)
            city, state = extract_city_state(location)
            business_type = SmartExtractor._extract_business_type(text)
            revenue = SmartExtractor._extract_revenue(text)
            cash_flow = SmartExtractor._extract_cashflow(text)

            return {
                'title': title,
                'url': url,
                'price': price,
                'price_text': price_text,
                'location': location,
                'city': city,
                'state': state,
                'business_type': business_type,
                'revenue': revenue,
                'cash_flow': cash_flow,
                'text': text[:500],
                'full_text': text
            }
        except:
            return None

    @staticmethod
    def _extract_title(element, text: str) -> str:
        for tag in ['h1','h2','h3','h4','h5','h6','strong','b']:
            el = element.find(tag)
            if el:
                t = el.get_text(strip=True)
                if 10 < len(t) < 200:
                    return t
        link = element.find('a')
        if link:
            t = link.get_text(strip=True)
            if 10 < len(t) < 200:
                return t
        for s in re.split(r'[.!?]\s+', text):
            if 10 < len(s) < 200:
                return s.strip()
        return text[:100]

    @staticmethod
    def _extract_price_text(text: str) -> Optional[str]:
        matches = re.findall(r'\$[\d,]+(?:\.\d{2})?', text)
        if matches:
            vals = []
            for m in matches:
                try:
                    vals.append((float(m.replace('$','').replace(',','')), m))
                except:
                    pass
            if vals:
                return max(vals)[1]
        return None

    @staticmethod
    def _extract_revenue(text: str) -> Optional[float]:
        text_lower = text.lower()
        for pattern in REVENUE_PATTERNS:
            match = re.search(pattern, text_lower, re.I)
            if match:
                value = parse_money_value(match.group(1))
                if value and value > 10000:
                    return value
        return None

    @staticmethod
    def _extract_cashflow(text: str) -> Optional[float]:
        text_lower = text.lower()
        for pattern in CASHFLOW_PATTERNS:
            match = re.search(pattern, text_lower, re.I)
            if match:
                value = parse_money_value(match.group(1))
                if value and value > 1000:
                    return value
        return None

    @staticmethod
    def _extract_location(text: str) -> Optional[str]:
        m = re.search(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\b', text)
        return f"{m.group(1)}, {m.group(2)}" if m else None

    @staticmethod
    def _extract_business_type(text: str) -> Optional[str]:
        types = {
            'restaurant': ['restaurant','cafe','diner','bistro'],
            'bar': ['bar','tavern','pub','lounge'],
            'retail': ['store','shop','boutique'],
            'service': ['salon','spa','cleaning'],
        }
        t = text.lower()
        for category, kws in types.items():
            if any(kw in t for kw in kws):
                return category
        return None


class SelfLearningScraper:
    """Production scraper with specialized franchise integration AND VERTICAL SUPPORT"""
    def __init__(self, args, vertical_slug: str = 'cleaning'):
        if vertical_slug not in VERTICAL_CONFIGS:
            raise ValueError(f"Invalid vertical: {vertical_slug}. Must be one of: {list(VERTICAL_CONFIGS.keys())}")

        self.args = args
        self.vertical_slug = vertical_slug
        self.vertical_config = VERTICAL_CONFIGS[vertical_slug]

        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("Set SUPABASE_URL and SUPABASE_KEY")
        self.supabase = create_client(url, key)

        self.pattern_db = PatternDatabase(self.supabase)
        self.failure_analyzer = FailureAnalyzer(self.supabase)

        self.all_listings = []
        self.seen_ids = set()
        self.scraper_run_id = None

        self.stats = {
            'attempted': 0, 'success': 0, 'failed': 0, 'listings': 0,
            'ml_predictions_used': 0, 'ml_predictions_correct': 0,
            'new_patterns_learned': 0,
            'with_price': 0, 'with_revenue': 0, 'with_cashflow': 0,
            'specialized_brokers': 0, 'specialized_listings': 0,
            'regular_brokers': 0, 'regular_listings': 0,
            'failures_by_type': defaultdict(int),
            'filtered_out': 0  # NEW: Track filtered listings
        }

        self.playwright = None
        self.browser = None
        self.context = None

    def create_scraper_run(self, broker_source: str):
        """Create a scraper run record"""
        self.scraper_run_id = str(uuid.uuid4())
        try:
            self.supabase.table('scraper_runs').insert({
                'id': self.scraper_run_id,
                'vertical_slug': self.vertical_slug,
                'broker_source': broker_source,
                'scraper_type': 'unified',
                'started_at': datetime.now(timezone.utc).isoformat(),
                'status': 'running',
                'total_listings_found': 0,
                'new_listings': 0,
                'updated_listings': 0,
                'failed_listings': 0
            }).execute()
            print(f"Created scraper run: {self.scraper_run_id}")
        except Exception as e:
            print(f"Warning: Could not create scraper run: {e}")

    def update_scraper_run(self, status: str = 'completed', error_message: str = None):
        """Update scraper run with final stats"""
        if not self.scraper_run_id:
            return

        try:
            self.supabase.table('scraper_runs').update({
                'completed_at': datetime.now(timezone.utc).isoformat(),
                'status': status,
                'total_listings_found': self.stats['listings'],
                'new_listings': self.stats['listings'],  # Simplified
                'updated_listings': 0,
                'failed_listings': self.stats['failed'],
                'error_message': error_message
            }).eq('id', self.scraper_run_id).execute()
        except Exception as e:
            print(f"Warning: Could not update scraper run: {e}")

    def log_scraper_event(self, level: str, message: str, context: Dict = None):
        """Log scraper events"""
        if not self.scraper_run_id:
            return

        try:
            self.supabase.table('scraper_logs').insert({
                'id': str(uuid.uuid4()),
                'scraper_run_id': self.scraper_run_id,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'level': level,
                'message': message,
                'context': context or {}
            }).execute()
        except:
            pass

    def matches_vertical(self, listing: Dict) -> bool:
        """Check if listing matches vertical keywords"""
        # Get searchable text
        title = (listing.get('title') or '').lower()
        description = (listing.get('description') or listing.get('text') or listing.get('full_text') or '').lower()
        business_type = (listing.get('business_type') or '').lower()
        search_text = f"{title} {description} {business_type}"

        # Check exclude keywords first
        for keyword in self.vertical_config['exclude_keywords']:
            if keyword.lower() in search_text:
                return False

        # Check include keywords
        for keyword in self.vertical_config['include_keywords']:
            if keyword.lower() in search_text:
                return True

        return False

    def normalize_to_db_format(self, listing: Dict, broker_account: str) -> Dict:
        """Convert scraped listing to database format"""
        lid_source = listing.get('listing_url') or listing.get('url') or ''
        listing_id = hashlib.md5(lid_source.encode()).hexdigest()

        return {
            'id': listing_id,
            'vertical_slug': self.vertical_slug,
            'title': listing.get('title'),
            'location': listing.get('location'),
            'city': listing.get('city'),
            'state': listing.get('state'),
            'asking_price': listing.get('price'),
            'price_text': listing.get('price_text'),
            'cash_flow': listing.get('cash_flow'),
            'ebitda': None,
            'annual_revenue': listing.get('revenue'),
            'description': listing.get('text') or listing.get('description') or '',
            'image_url': listing.get('image_url'),
            'listing_url': listing.get('listing_url') or listing.get('url'),
            'category_id': None,
            'business_type': listing.get('business_type'),
            'broker_account': broker_account,
            'broker_source': 'Broker Network',
            'broker_contact': None,
            'broker_company': None,
            'list_number': None,
            'url_stub': None,
            'region': None,
            'status': 'pending',
            'hot_property': False,
            'recently_added': True,
            'recently_updated': False,
            'scraper_run_id': self.scraper_run_id,
            'scraped_at': datetime.now(timezone.utc).isoformat()
        }

    def classify_business(self, text: str) -> bool:
        s = (text or "").lower()
        if RE_REAL_ESTATE.search(s):
            return False
        return looks_businessy(s) or (PRICE_RE.search(s) is not None)

    async def scrape_with_learning(self, page, url: str) -> tuple:
        all_listings = []
        pages_scraped = 0
        max_pages = 100
        current_url = url
        visited_urls = set()
        consecutive_empty = 0

        while pages_scraped < max_pages:
            if current_url in visited_urls:
                break
            visited_urls.add(current_url)

            if pages_scraped > 0:
                print(f"    Page {pages_scraped + 1}: {current_url[:60]}...")
                try:
                    await page.goto(current_url, timeout=20000, wait_until="domcontentloaded")
                except:
                    break

            try:
                await page.wait_for_load_state("networkidle", timeout=10000)
            except:
                pass
            await asyncio.sleep(5)

            for _ in range(3):
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await asyncio.sleep(1.5)

            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')

            domain = urlparse(url).netloc.replace('www.', '')
            cached = self.pattern_db.get_pattern_for_domain(domain)

            pattern_used = None
            len_before_page = len(all_listings)

            if cached and pages_scraped == 0:
                print(f"    Using cached pattern (used {cached['success_count']}x before)")
                patterns = PatternDetector.find_patterns(soup)
                for pattern in patterns:
                    if pattern['signature'] == cached['pattern']:
                        listings = []
                        for el in pattern['elements']:
                            extracted = SmartExtractor.extract(el, page.url)
                            if extracted:
                                listings.append(extracted)
                        if listings:
                            all_listings.extend(listings)
                            pattern_used = cached['pattern']
                            break

            if not pattern_used:
                if pages_scraped == 0:
                    print("    Detecting patterns...")

                patterns = PatternDetector.find_patterns(soup)
                if not patterns:
                    break

                if pages_scraped == 0:
                    print(f"    Found {len(patterns)} patterns")
                    pattern_sigs = [p['signature'] for p in patterns]
                    predicted = self.pattern_db.predict_pattern(url, pattern_sigs)
                    if predicted:
                        self.stats['ml_predictions_used'] += 1
                        for p in patterns:
                            if p['signature'] == predicted:
                                patterns.remove(p)
                                patterns.insert(0, p)
                                break

                for i, pattern in enumerate(patterns[:3], 1):
                    if pages_scraped == 0:
                        print(f"    Pattern {i}: {pattern['count']} elements")
                    listings = []
                    for el in pattern['elements']:
                        extracted = SmartExtractor.extract(el, page.url)
                        if extracted:
                            listings.append(extracted)
                    if listings:
                        if pages_scraped == 0:
                            print(f"      Extracted {len(listings)} listings")
                        all_listings.extend(listings)
                        pattern_used = pattern['signature']
                        break

            if not pattern_used:
                break

            listings_found_this_page = len(all_listings) - len_before_page

            if listings_found_this_page == 0:
                consecutive_empty += 1
                if consecutive_empty >= 3:
                    print(f"    Stopping: 3 consecutive empty pages")
                    break
            else:
                consecutive_empty = 0

            pages_scraped += 1
            next_url = await self._find_next_page(page, current_url)
            if not next_url:
                break
            current_url = next_url
            await asyncio.sleep(random.uniform(1, 2))

        if pages_scraped > 1:
            print(f"    Scraped {pages_scraped} pages total")

        return all_listings, pattern_used

    async def _find_next_page(self, page, current_url: str) -> Optional[str]:
        selectors = [
            'a.next','a.next-page','.pagination .next','a:has-text("Next")',
            'a:has-text(">")','a[rel="next"]','.pagination a:last-child'
        ]
        for selector in selectors:
            try:
                el = await page.query_selector(selector)
                if el:
                    href = await el.get_attribute('href')
                    if href:
                        return urljoin(current_url, href)
            except:
                continue

        parsed = urlparse(current_url)
        if 'page=' in parsed.query:
            m = re.search(r'page=(\d+)', parsed.query)
            if m:
                cur = int(m.group(1))
                return current_url.replace(f'page={cur}', f'page={cur+1}')
        if '/page/' in parsed.path:
            m = re.search(r'/page/(\d+)', parsed.path)
            if m:
                cur = int(m.group(1))
                return current_url.replace(f'/page/{cur}', f'/page/{cur+1}')
        return None

    async def scrape_broker(self, broker: Dict, index: int, total: int):
        self.stats['attempted'] += 1

        url = broker['url']
        account = broker['account']
        name = broker['name']

        print(f"\n{'='*70}")
        print(f"[{index}/{total}] {name}")
        print(f"{'='*70}")

        page = None
        response = None
        try:
            page = await self.context.new_page()
            response = await page.goto(url, timeout=60000, wait_until="domcontentloaded")
            if not response or response.status != 200:
                print(f"✗ HTTP {response.status if response else 'error'}")
                self.stats['failed'] += 1
                return

            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')

            download_links = soup.find_all('a', href=re.compile(r'\.(xlsx?|csv)', re.I))
            if download_links:
                print(f"    Found {len(download_links)} downloadable file(s)")
                for link in download_links[:1]:
                    file_url = urljoin(url, link['href'])
                    print(f"    Downloading: {file_url}")
                    listings = await self._download_and_parse_file(page, file_url, account)
                    if listings:
                        # Filter by vertical
                        matched = [l for l in listings if self.matches_vertical(l)]
                        filtered = len(listings) - len(matched)
                        self.stats['filtered_out'] += filtered

                        print(f"\n✓ SUCCESS: {len(matched)} {self.vertical_config['name']} listings from file ({filtered} filtered out)")
                        self.stats['success'] += 1
                        self.stats['listings'] += len(matched)
                        for listing in matched:
                            normalized = self.normalize_to_db_format(listing, account)
                            lid = normalized['id']
                            if lid not in self.seen_ids:
                                self.seen_ids.add(lid)
                                self.all_listings.append(normalized)
                                if listing.get('price'): self.stats['with_price'] += 1
                                if listing.get('revenue'): self.stats['with_revenue'] += 1
                                if listing.get('cash_flow'): self.stats['with_cashflow'] += 1
                        return

            listings, pattern_sig = await self.scrape_with_learning(page, url)
            pattern_used = bool(pattern_sig)

            business_count = 0
            for listing in listings:
                text = listing.get('full_text') or listing.get('text') or ''

                if pattern_used:
                    if RE_REAL_ESTATE.search(text or ''):
                        include = False
                    else:
                        include = True
                else:
                    include = bool(PRICE_RE.search(text) or looks_businessy(text))

                if not include:
                    continue

                # VERTICAL FILTERING
                if not self.matches_vertical(listing):
                    self.stats['filtered_out'] += 1
                    continue

                normalized = self.normalize_to_db_format(listing, account)
                lid = normalized['id']
                if lid in self.seen_ids:
                    continue
                self.seen_ids.add(lid)

                self.all_listings.append(normalized)
                business_count += 1

                if listing.get('price'): self.stats['with_price'] += 1
                if listing.get('revenue'): self.stats['with_revenue'] += 1
                if listing.get('cash_flow'): self.stats['with_cashflow'] += 1

            if business_count > 0:
                print(f"\n✓ SUCCESS: {business_count} {self.vertical_config['name']} business listings")
                with_financials = sum(1 for l in self.all_listings[-business_count:]
                                     if l.get('asking_price') or l.get('annual_revenue') or l.get('cash_flow'))
                print(f"  {with_financials}/{business_count} with financial data")
                self.stats['success'] += 1
                self.stats['listings'] += business_count
                if pattern_sig:
                    self.pattern_db.record_success(url, pattern_sig, business_count)
                    self.stats['new_patterns_learned'] += 1
                    print(f"  Pattern learned and saved to knowledge base")
            else:
                print(f"\n✗ NO BUSINESS LISTINGS MATCHING {self.vertical_config['name'].upper()}")
                self.stats['failed'] += 1

        except Exception as e:
            error_str = str(e)
            http_status = response.status if response else None
            html_content = None

            try:
                if page:
                    html_content = await page.content()
            except:
                pass

            failure_type, detail = self.failure_analyzer.classify_failure(
                error_str, http_status, html_content
            )

            self.failure_analyzer.log_failure(
                broker, failure_type, detail, http_status
            )

            self.stats['failures_by_type'][failure_type] += 1

            print(f"\n✗ {failure_type}: {detail}")
            self.stats['failed'] += 1
        finally:
            if page:
                await page.close()

    async def _download_and_parse_file(self, page, file_url: str, account: int) -> List[Dict]:
        try:
            import io, aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(file_url) as response:
                    if response.status != 200:
                        return []
                    content = await response.read()

            if file_url.lower().endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content))
            else:
                df = pd.read_excel(io.BytesIO(content))

            print(f"      Parsed {len(df)} rows from file")

            listings = []
            title_cols = [c for c in df.columns if any(x in c.lower() for x in ['name','title','business','description'])]
            price_cols = [c for c in df.columns if any(x in c.lower() for x in ['price','asking','value'])]
            location_cols = [c for c in df.columns if any(x in c.lower() for x in ['location','city','state','area'])]

            for idx, row in df.iterrows():
                try:
                    title = None
                    for col in title_cols:
                        if pd.notna(row[col]):
                            title = str(row[col]); break
                    if not title:
                        title = f"Business Listing {idx + 1}"

                    parts = []
                    for col, val in row.items():
                        if pd.notna(val):
                            parts.append(f"{col}: {val}")
                    description = " | ".join(parts)

                    price_text = None
                    for col in price_cols:
                        if pd.notna(row[col]):
                            price_text = str(row[col]); break

                    location = None
                    for col in location_cols:
                        if pd.notna(row[col]):
                            location = str(row[col]); break

                    city, state = extract_city_state(location)

                    listing_url = f"{file_url}#row{idx}"
                    if self.classify_business(description):
                        listings.append({
                            'title': title,
                            'price': parse_money_value(price_text),
                            'price_text': price_text,
                            'location': location,
                            'city': city,
                            'state': state,
                            'description': description[:500],
                            'listing_url': listing_url,
                            'text': description
                        })
                except Exception:
                    continue
            return listings
        except Exception as e:
            print(f"      Error parsing file: {e}")
            return []

    def save(self):
        if not self.all_listings:
            print("\n⚠️  No listings")
            return
        print(f"\nSaving {len(self.all_listings)} listings to vertical '{self.vertical_slug}'...")
        batch_size = 50
        for i in range(0, len(self.all_listings), batch_size):
            batch = self.all_listings[i:i+batch_size]
            try:
                self.supabase.table("listings").upsert(batch, on_conflict="id").execute()
                print(f"  ✓ Batch {i//batch_size + 1}")
            except Exception as e:
                print(f"  ✗ Batch {i//batch_size + 1}: {e}")

    def print_stats(self):
        kb = self.pattern_db.get_stats()
        print(f"\n{'='*70}")
        print(f"SCRAPING RESULTS - {self.vertical_config['name'].upper()} VERTICAL")
        print(f"{'='*70}")
        print(f"Brokers attempted:    {self.stats['attempted']}")
        print(f"  ✓ Success:          {self.stats['success']}")
        print(f"  ✗ Failed:           {self.stats['failed']}")
        print(f"\nBroker Breakdown:")
        print(f"  Specialized:        {self.stats['specialized_brokers']} brokers → {self.stats['specialized_listings']} listings")
        print(f"  Regular (ML):       {self.stats['regular_brokers']} brokers → {self.stats['regular_listings']} listings")
        print(f"\nTotal Listings:       {self.stats['listings']}")
        print(f"  Filtered out:       {self.stats['filtered_out']} (didn't match {self.vertical_config['name']})")
        print(f"  With price:         {self.stats['with_price']} ({self.stats['with_price']/max(1,self.stats['listings'])*100:.1f}%)")
        print(f"  With revenue:       {self.stats['with_revenue']} ({self.stats['with_revenue']/max(1,self.stats['listings'])*100:.1f}%)")
        print(f"  With cash flow:     {self.stats['with_cashflow']} ({self.stats['with_cashflow']/max(1,self.stats['listings'])*100:.1f}%)")
        print(f"{'='*70}")
        print("LEARNING SYSTEM")
        print(f"{'='*70}")
        print(f"Patterns in KB:       {kb['total_patterns']}")
        print(f"New patterns learned: {self.stats['new_patterns_learned']}")
        print(f"ML predictions used:  {self.stats['ml_predictions_used']}")
        print(f"Total KB scrapes:     {kb['total_scrapes']}")
        print(f"Total KB listings:    {kb['total_listings']}")

        if self.stats['failures_by_type']:
            print(f"{'='*70}")
            print("FAILURE ANALYSIS")
            print(f"{'='*70}")
            print("Failures by type:")
            for ftype, count in sorted(self.stats['failures_by_type'].items(),
                                       key=lambda x: x[1], reverse=True):
                pct = (count / max(1, self.stats['failed']) * 100)
                print(f"  {ftype:20s}: {count:4d} ({pct:5.1f}%)")
        print(f"{'='*70}")

    def load_brokers(self, top_n: Optional[int] = None, category: Optional[str] = None) -> List[Dict]:
        """Load brokers from Supabase broker_master table with pagination"""
        print(f"\nLoading brokers for {self.vertical_config['name']} vertical...")

        try:
            all_brokers = []
            page_size = 1000
            offset = 0

            while True:
                query = self.supabase.table('broker_master')\
                    .select('account, broker_name, "active lisitng url"')

                if category:
                    query = query.eq('category', category)

                query = query.order('leaderboard_score', desc=True)
                query = query.range(offset, offset + page_size - 1)

                response = query.execute()

                if not response.data:
                    break

                for row in response.data:
                    if row.get('active lisitng url') and row.get('account'):
                        all_brokers.append({
                            'account': str(row['account']),
                            'name': row.get('broker_name') or 'Unknown',
                            'url': row['active lisitng url']
                        })

                if len(response.data) < page_size:
                    break

                offset += page_size

                if top_n and len(all_brokers) >= top_n:
                    all_brokers = all_brokers[:top_n]
                    break

            brokers = all_brokers
            print(f"Loaded {len(brokers)} brokers from Supabase")

            specialized_names = get_specialized_broker_names()
            specialized_count = 0
            for b in brokers:
                name = (b.get('name') or '').lower()
                url = (b.get('url') or '').lower()
                if any([
                    'murphy' in name or 'murphybusiness.com' in url,
                    'transworld' in name or 'tworld.com' in url,
                    'sunbelt' in name or 'sunbeltnetwork.com' in url,
                    'vr business' in name or 'vrbusinessbrokers' in url or 'vrbbusa.com' in url,
                    'first choice' in name or 'fcbb' in name or 'firstchoicebusinessbrokers' in url or 'fcbb.com' in url
                ]):
                    specialized_count += 1

            if specialized_count > 0:
                print(f"  Including {specialized_count} specialized broker(s): {', '.join(specialized_names)}")

            return brokers

        except Exception as e:
            print(f"Error loading from Supabase: {e}")
            print("Make sure broker_master table exists and has data")
            return []

    async def run_async(self, top_n: Optional[int] = None, category: Optional[str] = None):
        """Main run method with specialized scraper integration"""
        brokers = self.load_brokers(top_n=top_n, category=category)

        print("\n" + "="*70)
        print(f"UNIFIED SCRAPER V2 - {self.vertical_config['name'].upper()} VERTICAL")
        print("="*70)
        print(f"Vertical: {self.vertical_slug}")
        print(f"Total brokers loaded: {len(brokers)}")
        print(f"Specialized scrapers available: {', '.join(get_specialized_broker_names())}")
        print("="*70 + "\n")

        # Create scraper run
        self.create_scraper_run('Broker Network')

        specialized_brokers = []
        regular_brokers = []

        for broker in brokers:
            name = (broker.get('name') or '').lower()
            url = (broker.get('url') or '').lower()

            is_specialized = any([
                'murphy' in name or 'murphybusiness.com' in url,
                'transworld' in name or 'tworld.com' in url,
                'sunbelt' in name or 'sunbeltnetwork.com' in url,
                'hedgestone' in name or 'hedgestone.com' in url,
                'vr business' in name or 'vrbusinessbrokers' in url or 'vrbbusa.com' in url,
                'first choice' in name or 'fcbb' in name or 'firstchoicebusinessbrokers' in url or 'fcbb.com' in url
            ])

            if is_specialized:
                specialized_brokers.append(broker)
            else:
                regular_brokers.append(broker)

        print(f"📊 Broker Distribution:")
        print(f"   Specialized: {len(specialized_brokers)}")
        print(f"   Regular (ML): {len(regular_brokers)}")
        print()

        if specialized_brokers:
            print("="*70)
            print("PHASE 1: SPECIALIZED FRANCHISE SCRAPERS")
            print("="*70 + "\n")

            for i, broker in enumerate(specialized_brokers, 1):
                self.stats['attempted'] += 1
                self.stats['specialized_brokers'] += 1

                try:
                    listings = scrape_specialized_broker(broker, verbose=True)

                    if listings:
                        # VERTICAL FILTERING
                        matched = []
                        for listing in listings:
                            if self.matches_vertical(listing):
                                # Add vertical_slug to listing
                                listing['vertical_slug'] = self.vertical_slug
                                # Ensure scraper_run_id is set
                                listing['scraper_run_id'] = self.scraper_run_id
                                matched.append(listing)
                            else:
                                self.stats['filtered_out'] += 1

                        if matched:
                            for listing in matched:
                                lid = listing['id'] if 'id' in listing else listing['listing_id']
                                if lid not in self.seen_ids:
                                    self.seen_ids.add(lid)
                                    self.all_listings.append(listing)
                                    if listing.get('price') or listing.get('asking_price'): self.stats['with_price'] += 1
                                    if listing.get('revenue') or listing.get('annual_revenue'): self.stats['with_revenue'] += 1
                                    if listing.get('cash_flow'): self.stats['with_cashflow'] += 1

                            self.stats['success'] += 1
                            self.stats['listings'] += len(matched)
                            self.stats['specialized_listings'] += len(matched)

                            filtered_count = len(listings) - len(matched)
                            if filtered_count > 0:
                                print(f"  (Filtered out {filtered_count} non-{self.vertical_config['name']} listings)")
                        else:
                            print(f"\n  ⚠️  All {len(listings)} listings filtered out (didn't match {self.vertical_config['name']})")
                            self.stats['failed'] += 1
                    else:
                        self.stats['failed'] += 1

                except Exception as e:
                    print(f"\n✗ ERROR: {str(e)[:100]}")
                    self.stats['failed'] += 1

                if i < len(specialized_brokers):
                    await asyncio.sleep(random.uniform(3, 5))

        if regular_brokers:
            print("\n" + "="*70)
            print("PHASE 2: ML-BASED GENERAL SCRAPING")
            print("="*70 + "\n")

            print("Starting browser...")
            self.playwright = await async_playwright().start()

            browser_args = {'headless': True, 'args': ['--disable-blink-features=AutomationControlled']}
            context_args = {
                'user_agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                'viewport': {'width': 1920, 'height': 1080}
            }

            self.browser = await self.playwright.chromium.launch(**browser_args)
            self.context = await self.browser.new_context(**context_args)
            print("Ready\n")

            total = len(regular_brokers)
            for i, broker in enumerate(regular_brokers, 1):
                self.stats['regular_brokers'] += 1
                await self.scrape_broker(broker, i, total)

                current_total = len(self.all_listings)
                self.stats['regular_listings'] = current_total - self.stats['specialized_listings']

                if i < total:
                    await asyncio.sleep(random.uniform(2, 4))

            await self.browser.close()
            await self.playwright.stop()

        self.save()
        self.update_scraper_run(status='completed')
        self.print_stats()

    def run(self, top_n: Optional[int] = None, category: Optional[str] = None):
        asyncio.run(self.run_async(top_n=top_n, category=category))


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Unified Production Scraper V2 - Multi-Tenant")
    parser.add_argument("--permissive", action="store_true", help="Include most items when repeating pattern detected")
    parser.add_argument("--category", type=str, help="Filter by category (e.g., 'franchise')")
    parser.add_argument("--vertical", type=str, choices=['cleaning', 'landscape', 'hvac'], default='cleaning',
                       help="Vertical to scrape (default: cleaning)")

    group = parser.add_mutually_exclusive_group()
    group.add_argument("--top-n", type=int, help="Limit number of brokers to scrape")
    group.add_argument("--all", action="store_true", help="Scrape all brokers in Supabase")

    args = parser.parse_args()

    vertical_config = VERTICAL_CONFIGS[args.vertical]
    print("\n" + "="*70)
    print(f"UNIFIED PRODUCTION SCRAPER V2 - {vertical_config['name'].upper()}")
    print("="*70)
    print(f"Vertical: {args.vertical}")
    print("Source: Supabase broker_master table")
    print("Specialized: Murphy, Transworld, Sunbelt, VR, FCBB")
    print("General: ML-based pattern detection")
    print("Max pages: 100")
    print("Classification: Less restrictive (trusts patterns more)")
    print("Vertical filtering: Enabled")
    print("="*70 + "\n")

    scraper = SelfLearningScraper(args, vertical_slug=args.vertical)
    topn = None if args.all else args.top_n
    scraper.run(top_n=topn, category=args.category)
