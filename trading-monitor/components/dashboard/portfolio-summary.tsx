'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PortfolioResponse } from '@/lib/types';

interface PortfolioSummaryProps {
  portfolio: PortfolioResponse;
}

export function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const isPositive = portfolio.totalProfitLoss >= 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">포트폴리오 요약</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">총 투자금</span>
          <span className="text-sm font-medium">
            {portfolio.totalInvestment.toLocaleString()}원
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">현재 평가</span>
          <span className="text-sm font-medium">
            {portfolio.totalCurrentValue.toLocaleString()}원
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">총 손익</span>
          <span
            className={`text-sm font-semibold ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isPositive ? '+' : ''}
            {portfolio.totalProfitLoss.toLocaleString()}원 (
            {isPositive ? '+' : ''}
            {portfolio.totalProfitLossPercent}%)
          </span>
        </div>
        <div className="border-t border-border pt-3">
          <div className="grid grid-cols-2 gap-2">
            {portfolio.holdings.slice(0, 3).map((h) => (
              <div key={h.etfCode} className="text-xs">
                <span className="text-muted-foreground">{h.etfName}</span>
                <span
                  className={`ml-1 font-medium ${
                    h.profitLossPercent >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {h.profitLossPercent >= 0 ? '+' : ''}
                  {h.profitLossPercent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
