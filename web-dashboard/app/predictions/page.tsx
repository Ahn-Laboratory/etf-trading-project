"use client"

import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, RefreshCw, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchPredictions, type Prediction } from "@/lib/api"

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"ALL" | "BUY" | "SELL" | "HOLD">("ALL")

  const loadPredictions = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPredictions()
      setPredictions(data)
    } catch (err) {
      setError("예측 데이터를 불러오는데 실패했습니다.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPredictions()
  }, [])

  const filteredPredictions = filter === "ALL"
    ? predictions
    : predictions.filter(p => p.signal === filter)

  const buyCount = predictions.filter(p => p.signal === "BUY").length
  const sellCount = predictions.filter(p => p.signal === "SELL").length
  const holdCount = predictions.filter(p => p.signal === "HOLD").length

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">예측 결과</h2>
            <p className="text-muted-foreground">RSI/MACD 기반 매매 신호 분석 결과</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadPredictions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              FastAPI 서비스가 실행 중인지 확인해주세요. (http://localhost:8000)
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">예측 결과</h2>
          <p className="text-muted-foreground">
            RSI/MACD 기반 매매 신호 분석 결과 {!loading && `(${predictions.length}개 종목)`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPredictions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
              매수 신호
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {buyCount}
                </div>
                <p className="text-xs text-green-600 dark:text-green-500">
                  RSI &lt; 30 과매도 구간
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
              매도 신호
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-red-700 dark:text-red-400">
                  {sellCount}
                </div>
                <p className="text-xs text-red-600 dark:text-red-500">
                  RSI &gt; 70 과매수 구간
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50 dark:bg-gray-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-400">
              관망 신호
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-700 dark:text-gray-400">
                  {holdCount}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-500">
                  30 &lt; RSI &lt; 70 중립 구간
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 필터 탭 */}
      <Tabs defaultValue="ALL" className="space-y-4" onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="ALL">전체 ({predictions.length})</TabsTrigger>
          <TabsTrigger value="BUY" className="text-green-600">매수 ({buyCount})</TabsTrigger>
          <TabsTrigger value="SELL" className="text-red-600">매도 ({sellCount})</TabsTrigger>
          <TabsTrigger value="HOLD">관망 ({holdCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>예측 상세</CardTitle>
              <CardDescription>
                마지막 업데이트: {predictions[0]?.updatedAt || "-"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>종목</TableHead>
                      <TableHead>현재가</TableHead>
                      <TableHead>RSI</TableHead>
                      <TableHead>MACD</TableHead>
                      <TableHead>신호</TableHead>
                      <TableHead>신뢰도</TableHead>
                      <TableHead className="text-right">예상 변동</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPredictions.map((prediction) => (
                      <TableRow key={prediction.symbol}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{prediction.symbol}</div>
                            <div className="text-sm text-muted-foreground">{prediction.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>${prediction.currentPrice.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={
                            prediction.rsi < 30 ? "text-green-600 font-medium" :
                            prediction.rsi > 70 ? "text-red-600 font-medium" : ""
                          }>
                            {prediction.rsi.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={prediction.macd >= 0 ? "text-green-600" : "text-red-600"}>
                            {prediction.macd >= 0 ? "+" : ""}{prediction.macd.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              prediction.signal === "BUY" ? "default" :
                              prediction.signal === "SELL" ? "destructive" : "secondary"
                            }
                            className={prediction.signal === "BUY" ? "bg-green-600" : ""}
                          >
                            {prediction.signal === "BUY" ? "매수" :
                             prediction.signal === "SELL" ? "매도" : "관망"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  prediction.confidence >= 75 ? "bg-green-500" :
                                  prediction.confidence >= 50 ? "bg-yellow-500" : "bg-red-500"
                                }`}
                                style={{ width: `${prediction.confidence}%` }}
                              />
                            </div>
                            <span className="text-sm">{prediction.confidence}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`flex items-center justify-end gap-1 ${
                            prediction.predictedChange >= 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {prediction.predictedChange >= 0 ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )}
                            {prediction.predictedChange >= 0 ? "+" : ""}{prediction.predictedChange.toFixed(2)}%
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 설명 */}
      <Card>
        <CardHeader>
          <CardTitle>예측 모델 설명</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>RSI (Relative Strength Index):</strong> 0-100 범위의 모멘텀 지표.
            30 이하는 과매도, 70 이상은 과매수 상태를 나타냅니다.
          </p>
          <p>
            <strong>MACD (Moving Average Convergence Divergence):</strong>
            추세 추종 모멘텀 지표. 양수는 상승 추세, 음수는 하락 추세를 나타냅니다.
          </p>
          <p>
            <strong>신뢰도:</strong> 모델의 예측 확신도. 높을수록 신호가 강합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
