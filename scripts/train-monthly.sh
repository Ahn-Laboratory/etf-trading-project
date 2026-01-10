#!/bin/bash
# 매월 모델 학습/업데이트 스크립트
# cron: 0 3 1 * * /Users/jeong-uchang/etf-trading-project/scripts/train-monthly.sh

# PATH 설정 (cron 환경용)
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

LOG_DIR="/Users/jeong-uchang/etf-trading-project/logs"
LOG_FILE="$LOG_DIR/train-$(date +%Y%m).log"
PROJECT_DIR="/Users/jeong-uchang/etf-trading-project"

mkdir -p "$LOG_DIR"

echo "========================================" >> "$LOG_FILE"
echo "🎓 월간 학습 시작: $(date)" >> "$LOG_FILE"
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

# 2. 학습 API 호출 (현재 MVP는 단순 모델이므로 예측 정확도 분석만 수행)
echo "📈 이전 달 예측 정확도 분석..." >> "$LOG_FILE"

# 저장된 예측 결과 조회
PREDICTIONS=$(curl -s "http://localhost:8000/api/predictions?limit=100")
COUNT=$(echo "$PREDICTIONS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('count', 0))" 2>/dev/null)

echo "📊 저장된 예측 수: $COUNT" >> "$LOG_FILE"

# 3. TODO: 향후 고급 ML 모델 학습 로직 추가
# - LSTM/Transformer 모델 학습
# - MLflow로 실험 추적
# - 모델 버전 관리

echo "⚠️  현재 MVP 버전: 고급 ML 학습은 향후 구현 예정" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 4. 예측 DB 정리 (90일 이상 된 데이터 삭제 - 옵션)
# echo "🧹 오래된 예측 데이터 정리..." >> "$LOG_FILE"

echo "완료 시간: $(date)" >> "$LOG_FILE"
echo "✅ 월간 학습 완료"
