#!/bin/bash
# Docker 권한 설정 스크립트

echo "🔧 Docker 권한 설정"
echo "===================="
echo ""

# docker 그룹 확인
if groups | grep -q docker; then
    echo "✅ 사용자가 이미 docker 그룹에 포함되어 있습니다."
    echo ""
    echo "그룹 변경사항을 적용하려면:"
    echo "  newgrp docker"
    echo ""
    echo "또는 재로그인하세요."
    exit 0
fi

echo "📋 docker 그룹에 사용자 추가 중..."
echo ""
echo "다음 명령을 실행하세요 (sudo 권한 필요):"
echo ""
echo "  sudo usermod -aG docker $USER"
echo ""
echo "⚠️  명령을 실행하면 아래 안내가 표시됩니다."
echo ""
echo "그룹 추가 후:"
echo "  1. newgrp docker 실행 (권장)"
echo "  2. 또는 재로그인"
echo ""
echo "확인:"
echo "  groups | grep docker"
echo "  docker ps"
echo ""

