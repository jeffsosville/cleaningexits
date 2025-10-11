#!/usr/bin/env python3
"""
ingest.py
---------
Helpers to push scraped rows into Supabase.

- Always loads .env.local from this folder (scraper/.env.local)
- Connects with SUPABASE_URL + SUPABASE_SERVICE_KEY
- Provides safe upsert functions for daily listings + top10 autos
"""

import os
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# -------------------------------------------------------------------
# Load environment variables (always relative to this file)
# -------------------------------------------------------------------
env_path = os.path.join(os.path.dirname(__file__), ".env.local")
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise RuntimeError(f"❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in {env_path}")

print(f"[DEBUG] Supabase URL: {SUPABASE_URL}")
print(f"[DEBUG] Supabase key length: {len(SUPABASE_SERVICE_KEY or '')}")

# Initialize client
sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# -------------------------------------------------------------------
# Allowed columns
# -------------------------------------------------------------------
DAILY_RAW_ALLOWED = {
    "id", "title", "city_state", "asking_price", "cash_flow",
    "ebitda", "summary", "url", "image_url",
    "broker", "broker_contact", "scraped_at"
}

TOP10_ALLOWED = {
    "id", "title", "location", "region",
    "asking_price", "cashflow", "ebitda",
    "broker", "url", "description"
}

# -------------------------------------------------------------------
# Internal helper
# -------------------------------------------------------------------
def _chunked_upsert(table: str, rows: List[Dict[str, Any]], allowed: set, on_conflict: str = "id"):
    """
    Upsert rows into Supabase in safe chunks of 500.
    Filters out unexpected columns to avoid schema errors.
    """
    clean_rows = [
        {k: v for k, v in row.items() if k in allowed}
        for row in rows
    ]

    for i in range(0, len(clean_rows), 500):
        chunk = clean_rows[i:i+500]
        if not chunk:
            continue
        print(f"[DEBUG] Upserting {len(chunk)} rows into {table} …")
        sb.table(table).upsert(chunk, on_conflict=on_conflict).execute()

# -------------------------------------------------------------------
# Public functions
# -------------------------------------------------------------------
def push_daily_candidates(rows: List[Dict[str, Any]]) -> int:
    """
    Push candidate rows into daily_cleaning_raw (physical table).
    Views like daily_cleaning_candidates / daily_cleaning_today will update automatically.
    """
    _chunked_upsert("daily_cleaning_raw", rows, DAILY_RAW_ALLOWED, on_conflict="id")
    return len(rows)

def push_top10_auto(rows: List[Dict[str, Any]]) -> int:
    """
    Push rows into cleaning_top10_auto_src (physical table backing the AUTO view).
    View cleaning_top10_auto will update automatically.
    """
    _chunked_upsert("cleaning_top10_auto_src", rows, TOP10_ALLOWED, on_conflict="id")
    return len(rows)
