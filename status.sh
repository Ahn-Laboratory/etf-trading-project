#!/bin/bash
# ETF Trading Pipeline - 상태 확인 스크립트

echo "📊 ETF Trading Pipeline 상태"
echo "================================"

# Docker 상태
echo ""
echo "🐳 Docker:"
if docker ps --format "{{.Names}} - {{.Status}}" | grep -q "etf-ml-service"; then
    docker ps --format "   {{.Names}} - {{.Status}}" | grep "etf-ml-service"
else
    echo "   ❌ 컨테이너 실행 중 아님"
fi

# SSH 터널 상태
echo ""
echo "📡 SSH 터널:"
if pgrep -f "ssh.*3306:127.0.0.1:5100" > /dev/null; then
    echo "   ✅ 실행 중 (localhost:3306 → 원격:5100)"
else
    echo "   ❌ 실행 중 아님"
fi

# API 상태
echo ""
echo "🌐 API:"
health=$(curl -s http://localhost:8000/health 2>/dev/null)
if echo "$health" | grep -q "healthy"; then
    echo "   ✅ healthy"
    echo "   📊 문서: http://localhost:8000/docs"
else
    echo "   ❌ 응답 없음"
fi

echo ""
