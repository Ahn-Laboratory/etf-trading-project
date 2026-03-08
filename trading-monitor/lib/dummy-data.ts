import type {
  TradingStatus,
  PortfolioResponse,
  Holding,
  Order,
  TradeHistory,
  DailySummary,
  HealthCheckResponse,
  TradingConfig,
} from './types';

// 더미 보유 종목
const DUMMY_HOLDINGS: Holding[] = [
  {
    etfCode: '069500',
    etfName: 'KODEX 200',
    quantity: 50,
    buyPrice: 35200,
    currentPrice: 36100,
    buyDate: '2026-02-25',
    dDay: 11,
    profitLoss: 45000,
    profitLossPercent: 2.56,
  },
  {
    etfCode: '229200',
    etfName: 'KODEX 코스닥150',
    quantity: 30,
    buyPrice: 12800,
    currentPrice: 12500,
    buyDate: '2026-02-25',
    dDay: 11,
    profitLoss: -9000,
    profitLossPercent: -2.34,
  },
  {
    etfCode: '102110',
    etfName: 'TIGER 200',
    quantity: 40,
    buyPrice: 36500,
    currentPrice: 37200,
    buyDate: '2026-02-27',
    dDay: 9,
    profitLoss: 28000,
    profitLossPercent: 1.92,
  },
  {
    etfCode: '252670',
    etfName: 'KODEX 200선물인버스2X',
    quantity: 100,
    buyPrice: 2850,
    currentPrice: 2780,
    buyDate: '2026-03-01',
    dDay: 7,
    profitLoss: -7000,
    profitLossPercent: -2.46,
  },
  {
    etfCode: '114800',
    etfName: 'KODEX 인버스',
    quantity: 80,
    buyPrice: 5120,
    currentPrice: 5050,
    buyDate: '2026-03-03',
    dDay: 5,
    profitLoss: -5600,
    profitLossPercent: -1.37,
  },
];

// 더미 최근 주문
const DUMMY_ORDERS: Order[] = [
  {
    id: 'ord-001',
    etfCode: '069500',
    etfName: 'KODEX 200',
    side: 'BUY',
    quantity: 50,
    price: 35200,
    status: 'success',
    timestamp: '2026-03-08T09:05:00',
  },
  {
    id: 'ord-002',
    etfCode: '229200',
    etfName: 'KODEX 코스닥150',
    side: 'BUY',
    quantity: 30,
    price: 12800,
    status: 'success',
    timestamp: '2026-03-08T09:05:30',
  },
  {
    id: 'ord-003',
    etfCode: '102110',
    etfName: 'TIGER 200',
    side: 'SELL',
    quantity: 20,
    price: 37200,
    status: 'success',
    timestamp: '2026-03-07T15:20:00',
  },
  {
    id: 'ord-004',
    etfCode: '252670',
    etfName: 'KODEX 200선물인버스2X',
    side: 'BUY',
    quantity: 100,
    price: 2850,
    status: 'failed',
    timestamp: '2026-03-07T09:10:00',
    reason: '주문 수량 초과',
  },
  {
    id: 'ord-005',
    etfCode: '114800',
    etfName: 'KODEX 인버스',
    side: 'BUY',
    quantity: 80,
    price: 5120,
    status: 'success',
    timestamp: '2026-03-06T09:05:00',
  },
  {
    id: 'ord-006',
    etfCode: '069500',
    etfName: 'KODEX 200',
    side: 'SELL',
    quantity: 30,
    price: 35800,
    status: 'success',
    timestamp: '2026-03-05T15:15:00',
  },
  {
    id: 'ord-007',
    etfCode: '229200',
    etfName: 'KODEX 코스닥150',
    side: 'BUY',
    quantity: 50,
    price: 12600,
    status: 'success',
    timestamp: '2026-03-05T09:05:00',
  },
  {
    id: 'ord-008',
    etfCode: '102110',
    etfName: 'TIGER 200',
    side: 'BUY',
    quantity: 40,
    price: 36500,
    status: 'success',
    timestamp: '2026-03-04T09:05:00',
  },
  {
    id: 'ord-009',
    etfCode: '252670',
    etfName: 'KODEX 200선물인버스2X',
    side: 'SELL',
    quantity: 50,
    price: 2920,
    status: 'success',
    timestamp: '2026-03-03T15:20:00',
  },
  {
    id: 'ord-010',
    etfCode: '114800',
    etfName: 'KODEX 인버스',
    side: 'BUY',
    quantity: 60,
    price: 5200,
    status: 'failed',
    timestamp: '2026-03-03T09:05:00',
    reason: '잔고 부족',
  },
];

// 더미 거래 히스토리
function createDummyHistory(): DailySummary[] {
  const summaries: DailySummary[] = [];
  const today = new Date('2026-03-08');

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const buyCount = Math.floor(Math.random() * 4);
    const sellCount = Math.floor(Math.random() * 3);

    if (buyCount === 0 && sellCount === 0) continue;

    const trades: TradeHistory[] = [];
    for (let j = 0; j < buyCount; j++) {
      trades.push({
        id: `trade-${i}-buy-${j}`,
        etfCode: DUMMY_HOLDINGS[j % DUMMY_HOLDINGS.length].etfCode,
        etfName: DUMMY_HOLDINGS[j % DUMMY_HOLDINGS.length].etfName,
        side: 'BUY',
        quantity: Math.floor(Math.random() * 50 + 10),
        price: Math.floor(Math.random() * 30000 + 5000),
        executedAt: date.toISOString(),
      });
    }
    for (let j = 0; j < sellCount; j++) {
      const pnl = Math.floor(Math.random() * 40000 - 15000);
      trades.push({
        id: `trade-${i}-sell-${j}`,
        etfCode: DUMMY_HOLDINGS[j % DUMMY_HOLDINGS.length].etfCode,
        etfName: DUMMY_HOLDINGS[j % DUMMY_HOLDINGS.length].etfName,
        side: 'SELL',
        quantity: Math.floor(Math.random() * 30 + 10),
        price: Math.floor(Math.random() * 30000 + 5000),
        executedAt: date.toISOString(),
        profitLoss: pnl,
        profitLossPercent: Number((pnl / (Math.random() * 500000 + 100000) * 100).toFixed(2)),
      });
    }

    const totalPnl = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);

    summaries.push({
      date: date.toISOString().split('T')[0],
      buyCount,
      sellCount,
      totalProfitLoss: totalPnl,
      trades,
    });
  }

  return summaries;
}

export function generateDummyTradingStatus(): TradingStatus {
  return {
    mode: 'paper',
    cycle: {
      currentDay: 11,
      totalDays: 15,
      cycleType: 'short',
      shortCycleDays: 15,
      longCycleDays: 63,
      startDate: '2026-02-25',
      nextRebalanceDate: '2026-03-12',
    },
    totalInvestment: 10000000,
    holdingsCount: 5,
    todayBuyCount: 2,
    todaySellCount: 0,
    automationStatus: {
      lastRun: '2026-03-08T09:05:30',
      success: true,
      message: '매수 2건 완료',
    },
  };
}

export function generateDummyPortfolio(): PortfolioResponse {
  const totalInvestment = DUMMY_HOLDINGS.reduce(
    (sum, h) => sum + h.buyPrice * h.quantity,
    0
  );
  const totalCurrentValue = DUMMY_HOLDINGS.reduce(
    (sum, h) => sum + h.currentPrice * h.quantity,
    0
  );
  const totalProfitLoss = totalCurrentValue - totalInvestment;

  return {
    totalInvestment,
    totalCurrentValue,
    totalProfitLoss,
    totalProfitLossPercent: Number(
      ((totalProfitLoss / totalInvestment) * 100).toFixed(2)
    ),
    holdings: DUMMY_HOLDINGS,
  };
}

export function generateDummyOrders(): Order[] {
  return DUMMY_ORDERS;
}

export function generateDummyHistory(): DailySummary[] {
  return createDummyHistory();
}

export function generateDummyHealthCheck(): HealthCheckResponse {
  return {
    services: [
      {
        name: 'trading-service',
        status: 'healthy',
        url: 'http://localhost:8002',
        lastChecked: new Date().toISOString(),
        responseTime: 45,
      },
      {
        name: 'ml-service',
        status: 'healthy',
        url: 'http://localhost:8000',
        lastChecked: new Date().toISOString(),
        responseTime: 120,
      },
      {
        name: 'scraper-service',
        status: 'unhealthy',
        url: 'http://localhost:8001',
        lastChecked: new Date().toISOString(),
        responseTime: undefined,
      },
    ],
  };
}

export function generateDummyConfig(): TradingConfig {
  return {
    mode: 'paper',
    shortCycleDays: 15,
    longCycleDays: 63,
    strategyRatio: {
      momentum: 40,
      value: 35,
      quality: 25,
    },
    capital: 10000000,
    maxHoldings: 10,
    rebalanceTime: '09:05',
  };
}

