from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from app.database import get_remote_db, get_local_db
from app.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(
    remote_db: Session = Depends(get_remote_db),
    local_db: Session = Depends(get_local_db)
):
    """서비스 상태 확인"""
    remote_status = "ok"
    local_status = "ok"

    # 원격 DB 연결 확인
    try:
        remote_db.execute(text("SELECT 1"))
    except Exception as e:
        remote_status = f"error: {str(e)[:50]}"

    # 로컬 DB 연결 확인
    try:
        local_db.execute(text("SELECT 1"))
    except Exception as e:
        local_status = f"error: {str(e)[:50]}"

    overall_status = "healthy" if remote_status == "ok" and local_status == "ok" else "unhealthy"

    return HealthResponse(
        status=overall_status,
        remote_db=remote_status,
        local_db=local_status,
        timestamp=datetime.utcnow()
    )
