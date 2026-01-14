#!/bin/bash
# cron 작업 설정 스크립트

PROJECT_DIR="/home/ahnbi2/etf-trading-project"

echo "📅 Cron 작업 설정"
echo "================="
echo ""
echo "다음 작업을 crontab에 추가합니다:"
echo ""
echo "1. 매일 미국 장 마감 후 (5 PM ET = 22:00 UTC, 월~금) - 전체 종목 예측"
echo "2. 매주 일요일 새벽 2시 - 3개월 전 예측 수익률 업데이트"
echo "3. 매년 1월 1일 새벽 3시 - 모델 재학습"
echo ""

# 현재 crontab 백업
crontab -l > /tmp/crontab_backup 2>/dev/null

# 기존 ETF 관련 작업 제거 후 새로 추가
(crontab -l 2>/dev/null | grep -v "etf-trading-project") | crontab -

# 새 작업 추가
(crontab -l 2>/dev/null; echo "# ETF Trading Pipeline - 매일 예측 (미국 장 마감 후 5 PM ET = 22:00 UTC, 월~금)") | crontab -
(crontab -l 2>/dev/null; echo "0 22 * * 1-5 $PROJECT_DIR/scripts/predict-daily.sh >> $PROJECT_DIR/logs/cron.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "") | crontab -
(crontab -l 2>/dev/null; echo "# ETF Trading Pipeline - 주간 수익률 업데이트 (매주 일요일 새벽 2시)") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * 0 $PROJECT_DIR/scripts/update-returns.sh >> $PROJECT_DIR/logs/cron.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "") | crontab -
(crontab -l 2>/dev/null; echo "# ETF Trading Pipeline - 연간 모델 학습 (매년 1월 1일 새벽 3시)") | crontab -
(crontab -l 2>/dev/null; echo "0 3 1 1 * $PROJECT_DIR/scripts/train-yearly.sh >> $PROJECT_DIR/logs/cron.log 2>&1") | crontab -

echo "✅ Cron 작업 설정 완료!"
echo ""
echo "현재 설정된 cron 작업:"
crontab -l | grep -A1 "ETF Trading"
echo ""
echo "📝 로그 위치: $PROJECT_DIR/logs/"
