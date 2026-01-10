"use client"

import { useState } from "react"
import {
  TrendingUp,
  Info,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { etfList, getFactSheet } from "@/lib/factsheet-data"
import {
  formatDate,
  formatCurrency,
  formatLargeNumber,
  formatPercent,
  formatNumber,
} from "@/lib/pdf-utils"
import { PDFDownloadButton } from "@/components/factsheet/PDFDownloadButton"

export default function FactSheetPage() {
  const [selectedETF, setSelectedETF] = useState("SPY")

  const factSheet = getFactSheet(selectedETF)

  if (!factSheet) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">팩트시트를 불러올 수 없습니다.</p>
      </div>
    )
  }

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "bg-green-600"
      case "MEDIUM":
        return "bg-yellow-600"
      case "HIGH":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "LOW":
        return "낮음"
      case "MEDIUM":
        return "중간"
      case "HIGH":
        return "높음"
      default:
        return level
    }
  }

  const chartConfig = {
    etfValue: {
      label: "ETF",
      color: "hsl(var(--chart-1))",
    },
    benchmarkValue: {
      label: "벤치마크",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  const sectorChartConfig = Object.fromEntries(
    factSheet.portfolio.sectorAllocation.map((item) => [
      item.sector,
      { label: item.sector, color: item.color },
    ])
  ) satisfies ChartConfig

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">팩트시트</h2>
          <p className="text-muted-foreground">ETF 상품 정보 및 운용 현황</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedETF} onValueChange={(value) => value && setSelectedETF(value)}>
            <SelectTrigger className="w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {etfList.map((etf) => (
                <SelectItem key={etf.symbol} value={etf.symbol}>
                  {etf.symbol} - {etf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PDFDownloadButton data={factSheet} symbol={selectedETF} />
        </div>
      </div>

      {/* Factsheet Content */}
      <div className="space-y-6">
        {/* Section 1: 기본 정보 + 투자 포인트 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                기본 정보
              </CardTitle>
              <CardDescription>상품 개요 및 Key Facts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">상품명</p>
                    <p className="font-medium">{factSheet.keyFacts.productName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">종목코드</p>
                    <p className="font-medium">{factSheet.keyFacts.symbol}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">기초지수</p>
                    <p className="font-medium">{factSheet.keyFacts.underlyingIndex}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">상장일</p>
                    <p className="font-medium">{formatDate(factSheet.keyFacts.listingDate)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">순자산총액 (AUM)</p>
                    <p className="font-medium">{formatLargeNumber(factSheet.keyFacts.aum)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">총보수율</p>
                    <p className="font-medium">{formatPercent(factSheet.keyFacts.expenseRatio)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">NAV / 시장가</p>
                    <p className="font-medium">
                      {formatCurrency(factSheet.keyFacts.nav)} / {formatCurrency(factSheet.keyFacts.marketPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">프리미엄/디스카운트</p>
                    <p className={`font-medium ${factSheet.keyFacts.premium >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPercent(factSheet.keyFacts.premium, true)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 투자 포인트 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                투자 포인트
              </CardTitle>
              <CardDescription>운용 전략 및 핵심 가치</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">운용 목표</p>
                <p className="text-sm">{factSheet.strategy.objective}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">운용 전략</p>
                <p className="text-sm">{factSheet.strategy.strategy}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">핵심 가치</p>
                <ul className="space-y-1">
                  {factSheet.strategy.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-1">-</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">위험등급:</span>
                <Badge className={getRiskBadgeColor(factSheet.strategy.riskLevel)}>
                  {getRiskLabel(factSheet.strategy.riskLevel)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: 운용 성과 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              운용 성과
            </CardTitle>
            <CardDescription>수익률 및 성과 지표</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="table" className="space-y-4">
              <TabsList>
                <TabsTrigger value="table">수익률 테이블</TabsTrigger>
                <TabsTrigger value="chart">성과 추이</TabsTrigger>
                <TabsTrigger value="metrics">성과 지표</TabsTrigger>
              </TabsList>

              <TabsContent value="table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>기간</TableHead>
                      <TableHead className="text-right">ETF 수익률</TableHead>
                      <TableHead className="text-right">벤치마크 수익률</TableHead>
                      <TableHead className="text-right">차이</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factSheet.performance.returns.map((row) => (
                      <TableRow key={row.period}>
                        <TableCell className="font-medium">{row.periodLabel}</TableCell>
                        <TableCell className={`text-right ${row.etfReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPercent(row.etfReturn, true)}
                        </TableCell>
                        <TableCell className={`text-right ${row.benchmarkReturn >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPercent(row.benchmarkReturn, true)}
                        </TableCell>
                        <TableCell className={`text-right ${row.difference >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatPercent(row.difference, true)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="chart">
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <LineChart data={factSheet.performance.history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getMonth() + 1}/${date.getDate()}`
                      }}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="etfValue"
                      name="ETF"
                      stroke="var(--color-etfValue)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmarkValue"
                      name="벤치마크"
                      stroke="var(--color-benchmarkValue)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </TabsContent>

              <TabsContent value="metrics">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">변동성</p>
                    <p className="text-xl font-bold">{formatPercent(factSheet.performance.metrics.volatility)}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">샤프지수</p>
                    <p className="text-xl font-bold">{factSheet.performance.metrics.sharpeRatio.toFixed(2)}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">최대낙폭</p>
                    <p className="text-xl font-bold text-red-600">{formatPercent(factSheet.performance.metrics.maxDrawdown)}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">베타</p>
                    <p className="text-xl font-bold">{factSheet.performance.metrics.beta.toFixed(2)}</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">알파</p>
                    <p className={`text-xl font-bold ${factSheet.performance.metrics.alpha >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPercent(factSheet.performance.metrics.alpha, true)}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Section 3: 포트폴리오 구성 */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* 상위 종목 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                상위 10개 종목
              </CardTitle>
              <CardDescription>
                총 {formatNumber(factSheet.portfolio.holdingsCount)}개 종목 보유 | 회전율 {formatPercent(factSheet.portfolio.turnoverRate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">순위</TableHead>
                    <TableHead>종목</TableHead>
                    <TableHead className="text-right">비중</TableHead>
                    <TableHead className="text-right">평가금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factSheet.portfolio.topHoldings.map((holding) => (
                    <TableRow key={holding.rank}>
                      <TableCell className="font-medium">{holding.rank}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{holding.ticker}</div>
                          <div className="text-xs text-muted-foreground">{holding.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatPercent(holding.weight)}</TableCell>
                      <TableCell className="text-right">{formatLargeNumber(holding.marketValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 업종별 비중 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                업종별 비중
              </CardTitle>
              <CardDescription>섹터 배분 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={sectorChartConfig} className="h-[250px]">
                <RechartsPie>
                  <Pie
                    data={factSheet.portfolio.sectorAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="weight"
                    nameKey="sector"
                  >
                    {factSheet.portfolio.sectorAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                </RechartsPie>
              </ChartContainer>
              <div className="mt-4 space-y-1 max-h-[150px] overflow-y-auto">
                {factSheet.portfolio.sectorAllocation.slice(0, 6).map((sector) => (
                  <div key={sector.sector} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: sector.color }}
                      />
                      <span>{sector.sector}</span>
                    </div>
                    <span className="font-medium">{formatPercent(sector.weight)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 4: 거래 및 분배 정보 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 거래 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                거래 정보
              </CardTitle>
              <CardDescription>거래소 및 유동성 현황</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">거래소</p>
                  <p className="font-medium">{factSheet.trading.exchange}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">거래통화</p>
                  <p className="font-medium">{factSheet.trading.tradingCurrency}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">30일 평균 거래량</p>
                  <p className="font-medium">{formatNumber(factSheet.trading.avgVolume30d)}주</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">평균 거래대금</p>
                  <p className="font-medium">{formatLargeNumber(factSheet.trading.avgTradingValue)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">평균 스프레드</p>
                  <p className="font-medium">{formatPercent(factSheet.trading.avgSpread)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 분배금 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                분배금 정보
              </CardTitle>
              <CardDescription>
                연간 분배율 {formatPercent(factSheet.distribution.annualYield)} | {factSheet.distribution.frequency} 지급
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>배당락일</TableHead>
                    <TableHead>지급일</TableHead>
                    <TableHead className="text-right">분배금</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factSheet.distribution.history.map((dist, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(dist.exDate)}</TableCell>
                      <TableCell>{formatDate(dist.payDate)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(dist.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center py-4 border-t">
          마지막 업데이트: {formatDate(factSheet.lastUpdated)} | 본 자료는 투자 권유가 아니며, 투자 결정 시 본인의 판단과 책임하에 결정하시기 바랍니다.
        </div>
      </div>
    </div>
  )
}
