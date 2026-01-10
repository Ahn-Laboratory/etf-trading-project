#!/bin/bash
# cron 작업 설정 스크립트

PROJECT_DIR="/Users/jeong-uchang/etf-trading-project"

echo "📅 Cron 작업 설정"
echo "================="
echo ""
echo "다음 작업을 crontab에 추가합니다:"
echo ""
echo "1. 매일 오전 8시 - 전체 종목 예측"
echo "2. 매월 1일 새벽 3시 - 모델 학습"
echo ""

# 현재 crontab 백업
crontab -l > /tmp/crontab_backup 2>/dev/null

# 기존 ETF 관련 작업 제거 후 새로 추가
(crontab -l 2>/dev/null | grep -v "etf-trading-project") | crontab -

# 새 작업 추가
(crontab -l 2>/dev/null; echo "# ETF Trading Pipeline - 매일 예측 (오전 8시)") | crontab -
(crontab -l 2>/dev/null; echo "0 8 * * * $PROJECT_DIR/scripts/predict-daily.sh >> $PROJECT_DIR/logs/cron.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "") | crontab -
(crontab -l 2>/dev/null; echo "# ETF Trading Pipeline - 월간 학습 (매월 1일 새벽 3시)") | crontab -
(crontab -l 2>/dev/null; echo "0 3 1 * * $PROJECT_DIR/scripts/train-monthly.sh >> $PROJECT_DIR/logs/cron.log 2>&1") | crontab -

echo "✅ Cron 작업 설정 완료!"
echo ""
echo "현재 설정된 cron 작업:"
crontab -l | grep -A1 "ETF Trading"
echo ""
echo "📝 로그 위치: $PROJECT_DIR/logs/"
