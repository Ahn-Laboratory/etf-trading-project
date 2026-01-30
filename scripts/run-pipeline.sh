#!/bin/bash
# 마스터 데이터 파이프라인 스크립트
# 전체 데이터 수집 → 검증 → 예측 프로세스를 순차적으로 실행
#
# Usage:
#   ./scripts/run-pipeline.sh [--skip-validation] [--continue-on-error]
#
# Options:
#   --skip-validation     Skip data validation step
#   --continue-on-error   Continue pipeline even if validation fails

# PATH 설정 (cron 환경용)
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# 프로젝트 경로 설정
PROJECT_DIR="/home/ahnbi2/etf-trading-project"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
LOG_DIR="$PROJECT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_ONLY=$(date +%Y%m%d)
PIPELINE_LOG="$LOG_DIR/pipeline-${DATE_ONLY}.log"

# 옵션 파싱
SKIP_VALIDATION=false
CONTINUE_ON_ERROR=false

for arg in "$@"; do
    case $arg in
        --skip-validation)
            SKIP_VALIDATION=true
            shift
            ;;
        --continue-on-error)
            CONTINUE_ON_ERROR=true
            shift
            ;;
        *)
            ;;
    esac
done

# 로그 디렉토리 생성
mkdir -p "$LOG_DIR"

# 로그 함수
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$PIPELINE_LOG"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ ERROR: $1" | tee -a "$PIPELINE_LOG"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ SUCCESS: $1" | tee -a "$PIPELINE_LOG"
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  WARNING: $1" | tee -a "$PIPELINE_LOG"
}

# Slack 알림 함수 (옵션)
send_slack_notification() {
    local message="$1"
    local webhook_url="${SLACK_WEBHOOK_URL:-}"

    if [ -n "$webhook_url" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$webhook_url" 2>/dev/null || true
    fi
}

# 파이프라인 시작
log "========================================"
log "🚀 ETF 데이터 파이프라인 시작"
log "========================================"
log "타임스탬프: $TIMESTAMP"
log "옵션: skip_validation=$SKIP_VALIDATION, continue_on_error=$CONTINUE_ON_ERROR"
log ""

# 전체 시간 측정 시작
PIPELINE_START=$(date +%s)

# Step 1: 데이터 스크래핑
log "========================================="
log "Step 1/3: 데이터 스크래핑"
log "========================================="
log "스크립트: scrape-daily.sh"
log ""

SCRAPE_START=$(date +%s)

if [ -f "$SCRIPTS_DIR/scrape-daily.sh" ]; then
    bash "$SCRIPTS_DIR/scrape-daily.sh"
    SCRAPE_EXIT=$?
else
    log_error "scrape-daily.sh not found at $SCRIPTS_DIR"
    SCRAPE_EXIT=1
fi

SCRAPE_END=$(date +%s)
SCRAPE_DURATION=$((SCRAPE_END - SCRAPE_START))

if [ $SCRAPE_EXIT -eq 0 ]; then
    log_success "스크래핑 완료 (소요시간: ${SCRAPE_DURATION}초)"
else
    log_error "스크래핑 실패 (Exit Code: $SCRAPE_EXIT)"
    log_error "파이프라인 중단"

    # Slack 알림
    send_slack_notification "❌ ETF Pipeline Failed - Scraping step failed (Exit: $SCRAPE_EXIT)"

    # 파이프라인 중단
    log ""
    log "========================================"
    log "❌ 파이프라인 실패 - Step 1에서 중단됨"
    log "========================================"
    exit 1
fi

log ""

# Step 2: 데이터 검증
if [ "$SKIP_VALIDATION" = false ]; then
    log "========================================="
    log "Step 2/3: 데이터 검증"
    log "========================================="
    log "스크립트: validate_data.py"
    log ""

    VALIDATE_START=$(date +%s)

    if [ -f "$SCRIPTS_DIR/validate_data.py" ]; then
        # Python 가상환경 확인
        if command -v python3 &> /dev/null; then
            python3 "$SCRIPTS_DIR/validate_data.py" | tee -a "$PIPELINE_LOG"
            VALIDATE_EXIT=$?
        else
            log_error "python3 not found"
            VALIDATE_EXIT=1
        fi
    else
        log_error "validate_data.py not found at $SCRIPTS_DIR"
        VALIDATE_EXIT=1
    fi

    VALIDATE_END=$(date +%s)
    VALIDATE_DURATION=$((VALIDATE_END - VALIDATE_START))

    if [ $VALIDATE_EXIT -eq 0 ]; then
        log_success "데이터 검증 통과 (소요시간: ${VALIDATE_DURATION}초)"
    else
        log_warning "데이터 검증 실패 (Exit Code: $VALIDATE_EXIT)"

        if [ "$CONTINUE_ON_ERROR" = false ]; then
            log_error "파이프라인 중단 (--continue-on-error 옵션으로 계속 진행 가능)"

            # Slack 알림
            send_slack_notification "⚠️ ETF Pipeline Warning - Validation failed but stopped (Exit: $VALIDATE_EXIT)"

            log ""
            log "========================================"
            log "❌ 파이프라인 실패 - Step 2에서 중단됨"
            log "========================================"
            exit 1
        else
            log_warning "검증 실패했지만 계속 진행합니다 (--continue-on-error 옵션)"

            # Slack 알림
            send_slack_notification "⚠️ ETF Pipeline Warning - Validation failed but continuing (Exit: $VALIDATE_EXIT)"
        fi
    fi

    log ""
else
    log "========================================="
    log "Step 2/3: 데이터 검증 (건너뜀)"
    log "========================================="
    log "옵션: --skip-validation"
    log ""
    VALIDATE_EXIT=0
    VALIDATE_DURATION=0
fi

# Step 3: 예측 실행
log "========================================="
log "Step 3/3: 예측 실행"
log "========================================="
log "스크립트: predict-daily.sh"
log ""

PREDICT_START=$(date +%s)

if [ -f "$SCRIPTS_DIR/predict-daily.sh" ]; then
    bash "$SCRIPTS_DIR/predict-daily.sh"
    PREDICT_EXIT=$?
else
    log_error "predict-daily.sh not found at $SCRIPTS_DIR"
    PREDICT_EXIT=1
fi

PREDICT_END=$(date +%s)
PREDICT_DURATION=$((PREDICT_END - PREDICT_START))

if [ $PREDICT_EXIT -eq 0 ]; then
    log_success "예측 완료 (소요시간: ${PREDICT_DURATION}초)"
else
    log_error "예측 실패 (Exit Code: $PREDICT_EXIT)"

    # Slack 알림
    send_slack_notification "❌ ETF Pipeline Failed - Prediction step failed (Exit: $PREDICT_EXIT)"
fi

log ""

# 전체 파이프라인 종료
PIPELINE_END=$(date +%s)
PIPELINE_DURATION=$((PIPELINE_END - PIPELINE_START))

# 파이프라인 요약
log "========================================"
log "📊 파이프라인 실행 요약"
log "========================================"
log "전체 소요시간: ${PIPELINE_DURATION}초 ($(($PIPELINE_DURATION / 60))분 $(($PIPELINE_DURATION % 60))초)"
log ""
log "Step 1 - 스크래핑:  $([ $SCRAPE_EXIT -eq 0 ] && echo '✅ 성공' || echo '❌ 실패') (${SCRAPE_DURATION}초)"

if [ "$SKIP_VALIDATION" = false ]; then
    log "Step 2 - 검증:      $([ $VALIDATE_EXIT -eq 0 ] && echo '✅ 성공' || echo '❌ 실패') (${VALIDATE_DURATION}초)"
else
    log "Step 2 - 검증:      ⏭️  건너뜀"
fi

log "Step 3 - 예측:      $([ $PREDICT_EXIT -eq 0 ] && echo '✅ 성공' || echo '❌ 실패') (${PREDICT_DURATION}초)"
log ""

# 최종 결과 판정
if [ $SCRAPE_EXIT -eq 0 ] && [ $PREDICT_EXIT -eq 0 ]; then
    if [ "$SKIP_VALIDATION" = false ] && [ $VALIDATE_EXIT -ne 0 ] && [ "$CONTINUE_ON_ERROR" = true ]; then
        log "⚠️  파이프라인 완료 (검증 경고 있음)"
        log "========================================"

        # Slack 알림
        send_slack_notification "⚠️ ETF Pipeline Completed with Warnings - Validation failed but prediction succeeded (${PIPELINE_DURATION}s)"

        exit 2  # 경고와 함께 완료
    else
        log_success "모든 단계 완료!"
        log "========================================"

        # Slack 알림
        send_slack_notification "✅ ETF Pipeline Completed Successfully - All steps passed (${PIPELINE_DURATION}s)"

        exit 0
    fi
else
    log_error "파이프라인 실패"
    log "========================================"

    # 실패한 단계 상세
    if [ $SCRAPE_EXIT -ne 0 ]; then
        log_error "실패 단계: Step 1 (스크래핑)"
    fi
    if [ "$SKIP_VALIDATION" = false ] && [ $VALIDATE_EXIT -ne 0 ] && [ "$CONTINUE_ON_ERROR" = false ]; then
        log_error "실패 단계: Step 2 (검증)"
    fi
    if [ $PREDICT_EXIT -ne 0 ]; then
        log_error "실패 단계: Step 3 (예측)"
    fi

    log ""
    log "상세 로그: $PIPELINE_LOG"
    log "개별 로그:"
    log "  - 스크래핑: $LOG_DIR/scraper-${DATE_ONLY}.log"
    if [ "$SKIP_VALIDATION" = false ]; then
        log "  - 검증: $LOG_DIR/validation_*.json"
    fi
    log "  - 예측: $LOG_DIR/predict-${DATE_ONLY}.log"

    exit 1
fi
