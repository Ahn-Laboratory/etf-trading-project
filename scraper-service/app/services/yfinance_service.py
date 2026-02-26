#!/usr/bin/env python3
"""
YFinance Corporate Actions Service

Fetches dividend and stock split data from Yahoo Finance via yfinance library.
"""

import logging
from typing import Optional, Dict, List
from datetime import datetime
import pandas as pd

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False
    yf = None

logger = logging.getLogger(__name__)


class YFinanceCorporateActionsService:
    """Service for fetching corporate actions from Yahoo Finance"""

    def __init__(self):
        """Initialize yfinance service"""
        if not YFINANCE_AVAILABLE:
            raise ImportError(
                "yfinance library not available. Install with: pip install yfinance"
            )
        logger.info("YFinance service initialized")

    def fetch_dividends(self, symbol: str) -> pd.DataFrame:
        """
        Fetch dividend history for a symbol.

        Args:
            symbol: Stock symbol (e.g., "AAPL")

        Returns:
            DataFrame with dividend data. Columns typically include:
            - Date: Declaration/Ex-date
            - Dividends: Dividend amount
        """
        try:
            logger.info(f"Fetching dividends for {symbol}...")
            ticker = yf.Ticker(symbol)
            dividends = ticker.dividends

            if dividends.empty:
                logger.info(f"No dividends found for {symbol}")
                return pd.DataFrame()

            # Convert index to datetime if not already
            if not isinstance(dividends.index, pd.DatetimeIndex):
                dividends.index = pd.to_datetime(dividends.index)

            # Reset index to make date a column
            df = dividends.reset_index()
            df.columns = ["ex_date", "amount"]

            logger.info(f"Found {len(df)} dividend records for {symbol}")
            return df

        except Exception as e:
            logger.error(f"Error fetching dividends for {symbol}: {e}")
            return pd.DataFrame()

    def fetch_splits(self, symbol: str) -> pd.DataFrame:
        """
        Fetch stock split history for a symbol.

        Args:
            symbol: Stock symbol (e.g., "AAPL")

        Returns:
            DataFrame with split data. Columns typically include:
            - Date: Split effective date
            - Splits: Split ratio (e.g., 4.0 for 4-for-1 split)
        """
        try:
            logger.info(f"Fetching splits for {symbol}...")
            ticker = yf.Ticker(symbol)
            splits = ticker.splits

            if splits.empty:
                logger.info(f"No splits found for {symbol}")
                return pd.DataFrame()

            # Convert index to datetime if not already
            if not isinstance(splits.index, pd.DatetimeIndex):
                splits.index = pd.to_datetime(splits.index)

            # Reset index to make date a column
            df = splits.reset_index()
            df.columns = ["ex_date", "split_ratio"]

            logger.info(f"Found {len(df)} split records for {symbol}")
            return df

        except Exception as e:
            logger.error(f"Error fetching splits for {symbol}: {e}")
            return pd.DataFrame()

    def fetch_corporate_actions(self, symbol: str) -> Dict[str, pd.DataFrame]:
        """
        Fetch all corporate actions (dividends and splits) for a symbol.

        Args:
            symbol: Stock symbol

        Returns:
            Dictionary with 'dividends' and 'splits' DataFrames
        """
        logger.info(f"Fetching corporate actions for {symbol}...")

        dividends = self.fetch_dividends(symbol)
        splits = self.fetch_splits(symbol)

        return {
            "dividends": dividends,
            "splits": splits
        }

    def get_dividend_summary(self, symbol: str) -> Dict:
        """
        Get summary statistics for dividends.

        Args:
            symbol: Stock symbol

        Returns:
            Dictionary with summary statistics
        """
        df = self.fetch_dividends(symbol)

        if df.empty:
            return {
                "count": 0,
                "total_amount": 0.0,
                "latest_date": None,
                "earliest_date": None
            }

        return {
            "count": len(df),
            "total_amount": float(df["amount"].sum()),
            "latest_date": df["ex_date"].max().isoformat(),
            "earliest_date": df["ex_date"].min().isoformat()
        }

    def get_split_summary(self, symbol: str) -> Dict:
        """
        Get summary statistics for splits.

        Args:
            symbol: Stock symbol

        Returns:
            Dictionary with summary statistics
        """
        df = self.fetch_splits(symbol)

        if df.empty:
            return {
                "count": 0,
                "latest_date": None,
                "earliest_date": None
            }

        return {
            "count": len(df),
            "latest_date": df["ex_date"].max().isoformat(),
            "earliest_date": df["ex_date"].min().isoformat()
        }


if __name__ == "__main__":
    # Example usage
    import sys

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )

    if not YFINANCE_AVAILABLE:
        print("yfinance not installed. Install with: pip install yfinance")
        sys.exit(1)

    if len(sys.argv) < 2:
        print("Usage: python yfinance_service.py <symbol>")
        print("Example: python yfinance_service.py AAPL")
        sys.exit(1)

    symbol = sys.argv[1]

    service = YFinanceCorporateActionsService()

    print(f"\n{'='*50}")
    print(f"Corporate Actions for {symbol}")
    print(f"{'='*50}\n")

    # Fetch and display dividends
    dividend_summary = service.get_dividend_summary(symbol)
    print(f"Dividends: {dividend_summary['count']} records")
    print(f"Total Amount: ${dividend_summary['total_amount']:.2f}")
    if dividend_summary['latest_date']:
        print(f"Latest: {dividend_summary['latest_date']}")
        print(f"Earliest: {dividend_summary['earliest_date']}")

    print()

    # Fetch and display splits
    split_summary = service.get_split_summary(symbol)
    print(f"Splits: {split_summary['count']} records")
    if split_summary['latest_date']:
        print(f"Latest: {split_summary['latest_date']}")
        print(f"Earliest: {split_summary['earliest_date']}")
