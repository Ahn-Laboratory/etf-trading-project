// 기본 정보 (Key Facts)
export interface ETFKeyFacts {
  productName: string // 상품명
  symbol: string // 종목코드
  underlyingIndex: string // 기초지수
  listingDate: string // 상장일
  aum: number // 순자산총액 (AUM)
  expenseRatio: number // 총보수율 (%)
  nav: number // 순자산가치
  marketPrice: number // 시장가격
  premium: number // 프리미엄/디스카운트 (%)
}

// 투자 포인트 (Investment Strategy)
export interface InvestmentStrategy {
  objective: string // 운용 목표
  strategy: string // 운용 전략
  keyPoints: string[] // 핵심 가치/투자 포인트
  riskLevel: "LOW" | "MEDIUM" | "HIGH"
}

// 수익률 데이터
export interface PerformanceData {
  period: string // 기간 (1M, 3M, 6M, 1Y, YTD, Since Inception)
  periodLabel: string // 기간 한글 라벨
  etfReturn: number // ETF 수익률
  benchmarkReturn: number // 벤치마크 수익률
  difference: number // 차이
}

// 성과 히스토리 (차트용)
export interface PerformanceHistory {
  date: string
  etfValue: number
  benchmarkValue: number
}

// 성과 지표
export interface PerformanceMetrics {
  volatility: number // 변동성 (%)
  sharpeRatio: number // 샤프지수
  maxDrawdown: number // 최대낙폭 (%)
  beta: number // 베타
  alpha: number // 알파
}

// 보유 종목
export interface PortfolioHolding {
  rank: number
  name: string
  ticker: string
  weight: number // 비중 (%)
  shares: number
  marketValue: number
}

// 업종별 비중
export interface SectorAllocation {
  sector: string
  weight: number
  color: string
}

// 거래 정보
export interface TradingInfo {
  exchange: string // 거래소
  tradingCurrency: string // 거래통화
  avgVolume30d: number // 30일 평균 거래량
  avgTradingValue: number // 평균 거래대금
  avgSpread: number // 평균 스프레드 (%)
}

// 분배금 정보
export interface Distribution {
  exDate: string // 배당락일
  recordDate: string // 기준일
  payDate: string // 지급일
  amount: number // 분배금
}

// 전체 팩트시트 데이터
export interface ETFFactSheet {
  keyFacts: ETFKeyFacts
  strategy: InvestmentStrategy
  performance: {
    returns: PerformanceData[]
    history: PerformanceHistory[]
    metrics: PerformanceMetrics
  }
  portfolio: {
    topHoldings: PortfolioHolding[]
    sectorAllocation: SectorAllocation[]
    holdingsCount: number
    turnoverRate: number
  }
  trading: TradingInfo
  distribution: {
    history: Distribution[]
    annualYield: number
    frequency: string
  }
  lastUpdated: string
}
