#!/usr/bin/env python3
"""
Raw DB → Processed DB Feature Pipeline

Reads raw OHLCV data from etf2_db, runs FeaturePipeline (96 features + target),
and stores the results in etf2_db_processed.

Usage:
    # Process all symbols
    poetry run python process_features.py

    # Specific symbols only
    poetry run python process_features.py --symbols AAPL MSFT GOOGL

    # Date range
    poetry run python process_features.py --start-date 2015-01-01 --end-date 2024-12-31

    # Skip macro features (faster)
    poetry run python process_features.py --no-macro

    # Store raw feature values (no 1-day shift)
    poetry run python process_features.py --no-shift

    # Dry run (compute only, no DB write)
    poetry run python process_features.py --dry-run
"""

import sys
import argparse
import logging
from pathlib import Path
from datetime import datetime

# ---------------------------------------------------------------------------
# Make scraper-service root importable
# ---------------------------------------------------------------------------
_SCRAPER_ROOT = str(Path(__file__).resolve().parent.parent)
if _SCRAPER_ROOT not in sys.path:
    sys.path.insert(0, _SCRAPER_ROOT)

from app.services.processed_db_service import ProcessedDatabaseService

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_DIR = Path(__file__).resolve().parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            LOG_DIR / "process_features.log", encoding="utf-8"
        ),
    ],
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_available_symbols() -> list[str]:
    """Query etf2_db for all *_D tables and return symbol names via MySQLProvider."""
    from app.features.data_providers.mysql_provider import MySQLProvider

    provider = MySQLProvider()
    symbols = provider.get_available_symbols()
    logger.info(f"Found {len(symbols)} symbols in etf2_db")
    return symbols


def run_pipeline(
    symbols: list[str],
    start_date: str,
    end_date: str,
    include_macro: bool,
    shift_features: bool,
    dry_run: bool,
):
    """Run the full feature processing pipeline."""

    # ---- lazy-import FeaturePipeline ----------------------------------------
    from app.features.pipeline import FeaturePipeline
    from app.features.ahnlab.constants import ALL_FEATURE_COLS

    logger.info(
        f"Starting feature pipeline: {len(symbols)} symbols, "
        f"{start_date} → {end_date}, macro={include_macro}, "
        f"shift={shift_features}, dry_run={dry_run}"
    )

    # ---- 1. Build the panel via FeaturePipeline ---------------------------
    pipeline = FeaturePipeline(
        data_provider="mysql",
        include_macro=include_macro,
        include_target=True,
        target_horizon=63,
    )

    panel = pipeline.create_panel(
        tickers=symbols,
        start_date=start_date,
        end_date=end_date,
        shift_features=shift_features,
        validate_features=True,
    )

    logger.info(
        f"Panel created: {panel.shape[0]:,} rows, "
        f"{panel['ticker'].nunique()} tickers, "
        f"{panel.shape[1]} columns"
    )

    if dry_run:
        logger.info("[DRY RUN] Skipping DB write")
        print(f"\n--- Dry-run summary ---")
        print(f"Rows:    {panel.shape[0]:,}")
        print(f"Tickers: {panel['ticker'].nunique()}")
        print(f"Columns: {panel.shape[1]}")
        print(f"Date range: {panel['date'].min()} → {panel['date'].max()}")
        print(panel.head())
        return

    # ---- 2. Connect to processed DB and create database -------------------
    proc_db = ProcessedDatabaseService()
    try:
        proc_db.create_database()

        # ---- 3. Upsert per symbol -----------------------------------------
        unique_tickers = sorted(panel["ticker"].unique())
        total_rows = 0
        success = 0
        failed = 0

        for i, ticker in enumerate(unique_tickers, 1):
            try:
                ticker_df = panel[panel["ticker"] == ticker]
                rows = proc_db.upsert_dataframe(
                    ticker_df, ticker, timeframe="D", feature_cols=ALL_FEATURE_COLS
                )
                total_rows += rows
                success += 1
                if i % 50 == 0 or i == len(unique_tickers):
                    logger.info(f"  Progress: {i}/{len(unique_tickers)} symbols")
            except Exception as e:
                logger.error(f"Failed to upsert {ticker}: {e}")
                failed += 1

        logger.info(
            f"Done: {success} symbols, {total_rows:,} rows upserted, "
            f"{failed} failed"
        )
    finally:
        proc_db.close()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Process raw OHLCV → 96-feature panel and store in etf2_db_processed"
    )
    parser.add_argument(
        "--symbols",
        nargs="+",
        default=None,
        help="Specific symbols to process (default: all in etf2_db)",
    )
    parser.add_argument(
        "--start-date",
        default="2010-01-01",
        help="Start date (YYYY-MM-DD, default: 2010-01-01)",
    )
    parser.add_argument(
        "--end-date",
        default=datetime.now().strftime("%Y-%m-%d"),
        help="End date (YYYY-MM-DD, default: today)",
    )
    parser.add_argument(
        "--no-macro",
        action="store_true",
        help="Skip macro-economic features (faster)",
    )
    parser.add_argument(
        "--no-shift",
        action="store_true",
        help="Do not shift features by 1 day (store raw feature values)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute features but do not write to DB",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    # ---- Resolve symbol list ----------------------------------------------
    if args.symbols:
        symbols = args.symbols
    else:
        symbols = get_available_symbols()

    if not symbols:
        logger.error("No symbols found. Exiting.")
        sys.exit(1)

    # ---- Run pipeline -----------------------------------------------------
    run_pipeline(
        symbols=symbols,
        start_date=args.start_date,
        end_date=args.end_date,
        include_macro=not args.no_macro,
        shift_features=not args.no_shift,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
