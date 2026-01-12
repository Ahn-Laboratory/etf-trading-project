#!/bin/bash
# ETF Trading Pipeline - 원클릭 시작 스크립트 (Nginx 포함)

cd "$(dirname "$0")"

echo "🚀 ETF Trading Pipeline 시작..."

# Docker 권한 확인
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker 권한 오류 발생"
    echo ""
    echo "💡 해결 방법:"
    echo ""
    
    # docker 그룹 확인
    if groups | grep -q docker; then
        echo "   ✅ 사용자가 docker 그룹에 포함되어 있습니다."
        echo "   🔄 그룹 변경사항이 아직 적용되지 않았습니다."
        echo ""
        echo "   다음 중 하나를 실행하세요:"
        echo "   1. newgrp docker"
        echo "   2. 재로그인"
        echo ""
        echo "   그 다음:"
        echo "   ./start.sh"
    else
        echo "   ❌ 사용자가 docker 그룹에 포함되어 있지 않습니다."
        echo ""
        echo "   다음 명령을 실행하여 docker 그룹에 추가하세요:"
        echo "   sudo usermod -aG docker $USER"
        echo ""
        echo "   그 다음 다음 중 하나를 실행:"
        echo "   1. newgrp docker  # 권장"
        echo "   2. 재로그인"
        echo ""
        echo "   확인:"
        echo "   groups | grep docker"
        echo "   docker ps"
        echo ""
        echo "   또는 임시로 sudo 사용 (권장하지 않음):"
        echo "   sudo ./start.sh"
    fi
    echo ""
    exit 1
fi

# 1. SSH 터널 시작 (이미 있으면 스킵)
# OS에 따라 바인딩 주소 결정
OS_NAME=$(uname)
if [ "$OS_NAME" = "Darwin" ]; then
    # macOS: Docker Desktop이 호스트의 localhost 포워딩을 처리하므로 127.0.0.1 사용
    BIND_ADDRESS="127.0.0.1"
    echo "🍎 macOS 감지: SSH 터널을 localhost($BIND_ADDRESS)에 바인딩"
else
    # Linux: Docker 컨테이너가 host.docker.internal로 접근하려면 호스트 IP(혹은 0.0.0.0)에 바인딩 필요
    BIND_ADDRESS="0.0.0.0"
    echo "🐧 Linux 감지: SSH 터널을 모든 인터페이스($BIND_ADDRESS)에 바인딩"
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

# 2. 기존 프로세스 정리 (포트 3000, 8000, 80 충돌 방지)
echo "🔍 기존 프로세스 확인 중..."
for port in 3000 8000 80; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pid" ]; then
        echo "  포트 $port 사용 중인 프로세스 (PID: $pid) 발견"
        # Docker 컨테이너가 아닌 경우에만 종료 시도
        if ! docker ps --format "{{.ID}}" 2>/dev/null | grep -q "$pid" 2>/dev/null; then
            # 일반 권한으로 종료 시도, 실패하면 sudo 사용
            if kill -9 $pid 2>/dev/null; then
                echo "  포트 $port 프로세스 종료됨"
            elif sudo kill -9 $pid 2>/dev/null; then
                echo "  포트 $port 프로세스 종료됨 (sudo 사용)"
            else
                echo "  ⚠️  포트 $port 프로세스 종료 실패 (권한 필요할 수 있음)"
            fi
        else
            echo "  포트 $port는 Docker 컨테이너에서 사용 중 - 무시"
        fi
    fi
done

# 3. Docker Compose로 서비스 시작
echo "🐳 Docker 컨테이너 시작 중..."

# Docker Compose v2 찾기 (PATH 또는 직접 경로)
DOCKER_COMPOSE_CMD=""
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif [ -f "$HOME/.docker/cli-plugins/docker-compose" ] && "$HOME/.docker/cli-plugins/docker-compose" version >/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="$HOME/.docker/cli-plugins/docker-compose"
else
    echo "❌ Docker Compose v2를 찾을 수 없습니다"
    echo "💡 Docker Compose v2 설치 필요:"
    echo "   mkdir -p ~/.docker/cli-plugins"
    echo "   wget -O ~/.docker/cli-plugins/docker-compose https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64"
    echo "   chmod +x ~/.docker/cli-plugins/docker-compose"
    exit 1
fi

echo "   사용할 명령: $DOCKER_COMPOSE_CMD"
$DOCKER_COMPOSE_CMD up -d --build

# 4. 헬스체크 대기 (Nginx를 통해 포트 80으로)
echo "⏳ 서비스 준비 대기 중..."
MAX_WAIT=90
PORT_READY=0
HTTP_READY=0

for i in $(seq 1 $MAX_WAIT); do
    # 1단계: 포트 80이 열려있는지 확인
    if [ $PORT_READY -eq 0 ]; then
        if nc -zv localhost 80 >/dev/null 2>&1 || ss -tlnp 2>/dev/null | grep -q ':80 '; then
            PORT_READY=1
            echo ""
            echo "   ✅ 포트 80 열림"
        fi
    fi
    
    # 2단계: HTTP 응답 확인 (포트가 열린 후에만)
    if [ $PORT_READY -eq 1 ]; then
        response=""
        if command -v wget >/dev/null 2>&1; then
            response=$(wget -q -O- --timeout=2 http://localhost/health 2>/dev/null || echo "")
        elif command -v curl >/dev/null 2>&1; then
            response=$(curl -s --max-time 2 http://localhost/health 2>/dev/null || echo "")
        fi
        
        if [ ! -z "$response" ]; then
            if echo "$response" | grep -qE "(healthy|status)"; then
                HTTP_READY=1
            fi
        fi
    fi
    
    # 두 단계 모두 완료되면 성공
    if [ $PORT_READY -eq 1 ] && [ $HTTP_READY -eq 1 ]; then
        echo ""
        echo "✅ 서비스 시작 완료!"
        echo ""
        echo "🌐 외부 접근 URL:"
        echo "   📊 웹 대시보드: http://ahnbi2.suwon.ac.kr/"
        echo "   📖 API 문서: http://ahnbi2.suwon.ac.kr/docs"
        echo "   💚 헬스체크: http://ahnbi2.suwon.ac.kr/health"
        echo "   🔌 API 엔드포인트: http://ahnbi2.suwon.ac.kr/api/predictions"
        echo ""
        echo "🏠 로컬 접근 URL:"
        echo "   📊 웹 대시보드: http://localhost/"
        echo "   📖 API 문서: http://localhost/docs"
        echo "   💚 헬스체크: http://localhost/health"
        echo ""
        
        # 컨테이너 상태 확인
        if [ ! -z "$DOCKER_COMPOSE_CMD" ]; then
            echo "📦 컨테이너 상태:"
            $DOCKER_COMPOSE_CMD ps 2>/dev/null || true
        fi
        
        exit 0
    fi
    
    echo -n "."
    sleep 1
done

# 타임아웃 시 상세 정보 제공
echo ""
echo "⚠️  서비스 시작 타임아웃"
echo ""
echo "📋 진단 정보:"
echo "   포트 80 상태:"
if ss -tlnp 2>/dev/null | grep -q ':80 '; then
    echo "   ✅ 포트 80 열림"
    ss -tlnp 2>/dev/null | grep ':80 ' | head -2
else
    echo "   ❌ 포트 80 닫힘"
fi

echo ""
echo "   컨테이너 상태:"
if [ ! -z "$DOCKER_COMPOSE_CMD" ]; then
    $DOCKER_COMPOSE_CMD ps 2>/dev/null || echo "   확인 불가"
else
    echo "   확인 불가 (Docker Compose 명령 없음)"
fi

echo ""
echo "   로그 확인:"
echo "   $DOCKER_COMPOSE_CMD logs nginx --tail 30"
echo "   $DOCKER_COMPOSE_CMD logs web-dashboard --tail 30"
echo "   $DOCKER_COMPOSE_CMD logs ml-service --tail 30"

echo ""
echo "❌ 서비스 시작 실패 또는 타임아웃"
echo "📋 로그 확인:"
if [ ! -z "$DOCKER_COMPOSE_CMD" ]; then
    echo "   $DOCKER_COMPOSE_CMD logs"
    echo "   $DOCKER_COMPOSE_CMD ps"
else
    echo "   docker logs <container-name>"
    echo "   docker ps"
fi
exit 1
