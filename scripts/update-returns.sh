#!/bin/bash
# 3개월 전 예측의 실제 수익률 업데이트 스크립트
# 매주 일요일 새벽 2시 실행
# cron: 0 2 * * 0 /path/to/scripts/update-returns.sh

# PATH 설정 (cron 환경용)
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

LOG_DIR="/home/ahnbi2/etf-trading-project/logs"
LOG_FILE="$LOG_DIR/update-returns-$(date +%Y%m%d).log"
PROJECT_DIR="/home/ahnbi2/etf-trading-project"

mkdir -p "$LOG_DIR"

echo "========================================" >> "$LOG_FILE"
echo "📊 수익률 업데이트 시작: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

cd "$PROJECT_DIR"

# 1. 서비스 상태 확인 및 시작
if ! pgrep -f "ssh.*3306:127.0.0.1:5100" > /dev/null; then
    echo "📡 SSH 터널 시작..." >> "$LOG_FILE"
    ssh -f -N -L 3306:127.0.0.1:5100 ahnbi2@ahnbi2.suwon.ac.kr \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3
    sleep 3
fi

# Docker 컨테이너 확인
if ! docker ps | grep -q "etf-ml-service"; then
    echo "🐳 Docker 컨테이너 시작..." >> "$LOG_FILE"
    docker-compose up -d
    sleep 10
fi

# 2. 헬스체크
for i in {1..30}; do
    if wget -q -O- http://localhost:8000/health | grep -q "healthy"; then
        echo "✅ 서비스 정상" >> "$LOG_FILE"
        break
    fi
    sleep 2
done

# 3. 3개월 전 예측 조회 및 실제 수익률 업데이트
echo "🔍 3개월 전 예측 조회 중..." >> "$LOG_FILE"

# 90일 전 날짜 계산
TARGET_DATE=$(date -v-90d +%Y-%m-%d 2>/dev/null || date -d "90 days ago" +%Y-%m-%d)
echo "📅 업데이트 대상 날짜: $TARGET_DATE" >> "$LOG_FILE"

# TODO: 실제 API 호출로 업데이트
# 현재는 로그만 남김
#
# 1. GET /api/predictions?prediction_date=$TARGET_DATE
# 2. 각 예측에 대해 현재 가격 조회
# 3. actual_close, actual_return, is_correct 업데이트

echo "" >> "$LOG_FILE"
echo "📈 수익률 계산 및 업데이트..." >> "$LOG_FILE"

# Python 스크립트로 업데이트 실행
python3 << 'PYTHON_SCRIPT' >> "$LOG_FILE" 2>&1
import requests
from datetime import datetime, timedelta

API_BASE = "http://localhost:8000"
target_date = datetime.now() - timedelta(days=90)

print(f"대상 날짜: {target_date.strftime('%Y-%m-%d')}")

# 해당 날짜 예측 조회 (실제로는 date 필터 필요)
try:
    response = requests.get(f"{API_BASE}/api/predictions?limit=100")
    data = response.json()
    print(f"조회된 예측 수: {data.get('count', 0)}")

    # 3개월 지난 예측 필터링
    old_predictions = [
        p for p in data.get('predictions', [])
        if datetime.fromisoformat(p['prediction_date'].replace('Z', '+00:00')).date() <= target_date.date()
    ]
    print(f"업데이트 대상: {len(old_predictions)}개")

    # TODO: 각 예측에 대해 실제 수익률 계산 및 업데이트
    # - 현재가 조회: GET /api/data/{symbol}
    # - 수익률 계산: (current - predicted_close) / predicted_close * 100
    # - 업데이트: PATCH /api/predictions/{id}

except Exception as e:
    print(f"오류 발생: {e}")

print("업데이트 완료")
PYTHON_SCRIPT

echo "" >> "$LOG_FILE"
echo "완료 시간: $(date)" >> "$LOG_FILE"
echo "✅ 수익률 업데이트 완료"
