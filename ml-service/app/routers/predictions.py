from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_remote_db, get_local_db
from app.services.prediction_service import PredictionService
from app.schemas import (
    PredictionResponse,
    PredictionListResponse,
    BatchPredictionRequest,
    BatchPredictionResponse
)

router = APIRouter()


def get_prediction_service(
    remote_db: Session = Depends(get_remote_db),
    local_db: Session = Depends(get_local_db)
) -> PredictionService:
    return PredictionService(remote_db, local_db)


# NOTE: /batch를 /{symbol}보다 먼저 선언해야 경로 충돌 방지
@router.post("/batch", response_model=BatchPredictionResponse)
def predict_batch(
    request: BatchPredictionRequest,
    service: PredictionService = Depends(get_prediction_service)
):
    """
    여러 종목 일괄 예측

    - **symbols**: 예측할 종목 목록 (None이면 전체)
    - **limit**: 최대 종목 수 (기본 10)
    """
    try:
        predictions = service.batch_predict(request.symbols, request.limit)

        return BatchPredictionResponse(
            total=request.limit,
            success=len(predictions),
            failed=request.limit - len(predictions) if request.symbols is None else 0,
            predictions=[PredictionResponse.model_validate(p) for p in predictions]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@router.post("/{symbol}", response_model=PredictionResponse)
def predict_single(
    symbol: str,
    timeframe: str = Query("D", description="시간프레임"),
    service: PredictionService = Depends(get_prediction_service)
):
    """
    단일 종목 예측 수행

    - **symbol**: 종목 코드 (예: AAPL, NVDA)
    - **timeframe**: 시간프레임 (기본: D=일봉)
    """
    try:
        prediction = service.predict(symbol.upper(), timeframe)
        return PredictionResponse.model_validate(prediction)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.get("", response_model=PredictionListResponse)
def list_predictions(
    symbol: Optional[str] = Query(None, description="종목 필터"),
    limit: int = Query(50, ge=1, le=100, description="조회 수"),
    offset: int = Query(0, ge=0, description="오프셋"),
    service: PredictionService = Depends(get_prediction_service)
):
    """
    저장된 예측 결과 조회

    - **symbol**: 종목 필터 (옵션)
    - **limit**: 조회 수 (기본 50, 최대 100)
    - **offset**: 페이지네이션 오프셋
    """
    predictions = service.get_predictions(symbol, limit, offset)

    return PredictionListResponse(
        count=len(predictions),
        predictions=[PredictionResponse.model_validate(p) for p in predictions]
    )


@router.get("/{prediction_id}", response_model=PredictionResponse)
def get_prediction(
    prediction_id: int,
    service: PredictionService = Depends(get_prediction_service)
):
    """예측 결과 상세 조회"""
    prediction = service.get_prediction_by_id(prediction_id)

    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    return PredictionResponse.model_validate(prediction)


@router.get("/latest/{symbol}", response_model=PredictionResponse)
def get_latest_prediction(
    symbol: str,
    service: PredictionService = Depends(get_prediction_service)
):
    """특정 종목의 최신 예측 조회"""
    prediction = service.get_latest_prediction(symbol.upper())

    if not prediction:
        raise HTTPException(status_code=404, detail=f"No prediction found for {symbol}")

    return PredictionResponse.model_validate(prediction)
