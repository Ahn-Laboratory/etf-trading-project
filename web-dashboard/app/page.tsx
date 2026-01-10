"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Briefcase, LineChart, TrendingUp, DollarSign, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchPredictions, checkHealth, type Prediction } from "@/lib/api"
import { portfolio, returns } from "@/lib/data"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, XAxis, YAxis } from "recharts"

const chartConfig = {
  portfolioValue: {
    label: "포트폴리오 가치",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<"ok" | "error" | "loading">("loading")

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [predictionsData, health] = await Promise.all([
          fetchPredictions(),
          checkHealth(),
        ])
        setPredictions(predictionsData)
        setApiStatus(health.status === "unhealthy" ? "error" : "ok")
      } catch {
        setApiStatus("error")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const recentReturns = returns.slice(-7)
  const topPredictions = predictions.slice(0, 5)
  const topHoldings = portfolio.slice(0, 5)

  const summary = {
    totalValue: portfolio.reduce((sum, item) => sum + item.totalValue, 0),
    totalProfit: portfolio.reduce((sum, item) => sum + item.profit, 0),
    profitPercent: 5.23,
    buySignals: predictions.filter((p) => p.signal === "BUY").length,
    sellSignals: predictions.filter((p) => p.signal === "SELL").length,
    holdSignals: predictions.filter((p) => p.signal === "HOLD").length,
  }

  return (
    <div className="space-y-6">
      {/* API 상태 알림 */}
      {apiStatus === "error" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">원격 DB 연결 오류 - 로컬 데이터로 표시 중</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 포트폴리오 가치</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className={summary.profitPercent >= 0 ? "text-green-600" : "text-red-600"}>
                {summary.profitPercent >= 0 ? "+" : ""}{summary.profitPercent}%
              </span>{" "}
              전일 대비
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수익</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.totalProfit >= 0 ? "+" : ""}${summary.totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              전체 보유 종목 기준
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">보유 종목</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.length}</div>
            <p className="text-xs text-muted-foreground">
              {portfolio.filter(p => p.profit > 0).length}개 수익, {portfolio.filter(p => p.profit <= 0).length}개 손실
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘의 시그널</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <div className="flex gap-2">
                <Badge variant="default" className="bg-green-600">매수 {summary.buySignals}</Badge>
                <Badge variant="destructive">매도 {summary.sellSignals}</Badge>
                <Badge variant="secondary">관망 {summary.holdSignals}</Badge>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {loading ? "로딩 중..." : `총 ${predictions.length}개 종목 분석`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 포트폴리오 차트 */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>포트폴리오 추이</CardTitle>
            <CardDescription>최근 7일 포트폴리오 가치 변동</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={recentReturns}>
                <defs>
                  <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-portfolioValue)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-portfolioValue)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => value.slice(5)}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="portfolioValue"
                  stroke="var(--color-portfolioValue)"
                  fill="url(#fillValue)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 최근 예측 결과 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>최근 예측 시그널</CardTitle>
            <CardDescription>RSI/MACD 기반 매매 신호 (실시간)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {topPredictions.map((prediction) => (
                  <div key={prediction.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold">{prediction.symbol}</div>
                      <Badge
                        variant={
                          prediction.signal === "BUY" ? "default" :
                          prediction.signal === "SELL" ? "destructive" : "secondary"
                        }
                        className={prediction.signal === "BUY" ? "bg-green-600" : ""}
                      >
                        {prediction.signal === "BUY" ? "매수" : prediction.signal === "SELL" ? "매도" : "관망"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">신뢰도</span>
                      <span className="font-medium">{prediction.confidence}%</span>
                      {prediction.predictedChange >= 0 ? (
                        <ArrowUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 보유 종목 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>보유 종목 현황</CardTitle>
          <CardDescription>현재 포트폴리오 상위 종목 (더미 데이터)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topHoldings.map((item) => (
              <div key={item.symbol} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <div className="font-semibold">{item.symbol}</div>
                  <div className="text-sm text-muted-foreground">{item.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${item.totalValue.toLocaleString()}</div>
                  <div className={`text-sm ${item.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {item.profit >= 0 ? "+" : ""}{item.profitPercent.toFixed(2)}% ({item.profit >= 0 ? "+" : ""}${item.profit.toLocaleString()})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
