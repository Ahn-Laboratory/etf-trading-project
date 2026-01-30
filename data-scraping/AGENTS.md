# Data Scraping - TradingView 자동화 파이프라인

## 규칙
1. 크롤링 관련 실행은 사용자가 직접 수행 - 실행 가이드라인만 제공

## 폴더 구조

```
data-scraping/
├── tradingview_playwright_scraper_upload.py  # 메인 스크래퍼 (최종 버전)
├── db_service.py                              # DB 연결/업로드 서비스
├── cookies.json                               # 로그인 쿠키 (자동 생성)
├── pyproject.toml                             # 의존성 정의
├── poetry.lock                                # 의존성 잠금
├── downloads/                                 # CSV 다운로드 폴더
└── tradingview_data/                          # 데이터 저장
```

## 핵심 파일 설명

### tradingview_playwright_scraper_upload.py
- TradingView에서 주가 데이터 CSV 다운로드
- 다운로드된 CSV를 원격 MySQL DB에 자동 업로드
- Playwright 기반 브라우저 자동화
- 쿠키 기반 세션 관리

### db_service.py
- SSH 터널 연결 관리
- CSV 파싱 및 DB 업로드
- 테이블 자동 생성 (UPSERT 지원)

## 실행 방법

```bash
# 1. SSH 터널 시작 (필수)
ssh -f -N -L 3306:127.0.0.1:5100 ahnbi2@ahnbi2.suwon.ac.kr

# 2. 스크래퍼 실행
cd data-scraping
poetry run python tradingview_playwright_scraper_upload.py
```

## 환경 변수 (.env)

```
TRADINGVIEW_USERNAME=your_username
TRADINGVIEW_PASSWORD=your_password
UPLOAD_TO_DB=true
USE_EXISTING_TUNNEL=true
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
- Poetry 환경 자동 설정
- Headless 모드로 스크래퍼 실행
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
cd data-scraping
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

### 로그 관리

**로그 위치:**
```
logs/
├── scraper-YYYYMMDD.log      # 일일 스크래핑 로그
└── validation_YYYYMMDD_HHMMSS.json  # 데이터 검증 결과
```

**로그 조회:**
```bash
# 최근 스크래핑 로그
tail -f logs/scraper-$(date +%Y%m%d).log

# 어제 로그
tail -100 logs/scraper-$(date -d "yesterday" +%Y%m%d).log

# 최근 검증 결과
ls -lt logs/validation_*.json | head -1 | xargs cat | jq '.summary'
```

## 상세 문서

전체 파이프라인 가이드: `.claude/skills/data-scraping-pipeline/skill.md`
