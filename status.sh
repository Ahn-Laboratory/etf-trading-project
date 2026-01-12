#!/bin/bash
# ETF Trading Pipeline - 상태 확인 스크립트

cd "$(dirname "$0")"

echo "📊 ETF Trading Pipeline 상태"
echo "================================"

# Docker 상태
echo ""
echo "🐳 Docker 컨테이너:"
if command -v docker >/dev/null 2>&1; then
    containers=$(docker ps --format "{{.Names}}" 2>/dev/null | grep -E "(etf-ml-service|etf-web-dashboard|etf-nginx)" || echo "")
    if [ ! -z "$containers" ]; then
        docker ps --format "   {{.Names}} - {{.Status}} - {{.Ports}}" | grep -E "(etf-ml-service|etf-web-dashboard|etf-nginx)" || true
    else
        echo "   ❌ 컨테이너 실행 중 아님"
        echo "   💡 시작하려면: ./start.sh"
    fi
else
    echo "   ❌ Docker가 설치되지 않음"
fi

# SSH 터널 상태
echo ""
echo "📡 SSH 터널:"
if pgrep -f "ssh.*3306:127.0.0.1:5100" > /dev/null; then
    echo "   ✅ 실행 중 (localhost:3306 → 원격:5100)"
else
    echo "   ❌ 실행 중 아님"
    echo "   💡 start.sh를 실행하면 자동으로 시작됩니다"
fi

# 서비스 헬스체크 (Nginx를 통해)
echo ""
echo "🌐 서비스 상태:"

# 헬스체크 함수
check_health() {
    local url=$1
    local name=$2
    
    if command -v wget >/dev/null 2>&1; then
        response=$(wget -q -O- --timeout=2 "$url" 2>/dev/null || echo "")
    elif command -v curl >/dev/null 2>&1; then
        response=$(curl -s --max-time 2 "$url" 2>/dev/null || echo "")
    elif command -v nc >/dev/null 2>&1; then
        if echo "$url" | grep -q "localhost"; then
            host=$(echo "$url" | sed 's|http://||' | cut -d: -f1)
            port=$(echo "$url" | sed 's|http://||' | cut -d: -f2 | cut -d/ -f1)
            if nc -zv "$host" "$port" >/dev/null 2>&1; then
                response="connected"
            else
                response=""
            fi
        fi
    fi
    
    if [ ! -z "$response" ]; then
        if echo "$response" | grep -qE "(healthy|status)"; then
            echo "   ✅ $name: 정상"
        else
            echo "   ⚠️  $name: 응답 있음 (상태 확인 필요)"
        fi
    else
        echo "   ❌ $name: 응답 없음"
    fi
}

# 헬스체크
check_health "http://localhost/health" "Nginx (포트 80)"
check_health "http://localhost/docs" "FastAPI 문서"

# 접근 URL 표시
echo ""
echo "🌍 접근 URL:"
echo "   외부:"
echo "   📊 웹 대시보드: http://ahnbi2.suwon.ac.kr/"
echo "   📖 API 문서: http://ahnbi2.suwon.ac.kr/docs"
echo "   💚 헬스체크: http://ahnbi2.suwon.ac.kr/health"
echo "   🔌 API: http://ahnbi2.suwon.ac.kr/api/predictions"
echo ""
echo "   로컬:"
echo "   📊 웹 대시보드: http://localhost/"
echo "   📖 API 문서: http://localhost/docs"
echo "   💚 헬스체크: http://localhost/health"

# 포트 사용 상태
echo ""
echo "🔌 포트 상태:"
for port in 80 3000 8000; do
    if ss -tlnp 2>/dev/null | grep -q ":$port "; then
        echo "   ✅ 포트 $port: 사용 중"
    else
        echo "   ❌ 포트 $port: 사용 안 함"
    fi
done

echo ""
