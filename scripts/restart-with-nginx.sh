#!/bin/bash
# Nginx를 포함한 전체 서비스 재시작

cd "$(dirname "$0")/.."

echo "🔄 서비스 재시작 중 (Nginx 포함)..."

# 1. 기존 서비스 중지
echo "📌 기존 서비스 중지..."
docker compose down 2>/dev/null || true

# 2. 기존 프로세스 중지 (포트 3000, 8000 사용 중인 프로세스)
echo "📌 포트 3000, 8000 사용 중인 프로세스 확인..."
for port in 3000 8000; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pid" ]; then
        echo "  포트 $port 사용 중인 프로세스 (PID: $pid) 종료..."
        sudo kill -9 $pid 2>/dev/null || true
    fi
done

# 3. Docker Compose로 재시작
echo "🐳 Docker Compose로 서비스 시작..."
docker compose up -d --build

# 4. 서비스 상태 확인
echo ""
echo "⏳ 서비스 시작 대기 중..."
sleep 5

# 5. 상태 확인
echo ""
echo "📊 서비스 상태:"
docker compose ps

echo ""
echo "✅ 서비스 재시작 완료!"
echo ""
echo "🌐 접근 URL:"
echo "   - 웹 대시보드: http://ahnbi2.suwon.ac.kr/"
echo "   - API: http://ahnbi2.suwon.ac.kr/api/predictions"
echo "   - API 문서: http://ahnbi2.suwon.ac.kr/docs"
echo "   - 헬스체크: http://ahnbi2.suwon.ac.kr/health"

