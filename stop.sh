#!/bin/bash
# ETF Trading Pipeline - 원클릭 종료 스크립트

cd "$(dirname "$0")"

echo "🛑 ETF Trading Pipeline 종료..."

# 1. Docker 종료
echo "🐳 Docker 컨테이너 종료 중..."
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose down
elif [ -f ~/.docker/cli-plugins/docker-compose ] && ~/.docker/cli-plugins/docker-compose version >/dev/null 2>&1; then
    ~/.docker/cli-plugins/docker-compose down
else
    echo "⚠️  Docker Compose v2를 찾을 수 없습니다"
    echo "💡 Docker Compose v2 설치 필요"
fi

# 2. SSH 터널 종료 (선택적 - 보통 유지)
echo "📡 SSH 터널 확인 중..."
echo "   SSH 터널은 수동으로 유지 중입니다 (종료하려면: pkill -f 'ssh.*3306:127.0.0.1:5100')"

echo "✅ Docker 서비스 종료 완료!"
echo ""
echo "💡 SSH 터널은 계속 실행 중입니다."
echo "   완전 종료하려면: pkill -f 'ssh.*3306:127.0.0.1:5100'"
