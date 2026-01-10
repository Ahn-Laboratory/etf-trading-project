const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// API 예측 결과 타입 (FastAPI 응답 형식)
export interface APIPrediction {
  id: number
  symbol: string
  prediction_date: string
  target_date: string
  current_close: number
  predicted_close: number
  predicted_direction: "UP" | "DOWN"
  confidence: number
  rsi_value: number
  macd_value: number
  actual_close: number | null
  is_correct: boolean | null
}

export interface PredictionsResponse {
  count: number
  predictions: APIPrediction[]
}

// 프론트엔드용 변환된 예측 타입
export interface Prediction {
  symbol: string
  name: string
  signal: "BUY" | "SELL" | "HOLD"
  confidence: number
  rsi: number
  macd: number
  currentPrice: number
  predictedChange: number
  updatedAt: string
}

// 종목 이름 매핑 (추후 API에서 가져올 수 있음)
const STOCK_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  NVDA: "NVIDIA Corp.",
  MSFT: "Microsoft Corp.",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  META: "Meta Platforms Inc.",
  TSLA: "Tesla Inc.",
  AMD: "AMD Inc.",
  XOM: "Exxon Mobil Corp.",
  WMT: "Walmart Inc.",
  WFC: "Wells Fargo & Co.",
  JPM: "JPMorgan Chase & Co.",
  V: "Visa Inc.",
  JNJ: "Johnson & Johnson",
  PG: "Procter & Gamble Co.",
  UNH: "UnitedHealth Group Inc.",
  HD: "Home Depot Inc.",
  MA: "Mastercard Inc.",
  DIS: "Walt Disney Co.",
  PYPL: "PayPal Holdings Inc.",
}

// RSI 기반 신호 결정
function getSignalFromRSI(rsi: number): "BUY" | "SELL" | "HOLD" {
  if (rsi < 30) return "BUY"
  if (rsi > 70) return "SELL"
  return "HOLD"
}

// API 예측 데이터를 프론트엔드 형식으로 변환
export function transformPrediction(apiPred: APIPrediction): Prediction {
  const predictedChange = ((apiPred.predicted_close - apiPred.current_close) / apiPred.current_close) * 100

  return {
    symbol: apiPred.symbol,
    name: STOCK_NAMES[apiPred.symbol] || apiPred.symbol,
    signal: getSignalFromRSI(apiPred.rsi_value),
    confidence: Math.round(apiPred.confidence * 100),
    rsi: apiPred.rsi_value,
    macd: apiPred.macd_value,
    currentPrice: apiPred.current_close,
    predictedChange: parseFloat(predictedChange.toFixed(2)),
    updatedAt: new Date(apiPred.prediction_date).toLocaleString("ko-KR"),
  }
}

// 예측 데이터 가져오기
export async function fetchPredictions(): Promise<Prediction[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/predictions`, {
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data: PredictionsResponse = await response.json()
    return data.predictions.map(transformPrediction)
  } catch (error) {
    console.error("Failed to fetch predictions:", error)
    throw error
  }
}

// 헬스 체크
export async function checkHealth(): Promise<{
  status: string
  remote_db: string
  local_db: string
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      cache: "no-store",
    })
    return response.json()
  } catch (error) {
    return {
      status: "error",
      remote_db: "unknown",
      local_db: "unknown",
    }
  }
}
