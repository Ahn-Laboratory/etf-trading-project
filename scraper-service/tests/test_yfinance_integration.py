#!/usr/bin/env python3
"""
Test script for yfinance corporate actions integration

This script demonstrates the new corporate actions fetching functionality
without running the full TradingView scraper.
"""

import sys
import logging
from pathlib import Path

# Add app/services to sys.path
_SERVICES_DIR = str(Path(__file__).resolve().parent.parent / "app" / "services")
if _SERVICES_DIR not in sys.path:
    sys.path.insert(0, _SERVICES_DIR)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

def test_yfinance_service():
    """Test the yfinance service independently"""
    try:
        from yfinance_service import YFinanceCorporateActionsService
        print("✓ yfinance_service imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import yfinance_service: {e}")
        print("\nInstall with: pip install yfinance pandas")
        return False

    # Test with a sample symbol
    symbol = "AAPL"
    
    print(f"\n{'='*60}")
    print(f"Testing YFinance Corporate Actions for {symbol}")
    print(f"{'='*60}\n")
    
    try:
        service = YFinanceCorporateActionsService()
        print("✓ YFinance service initialized")
        
        # Fetch corporate actions
        actions = service.fetch_corporate_actions(symbol)
        
        dividends_df = actions.get("dividends")
        splits_df = actions.get("splits")
        
        print(f"\nDividends: {len(dividends_df)} records")
        if not dividends_df.empty:
            print(f"  Columns: {list(dividends_df.columns)}")
            print(f"  Date range: {dividends_df['ex_date'].min()} to {dividends_df['ex_date'].max()}")
            print(f"  Total amount: ${dividends_df['amount'].sum():.2f}")

        print(f"\nSplits: {len(splits_df)} records")
        if not splits_df.empty:
            print(f"  Columns: {list(splits_df.columns)}")
            print(f"  Date range: {splits_df['ex_date'].min()} to {splits_df['ex_date'].max()}")
        
        print("\n✓ Test completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_db_service():
    """Test database service corporate actions methods"""
    try:
        from db_service import DatabaseService  # noqa: from app/services via sys.path
        print("\n✓ db_service imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import db_service: {e}")
        return False
    
    print("\nChecking for corporate actions methods...")
    db_service_methods = [
        'upload_corporate_actions',
        'upload_dividends', 
        'upload_splits',
        'create_corporate_actions_tables'
    ]
    
    for method in db_service_methods:
        if hasattr(DatabaseService, method):
            print(f"  ✓ {method}")
        else:
            print(f"  ✗ {method} NOT FOUND")
            return False
    
    return True

if __name__ == "__main__":
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║     YFINANCE CORPORATE ACTIONS INTEGRATION TEST                    ║")
    print("╚════════════════════════════════════════════════════════════════════╝\n")
    
    # Test 1: yfinance service
    yf_ok = test_yfinance_service()
    
    # Test 2: Database service
    db_ok = test_db_service()
    
    # Summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    print(f"YFinance Service: {'✓ PASS' if yf_ok else '✗ FAIL'}")
    print(f"Database Service: {'✓ PASS' if db_ok else '✗ FAIL'}")
    print(f"{'='*60}\n")
    
    if yf_ok and db_ok:
        print("🎉 All tests passed! Integration is ready.")
        print("\nNext steps:")
        print("1. Run the main scraper: python3 tradingview_playwright_scraper_upload.py")
        print("2. Check database for corporate_dividends and corporate_splits tables")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
