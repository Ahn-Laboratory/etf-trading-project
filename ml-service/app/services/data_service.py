from sqlalchemy import text
from sqlalchemy.orm import Session
import pandas as pd
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class DataService:
    """원격 MySQL에서 주가 데이터를 조회하는 서비스"""

    def __init__(self, db: Session):
        self.db = db

    def list_symbols(self) -> list[str]:
        """사용 가능한 종목 목록 조회 (일봉 테이블 기준)"""
        query = text("""
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = 'etf2_db'
            AND TABLE_NAME LIKE '%_D'
            ORDER BY TABLE_NAME
        """)

        result = self.db.execute(query)
        symbols = [row[0].replace("_D", "") for row in result]
        return symbols

    def get_stock_data(
        self,
        symbol: str,
        timeframe: str = "D",
        limit: int = 100
    ) -> pd.DataFrame:
        """
        주가 데이터 조회

        Args:
            symbol: 종목 코드 (예: AAPL, NVDA)
            timeframe: 시간프레임 (D=일봉, 1h=시간봉, 10m=10분봉)
            limit: 조회할 데이터 수

        Returns:
            DataFrame with columns: time, open, high, low, close, volume, rsi, macd
        """
        table_name = f"{symbol}_{timeframe}"

        query = text(f"""
            SELECT time, open, high, low, close, volume, rsi, macd
            FROM `{table_name}`
            ORDER BY time DESC
            LIMIT :limit
        """)

        try:
            result = self.db.execute(query, {"limit": limit})
            rows = result.fetchall()

            if not rows:
                return pd.DataFrame()

            df = pd.DataFrame(rows, columns=["time", "open", "high", "low", "close", "volume", "rsi", "macd"])

            # 데이터 타입 변환
            df["time"] = pd.to_datetime(df["time"])
            for col in ["open", "high", "low", "close", "rsi", "macd"]:
                df[col] = pd.to_numeric(df[col], errors="coerce")
            df["volume"] = pd.to_numeric(df["volume"], errors="coerce").fillna(0).astype(int)

            # 시간순 정렬 (오래된 것 → 최신)
            df = df.sort_values("time").reset_index(drop=True)

            return df

        except Exception as e:
            logger.error(f"Failed to fetch data for {symbol}: {e}")
            raise

    def get_latest_data(self, symbol: str, timeframe: str = "D") -> Optional[dict]:
        """최신 데이터 1개 조회"""
        df = self.get_stock_data(symbol, timeframe, limit=1)
        if df.empty:
            return None
        return df.iloc[-1].to_dict()

    def check_table_exists(self, symbol: str, timeframe: str = "D") -> bool:
        """테이블 존재 여부 확인"""
        table_name = f"{symbol}_{timeframe}"
        query = text("""
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = 'etf2_db'
            AND TABLE_NAME = :table_name
        """)

        result = self.db.execute(query, {"table_name": table_name})
        count = result.scalar()
        return count > 0
