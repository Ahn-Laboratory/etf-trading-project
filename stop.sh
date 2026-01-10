#!/bin/bash
# ETF Trading Pipeline - 원클릭 종료 스크립트

cd "$(dirname "$0")"

echo "🛑 ETF Trading Pipeline 종료..."

# 1. Docker 종료
echo "🐳 Docker 컨테이너 종료 중..."
docker-compose down

# 2. SSH 터널 종료
echo "📡 SSH 터널 종료 중..."
pkill -f "ssh.*3306:127.0.0.1:5100" 2>/dev/null

echo "✅ 모든 서비스 종료 완료!"
