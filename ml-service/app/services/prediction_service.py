from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import logging

from app.models import Prediction
from app.services.data_service import DataService
from app.services.ml_model import SimplePredictor
from app.schemas import PredictionResponse

logger = logging.getLogger(__name__)


class PredictionService:
    """예측 수행 및 결과 저장 서비스"""

    def __init__(self, remote_db: Session, local_db: Session):
        self.remote_db = remote_db
        self.local_db = local_db
        self.data_service = DataService(remote_db)
        self.predictor = SimplePredictor()

    def predict(self, symbol: str, timeframe: str = "D") -> Prediction:
        """
        단일 종목 예측 수행

        Args:
            symbol: 종목 코드
            timeframe: 시간프레임

        Returns:
            Prediction 모델 객체
        """
        # 1. 데이터 조회
        df = self.data_service.get_stock_data(symbol, timeframe, limit=60)

        if df.empty:
            raise ValueError(f"No data found for {symbol}")

        if len(df) < 5:
            raise ValueError(f"Not enough data for {symbol} (got {len(df)} rows)")

        # 2. 예측 수행
        result = self.predictor.predict(df)

        # 3. 결과 저장
        prediction = Prediction(
            symbol=symbol,
            prediction_date=datetime.utcnow(),
            target_date=result["target_date"],
            current_close=result["current_close"],
            predicted_close=result["predicted_close"],
            predicted_direction=result["direction"],
            confidence=result["confidence"],
            rsi_value=result["rsi_value"],
            macd_value=result["macd_value"]
        )

        self.local_db.add(prediction)
        self.local_db.commit()
        self.local_db.refresh(prediction)

        logger.info(f"Prediction saved: {symbol} -> {result['direction']} (confidence: {result['confidence']:.2%})")

        return prediction

    def batch_predict(self, symbols: Optional[list[str]] = None, limit: int = 10) -> list[Prediction]:
        """
        여러 종목 일괄 예측

        Args:
            symbols: 예측할 종목 목록 (None이면 전체)
            limit: 최대 종목 수

        Returns:
            예측 결과 리스트
        """
        if symbols is None:
            symbols = self.data_service.list_symbols()[:limit]
        else:
            symbols = symbols[:limit]

        predictions = []
        failed = []

        for symbol in symbols:
            try:
                prediction = self.predict(symbol)
                predictions.append(prediction)
            except Exception as e:
                logger.error(f"Failed to predict {symbol}: {e}")
                failed.append({"symbol": symbol, "error": str(e)})

        logger.info(f"Batch prediction complete: {len(predictions)} success, {len(failed)} failed")

        return predictions

    def get_predictions(
        self,
        symbol: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[Prediction]:
        """저장된 예측 결과 조회"""
        query = self.local_db.query(Prediction)

        if symbol:
            query = query.filter(Prediction.symbol == symbol)

        return query.order_by(Prediction.created_at.desc()).offset(offset).limit(limit).all()

    def get_prediction_by_id(self, prediction_id: int) -> Optional[Prediction]:
        """ID로 예측 조회"""
        return self.local_db.query(Prediction).filter(Prediction.id == prediction_id).first()

    def get_latest_prediction(self, symbol: str) -> Optional[Prediction]:
        """특정 종목의 최신 예측 조회"""
        return (
            self.local_db.query(Prediction)
            .filter(Prediction.symbol == symbol)
            .order_by(Prediction.created_at.desc())
            .first()
        )
