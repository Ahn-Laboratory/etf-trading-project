# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ETF 주식 예측 AI 경진대회 프로젝트. 2020~2024년 각 거래일에 대해 3개월 후 수익률 Top-100 종목을 예측하는 LightGBM 기반 모델.

**대회 규칙:**
- 5개 연도(2020-2024) 평균 점수로 순위 산정
- 단일 모델(단일 파이프라인) 사용 필수 - 동일한 전처리, 입력 구조, 모델 구조
- 연도별 재학습 허용 (예: 2022년 예측 시 2021년까지 데이터로 학습)
- 마감: 2026년 1월 8일

## Build & Run Commands

```bash
# 가상환경 활성화
source .venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 전체 파이프라인 실행 (5개 연도 예측 생성)
python -m src.pipeline

# Jupyter 노트북 실행
jupyter notebook notebooks/train_and_submit.ipynb
```

## Architecture

```
src/
├── config.py           # 전체 설정 (데이터, 피처, 모델 하이퍼파라미터)
├── pipeline.py         # 메인 파이프라인 (CompetitionPipeline 클래스)
├── data/
│   ├── loader.py       # FinanceDataReader로 시세 다운로드
│   └── preprocessor.py # 전처리, 메모리 최적화
├── features/
│   ├── technical.py    # RSI, MACD, Stochastic, ADX, Aroon
│   ├── momentum.py     # ROC, 이동평균 비율
│   ├── volatility.py   # ATR, Bollinger Bands, 변동성
│   ├── volume.py       # 거래량 비율, OBV, MFI
│   ├── returns.py      # 다기간 수익률 (1d~252d), 타겟 생성
│   └── cross_sectional.py  # 일별 종목 간 랭킹 피처
├── models/
│   ├── lightgbm_model.py   # ETFRankingModel (예측 및 Top-K 선택)
│   └── trainer.py          # WalkForwardTrainer (워크포워드 학습)
└── utils/
    └── evaluation.py       # 정확도 계산, 제출 파일 검증
```

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

## 규칙
1) 긴 시간이 걸리는 작업은 기다리지말고 nohup 으로 백그라운드에서 실행시키고 logs/ 폴더에 로그 기록