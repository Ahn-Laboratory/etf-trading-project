"""
AhnLab LGBM Rank feature engineering module.

This module contains feature engineering logic extracted from the AhnLab
competition solution (AhnLab_LGBM_rank_0.19231/train.py).

Usage:
    from app.features.ahnlab import (
        add_engineered_features,
        add_cross_sectional_zscores,
        add_cross_sectional_ranks,
        add_relevance_labels,
        ALL_FEATURE_COLS,
        add_technical_indicators,
        MacroDataCollector,
    )

    # Feature engineering pipeline
    panel = add_engineered_features(panel)
    panel = add_cross_sectional_zscores(panel)
    panel = add_cross_sectional_ranks(panel)
    df = add_relevance_labels(df)
"""

# Constants (feature definitions only, no model hyperparameters)
from .constants import (
    ALL_FEATURE_COLS,
    BASE_FEATURE_COLS,
    ENGINEERED_FEATURE_COLS,
    FEATURE_COLS,
    RANK_BASE_COLS,
    RANK_FEATURE_COLS,
    TARGET_HORIZON,
    ZS_BASE_COLS,
    ZS_FEATURE_COLS,
)

# Feature engineering functions
from .cross_sectional import add_cross_sectional_ranks, add_cross_sectional_zscores
from .engineered import add_engineered_features
from .target import add_relevance_labels
from .technical import add_technical_indicators, TECHNICAL_FEATURE_COLS
from .macro import MacroDataCollector, MACRO_FEATURE_COLS

__all__ = [
    # Constants
    "BASE_FEATURE_COLS",
    "ENGINEERED_FEATURE_COLS",
    "FEATURE_COLS",
    "ZS_BASE_COLS",
    "ZS_FEATURE_COLS",
    "RANK_BASE_COLS",
    "RANK_FEATURE_COLS",
    "ALL_FEATURE_COLS",
    "TARGET_HORIZON",
    "TECHNICAL_FEATURE_COLS",
    "MACRO_FEATURE_COLS",
    # Functions
    "add_engineered_features",
    "add_cross_sectional_zscores",
    "add_cross_sectional_ranks",
    "add_relevance_labels",
    "add_technical_indicators",
    "MacroDataCollector",
]
