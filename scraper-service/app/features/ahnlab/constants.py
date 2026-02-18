"""
Feature column definitions for the AhnLab pipeline.

This file contains only feature/column definitions used by the feature
engineering pipeline.  Model hyperparameters (LGB_PARAMS, NUM_BOOST_ROUND,
etc.) live in etf-model/src/models/ahnlab_constants.py.
"""

from typing import List

# Base features from raw data
BASE_FEATURE_COLS: List[str] = [
    "open",
    "high",
    "low",
    "close",
    "volume",
    "dividends",
    "stock_splits",
    "ret_1d",
    "ret_5d",
    "ret_20d",
    "ret_63d",
    "macd",
    "macd_signal",
    "macd_hist",
    "rsi_14",
    "rsi_28",
    "bb_upper",
    "bb_middle",
    "bb_lower",
    "bb_width",
    "bb_position",
    "atr_14",
    "obv",
    "ema_10",
    "ema_20",
    "ema_50",
    "ema_200",
    "sma_10",
    "sma_20",
    "sma_50",
    "stoch_k",
    "stoch_d",
    "adx",
    "cci",
    "willr",
    "mfi",
    "vwap",
    "volume_sma_20",
    "volume_ratio",
    "vix",
    "fed_funds_rate",
    "unemployment_rate",
    "cpi",
    "treasury_10y",
    "treasury_2y",
    "yield_curve",
    "oil_price",
    "usd_eur",
    "high_yield_spread",
]

# Engineered features computed from base features
ENGINEERED_FEATURE_COLS: List[str] = [
    "ret_10d",
    "ret_30d",
    "vol_20d",
    "vol_63d",
    "price_to_sma_50",
    "price_to_ema_200",
    "volume_trend",
    "close_to_high_52w",
    "ret_5d_20d_ratio",
    "momentum_strength",
    "volume_surge",
    "ret_vol_ratio_20d",
    "ret_vol_ratio_63d",
    "trend_acceleration",
    "close_to_high_20d",
    "close_to_high_63d",
    "close_to_high_126d",
    "ema_5",
    "ema_100",
    "price_to_ema_10",
    "price_to_ema_50",
    "ema_cross_short",
    "ema_cross_long",
    "ema_slope_20",
]

# Combined base + engineered features
FEATURE_COLS: List[str] = BASE_FEATURE_COLS + ENGINEERED_FEATURE_COLS

# Columns to apply cross-sectional z-score normalization
ZS_BASE_COLS: List[str] = [
    "vol_63d",
    "volume_sma_20",
    "obv",
    "vwap",
    "ema_200",
    "price_to_ema_200",
    "close_to_high_52w",
]
ZS_FEATURE_COLS: List[str] = [f"{col}_zs" for col in ZS_BASE_COLS]

# Columns to apply cross-sectional percentile ranking
RANK_BASE_COLS: List[str] = [
    "ret_20d",
    "ret_63d",
    "vol_20d",
    "momentum_strength",
    "volume_surge",
]
RANK_FEATURE_COLS: List[str] = [f"{col}_rank" for col in RANK_BASE_COLS]

# All feature columns for pipeline output
ALL_FEATURE_COLS: List[str] = FEATURE_COLS + ZS_FEATURE_COLS + RANK_FEATURE_COLS

# Target horizon (trading days ≈ 3 months)
TARGET_HORIZON = 63
