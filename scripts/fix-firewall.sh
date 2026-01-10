#!/bin/bash
# 방화벽 포트 열기 스크립트

echo "=== 방화벽 포트 열기 ==="
echo ""

# UFW 상태 확인
echo "1. 현재 UFW 상태:"
sudo ufw status verbose

echo ""
echo "2. 포트 3000, 8000 열기:"
sudo ufw allow 3000/tcp comment "ETF Web Dashboard"
sudo ufw allow 8000/tcp comment "ETF ML Service API"

echo ""
echo "3. UFW 다시 로드:"
sudo ufw reload

echo ""
echo "4. 최종 상태 확인:"
sudo ufw status | grep -E '(3000|8000|Status)'

echo ""
echo "✅ 완료! 외부에서 접근 가능합니다:"
echo "   - http://ahnbi2.suwon.ac.kr:3000"
echo "   - http://ahnbi2.suwon.ac.kr:8000"


