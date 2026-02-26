# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ETF 주식 예측 AI 경진대회 프로젝트. 2020~2024년 각 거래일에 대해 3개월 후 수익률 Top-100 종목을 예측하는 모델.

**대회 규칙:**
- 5개 연도(2020-2024) 평균 점수로 순위 산정
- 단일 모델(단일 파이프라인) 사용 필수 - 동일한 전처리, 입력 구조, 모델 구조
- **연도별 재학습만 허용** (날짜별 재학습 금지)
  - 2020년 예측: 2019년까지 데이터로 1번 학습 → 2020년 전체 예측
  - 2021년 예측: 2020년까지 데이터로 1번 학습 → 2021년 전체 예측
  - (각 연도마다 1개 모델만 사용)

## Current Best Results

| 모델 | 2020 | 2021 | 2022 | 2023 | 2024 | 평균 |
|------|------|------|------|------|------|------|
| LambdaRank | 0.168 | 0.113 | 0.112 | 0.135 | 0.168 | 0.139 |
| **TabPFN V2 (150 features)** | 0.163 | 0.151 | 0.154 | 0.190 | 0.185 | **0.169** |

## Build & Run Commands

```bash
# Poetry 사용 (필수)
poetry install              # 의존성 설치
poetry shell                # 가상환경 활성화

# 또는 poetry run으로 직접 실행
poetry run python -m src.pipeline

# LightGBM 파이프라인 실행
poetry run python -m src.pipeline

# TabPFN V2 실행 (권장)
poetry run python -m src.tabpfn_pipeline_v2 --device cuda --features 150 --samples 10000 --chunk-size 500

# 멀티 GPU 실행 (RTX 3090 x2)
poetry run python -m src.tabpfn_pipeline_v2 --multi-gpu --gpu-ids 0 1 --features 150
```

### TabPFN V2 주요 옵션
| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `--features` | 100 | 사용할 피처 수 (최대 242개) |
| `--samples` | 10000 | 학습 샘플 수 |
| `--chunk-size` | 500 | 예측 청크 크기 (OOM 시 줄이기) |
| `--train-years` | 5 | 학습 데이터 기간 |
| `--timestamp` | auto | 제출 파일명 타임스탬프 |

## Architecture

```
src/
├── config.py               # 전체 설정 (데이터, 피처, 모델 하이퍼파라미터)
├── pipeline.py             # LightGBM 파이프라인
├── tabpfn_pipeline_v2.py   # TabPFN V2 파이프라인 (규칙 준수, 권장)
├── data/
│   ├── loader.py           # FinanceDataReader로 시세 다운로드
│   └── preprocessor.py     # 전처리, 메모리 최적화
├── features/
│   ├── technical.py        # RSI, MACD, Stochastic, ADX, Aroon (15개)
│   ├── momentum.py         # ROC, 이동평균 비율 (27개)
│   ├── volatility.py       # ATR, Bollinger Bands (23개)
│   ├── volume.py           # 거래량 비율, OBV, MFI (23개)
│   ├── returns.py          # 다기간 수익률 (38개)
│   ├── cross_sectional.py  # 일별 종목 간 랭킹 (35개)
│   └── enhanced.py         # 추가 피처 (81개)
├── models/
│   ├── lightgbm_model.py   # ETFRankingModel
│   ├── tabpfn_model.py     # TabPFNRankingModel
│   └── trainer.py          # WalkForwardTrainer
└── utils/
    └── evaluation.py       # 정확도 계산, 제출 파일 검증
```

**총 피처 수: 242개** (correlation 기준 상위 N개 선택)

**데이터 흐름:**
1. `DataLoader`: FinanceDataReader로 OHLCV 다운로드 → 종목별 DataFrame
2. `features/*.py`: 기술적 지표 생성 (종목별 시계열)
3. `cross_sectional.py`: 일별 종목 간 순위 피처
4. `ETFRankingModel.fit()`: LightGBM으로 3개월 수익률 예측
5. `predict_top_k()`: 예측값 기준 Top-100 선택
6. 제출 파일 저장: `submissions/{year}.submission.csv`

## Key Files

| 파일 | 설명 |
|------|------|
| `data/{year}_final_universe.csv` | 연도별 예측 대상 티커 (~1000개) |
| `data/{year}_sample_submission.csv` | 제출 파일 형식 참조 |
| `submissions/{year}.submission.csv` | 생성된 제출 파일 |
| `Final_Baseline.ipynb` | 베이스라인 코드 (Ridge 기반 단순 모델) |

## Model Configuration

`src/config.py`에서 설정 관리:
- **학습 기간**: 2010년부터 예측 연도 전년도까지 (rolling 10년 또는 expanding)
- **타겟**: 63 거래일(~3개월) 후 수익률 (`target_3m`)
- **LightGBM 파라미터**: `num_leaves=63`, `learning_rate=0.05`, `early_stopping=50`

## Submission Format

각 연도별 CSV 파일 (date, rank, ticker):
- 2020: 253일 × 100종목 = 25,300행
- 2021: 252일 × 100종목 = 25,200행
- 2022: 251일 × 100종목 = 25,100행
- 2023: 250일 × 100종목 = 25,000행
- 2024: 252일 × 100종목 = 25,200행

## Competition Constraints

- **단일 모델 규칙**: 앙상블 모델 사용 금지 (`EnsembleRankingModel`은 대회 규정 위반 가능)
- **미래 정보 누수 금지**: 예측일 이후 데이터 사용 시 무효
- **유니버스 준수**: 연도별 지정된 티커만 예측 가능

## Server Info

```bash
# 서버 접속
ssh ahnbi1.suwon.ac.kr

# 프로젝트 경로
cd /data2/project/2025summer/jwc0706/etf-trading-project/etf-model

# GPU: RTX 3090(GPU RAM : 24) x2
```

## 규칙
1) 긴 시간이 걸리는 작업은 nohup으로 백그라운드 실행, logs/ 폴더에 로그 기록
2) TabPFN V1 (날짜별 학습)은 규칙 위반 - V2 (연도별 학습) 사용
3) 제출 파일명: `{model_name}_{hyper_param_info}/{year}.{model_name}.{timestamp}.submission.csv`
4) panel 로딩 시간이 길기 때문에 실험 설계시 자원(데이터) 재활용을 고려하는 것이 필요함

## AhnLab Feature Pipeline

### 사용법
```bash
# 기존 방식 (pre-downloaded parquet)
poetry run python run_experiment.py --model ahnlab_lgbm --year 2024

# 새 방식 (FeaturePipeline으로 실시간 생성)
poetry run python run_experiment.py --model ahnlab_lgbm --year 2024 --use-pipeline

# GPU 가속 사용 (RTX 3090)
poetry run python run_experiment.py --model ahnlab_lgbm --year 2024 --device gpu

# CPU 강제 사용
poetry run python run_experiment.py --model ahnlab_lgbm --year 2024 --device cpu
```

### GPU 지원
| 모델 | GPU 지원 | 파라미터 |
|------|----------|---------|
| `ahnlab_lgbm` | ✅ | `--device gpu` (기본: auto) |
| `xgboost` | ✅ | `--device cuda` |
| `catboost` | ✅ | `--device cuda` |
| `tabpfn` | ✅ | `--device cuda` |

**참고**: `--device auto`는 GPU 가용 여부를 자동 감지합니다.

### 데이터 소스 선택
| Provider | 설명 | 사용법 |
|----------|------|--------|
| `yfinance` | Yahoo Finance API (기본값) | `--data-provider yfinance` |
| `mysql` | TradingView 스크래핑 데이터 (etf2_db) | `--data-provider mysql` |

```bash
# YFinance 사용 (기본)
poetry run python run_experiment.py --model ahnlab_lgbm --year 2024 --use-pipeline

# MySQL 사용 (TradingView 스크래핑 데이터)
poetry run python run_experiment.py --model ahnlab_lgbm --year 2024 --use-pipeline --data-provider mysql
```

**MySQL 환경변수** (`.env` 파일):
```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=ahnbi2
MYSQL_PASSWORD=bigdata
MYSQL_DB=etf2_db
# 또는 전체 URL
MYSQL_URL=mysql+pymysql://ahnbi2:bigdata@localhost:3306/etf2_db
```

### 파이프라인 구조
```
src/features/
├── pipeline.py                 # 메인 오케스트레이터 (85개 피처 생성)
├── ahnlab/
│   ├── constants.py           # 피처 컬럼 정의, LGB 파라미터
│   ├── technical.py           # pandas-ta 기술지표 (31개)
│   ├── engineered.py          # 엔지니어링 피처 (24개)
│   ├── cross_sectional.py     # Z-scores, Ranks (12개)
│   ├── macro.py               # FRED API 거시경제 (10개)
│   └── target.py              # 타겟 변수 생성
└── data_providers/
    ├── base.py                # 추상 데이터 제공자
    ├── yfinance_provider.py   # YFinance 구현
    └── mysql_provider.py      # MySQL 구현 (TradingView 스크래핑 데이터)
```

### 알려진 이슈 및 해결법

#### 1. `KeyError: ['target_3m']` (해결됨)
**원인**: 이전 버전의 FeaturePipeline이 타겟 변수를 생성하지 않음
**해결**: 현재 버전은 `include_target=True`가 기본값이므로 자동 생성됨
```python
# 수동으로 타겟 추가가 필요한 경우
panel['target_3m'] = panel.groupby('ticker')['close'].pct_change(63).shift(-63)
```

#### 2. `HTTP Error 404: Quote not found for symbol`
**원인**: 상장폐지된 티커 (예: GORV)
**해결**: 정상 동작 - 해당 티커만 제외하고 계속 진행됨

#### 3. MACD/RSI 초기 NaN
**원인**: MACD는 35일, RSI는 14일 이상의 데이터 필요
**해결**: 정상 동작 - 학습 시 자동으로 제외됨