'use client';

import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DailySummary } from '@/lib/types';

interface DayDetailModalProps {
  summary: DailySummary;
  onClose: () => void;
}

export function DayDetailModal({ summary, onClose }: DayDetailModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const isPositive = summary.totalProfitLoss >= 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {new Date(summary.date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </CardTitle>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>매수 {summary.buyCount}건</span>
              <span>·</span>
              <span>매도 {summary.sellCount}건</span>
              <span>·</span>
              <span
                className={`font-medium ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {isPositive ? '+' : ''}
                {summary.totalProfitLoss.toLocaleString()}원
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>구분</TableHead>
                <TableHead>ETF</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">가격</TableHead>
                <TableHead className="text-right">손익</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>
                    <Badge
                      variant={trade.side === 'BUY' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {trade.side === 'BUY' ? '매수' : '매도'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{trade.etfName}</div>
                    <div className="text-xs text-muted-foreground">
                      {trade.etfCode}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{trade.quantity}주</TableCell>
                  <TableCell className="text-right">
                    {trade.price.toLocaleString()}원
                  </TableCell>
                  <TableCell className="text-right">
                    {trade.profitLoss != null ? (
                      <span
                        className={`font-medium ${
                          trade.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {trade.profitLoss >= 0 ? '+' : ''}
                        {trade.profitLoss.toLocaleString()}원
                        {trade.profitLossPercent != null && (
                          <span className="ml-1 text-xs">
                            ({trade.profitLossPercent}%)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
