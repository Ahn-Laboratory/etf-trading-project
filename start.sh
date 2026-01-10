#!/bin/bash
# ETF Trading Pipeline - 원클릭 시작 스크립트

cd "$(dirname "$0")"

echo "🚀 ETF Trading Pipeline 시작..."

# 1. SSH 터널 시작 (이미 있으면 스킵)
if ! pgrep -f "ssh.*3306:127.0.0.1:5100" > /dev/null; then
    echo "📡 SSH 터널 시작 중..."
    ssh -f -N -L 3306:127.0.0.1:5100 ahnbi2@ahnbi2.suwon.ac.kr \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3
    sleep 2
    echo "✅ SSH 터널 시작됨"
else
    echo "✅ SSH 터널 이미 실행 중"
fi

# 2. Docker 시작
echo "🐳 Docker 컨테이너 시작 중..."
docker-compose up -d

# 3. 헬스체크 대기
echo "⏳ 서비스 준비 대기 중..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        echo ""
        echo "✅ 서비스 시작 완료!"
        echo ""
        echo "📊 API 문서: http://localhost:8000/docs"
        echo "💚 헬스체크: http://localhost:8000/health"
        exit 0
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "❌ 서비스 시작 실패. 로그 확인: docker-compose logs"
exit 1
