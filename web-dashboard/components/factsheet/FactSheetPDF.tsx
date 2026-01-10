"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import { ETFFactSheet } from "@/lib/types/factsheet"

// PDF 스타일 정의
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: "#4f46e5",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
    backgroundColor: "#f3f4f6",
    padding: 6,
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  col2: {
    flexDirection: "row",
    gap: 20,
  },
  halfCol: {
    width: "48%",
  },
  label: {
    width: 100,
    color: "#6b7280",
    fontSize: 9,
  },
  value: {
    flex: 1,
    fontWeight: "bold",
    color: "#1f2937",
  },
  card: {
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    padding: 6,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottom: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellRight: {
    flex: 1,
    fontSize: 9,
    textAlign: "right",
  },
  tableCellHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
  },
  badge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "2 6",
    borderRadius: 4,
    fontSize: 8,
    alignSelf: "flex-start",
  },
  badgeLow: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  badgeMedium: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  badgeHigh: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  positive: {
    color: "#059669",
  },
  negative: {
    color: "#dc2626",
  },
  bulletPoint: {
    marginLeft: 10,
    marginBottom: 3,
    fontSize: 9,
    color: "#4b5563",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricBox: {
    width: "18%",
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    borderTop: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 30,
    fontSize: 8,
    color: "#9ca3af",
  },
})

// 숫자 포맷팅 헬퍼
const formatNumber = (value: number): string => {
  return value.toLocaleString("en-US")
}

const formatCurrency = (value: number, decimals = 2): string => {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
}

const formatLargeNumber = (value: number): string => {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`
  }
  return `$${value.toLocaleString()}`
}

const formatPercent = (value: number, showSign = false): string => {
  const formatted = value.toFixed(2)
  if (showSign && value > 0) {
    return `+${formatted}%`
  }
  return `${formatted}%`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const getRiskBadgeStyle = (level: string) => {
  switch (level) {
    case "LOW":
      return styles.badgeLow
    case "MEDIUM":
      return styles.badgeMedium
    case "HIGH":
      return styles.badgeHigh
    default:
      return styles.badgeMedium
  }
}

const getRiskLabel = (level: string) => {
  switch (level) {
    case "LOW":
      return "Low Risk"
    case "MEDIUM":
      return "Medium Risk"
    case "HIGH":
      return "High Risk"
    default:
      return level
  }
}

interface FactSheetPDFProps {
  data: ETFFactSheet
}

export const FactSheetPDF = ({ data }: FactSheetPDFProps) => (
  <Document>
    {/* Page 1: Key Facts, Strategy, Performance */}
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{data.keyFacts.productName}</Text>
        <Text style={styles.subtitle}>
          {data.keyFacts.symbol} | Fact Sheet | {formatDate(data.lastUpdated)}
        </Text>
      </View>

      {/* Key Facts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Facts</Text>
        <View style={styles.col2}>
          <View style={styles.halfCol}>
            <View style={styles.row}>
              <Text style={styles.label}>Product Name</Text>
              <Text style={styles.value}>{data.keyFacts.productName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Symbol</Text>
              <Text style={styles.value}>{data.keyFacts.symbol}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Underlying Index</Text>
              <Text style={styles.value}>{data.keyFacts.underlyingIndex}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Listing Date</Text>
              <Text style={styles.value}>{formatDate(data.keyFacts.listingDate)}</Text>
            </View>
          </View>
          <View style={styles.halfCol}>
            <View style={styles.row}>
              <Text style={styles.label}>AUM</Text>
              <Text style={styles.value}>{formatLargeNumber(data.keyFacts.aum)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Expense Ratio</Text>
              <Text style={styles.value}>{formatPercent(data.keyFacts.expenseRatio)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>NAV / Price</Text>
              <Text style={styles.value}>
                {formatCurrency(data.keyFacts.nav)} / {formatCurrency(data.keyFacts.marketPrice)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Premium/Discount</Text>
              <Text style={[styles.value, data.keyFacts.premium >= 0 ? styles.positive : styles.negative]}>
                {formatPercent(data.keyFacts.premium, true)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Investment Strategy Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Investment Strategy</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Objective</Text>
            <Text style={[styles.value, { fontSize: 9 }]}>{data.strategy.objective}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Strategy</Text>
            <Text style={[styles.value, { fontSize: 9 }]}>{data.strategy.strategy}</Text>
          </View>
          <View style={{ marginTop: 6 }}>
            <Text style={[styles.label, { marginBottom: 4 }]}>Key Points</Text>
            {data.strategy.keyPoints.map((point, index) => (
              <Text key={index} style={styles.bulletPoint}>
                - {point}
              </Text>
            ))}
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={styles.label}>Risk Level</Text>
            <Text style={[styles.badge, getRiskBadgeStyle(data.strategy.riskLevel)]}>
              {getRiskLabel(data.strategy.riskLevel)}
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>

        {/* Performance Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCellHeader}>Period</Text>
            <Text style={[styles.tableCellHeader, { textAlign: "right" }]}>ETF Return</Text>
            <Text style={[styles.tableCellHeader, { textAlign: "right" }]}>Benchmark</Text>
            <Text style={[styles.tableCellHeader, { textAlign: "right" }]}>Difference</Text>
          </View>
          {data.performance.returns.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{row.periodLabel}</Text>
              <Text style={[styles.tableCellRight, row.etfReturn >= 0 ? styles.positive : styles.negative]}>
                {formatPercent(row.etfReturn, true)}
              </Text>
              <Text style={[styles.tableCellRight, row.benchmarkReturn >= 0 ? styles.positive : styles.negative]}>
                {formatPercent(row.benchmarkReturn, true)}
              </Text>
              <Text style={[styles.tableCellRight, row.difference >= 0 ? styles.positive : styles.negative]}>
                {formatPercent(row.difference, true)}
              </Text>
            </View>
          ))}
        </View>

        {/* Performance Metrics */}
        <View style={[styles.metricsGrid, { marginTop: 12 }]}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Volatility</Text>
            <Text style={styles.metricValue}>{formatPercent(data.performance.metrics.volatility)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Sharpe Ratio</Text>
            <Text style={styles.metricValue}>{data.performance.metrics.sharpeRatio.toFixed(2)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Max Drawdown</Text>
            <Text style={[styles.metricValue, styles.negative]}>
              {formatPercent(data.performance.metrics.maxDrawdown)}
            </Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Beta</Text>
            <Text style={styles.metricValue}>{data.performance.metrics.beta.toFixed(2)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Alpha</Text>
            <Text style={[styles.metricValue, data.performance.metrics.alpha >= 0 ? styles.positive : styles.negative]}>
              {formatPercent(data.performance.metrics.alpha, true)}
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        This document is for informational purposes only and does not constitute investment advice.
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>

    {/* Page 2: Portfolio Composition & Trading Info */}
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{data.keyFacts.productName}</Text>
        <Text style={styles.subtitle}>Portfolio Composition & Trading Information</Text>
      </View>

      {/* Top 10 Holdings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Top 10 Holdings ({formatNumber(data.portfolio.holdingsCount)} total holdings | Turnover: {formatPercent(data.portfolio.turnoverRate)})
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { width: 30 }]}>#</Text>
            <Text style={[styles.tableCellHeader, { flex: 2 }]}>Name</Text>
            <Text style={styles.tableCellHeader}>Ticker</Text>
            <Text style={[styles.tableCellHeader, { textAlign: "right" }]}>Weight</Text>
            <Text style={[styles.tableCellHeader, { textAlign: "right" }]}>Value</Text>
          </View>
          {data.portfolio.topHoldings.map((holding) => (
            <View key={holding.rank} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: 30 }]}>{holding.rank}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{holding.name}</Text>
              <Text style={styles.tableCell}>{holding.ticker}</Text>
              <Text style={styles.tableCellRight}>{formatPercent(holding.weight)}</Text>
              <Text style={styles.tableCellRight}>{formatLargeNumber(holding.marketValue)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Sector Allocation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sector Allocation</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { flex: 2 }]}>Sector</Text>
            <Text style={[styles.tableCellHeader, { textAlign: "right" }]}>Weight</Text>
          </View>
          {data.portfolio.sectorAllocation.map((sector, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{sector.sector}</Text>
              <Text style={styles.tableCellRight}>{formatPercent(sector.weight)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Trading & Distribution Info */}
      <View style={styles.col2}>
        {/* Trading Info */}
        <View style={[styles.section, styles.halfCol]}>
          <Text style={styles.sectionTitle}>Trading Information</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Exchange</Text>
              <Text style={styles.value}>{data.trading.exchange}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Currency</Text>
              <Text style={styles.value}>{data.trading.tradingCurrency}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Avg Volume (30d)</Text>
              <Text style={styles.value}>{formatNumber(data.trading.avgVolume30d)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Avg Value</Text>
              <Text style={styles.value}>{formatLargeNumber(data.trading.avgTradingValue)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Avg Spread</Text>
              <Text style={styles.value}>{formatPercent(data.trading.avgSpread)}</Text>
            </View>
          </View>
        </View>

        {/* Distribution Info */}
        <View style={[styles.section, styles.halfCol]}>
          <Text style={styles.sectionTitle}>Distribution</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Annual Yield</Text>
              <Text style={styles.value}>{formatPercent(data.distribution.annualYield)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Frequency</Text>
              <Text style={styles.value}>{data.distribution.frequency}</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.label, { marginBottom: 4 }]}>Recent Distributions</Text>
              {data.distribution.history.slice(0, 3).map((dist, index) => (
                <View key={index} style={[styles.row, { marginLeft: 8 }]}>
                  <Text style={{ fontSize: 8, color: "#6b7280", width: 80 }}>
                    {formatDate(dist.exDate)}
                  </Text>
                  <Text style={{ fontSize: 8, fontWeight: "bold" }}>
                    {formatCurrency(dist.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        This document is for informational purposes only and does not constitute investment advice.
      </Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
        fixed
      />
    </Page>
  </Document>
)

export default FactSheetPDF
