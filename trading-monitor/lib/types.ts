// 매매 상태
export type TradingMode = 'paper' | 'live';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'success' | 'failed' | 'pending';
export type ServiceStatus = 'healthy' | 'unhealthy' | 'unknown';

// 사이클 정보
export interface CycleInfo {
  currentDay: number;
  totalDays: number;
  cycleType: 'short' | 'long';
  shortCycleDays: number;
  longCycleDays: number;
  startDate: string;
  nextRebalanceDate: string;
}

// 포트폴리오 보유 종목
export interface Holding {
  etfCode: string;
  etfName: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  buyDate: string;
  dDay: number;
  profitLoss: number;
  profitLossPercent: number;
}

// 주문 로그
export interface Order {
  id: string;
  etfCode: string;
  etfName: string;
  side: OrderSide;
  quantity: number;
  price: number;
  status: OrderStatus;
  timestamp: string;
  reason?: string;
}

// 매매 내역 (히스토리)
export interface TradeHistory {
  id: string;
  etfCode: string;
  etfName: string;
  side: OrderSide;
  quantity: number;
  price: number;
  executedAt: string;
  profitLoss?: number;
  profitLossPercent?: number;
}

// 일별 거래 요약
export interface DailySummary {
  date: string;
  buyCount: number;
  sellCount: number;
  totalProfitLoss: number;
  trades: TradeHistory[];
}

// 트레이딩 상태
export interface TradingStatus {
  mode: TradingMode;
  cycle: CycleInfo;
  totalInvestment: number;
  holdingsCount: number;
  todayBuyCount: number;
  todaySellCount: number;
  automationStatus: {
    lastRun: string | null;
    success: boolean;
    message: string;
  };
}

// 포트폴리오 응답
export interface PortfolioResponse {
  totalInvestment: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdings: Holding[];
}

// 헬스체크 응답
export interface HealthCheckResponse {
  services: {
    name: string;
    status: ServiceStatus;
    url: string;
    lastChecked: string;
    responseTime?: number;
  }[];
}

// 트레이딩 설정
export interface TradingConfig {
  mode: TradingMode;
  shortCycleDays: number;
  longCycleDays: number;
  strategyRatio: {
    momentum: number;
    value: number;
    quality: number;
  };
  capital: number;
  maxHoldings: number;
  rebalanceTime: string;
}
