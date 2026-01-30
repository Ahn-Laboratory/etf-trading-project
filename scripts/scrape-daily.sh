#!/bin/bash
# 매일 TradingView 데이터 스크래핑 실행 스크립트
# 미국 정규장 마감 후 실행 (5 PM ET = 22:00 UTC, 월~금)
# cron: 0 22 * * 1-5 /home/ahnbi2/etf-trading-project/scripts/scrape-daily.sh

# PATH 설정 (cron 환경용)
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

LOG_DIR="/home/ahnbi2/etf-trading-project/logs"
LOG_FILE="$LOG_DIR/scraper-$(date +%Y%m%d).log"
PROJECT_DIR="/home/ahnbi2/etf-trading-project"
SCRAPER_DIR="$PROJECT_DIR/data-scraping"

# Headless 모드 활성화
export HEADLESS=true

mkdir -p "$LOG_DIR"

echo "========================================" >> "$LOG_FILE"
echo "📊 일일 스크래핑 시작: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# 1. SSH 터널 확인 및 시작
if ! pgrep -f "ssh.*3306:127.0.0.1:5100" > /dev/null; then
    echo "📡 SSH 터널 시작..." >> "$LOG_FILE"
    ssh -f -N -L 3306:127.0.0.1:5100 ahnbi2@ahnbi2.suwon.ac.kr \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 2>> "$LOG_FILE"

    if [ $? -ne 0 ]; then
        echo "❌ SSH 터널 시작 실패" >> "$LOG_FILE"
        exit 1
    fi

    sleep 3
    echo "✅ SSH 터널 시작 완료" >> "$LOG_FILE"
else
    echo "✅ SSH 터널 이미 실행 중" >> "$LOG_FILE"
fi

# 2. Poetry 환경 확인
cd "$SCRAPER_DIR"

if [ ! -d ".venv" ]; then
    echo "⚙️  Poetry 환경 설정 중..." >> "$LOG_FILE"
    poetry install >> "$LOG_FILE" 2>&1

    if [ $? -ne 0 ]; then
        echo "❌ Poetry 환경 설정 실패" >> "$LOG_FILE"
        exit 1
    fi
fi

# 3. TradingView 스크래퍼 실행
echo "🚀 스크래퍼 실행 중..." >> "$LOG_FILE"
echo "Headless 모드: $HEADLESS" >> "$LOG_FILE"

START_TIME=$(date +%s)

poetry run python tradingview_playwright_scraper_upload.py >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 4. 결과 확인
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ 스크래핑 성공 (소요시간: ${DURATION}초)" >> "$LOG_FILE"
    echo "완료 시간: $(date)" >> "$LOG_FILE"
else
    echo "❌ 스크래핑 실패 (Exit Code: $EXIT_CODE)" >> "$LOG_FILE"
    echo "에러 발생 시간: $(date)" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# 5. 요약 출력 (stdout)
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ 일일 스크래핑 완료 (${DURATION}초)"
else
    echo "❌ 스크래핑 실패 - 로그 확인: $LOG_FILE"
fi

exit $EXIT_CODE
