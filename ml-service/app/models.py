from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from datetime import datetime
from app.database import Base


class Prediction(Base):
    """예측 결과 저장 모델 (로컬 SQLite)"""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False, index=True)
    prediction_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    target_date = Column(DateTime, nullable=False)
    current_close = Column(Float, nullable=False)
    predicted_close = Column(Float, nullable=False)
    predicted_direction = Column(String(10), nullable=False)  # UP or DOWN
    confidence = Column(Float, nullable=False)
    rsi_value = Column(Float, nullable=True)
    macd_value = Column(Float, nullable=True)
    actual_close = Column(Float, nullable=True)  # 나중에 업데이트
    is_correct = Column(Boolean, nullable=True)  # 나중에 업데이트
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Prediction {self.symbol} {self.target_date} {self.predicted_direction}>"
