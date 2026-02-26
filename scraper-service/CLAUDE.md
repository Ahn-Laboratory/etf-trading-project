# CLAUDE.md - Scraper Service

## 규칙
1. 크롤링 관련 실행은 사용자가 직접 수행 - 실행 가이드라인만 제공

## Overview
TradingView 데이터 스크래핑을 API로 제공하는 FastAPI 서비스. Docker 컨테이너로 실행되며, 모니터링 대시보드와 연동됩니다. 두 가지 실행 방식을 지원: Docker API (권장) 및 레거시 호스트 스크립트.

## 폴더 구조

```
scraper-service/
├── Dockerfile
├── pyproject.toml
├── CLAUDE.md
├── .env.example
├── app/
│   ├── main.py                    # FastAPI 진입점
│   ├── config.py                  # 설정
│   ├── models/
│   │   └── task_info.py           # 작업 상태 모델
│   ├── routers/
│   │   ├── health.py              # 헬스체크
│   │   └── jobs.py                # 스크래핑 API
│   └── services/
│       ├── scraper.py             # Docker API 스크래퍼
│       ├── db_service.py          # DB 서비스 (corporate actions 포함)
│       ├── yfinance_service.py    # 배당금/분할 데이터
│       └── processed_db_service.py # 피처 처리 DB
├── scripts/
│   ├── tradingview_playwright_scraper_upload.py  # 레거시 호스트 스크래퍼
│   ├── db_service_host.py         # SSH 터널 버전 DB 서비스
│   └── process_features.py        # 피처 처리 CLI
├── tests/
│   └── test_yfinance_integration.py
├── downloads/                     # 런타임 데이터 (CSV 다운로드)
├── logs/                          # 런타임 데이터 (스크래핑 로그)
└── cookies.json                   # 런타임 데이터 (TradingView 세션)
```

## 두 가지 실행 방식

### 방식 1: Docker API (권장)

Docker 컨테이너 내에서 FastAPI 서비스를 통해 스크래핑을 실행합니다.

**장점:**
- 모니터링 대시보드 완전 연동
- task_info.json 자동 생성 및 업데이트
- API를 통한 제어 가능
- 일관된 실행 환경

**실행:**
```bash
# Docker 컨테이너 시작
docker compose up -d scraper-service

# 스크래핑 실행
curl -X POST http://localhost:8001/api/scrape

# 로그 확인
docker compose logs -f scraper-service
```

### 방식 2: 레거시 호스트 스크립트 (하위 호환)

호스트 시스템에서 직접 Playwright 스크래퍼를 실행합니다.

**주의:**
- SSH 터널 수동 설정 필요
- task_info.json 생성 안 됨 → 모니터링 대시보드 미연동
- Poetry 환경 필요

**실행:**
```bash
# 1. SSH 터널 시작 (필수)
ssh -f -N -L 3306:127.0.0.1:5100 ahnbi2@ahnbi2.suwon.ac.kr

# 2. 스크래퍼 실행
cd scraper-service
poetry run python scripts/tradingview_playwright_scraper_upload.py
```

**환경 변수 (.env):**
```
TRADINGVIEW_USERNAME=your_username
TRADINGVIEW_PASSWORD=your_password
UPLOAD_TO_DB=true
USE_EXISTING_TUNNEL=true
```

## 모니터링 연동 (중요)

### 두 실행 방식과 모니터링 호환성

| 실행 방식 | 명령어 | 로그 파일 | task_info.json | 모니터링 대시보드 |
|-----------|--------|-----------|----------------|-------------------|
| **Docker API** (권장) | `curl POST /api/scrape` | O | O | **정상 동작** |
| **레거시 호스트 스크립트** | `poetry run python3 scripts/...` | O | X | **동작 안 함** |

### 왜 레거시 방식은 모니터링이 안 되는가?

모니터링 대시보드(`auto-monitoring`)의 API route(`app/api/scraping/status/route.ts`)는 **task_info.json을 우선** 읽습니다:

1. `task_info.json` 읽기 시도 (Docker API가 생성)
2. 없거나 `job_id === 'initial'`이면 로그 파일 파싱으로 fallback

레거시 호스트 스크립트는 `task_info.json`을 생성하지 않으므로, 이전 Docker API 실행의 오래된 `task_info.json`이 남아있으면 **그 데이터가 표시**됩니다.

### 해결 방법

모니터링과 함께 스크래핑하려면 **Docker API를 사용**하세요:

```bash
# Docker API를 통한 스크래핑 (모니터링 지원)
curl -X POST http://localhost:8001/api/scrape

# 레거시 호스트 스크립트 실행 시에는 모니터링 불가
poetry run python scripts/tradingview_playwright_scraper_upload.py
```

레거시 방식 실행 후 모니터링이 이상하면 `logs/task_info.json`을 삭제하세요:
```bash
rm scraper-service/logs/task_info.json
```

## Docker 명령어

```bash
# 서비스 시작
docker compose up -d scraper-service

# 로그 확인
docker compose logs -f scraper-service

# 서비스 중지
docker compose down scraper-service

# 컨테이너 재시작
docker compose restart scraper-service

# 이미지 재빌드
docker compose build scraper-service
```

## API Endpoints

Base URL: `http://localhost:8001`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scrape` | 스크래핑 시작 (task_info.json 생성 + 모니터링 연동) |
| GET | `/health` | 헬스체크 |

**예시:**
```bash
# 스크래핑 시작
curl -X POST http://localhost:8001/api/scrape

# 헬스체크
curl http://localhost:8001/health
```

## 자동화 파이프라인

### 스크립트 구성

```
scripts/
├── scrape-daily.sh       # 일일 데이터 수집 자동화
├── validate_data.py      # 데이터 품질 검증
└── setup-cron.sh         # cron 작업 설정
```

### scrape-daily.sh

매일 미국 정규장 마감 후 자동으로 TradingView 데이터를 수집하는 스크립트.

**주요 기능:**
- SSH 터널 자동 확인 및 시작
- Docker 서비스 자동 시작
- Docker API를 통한 스크래핑 실행 (모니터링 연동)
- 상세 로그 기록 (`logs/scraper-YYYYMMDD.log`)
- 실행 시간 측정 및 성공/실패 리포트

**실행:**
```bash
# 수동 실행
./scripts/scrape-daily.sh

# 로그 확인
tail -f logs/scraper-$(date +%Y%m%d).log
```

### validate_data.py

MySQL 데이터베이스의 데이터 품질을 검증하는 Python 스크립트.

**검증 항목:**
- 테이블 존재 여부
- 최신 데이터 확인 (오늘/어제 데이터 존재)
- NULL 값 비율 (임계값: 5%)
- 중복 타임스탬프 검사
- 가격 이상치 탐지 (0 이하, 50% 이상 급변)

**실행:**
```bash
# Poetry 환경에서 실행
cd scraper-service
poetry run python ../scripts/validate_data.py

# 검증 결과는 logs/validation_YYYYMMDD_HHMMSS.json에 저장
```

**결과 형식:**
```json
{
  "timestamp": "2026-01-30T...",
  "summary": {
    "total_tables": 60,
    "passed": 58,
    "failed": 2,
    "errors": 0,
    "pass_rate": 0.967
  },
  "failed_tables": ["NVDA_1h", "AAPL_D"],
  "tables": { ... }
}
```

### Cron 설정

**자동 설정:**
```bash
./scripts/setup-cron.sh
```

**수동 설정:**
```bash
crontab -e

# 매일 오전 7시 (한국시간 기준, 미국 정규장 마감 후)
# 월~금요일에만 실행
0 22 * * 1-5 /home/ahnbi2/etf-trading-project/scripts/scrape-daily.sh
```

**Cron 작업 확인:**
```bash
crontab -l
```

## 로그 관리

**로그 위치:**
```
scraper-service/logs/
├── task_info.json                   # 실시간 작업 상태 (Docker API 전용)
├── tradingview_scraper_upload.log   # 상세 스크래핑 로그
└── scraper-YYYYMMDD.log             # 일일 자동화 로그

logs/                                 # 프로젝트 루트 (자동화 스크립트)
├── scraper-YYYYMMDD.log             # 일일 스크래핑 로그
└── validation_YYYYMMDD_HHMMSS.json  # 데이터 검증 결과
```

**로그 조회:**
```bash
# Docker API 실시간 로그
docker compose logs -f scraper-service

# 최근 스크래핑 로그
tail -f logs/scraper-$(date +%Y%m%d).log

# 어제 로그
tail -100 logs/scraper-$(date -d "yesterday" +%Y%m%d).log

# 최근 검증 결과
ls -lt logs/validation_*.json | head -1 | xargs cat | jq '.summary'

# 레거시 호스트 스크립트 로그
tail -f scraper-service/logs/tradingview_scraper_upload.log
```

## DB 서비스

### app/services/db_service.py (Docker API)

Docker 컨테이너 내에서 사용하는 DB 서비스. `host.docker.internal`을 통해 호스트의 MySQL에 접근합니다.

**특징:**
- Corporate actions (배당금, 분할) 테이블 관리
- UPSERT 지원 (중복 데이터 자동 병합)
- 테이블 자동 생성

### scripts/db_service_host.py (레거시)

호스트 시스템에서 SSH 터널을 통해 MySQL에 접근하는 DB 서비스.

**특징:**
- SSH 터널 수동 설정 필요
- 레거시 호스트 스크립트 전용

## 피처 처리

### scripts/process_features.py

기술적 지표(RSI, MACD 등)를 계산하고 processed_db에 저장하는 CLI 도구.

**실행:**
```bash
cd scraper-service
poetry run python scripts/process_features.py --symbols AAPL NVDA --timeframe D
```

## Troubleshooting

### 모니터링 대시보드에 오래된 데이터가 표시됨
```bash
# task_info.json 삭제
rm scraper-service/logs/task_info.json
```

### Docker API가 DB에 연결 실패
```bash
# SSH 터널 확인
pgrep -f "ssh.*3306"

# 터널 재시작
ssh -f -N -L 3306:127.0.0.1:5100 ahnbi2@ahnbi2.suwon.ac.kr
```

### 레거시 호스트 스크립트가 실행 안 됨
```bash
# Poetry 환경 확인
cd scraper-service
poetry install

# SSH 터널 확인
pgrep -f "ssh.*3306"
```

### 쿠키 만료로 로그인 실패
```bash
# cookies.json 삭제하고 재실행
rm scraper-service/cookies.json
```

## 상세 문서

- 전체 파이프라인 가이드: `.claude/skills/data-scraping-pipeline/skill.md`
- 프로젝트 전체 구조: `/home/ahnbi2/etf-trading-project/CLAUDE.md`
