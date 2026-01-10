import { ETFFactSheet } from "./types/factsheet"

// 성과 히스토리 생성 함수
function generatePerformanceHistory(baseValue: number, volatility: number) {
  const history = []
  let etfValue = 100
  let benchmarkValue = 100

  for (let i = 365; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    const etfChange = (Math.random() - 0.48) * volatility
    const benchmarkChange = (Math.random() - 0.48) * volatility * 0.8

    etfValue *= 1 + etfChange / 100
    benchmarkValue *= 1 + benchmarkChange / 100

    if (i % 7 === 0) {
      history.push({
        date: date.toISOString().split("T")[0],
        etfValue: parseFloat(etfValue.toFixed(2)),
        benchmarkValue: parseFloat(benchmarkValue.toFixed(2)),
      })
    }
  }

  return history
}

// SPY - S&P 500 ETF
const spyFactSheet: ETFFactSheet = {
  keyFacts: {
    productName: "SPDR S&P 500 ETF Trust",
    symbol: "SPY",
    underlyingIndex: "S&P 500 Index",
    listingDate: "1993-01-22",
    aum: 525000000000, // $525B
    expenseRatio: 0.0945,
    nav: 592.34,
    marketPrice: 592.56,
    premium: 0.04,
  },
  strategy: {
    objective: "S&P 500 지수의 성과를 추적하여 미국 대형주 시장에 대한 광범위한 노출을 제공",
    strategy: "완전복제법을 통해 S&P 500 지수 구성 종목에 비례 투자",
    keyPoints: [
      "미국 대형주 500개 종목에 분산투자",
      "세계에서 가장 오래되고 규모가 큰 ETF",
      "높은 유동성으로 좁은 스프레드 유지",
      "낮은 보수율로 비용 효율적",
    ],
    riskLevel: "MEDIUM",
  },
  performance: {
    returns: [
      { period: "1M", periodLabel: "1개월", etfReturn: 2.34, benchmarkReturn: 2.31, difference: 0.03 },
      { period: "3M", periodLabel: "3개월", etfReturn: 5.67, benchmarkReturn: 5.62, difference: 0.05 },
      { period: "6M", periodLabel: "6개월", etfReturn: 12.45, benchmarkReturn: 12.38, difference: 0.07 },
      { period: "1Y", periodLabel: "1년", etfReturn: 26.89, benchmarkReturn: 26.79, difference: 0.10 },
      { period: "YTD", periodLabel: "연초대비", etfReturn: 2.15, benchmarkReturn: 2.12, difference: 0.03 },
      { period: "SI", periodLabel: "설정이후", etfReturn: 1245.67, benchmarkReturn: 1242.34, difference: 3.33 },
    ],
    history: generatePerformanceHistory(592, 1.2),
    metrics: {
      volatility: 15.23,
      sharpeRatio: 1.45,
      maxDrawdown: -23.45,
      beta: 1.0,
      alpha: 0.02,
    },
  },
  portfolio: {
    topHoldings: [
      { rank: 1, name: "Apple Inc.", ticker: "AAPL", weight: 7.12, shares: 160500000, marketValue: 38500000000 },
      { rank: 2, name: "Microsoft Corp.", ticker: "MSFT", weight: 6.89, shares: 92300000, marketValue: 37200000000 },
      { rank: 3, name: "Amazon.com Inc.", ticker: "AMZN", weight: 3.45, shares: 48200000, marketValue: 18600000000 },
      { rank: 4, name: "NVIDIA Corp.", ticker: "NVDA", weight: 3.21, shares: 35100000, marketValue: 17300000000 },
      { rank: 5, name: "Alphabet Inc. Class A", ticker: "GOOGL", weight: 2.15, shares: 81200000, marketValue: 11600000000 },
      { rank: 6, name: "Alphabet Inc. Class C", ticker: "GOOG", weight: 1.89, shares: 71500000, marketValue: 10200000000 },
      { rank: 7, name: "Meta Platforms Inc.", ticker: "META", weight: 1.78, shares: 26800000, marketValue: 9600000000 },
      { rank: 8, name: "Berkshire Hathaway Inc.", ticker: "BRK.B", weight: 1.65, shares: 24300000, marketValue: 8900000000 },
      { rank: 9, name: "Tesla Inc.", ticker: "TSLA", weight: 1.45, shares: 38600000, marketValue: 7800000000 },
      { rank: 10, name: "UnitedHealth Group Inc.", ticker: "UNH", weight: 1.32, shares: 13200000, marketValue: 7100000000 },
    ],
    sectorAllocation: [
      { sector: "정보기술", weight: 31.2, color: "#0088FE" },
      { sector: "금융", weight: 13.1, color: "#00C49F" },
      { sector: "헬스케어", weight: 12.8, color: "#FFBB28" },
      { sector: "임의소비재", weight: 10.5, color: "#FF8042" },
      { sector: "통신서비스", weight: 8.9, color: "#8884d8" },
      { sector: "산업재", weight: 8.4, color: "#82ca9d" },
      { sector: "필수소비재", weight: 6.2, color: "#ffc658" },
      { sector: "에너지", weight: 3.8, color: "#ff7c43" },
      { sector: "유틸리티", weight: 2.5, color: "#a4de6c" },
      { sector: "부동산", weight: 2.3, color: "#d0ed57" },
    ],
    holdingsCount: 503,
    turnoverRate: 2.1,
  },
  trading: {
    exchange: "NYSE Arca",
    tradingCurrency: "USD",
    avgVolume30d: 78500000,
    avgTradingValue: 46500000000,
    avgSpread: 0.01,
  },
  distribution: {
    history: [
      { exDate: "2025-12-20", recordDate: "2025-12-23", payDate: "2025-12-31", amount: 1.89 },
      { exDate: "2025-09-20", recordDate: "2025-09-23", payDate: "2025-09-30", amount: 1.75 },
      { exDate: "2025-06-21", recordDate: "2025-06-24", payDate: "2025-06-30", amount: 1.82 },
      { exDate: "2025-03-21", recordDate: "2025-03-24", payDate: "2025-03-31", amount: 1.68 },
    ],
    annualYield: 1.25,
    frequency: "분기",
  },
  lastUpdated: new Date().toISOString().split("T")[0],
}

// QQQ - Nasdaq 100 ETF
const qqqFactSheet: ETFFactSheet = {
  keyFacts: {
    productName: "Invesco QQQ Trust",
    symbol: "QQQ",
    underlyingIndex: "NASDAQ-100 Index",
    listingDate: "1999-03-10",
    aum: 265000000000, // $265B
    expenseRatio: 0.2,
    nav: 518.72,
    marketPrice: 518.95,
    premium: 0.04,
  },
  strategy: {
    objective: "NASDAQ-100 지수의 성과를 추적하여 기술 중심 대형 성장주에 투자",
    strategy: "NASDAQ-100 지수 구성 종목에 시가총액 가중 투자",
    keyPoints: [
      "나스닥 상장 비금융 대형주 100개에 집중 투자",
      "기술 및 혁신 기업 중심의 성장 포트폴리오",
      "높은 거래량으로 우수한 유동성 제공",
      "성장주 투자자에게 적합한 ETF",
    ],
    riskLevel: "HIGH",
  },
  performance: {
    returns: [
      { period: "1M", periodLabel: "1개월", etfReturn: 3.45, benchmarkReturn: 3.42, difference: 0.03 },
      { period: "3M", periodLabel: "3개월", etfReturn: 8.12, benchmarkReturn: 8.07, difference: 0.05 },
      { period: "6M", periodLabel: "6개월", etfReturn: 18.67, benchmarkReturn: 18.58, difference: 0.09 },
      { period: "1Y", periodLabel: "1년", etfReturn: 35.23, benchmarkReturn: 35.08, difference: 0.15 },
      { period: "YTD", periodLabel: "연초대비", etfReturn: 3.28, benchmarkReturn: 3.24, difference: 0.04 },
      { period: "SI", periodLabel: "설정이후", etfReturn: 1856.45, benchmarkReturn: 1849.23, difference: 7.22 },
    ],
    history: generatePerformanceHistory(518, 1.8),
    metrics: {
      volatility: 21.45,
      sharpeRatio: 1.32,
      maxDrawdown: -32.58,
      beta: 1.15,
      alpha: 0.08,
    },
  },
  portfolio: {
    topHoldings: [
      { rank: 1, name: "Apple Inc.", ticker: "AAPL", weight: 8.95, shares: 178200000, marketValue: 42800000000 },
      { rank: 2, name: "Microsoft Corp.", ticker: "MSFT", weight: 8.67, shares: 102400000, marketValue: 41500000000 },
      { rank: 3, name: "Amazon.com Inc.", ticker: "AMZN", weight: 5.12, shares: 62100000, marketValue: 24500000000 },
      { rank: 4, name: "NVIDIA Corp.", ticker: "NVDA", weight: 4.89, shares: 48300000, marketValue: 23400000000 },
      { rank: 5, name: "Meta Platforms Inc.", ticker: "META", weight: 4.23, shares: 58900000, marketValue: 20200000000 },
      { rank: 6, name: "Broadcom Inc.", ticker: "AVGO", weight: 3.98, shares: 18600000, marketValue: 19000000000 },
      { rank: 7, name: "Tesla Inc.", ticker: "TSLA", weight: 3.45, shares: 82100000, marketValue: 16500000000 },
      { rank: 8, name: "Alphabet Inc. Class A", ticker: "GOOGL", weight: 2.89, shares: 95400000, marketValue: 13800000000 },
      { rank: 9, name: "Alphabet Inc. Class C", ticker: "GOOG", weight: 2.67, shares: 88200000, marketValue: 12800000000 },
      { rank: 10, name: "Costco Wholesale Corp.", ticker: "COST", weight: 2.45, shares: 14500000, marketValue: 11700000000 },
    ],
    sectorAllocation: [
      { sector: "정보기술", weight: 51.3, color: "#0088FE" },
      { sector: "통신서비스", weight: 16.8, color: "#00C49F" },
      { sector: "임의소비재", weight: 14.2, color: "#FFBB28" },
      { sector: "헬스케어", weight: 6.9, color: "#FF8042" },
      { sector: "필수소비재", weight: 5.8, color: "#8884d8" },
      { sector: "산업재", weight: 3.2, color: "#82ca9d" },
      { sector: "유틸리티", weight: 1.8, color: "#ffc658" },
    ],
    holdingsCount: 101,
    turnoverRate: 8.5,
  },
  trading: {
    exchange: "NASDAQ",
    tradingCurrency: "USD",
    avgVolume30d: 52300000,
    avgTradingValue: 27100000000,
    avgSpread: 0.01,
  },
  distribution: {
    history: [
      { exDate: "2025-12-23", recordDate: "2025-12-26", payDate: "2026-01-02", amount: 0.67 },
      { exDate: "2025-09-23", recordDate: "2025-09-26", payDate: "2025-10-02", amount: 0.58 },
      { exDate: "2025-06-24", recordDate: "2025-06-27", payDate: "2025-07-03", amount: 0.62 },
      { exDate: "2025-03-24", recordDate: "2025-03-27", payDate: "2025-04-02", amount: 0.55 },
    ],
    annualYield: 0.52,
    frequency: "분기",
  },
  lastUpdated: new Date().toISOString().split("T")[0],
}

// IWM - Russell 2000 ETF
const iwmFactSheet: ETFFactSheet = {
  keyFacts: {
    productName: "iShares Russell 2000 ETF",
    symbol: "IWM",
    underlyingIndex: "Russell 2000 Index",
    listingDate: "2000-05-22",
    aum: 72000000000, // $72B
    expenseRatio: 0.19,
    nav: 225.67,
    marketPrice: 225.82,
    premium: 0.07,
  },
  strategy: {
    objective: "Russell 2000 지수의 성과를 추적하여 미국 소형주 시장에 광범위한 노출 제공",
    strategy: "Russell 2000 지수 구성 종목에 시가총액 가중 투자",
    keyPoints: [
      "미국 소형주 약 2,000개에 분산투자",
      "미국 경제의 내수 성장에 집중 노출",
      "대형주 대비 높은 성장 잠재력",
      "포트폴리오 다각화에 적합",
    ],
    riskLevel: "HIGH",
  },
  performance: {
    returns: [
      { period: "1M", periodLabel: "1개월", etfReturn: 1.23, benchmarkReturn: 1.21, difference: 0.02 },
      { period: "3M", periodLabel: "3개월", etfReturn: 3.45, benchmarkReturn: 3.42, difference: 0.03 },
      { period: "6M", periodLabel: "6개월", etfReturn: 8.92, benchmarkReturn: 8.87, difference: 0.05 },
      { period: "1Y", periodLabel: "1년", etfReturn: 18.45, benchmarkReturn: 18.32, difference: 0.13 },
      { period: "YTD", periodLabel: "연초대비", etfReturn: 1.45, benchmarkReturn: 1.42, difference: 0.03 },
      { period: "SI", periodLabel: "설정이후", etfReturn: 542.34, benchmarkReturn: 538.67, difference: 3.67 },
    ],
    history: generatePerformanceHistory(225, 2.0),
    metrics: {
      volatility: 24.56,
      sharpeRatio: 0.89,
      maxDrawdown: -41.23,
      beta: 1.25,
      alpha: -0.02,
    },
  },
  portfolio: {
    topHoldings: [
      { rank: 1, name: "Super Micro Computer Inc.", ticker: "SMCI", weight: 0.72, shares: 4200000, marketValue: 518000000 },
      { rank: 2, name: "Axon Enterprise Inc.", ticker: "AXON", weight: 0.68, shares: 1850000, marketValue: 490000000 },
      { rank: 3, name: "Sprouts Farmers Market", ticker: "SFM", weight: 0.58, shares: 4100000, marketValue: 418000000 },
      { rank: 4, name: "Comfort Systems USA", ticker: "FIX", weight: 0.55, shares: 1420000, marketValue: 396000000 },
      { rank: 5, name: "Fabrinet", ticker: "FN", weight: 0.52, shares: 1680000, marketValue: 374000000 },
      { rank: 6, name: "Onto Innovation Inc.", ticker: "ONTO", weight: 0.48, shares: 1920000, marketValue: 346000000 },
      { rank: 7, name: "Saia Inc.", ticker: "SAIA", weight: 0.45, shares: 820000, marketValue: 324000000 },
      { rank: 8, name: "Mueller Industries Inc.", ticker: "MLI", weight: 0.42, shares: 4250000, marketValue: 302000000 },
      { rank: 9, name: "Insmed Incorporated", ticker: "INSM", weight: 0.40, shares: 4800000, marketValue: 288000000 },
      { rank: 10, name: "Chart Industries Inc.", ticker: "GTLS", weight: 0.38, shares: 1650000, marketValue: 274000000 },
    ],
    sectorAllocation: [
      { sector: "헬스케어", weight: 16.8, color: "#0088FE" },
      { sector: "산업재", weight: 16.2, color: "#00C49F" },
      { sector: "금융", weight: 15.9, color: "#FFBB28" },
      { sector: "정보기술", weight: 13.5, color: "#FF8042" },
      { sector: "임의소비재", weight: 11.2, color: "#8884d8" },
      { sector: "에너지", weight: 7.8, color: "#82ca9d" },
      { sector: "부동산", weight: 6.5, color: "#ffc658" },
      { sector: "소재", weight: 4.8, color: "#ff7c43" },
      { sector: "필수소비재", weight: 3.2, color: "#a4de6c" },
      { sector: "유틸리티", weight: 2.8, color: "#d0ed57" },
      { sector: "통신서비스", weight: 1.3, color: "#8dd1e1" },
    ],
    holdingsCount: 1978,
    turnoverRate: 18.5,
  },
  trading: {
    exchange: "NYSE Arca",
    tradingCurrency: "USD",
    avgVolume30d: 28500000,
    avgTradingValue: 6400000000,
    avgSpread: 0.02,
  },
  distribution: {
    history: [
      { exDate: "2025-12-18", recordDate: "2025-12-19", payDate: "2025-12-23", amount: 0.82 },
      { exDate: "2025-09-19", recordDate: "2025-09-22", payDate: "2025-09-26", amount: 0.68 },
      { exDate: "2025-06-20", recordDate: "2025-06-23", payDate: "2025-06-27", amount: 0.75 },
      { exDate: "2025-03-21", recordDate: "2025-03-24", payDate: "2025-03-28", amount: 0.62 },
    ],
    annualYield: 1.28,
    frequency: "분기",
  },
  lastUpdated: new Date().toISOString().split("T")[0],
}

// VTI - Total Stock Market ETF
const vtiFactSheet: ETFFactSheet = {
  keyFacts: {
    productName: "Vanguard Total Stock Market ETF",
    symbol: "VTI",
    underlyingIndex: "CRSP US Total Market Index",
    listingDate: "2001-05-24",
    aum: 418000000000, // $418B
    expenseRatio: 0.03,
    nav: 285.42,
    marketPrice: 285.55,
    premium: 0.05,
  },
  strategy: {
    objective: "미국 전체 주식 시장에 대한 광범위한 노출을 제공하여 장기 성장 추구",
    strategy: "CRSP US Total Market Index를 추적하여 대형, 중형, 소형주 전체에 투자",
    keyPoints: [
      "미국 주식 시장 전체 (3,800+ 종목)에 분산투자",
      "업계 최저 수준의 보수율 (0.03%)",
      "대형주부터 소형주까지 전체 시장 커버",
      "장기 투자자를 위한 핵심 보유 ETF",
    ],
    riskLevel: "MEDIUM",
  },
  performance: {
    returns: [
      { period: "1M", periodLabel: "1개월", etfReturn: 2.12, benchmarkReturn: 2.11, difference: 0.01 },
      { period: "3M", periodLabel: "3개월", etfReturn: 5.34, benchmarkReturn: 5.32, difference: 0.02 },
      { period: "6M", periodLabel: "6개월", etfReturn: 11.89, benchmarkReturn: 11.86, difference: 0.03 },
      { period: "1Y", periodLabel: "1년", etfReturn: 25.67, benchmarkReturn: 25.62, difference: 0.05 },
      { period: "YTD", periodLabel: "연초대비", etfReturn: 2.05, benchmarkReturn: 2.03, difference: 0.02 },
      { period: "SI", periodLabel: "설정이후", etfReturn: 478.92, benchmarkReturn: 476.85, difference: 2.07 },
    ],
    history: generatePerformanceHistory(285, 1.3),
    metrics: {
      volatility: 16.45,
      sharpeRatio: 1.38,
      maxDrawdown: -25.12,
      beta: 1.02,
      alpha: 0.01,
    },
  },
  portfolio: {
    topHoldings: [
      { rank: 1, name: "Apple Inc.", ticker: "AAPL", weight: 6.45, shares: 152300000, marketValue: 36600000000 },
      { rank: 2, name: "Microsoft Corp.", ticker: "MSFT", weight: 6.23, shares: 87500000, marketValue: 35300000000 },
      { rank: 3, name: "Amazon.com Inc.", ticker: "AMZN", weight: 3.12, shares: 45800000, marketValue: 17700000000 },
      { rank: 4, name: "NVIDIA Corp.", ticker: "NVDA", weight: 2.89, shares: 33200000, marketValue: 16400000000 },
      { rank: 5, name: "Alphabet Inc. Class A", ticker: "GOOGL", weight: 1.95, shares: 78600000, marketValue: 11100000000 },
      { rank: 6, name: "Alphabet Inc. Class C", ticker: "GOOG", weight: 1.72, shares: 69200000, marketValue: 9800000000 },
      { rank: 7, name: "Meta Platforms Inc.", ticker: "META", weight: 1.62, shares: 25400000, marketValue: 9200000000 },
      { rank: 8, name: "Berkshire Hathaway Inc.", ticker: "BRK.B", weight: 1.52, shares: 23100000, marketValue: 8600000000 },
      { rank: 9, name: "Tesla Inc.", ticker: "TSLA", weight: 1.32, shares: 36800000, marketValue: 7500000000 },
      { rank: 10, name: "Eli Lilly and Company", ticker: "LLY", weight: 1.28, shares: 9200000, marketValue: 7300000000 },
    ],
    sectorAllocation: [
      { sector: "정보기술", weight: 29.8, color: "#0088FE" },
      { sector: "금융", weight: 13.5, color: "#00C49F" },
      { sector: "헬스케어", weight: 12.9, color: "#FFBB28" },
      { sector: "임의소비재", weight: 10.8, color: "#FF8042" },
      { sector: "통신서비스", weight: 8.5, color: "#8884d8" },
      { sector: "산업재", weight: 8.2, color: "#82ca9d" },
      { sector: "필수소비재", weight: 5.8, color: "#ffc658" },
      { sector: "에너지", weight: 4.2, color: "#ff7c43" },
      { sector: "부동산", weight: 2.8, color: "#a4de6c" },
      { sector: "유틸리티", weight: 2.5, color: "#d0ed57" },
      { sector: "소재", weight: 1.0, color: "#8dd1e1" },
    ],
    holdingsCount: 3842,
    turnoverRate: 3.2,
  },
  trading: {
    exchange: "NYSE Arca",
    tradingCurrency: "USD",
    avgVolume30d: 4200000,
    avgTradingValue: 1200000000,
    avgSpread: 0.01,
  },
  distribution: {
    history: [
      { exDate: "2025-12-23", recordDate: "2025-12-24", payDate: "2025-12-27", amount: 0.95 },
      { exDate: "2025-09-26", recordDate: "2025-09-29", payDate: "2025-10-02", amount: 0.88 },
      { exDate: "2025-06-27", recordDate: "2025-06-30", payDate: "2025-07-03", amount: 0.92 },
      { exDate: "2025-03-28", recordDate: "2025-03-31", payDate: "2025-04-03", amount: 0.85 },
    ],
    annualYield: 1.35,
    frequency: "분기",
  },
  lastUpdated: new Date().toISOString().split("T")[0],
}

// ETF 목록
export const etfList = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF" },
]

// 팩트시트 데이터 맵
export const factSheets: Record<string, ETFFactSheet> = {
  SPY: spyFactSheet,
  QQQ: qqqFactSheet,
  IWM: iwmFactSheet,
  VTI: vtiFactSheet,
}

// 팩트시트 조회 함수
export function getFactSheet(symbol: string): ETFFactSheet | undefined {
  return factSheets[symbol]
}
