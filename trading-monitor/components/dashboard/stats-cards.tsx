'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberTicker } from '@/components/ui/number-ticker';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Money03Icon,
  ChartLineData02Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from '@hugeicons/core-free-icons';
import type { TradingStatus } from '@/lib/types';

interface StatsCardsProps {
  status: TradingStatus;
}

export function StatsCards({ status }: StatsCardsProps) {
  const stats = [
    {
      title: '투자금',
      value: status.totalInvestment,
      iconData: Money03Icon,
      description: `${status.mode === 'paper' ? '모의투자' : '실투자'}`,
      iconColor: 'text-blue-500',
      format: (v: number) =>
        `${(v / 10000).toLocaleString()}만원`,
    },
    {
      title: '보유 종목',
      value: status.holdingsCount,
      iconData: ChartLineData02Icon,
      description: '현재 보유중',
      iconColor: 'text-emerald-500',
    },
    {
      title: '오늘 매수',
      value: status.todayBuyCount,
      iconData: ArrowDown01Icon,
      description: '금일 매수 건수',
      iconColor: 'text-red-500',
    },
    {
      title: '오늘 매도',
      value: status.todaySellCount,
      iconData: ArrowUp01Icon,
      description: '금일 매도 건수',
      iconColor: 'text-cyan-500',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <HugeiconsIcon
              icon={stat.iconData}
              className={`h-4 w-4 ${stat.iconColor}`}
              strokeWidth={2}
            />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-semibold">
              {stat.format ? (
                stat.format(stat.value)
              ) : (
                <NumberTicker value={stat.value} />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
