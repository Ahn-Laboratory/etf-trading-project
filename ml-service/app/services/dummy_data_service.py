"""더미 데이터 생성 서비스"""
import random
from datetime import datetime, timedelta
from typing import Optional

# 샘플 종목 데이터
SAMPLE_STOCKS = {
    "AAPL": {"name": "Apple Inc.", "sector": "Technology", "base_price": 175.0},
    "MSFT": {"name": "Microsoft Corp.", "sector": "Technology", "base_price": 380.0},
    "GOOGL": {"name": "Alphabet Inc.", "sector": "Technology", "base_price": 140.0},
    "AMZN": {"name": "Amazon.com Inc.", "sector": "Consumer Cyclical", "base_price": 180.0},
    "NVDA": {"name": "NVIDIA Corp.", "sector": "Technology", "base_price": 480.0},
    "META": {"name": "Meta Platforms Inc.", "sector": "Technology", "base_price": 500.0},
    "TSLA": {"name": "Tesla Inc.", "sector": "Consumer Cyclical", "base_price": 250.0},
    "JPM": {"name": "JPMorgan Chase", "sector": "Financial", "base_price": 195.0},
    "V": {"name": "Visa Inc.", "sector": "Financial", "base_price": 280.0},
    "JNJ": {"name": "Johnson & Johnson", "sector": "Healthcare", "base_price": 155.0},
}


def generate_candlestick_forecast(
    symbol: str,
    current_price: Optional[float] = None,
    days: int = 90,
    seed: Optional[int] = None
) -> list[dict]:
    """
    향후 N일간의 캔들스틱 더미 데이터 생성

    Args:
        symbol: 종목 코드
        current_price: 현재가 (None이면 샘플 데이터에서 가져옴)
        days: 생성할 일 수 (기본 90일)
        seed: 랜덤 시드 (재현성을 위해)

    Returns:
        OHLCV 딕셔너리 리스트
    """
    if seed is not None:
        random.seed(seed)
    else:
        # 같은 symbol에 대해 일관된 결과를 위해 symbol 해시 사용
        random.seed(hash(symbol) % (10 ** 9))

    # 현재가 결정
    if current_price is None:
        if symbol in SAMPLE_STOCKS:
            current_price = SAMPLE_STOCKS[symbol]["base_price"]
        else:
            current_price = 100.0 + random.uniform(0, 400)

    candles = []
    price = current_price
    today = datetime.now().date()
    
    # 다음 거래일부터 시작
    forecast_date = today + timedelta(days=1)
    # 첫 거래일이 주말이면 월요일로 이동
    while forecast_date.weekday() >= 5:
        forecast_date += timedelta(days=1)

    for i in range(days):
        # 일일 변동폭 결정 (평균 0%, 표준편차 2%)
        daily_return = random.gauss(0.0002, 0.02)  # 약간의 상승 편향

        # OHLC 생성
        open_price = price
        close_price = price * (1 + daily_return)

        # 장중 변동폭
        intraday_volatility = abs(daily_return) + random.uniform(0.005, 0.02)
        high_price = max(open_price, close_price) * (1 + intraday_volatility / 2)
        low_price = min(open_price, close_price) * (1 - intraday_volatility / 2)

        # 거래량 (기본 1000만주 ± 50%)
        volume = int(10_000_000 * random.uniform(0.5, 1.5))

        candles.append({
            "time": forecast_date.isoformat(),
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": volume
        })

        # 다음 날 시작가는 오늘 종가 기준
        price = close_price
        
        # 다음 거래일로 이동 (주말 건너뛰기)
        forecast_date += timedelta(days=1)
        while forecast_date.weekday() >= 5:
            forecast_date += timedelta(days=1)

    return candles


def generate_prediction_history(
    symbol: Optional[str] = None,
    days: int = 180,
    seed: Optional[int] = None
) -> list[dict]:
    """
    과거 N일간의 예측 히스토리 더미 데이터 생성

    Args:
        symbol: 종목 코드 (None이면 모든 샘플 종목)
        days: 생성할 일 수 (기본 180일)
        seed: 랜덤 시드

    Returns:
        예측 딕셔너리 리스트
    """
    if seed is not None:
        random.seed(seed)

    predictions = []
    today = datetime.now().date()
    symbols = [symbol] if symbol else list(SAMPLE_STOCKS.keys())

    for sym in symbols:
        stock = SAMPLE_STOCKS.get(sym, {"base_price": 100.0})
        base_price = stock["base_price"]

        for day_offset in range(days):
            prediction_date = today - timedelta(days=days - day_offset)

            # 주말 제외
            if prediction_date.weekday() >= 5:
                continue

            target_date = prediction_date + timedelta(days=90)  # 3개월 후 타겟

            # 예측 당시 가격 (약간의 변동 적용)
            price_offset = random.uniform(-0.2, 0.2)  # ±20%
            current_close = base_price * (1 + price_offset)

            # 예측 방향 및 신뢰도
            direction = random.choice(["UP", "DOWN"])
            confidence = random.uniform(0.55, 0.95)
            predicted_change = random.uniform(0.01, 0.05) * (1 if direction == "UP" else -1)
            predicted_close = current_close * (1 + predicted_change)

            # RSI/MACD 값
            rsi = random.uniform(20, 80)
            macd = random.uniform(-2, 2)

            # 3개월 이상 지난 예측은 실제 수익률 포함
            days_elapsed = (today - prediction_date).days
            actual_close = None
            actual_return = None
            is_correct = None

            if days_elapsed >= 90:
                # 실제 수익률 시뮬레이션 (예측 방향과 약간 상관관계)
                if random.random() < (0.4 + confidence * 0.3):  # 신뢰도에 따라 정확도 상승
                    actual_return = predicted_change * random.uniform(0.5, 1.5) * 100
                else:
                    actual_return = -predicted_change * random.uniform(0.5, 1.5) * 100

                actual_close = current_close * (1 + actual_return / 100)
                is_correct = (direction == "UP" and actual_return > 0) or \
                            (direction == "DOWN" and actual_return < 0)

            predictions.append({
                "id": len(predictions) + 1,
                "symbol": sym,
                "prediction_date": prediction_date.isoformat(),
                "target_date": target_date.isoformat(),
                "current_close": round(current_close, 2),
                "predicted_close": round(predicted_close, 2),
                "predicted_direction": direction,
                "confidence": round(confidence, 2),
                "rsi_value": round(rsi, 2),
                "macd_value": round(macd, 4),
                "actual_close": round(actual_close, 2) if actual_close else None,
                "actual_return": round(actual_return, 2) if actual_return else None,
                "is_correct": is_correct,
                "days_elapsed": days_elapsed,
                "has_performance": days_elapsed >= 90
            })

    # 날짜순 정렬 (최신순)
    predictions.sort(key=lambda x: x["prediction_date"], reverse=True)

    return predictions


def get_stock_info(symbol: str) -> dict:
    """종목 기본 정보 조회"""
    if symbol in SAMPLE_STOCKS:
        return {
            "symbol": symbol,
            "name": SAMPLE_STOCKS[symbol]["name"],
            "sector": SAMPLE_STOCKS[symbol]["sector"],
            "current_price": SAMPLE_STOCKS[symbol]["base_price"]
        }
    return {
        "symbol": symbol,
        "name": f"{symbol} Inc.",
        "sector": "Unknown",
        "current_price": 100.0
    }
