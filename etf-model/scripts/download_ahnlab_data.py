#!/usr/bin/env python3
"""Standalone script to download stock and macro data for ETF trading project.

This script downloads historical stock data from Yahoo Finance and macroeconomic
indicators from FRED, computes technical indicators, and builds panel data.

Usage:
    python scripts/download_ahnlab_data.py --years 2020 2021 2022 2023 2024
    python scripts/download_ahnlab_data.py --years 2020 --start 2010-01-01 --end 2020-12-31
"""

import argparse
import os
import sys
import warnings
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Set

import numpy as np
import pandas as pd
import pandas_ta as ta
import yfinance as yf
from dotenv import load_dotenv
from fredapi import Fred
from tqdm import tqdm

warnings.filterwarnings("ignore")

# Add project root to path
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Configuration
DEFAULT_START_DATE = "2010-01-01"
DEFAULT_END_DATE = datetime.now().strftime("%Y-%m-%d")
MIN_HISTORY_DAYS = 100
RETRY_ATTEMPTS = 3

# FRED indicator mappings
FRED_INDICATORS = {
    "VIXCLS": "vix",
    "DFF": "fed_funds_rate",
    "UNRATE": "unemployment_rate",
    "CPIAUCSL": "cpi",
    "DGS10": "treasury_10y",
    "DGS2": "treasury_2y",
    "T10Y2Y": "yield_curve",
    "DCOILWTICO": "oil_price",
    "DEXUSEU": "usd_eur",
    "BAMLH0A0HYM2": "high_yield_spread",
}

# Target calculation horizon
TARGET_HORIZON = 63  # ~3 months in trading days


def add_target(panel: pd.DataFrame) -> pd.DataFrame:
    """Add 3-month future return target for training.

    Args:
        panel: Panel DataFrame with ticker, date, and close columns.

    Returns:
        Panel with target_3m (future return) and target_date columns.
    """
    panel = panel.copy()
    future_close = panel.groupby("ticker")["close"].shift(-TARGET_HORIZON)
    future_date = panel.groupby("ticker")["date"].shift(-TARGET_HORIZON)
    panel["target_3m"] = future_close / panel["close"] - 1
    panel["target_date"] = future_date
    return panel


def setup_logging():
    """Configure logging for the script."""
    import logging

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    return logging.getLogger(__name__)


logger = setup_logging()


def load_env_config():
    """Load environment variables from .env file."""
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists():
        load_dotenv(env_file)
        logger.info(f"Loaded environment from {env_file}")
    else:
        logger.warning(f"No .env file found at {env_file}")

    fred_api_key = os.environ.get("FRED_API_KEY", "")
    if not fred_api_key:
        logger.warning("FRED_API_KEY not found in environment")

    return fred_api_key


def load_tickers_from_universe(years: List[int], data_dir: Path) -> List[str]:
    """Load unique tickers from universe files for specified years.

    Args:
        years: List of years to load universe files for.
        data_dir: Directory containing universe CSV files.

    Returns:
        Sorted list of unique ticker symbols.
    """
    all_tickers: Set[str] = set()

    logger.info(f"Loading tickers from {len(years)} universe files...")

    for year in years:
        ticker_file = data_dir / f"{year}_final_universe.csv"

        if not ticker_file.exists():
            logger.warning(f"Universe file not found: {ticker_file}")
            continue

        try:
            df = pd.read_csv(ticker_file)
            tickers = df["ticker"].str.strip().tolist()
            all_tickers.update(tickers)
            logger.info(f"  {year}: Loaded {len(tickers)} tickers")
        except Exception as e:
            logger.error(f"  {year}: Failed to load - {e}")

    tickers_list = sorted(list(all_tickers))
    logger.info(f"Total unique tickers: {len(tickers_list)}")

    return tickers_list


def download_stock_data(
    tickers: List[str],
    start_date: str,
    end_date: str,
    min_history_days: int = MIN_HISTORY_DAYS,
) -> Dict[str, pd.DataFrame]:
    """Download historical stock data with retry logic.

    Args:
        tickers: List of ticker symbols to download.
        start_date: Start date in YYYY-MM-DD format.
        end_date: End date in YYYY-MM-DD format.
        min_history_days: Minimum required history days.

    Returns:
        Dictionary mapping ticker to DataFrame with OHLCV data.
    """
    stock_data = {}
    failed_tickers = []

    logger.info(f"\nDownloading stock data for {len(tickers)} tickers...")
    logger.info(f"Date range: {start_date} to {end_date}")

    for ticker in tqdm(tickers, desc="Downloading stocks"):
        success = False

        for attempt in range(RETRY_ATTEMPTS):
            try:
                stock = yf.Ticker(ticker)
                df = stock.history(start=start_date, end=end_date, auto_adjust=True)

                if df.empty or len(df) < min_history_days:
                    if attempt == RETRY_ATTEMPTS - 1:
                        logger.debug(f"  {ticker}: Insufficient data (rows: {len(df)})")
                    continue

                # Normalize column names
                df.columns = df.columns.str.lower()
                df = df.rename(columns={"stock splits": "stock_splits"})

                if "close" not in df.columns:
                    if attempt == RETRY_ATTEMPTS - 1:
                        logger.debug(f"  {ticker}: Missing 'close' column")
                    continue

                df["ticker"] = ticker
                stock_data[ticker] = df
                success = True
                break

            except Exception as e:
                if attempt == RETRY_ATTEMPTS - 1:
                    logger.debug(f"  {ticker}: Download failed - {e}")
                continue

        if not success:
            failed_tickers.append(ticker)

    logger.info(f"Successfully downloaded: {len(stock_data)} stocks")
    if failed_tickers:
        logger.info(f"Failed to download: {len(failed_tickers)} stocks")

    return stock_data


def add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Add comprehensive technical indicators to stock data.

    Args:
        df: DataFrame with OHLCV columns.

    Returns:
        DataFrame with added technical indicators.
    """
    try:
        close = df["close"]
        high = df["high"]
        low = df["low"]
        volume = df["volume"]

        # Returns
        df["ret_1d"] = close.pct_change(1)
        df["ret_5d"] = close.pct_change(5)
        df["ret_20d"] = close.pct_change(20)
        df["ret_63d"] = close.pct_change(63)

        # MACD
        macd = ta.macd(close, fast=12, slow=26, signal=9)
        if macd is not None and not macd.empty:
            macd_cols = macd.columns.tolist()
            macd_col = [
                c for c in macd_cols
                if "MACD_" in c and "h" not in c and "s" not in c.lower()
            ]
            signal_col = [
                c for c in macd_cols
                if "MACD" in c and ("s" in c.lower() or "signal" in c.lower()) and "h" not in c
            ]
            hist_col = [c for c in macd_cols if "MACD" in c and "h" in c.lower()]

            if macd_col:
                df["macd"] = macd[macd_col[0]]
            if signal_col:
                df["macd_signal"] = macd[signal_col[0]]
            if hist_col:
                df["macd_hist"] = macd[hist_col[0]]

        # RSI
        df["rsi_14"] = ta.rsi(close, length=14)
        df["rsi_28"] = ta.rsi(close, length=28)

        # Bollinger Bands
        bbands = ta.bbands(close, length=20, std=2)
        if bbands is not None and not bbands.empty:
            bb_cols = bbands.columns.tolist()
            upper_col = [c for c in bb_cols if "BBU" in c][0] if any("BBU" in c for c in bb_cols) else None
            middle_col = [c for c in bb_cols if "BBM" in c][0] if any("BBM" in c for c in bb_cols) else None
            lower_col = [c for c in bb_cols if "BBL" in c][0] if any("BBL" in c for c in bb_cols) else None

            if upper_col and middle_col and lower_col:
                df["bb_upper"] = bbands[upper_col]
                df["bb_middle"] = bbands[middle_col]
                df["bb_lower"] = bbands[lower_col]
                df["bb_width"] = (df["bb_upper"] - df["bb_lower"]) / (df["bb_middle"] + 1e-8)
                df["bb_position"] = (close - df["bb_lower"]) / (df["bb_upper"] - df["bb_lower"] + 1e-8)

        # ATR
        df["atr_14"] = ta.atr(high, low, close, length=14)

        # OBV
        df["obv"] = ta.obv(close, volume)

        # EMAs
        df["ema_10"] = ta.ema(close, length=10)
        df["ema_20"] = ta.ema(close, length=20)
        df["ema_50"] = ta.ema(close, length=50)
        df["ema_200"] = ta.ema(close, length=200)

        # SMAs
        df["sma_10"] = ta.sma(close, length=10)
        df["sma_20"] = ta.sma(close, length=20)
        df["sma_50"] = ta.sma(close, length=50)

        # Stochastic
        stoch = ta.stoch(high, low, close, k=14, d=3)
        if stoch is not None and not stoch.empty:
            stoch_cols = stoch.columns.tolist()
            k_col = [c for c in stoch_cols if "STOCHk" in c or "K_" in c]
            d_col = [c for c in stoch_cols if "STOCHd" in c or "D_" in c]
            if k_col:
                df["stoch_k"] = stoch[k_col[0]]
            if d_col:
                df["stoch_d"] = stoch[d_col[0]]

        # ADX
        adx_result = ta.adx(high, low, close, length=14)
        if adx_result is not None and not adx_result.empty:
            adx_cols = [
                c for c in adx_result.columns
                if "ADX" in c and "DMP" not in c and "DMN" not in c
            ]
            if adx_cols:
                df["adx"] = adx_result[adx_cols[0]]

        # CCI
        df["cci"] = ta.cci(high, low, close, length=20)

        # Williams %R
        df["willr"] = ta.willr(high, low, close, length=14)

        # MFI
        df["mfi"] = ta.mfi(high, low, close, volume, length=14)

        # VWAP
        df["vwap"] = ta.vwap(high, low, close, volume)

        # Volume indicators
        df["volume_sma_20"] = ta.sma(volume, length=20)
        df["volume_ratio"] = volume / (df["volume_sma_20"] + 1e-8)

    except Exception as e:
        logger.error(f"  Failed to add technical indicators: {e}")

    return df


def download_fred_data(
    fred_api_key: str,
    start_date: str,
    end_date: str,
) -> Optional[pd.DataFrame]:
    """Download macroeconomic data from FRED.

    Args:
        fred_api_key: FRED API key.
        start_date: Start date in YYYY-MM-DD format.
        end_date: End date in YYYY-MM-DD format.

    Returns:
        DataFrame with macro indicators, or None if unavailable.
    """
    if not fred_api_key:
        logger.warning("FRED API key not provided - skipping macro data")
        return None

    logger.info("\nDownloading macroeconomic data from FRED...")

    try:
        fred = Fred(api_key=fred_api_key)
        fred_data = {}

        for fred_code, col_name in FRED_INDICATORS.items():
            try:
                series = fred.get_series(
                    fred_code,
                    observation_start=start_date,
                    observation_end=end_date,
                )
                fred_data[col_name] = series
                logger.info(f"  {col_name}: Downloaded {len(series)} observations")
            except Exception as e:
                logger.warning(f"  {col_name}: Download failed - {e}")

        if fred_data:
            macro_df = pd.DataFrame(fred_data)
            macro_df.index.name = "date"
            macro_df = macro_df.ffill()
            logger.info(f"FRED data shape: {macro_df.shape}")
            return macro_df

    except Exception as e:
        logger.error(f"FRED data download failed: {e}")

    return None


def build_panel_data(
    stock_data: Dict[str, pd.DataFrame],
    macro_data: Optional[pd.DataFrame],
) -> pd.DataFrame:
    """Build panel data combining stock and macro data.

    Args:
        stock_data: Dictionary mapping ticker to DataFrame.
        macro_data: Optional macro data DataFrame.

    Returns:
        Combined panel DataFrame.
    """
    logger.info("\nBuilding panel data...")

    all_frames = []

    for ticker, df in tqdm(stock_data.items(), desc="Adding technical indicators"):
        df_with_ta = add_technical_indicators(df.copy())
        df_with_ta["date"] = df_with_ta.index
        all_frames.append(df_with_ta)

    if not all_frames:
        logger.error("No stock data available to build panel")
        return pd.DataFrame()

    panel = pd.concat(all_frames, ignore_index=True)
    panel["date"] = pd.to_datetime(panel["date"])

    # Remove timezone info
    if panel["date"].dt.tz is not None:
        panel["date"] = panel["date"].dt.tz_localize(None)

    # Merge macro data
    if macro_data is not None:
        logger.info("Merging macroeconomic data...")
        macro_data = macro_data.reset_index()
        macro_data["date"] = pd.to_datetime(macro_data["date"])

        if macro_data["date"].dt.tz is not None:
            macro_data["date"] = macro_data["date"].dt.tz_localize(None)

        panel = pd.merge(panel, macro_data, on="date", how="left")
        panel = panel.sort_values(["ticker", "date"]).reset_index(drop=True)

        # Forward fill macro data within each ticker
        macro_cols = [col for col in macro_data.columns if col != "date"]
        for col in macro_cols:
            panel[col] = panel.groupby("ticker")[col].ffill().bfill()

    # Clean infinite values
    panel.replace([np.inf, -np.inf], np.nan, inplace=True)

    # Add target column (3-month future return)
    logger.info("Adding target_3m column...")
    panel = add_target(panel)

    logger.info(f"Panel data shape: {panel.shape}")
    logger.info(f"Date range: {panel['date'].min()} to {panel['date'].max()}")
    logger.info(f"Unique tickers: {panel['ticker'].nunique()}")

    return panel


def save_panel_data(panel: pd.DataFrame, output_dir: Path, filename_prefix: str = "stock_panel_data"):
    """Save panel data to CSV and Parquet formats.

    Args:
        panel: Panel DataFrame to save.
        output_dir: Output directory.
        filename_prefix: Prefix for output filenames.
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save CSV
    csv_file = output_dir / f"{filename_prefix}.csv"
    panel.to_csv(csv_file, index=False)
    logger.info(f"\nSaved CSV: {csv_file}")
    logger.info(f"  Size: {csv_file.stat().st_size / 1024 / 1024:.2f} MB")

    # Save Parquet
    parquet_file = output_dir / f"{filename_prefix}.parquet"
    panel.to_parquet(parquet_file, index=False)
    logger.info(f"Saved Parquet: {parquet_file}")
    logger.info(f"  Size: {parquet_file.stat().st_size / 1024 / 1024:.2f} MB")


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Download stock and macro data for ETF trading project",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "--years",
        type=int,
        nargs="+",
        default=[2020, 2021, 2022, 2023, 2024],
        help="Years to load universe files from (default: 2020-2024)",
    )

    parser.add_argument(
        "--start",
        type=str,
        default=DEFAULT_START_DATE,
        help=f"Start date in YYYY-MM-DD format (default: {DEFAULT_START_DATE})",
    )

    parser.add_argument(
        "--end",
        type=str,
        default=DEFAULT_END_DATE,
        help=f"End date in YYYY-MM-DD format (default: today)",
    )

    parser.add_argument(
        "--data-dir",
        type=str,
        default=str(PROJECT_ROOT / "data"),
        help="Directory containing universe CSV files (default: ./data)",
    )

    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(PROJECT_ROOT / "data"),
        help="Output directory for panel data (default: ./data)",
    )

    parser.add_argument(
        "--output-prefix",
        type=str,
        default="stock_panel_data",
        help="Prefix for output filenames (default: stock_panel_data)",
    )

    parser.add_argument(
        "--min-history-days",
        type=int,
        default=MIN_HISTORY_DAYS,
        help=f"Minimum required history days (default: {MIN_HISTORY_DAYS})",
    )

    parser.add_argument(
        "--no-macro",
        action="store_true",
        help="Skip macroeconomic data download",
    )

    return parser.parse_args()


def main():
    """Main execution function."""
    args = parse_args()

    logger.info("=" * 70)
    logger.info("ETF Trading Project - Data Download Script")
    logger.info("=" * 70)
    logger.info(f"Years: {args.years}")
    logger.info(f"Date range: {args.start} to {args.end}")
    logger.info(f"Data directory: {args.data_dir}")
    logger.info(f"Output directory: {args.output_dir}")
    logger.info("=" * 70)

    # Load configuration
    fred_api_key = load_env_config()

    # Convert paths
    data_dir = Path(args.data_dir)
    output_dir = Path(args.output_dir)

    # Load tickers from universe files
    tickers = load_tickers_from_universe(args.years, data_dir)

    if not tickers:
        logger.error("No tickers loaded - exiting")
        sys.exit(1)

    # Download stock data
    stock_data = download_stock_data(
        tickers=tickers,
        start_date=args.start,
        end_date=args.end,
        min_history_days=args.min_history_days,
    )

    if not stock_data:
        logger.error("No stock data downloaded - exiting")
        sys.exit(1)

    # Download macro data
    macro_data = None
    if not args.no_macro:
        macro_data = download_fred_data(
            fred_api_key=fred_api_key,
            start_date=args.start,
            end_date=args.end,
        )

    # Build panel data
    panel = build_panel_data(stock_data, macro_data)

    if panel.empty:
        logger.error("Failed to build panel data - exiting")
        sys.exit(1)

    # Save panel data
    save_panel_data(panel, output_dir, args.output_prefix)

    logger.info("\n" + "=" * 70)
    logger.info("Data download and processing complete!")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()
