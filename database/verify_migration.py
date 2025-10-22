#!/usr/bin/env python3
"""
Migration Verification Script
Checks that the database migration was successful and all required tables exist.

Usage:
    python verify_migration.py
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

# Load environment variables
load_dotenv()


def verify_migration():
    """Verify that database migration was successful"""

    print(f"\n{Fore.CYAN}{'='*70}")
    print(f"{Fore.CYAN}DATABASE MIGRATION VERIFICATION")
    print(f"{Fore.CYAN}{'='*70}\n")

    # Check environment variables
    print(f"{Fore.YELLOW}[1/5] Checking environment variables...")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        print(f"{Fore.RED}✗ SUPABASE_URL or SUPABASE_KEY not set in .env file")
        print(f"{Fore.YELLOW}  Create a .env file with:")
        print(f"  SUPABASE_URL=https://your-project.supabase.co")
        print(f"  SUPABASE_KEY=your-service-role-key")
        return False

    print(f"{Fore.GREEN}✓ Environment variables found")
    print(f"  URL: {supabase_url[:40]}...")

    # Connect to Supabase
    print(f"\n{Fore.YELLOW}[2/5] Connecting to Supabase...")
    try:
        supabase = create_client(supabase_url, supabase_key)
        print(f"{Fore.GREEN}✓ Connected successfully")
    except Exception as e:
        print(f"{Fore.RED}✗ Connection failed: {e}")
        return False

    # Check required tables exist
    print(f"\n{Fore.YELLOW}[3/5] Checking required tables...")
    required_tables = ['listings', 'scraper_runs', 'scraper_logs']
    all_tables_exist = True

    for table_name in required_tables:
        try:
            # Try to select from table (will fail if table doesn't exist)
            response = supabase.table(table_name).select('*').limit(1).execute()
            print(f"{Fore.GREEN}✓ Table '{table_name}' exists")
        except Exception as e:
            print(f"{Fore.RED}✗ Table '{table_name}' missing or inaccessible")
            print(f"  Error: {e}")
            all_tables_exist = False

    if not all_tables_exist:
        print(f"\n{Fore.RED}Migration incomplete! Run migration_add_multitenant.sql")
        return False

    # Check listings table has required columns
    print(f"\n{Fore.YELLOW}[4/5] Checking listings table columns...")
    try:
        # Try to query with new columns
        response = supabase.table('listings').select(
            'id, vertical_slug, title, status, scraper_run_id'
        ).limit(1).execute()
        print(f"{Fore.GREEN}✓ All required columns exist in listings table")

        # Count existing listings
        count_response = supabase.table('listings').select('id', count='exact').execute()
        listing_count = count_response.count if hasattr(count_response, 'count') else len(count_response.data)
        print(f"{Fore.GREEN}  Total listings: {listing_count}")

    except Exception as e:
        print(f"{Fore.RED}✗ Missing columns in listings table")
        print(f"  Error: {e}")
        print(f"\n{Fore.YELLOW}  Run migration_add_multitenant.sql to add missing columns")
        return False

    # Test inserting and deleting a record
    print(f"\n{Fore.YELLOW}[5/5] Testing write permissions...")
    try:
        # Insert test record
        test_data = {
            'id': 'test-verification-123',
            'vertical_slug': 'cleaning',
            'title': 'Test Listing for Verification',
            'location': 'Test City, TS',
            'status': 'pending',
            'scraped_at': '2025-01-01T00:00:00Z'
        }

        insert_response = supabase.table('listings').upsert(test_data).execute()
        print(f"{Fore.GREEN}✓ Write permission OK (inserted test record)")

        # Delete test record
        delete_response = supabase.table('listings').delete().eq('id', 'test-verification-123').execute()
        print(f"{Fore.GREEN}✓ Delete permission OK (removed test record)")

    except Exception as e:
        print(f"{Fore.RED}✗ Write/Delete permission failed")
        print(f"  Error: {e}")
        print(f"\n{Fore.YELLOW}  Make sure you're using the service role key, not anon key")
        return False

    # Summary
    print(f"\n{Fore.GREEN}{'='*70}")
    print(f"{Fore.GREEN}✓ VERIFICATION COMPLETE - ALL CHECKS PASSED")
    print(f"{Fore.GREEN}{'='*70}")
    print(f"\n{Fore.CYAN}Your database is ready for multi-tenant scrapers!")
    print(f"\n{Fore.YELLOW}Next steps:")
    print(f"  1. Test a scraper:")
    print(f"     python scrapers/bizbuysell_scraper_v2.py --vertical cleaning --max-pages 5")
    print(f"\n  2. Run orchestrator:")
    print(f"     python scrapers/orchestrator.py --verticals cleaning --scrapers bizbuysell")
    print(f"\n  3. View analytics:")
    print(f"     SELECT * FROM active_listings_by_vertical;")
    print(f"\n{Fore.GREEN}{'='*70}\n")

    return True


def main():
    """Main entry point"""
    try:
        success = verify_migration()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n{Fore.RED}Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
