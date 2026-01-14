#!/bin/bash
# 개발 모드 - ML 서비스는 Docker, 웹 대시보드는 로컬
# 웹 대시보드 코드 수정 시 핫 리로딩 지원

cd "$(dirname "$0")"

echo "🔧 개발 모드 시작..."

# OS 감지
OS_NAME=$(uname)

# 1. SSH 터널 시작
if [ "$OS_NAME" = "Darwin" ]; then
    BIND_ADDRESS="127.0.0.1"
else
    BIND_ADDRESS="0.0.0.0"
fi

if ! pgrep -f "ssh.*3306:127.0.0.1:5100" > /dev/null; then
    echo "📡 SSH 터널 시작 중..."
    ssh -f -N -L ${BIND_ADDRESS}:3306:127.0.0.1:5100 ahnbi2@ahnbi2.suwon.ac.kr \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3
    sleep 2
    echo "✅ SSH 터널 시작됨"
else
    echo "✅ SSH 터널 이미 실행 중"
fi

# 2. ML 서비스만 Docker로 시작
echo "🐳 ML 서비스 시작 중..."
docker compose up -d ml-service

# ML 서비스 헬스체크 대기
echo -n "⏳ ML 서비스 준비 대기 중"
for i in $(seq 1 30); do
    if curl -s http://localhost:8000/health >/dev/null 2>&1; then
        echo ""
        echo "✅ ML 서비스 준비 완료 (http://localhost:8000)"
        break
    fi
    echo -n "."
    sleep 1
done

# 3. 웹 대시보드 로컬 실행
echo ""
echo "🌐 웹 대시보드 로컬 실행..."
echo ""
echo "📍 접속 URL:"
echo "   웹 대시보드: http://localhost:3000"
echo "   API 문서:    http://localhost:8000/docs"
echo "   헬스체크:    http://localhost:8000/health"
echo ""
echo "💡 코드 수정 시 자동으로 반영됩니다 (핫 리로딩)"
echo "💡 종료하려면 Ctrl+C"
echo ""

cd web-dashboard
npm run dev
