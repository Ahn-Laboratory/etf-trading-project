import pandas as pd
import numpy as np
from datetime import timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class SimplePredictor:
    """
    MVP용 단순 예측 모델
    RSI + MACD 기반 방향 예측
    """

    def __init__(self):
        self.rsi_oversold = 30  # 과매도
        self.rsi_overbought = 70  # 과매수

    def predict(self, df: pd.DataFrame) -> dict:
        """
        다음 날 주가 방향 예측

        Args:
            df: OHLCV + RSI + MACD 데이터프레임 (시간순 정렬)

        Returns:
            dict with target_date, predicted_close, direction, confidence, etc.
        """
        if len(df) < 5:
            raise ValueError("Not enough data for prediction (min 5 rows required)")

        latest = df.iloc[-1]

        # 현재 값들
        current_close = float(latest["close"])
        current_rsi = float(latest["rsi"]) if pd.notna(latest["rsi"]) else 50.0
        current_macd = float(latest["macd"]) if pd.notna(latest["macd"]) else 0.0

        # RSI 신호 계산 (-1 ~ 1)
        rsi_signal = self._calculate_rsi_signal(current_rsi)

        # MACD 신호 계산 (-1 ~ 1)
        macd_signal = self._calculate_macd_signal(df)

        # 모멘텀 신호 (최근 5일 변동률)
        momentum_signal = self._calculate_momentum_signal(df)

        # 종합 신호 (가중 평균)
        combined_signal = (
            rsi_signal * 0.3 +
            macd_signal * 0.4 +
            momentum_signal * 0.3
        )

        # 예측 변동률 계산
        predicted_change = combined_signal * 0.02  # 최대 ±2% 예측

        # 예측 종가
        predicted_close = current_close * (1 + predicted_change)

        # 방향 및 신뢰도
        direction = "UP" if combined_signal > 0 else "DOWN"
        confidence = min(abs(combined_signal) * 0.5 + 0.5, 0.95)

        # 다음 거래일 계산
        last_date = pd.to_datetime(latest["time"])
        target_date = self._get_next_trading_day(last_date)

        return {
            "target_date": target_date,
            "current_close": round(current_close, 2),
            "predicted_close": round(predicted_close, 2),
            "predicted_change_pct": round(predicted_change * 100, 2),
            "direction": direction,
            "confidence": round(confidence, 4),
            "rsi_value": round(current_rsi, 2),
            "macd_value": round(current_macd, 4),
            "signals": {
                "rsi": round(rsi_signal, 4),
                "macd": round(macd_signal, 4),
                "momentum": round(momentum_signal, 4),
                "combined": round(combined_signal, 4)
            }
        }

    def _calculate_rsi_signal(self, rsi: float) -> float:
        """
        RSI 기반 신호 계산
        - RSI < 30: 매수 신호 (양수)
        - RSI > 70: 매도 신호 (음수)
        - 30-70: 중립
        """
        if rsi < self.rsi_oversold:
            # 과매도 → 반등 예상
            return (self.rsi_oversold - rsi) / self.rsi_oversold
        elif rsi > self.rsi_overbought:
            # 과매수 → 하락 예상
            return -(rsi - self.rsi_overbought) / (100 - self.rsi_overbought)
        else:
            # 중립 구간
            return 0.0

    def _calculate_macd_signal(self, df: pd.DataFrame) -> float:
        """
        MACD 기반 신호 계산
        - MACD > 0 and 상승 추세: 매수 신호
        - MACD < 0 and 하락 추세: 매도 신호
        """
        if len(df) < 3:
            return 0.0

        recent_macd = df["macd"].tail(3).values
        if np.any(pd.isna(recent_macd)):
            return 0.0

        current_macd = recent_macd[-1]
        macd_change = recent_macd[-1] - recent_macd[-2]

        # MACD 값과 변화 방향을 모두 고려
        if current_macd > 0 and macd_change > 0:
            return min(current_macd / 0.5, 1.0)  # 정규화
        elif current_macd < 0 and macd_change < 0:
            return max(current_macd / 0.5, -1.0)
        elif macd_change > 0:
            return 0.3  # 약한 매수 신호
        elif macd_change < 0:
            return -0.3  # 약한 매도 신호
        else:
            return 0.0

    def _calculate_momentum_signal(self, df: pd.DataFrame) -> float:
        """최근 5일 모멘텀 기반 신호"""
        if len(df) < 5:
            return 0.0

        closes = df["close"].tail(5).values
        returns = (closes[-1] - closes[0]) / closes[0]

        # 수익률을 -1 ~ 1 범위로 정규화
        return np.clip(returns * 10, -1, 1)

    def _get_next_trading_day(self, date: pd.Timestamp) -> pd.Timestamp:
        """다음 거래일 계산 (주말 제외)"""
        next_day = date + timedelta(days=1)

        # 토요일이면 월요일로
        if next_day.weekday() == 5:
            next_day += timedelta(days=2)
        # 일요일이면 월요일로
        elif next_day.weekday() == 6:
            next_day += timedelta(days=1)

        return next_day
