'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TradingStatus } from '@/lib/types';

interface AutomationStatusProps {
  status: TradingStatus;
}

function getNextScheduledTime(
  targetHour: number,
  targetMinute: number,
  targetDay?: number
): string {
  const now = new Date();
  // Work in KST (UTC+9)
  const kstOffset = 9 * 60 * 60 * 1000;
  const nowKst = new Date(now.getTime() + kstOffset);

  if (targetDay !== undefined) {
    // Next occurrence of a specific day-of-month at a specific time
    const next = new Date(nowKst);
    next.setUTCDate(targetDay);
    next.setUTCHours(targetHour, targetMinute, 0, 0);
    if (next.getTime() <= nowKst.getTime()) {
      next.setUTCMonth(next.getUTCMonth() + 1);
      next.setUTCDate(targetDay);
    }
    // Convert back to local for display
    const localNext = new Date(next.getTime() - kstOffset);
    return localNext.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
    }) + ' 03:00 KST';
  }

  // Next daily occurrence of a specific hour:minute
  const next = new Date(nowKst);
  next.setUTCHours(targetHour, targetMinute, 0, 0);
  if (next.getTime() <= nowKst.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  const localNext = new Date(next.getTime() - kstOffset);
  return localNext.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }) + ' KST';
}

export function AutomationStatus({ status }: AutomationStatusProps) {
  const { automationStatus } = status;
  const isSuccess = automationStatus.success;

  const nextPrediction = getNextScheduledTime(6, 0);
  const nextTrading = getNextScheduledTime(8, 30);
  const nextRetraining = getNextScheduledTime(3, 0, 1);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          자동매매 상태
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isSuccess ? 'bg-green-500' : 'bg-red-500'
            } ${isSuccess ? 'animate-pulse' : ''}`}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">상태</span>
          <span
            className={`text-sm font-medium ${
              isSuccess ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isSuccess ? '정상' : '오류'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">마지막 실행</span>
          <span className="text-sm font-medium">
            {automationStatus.lastRun
              ? new Date(automationStatus.lastRun).toLocaleTimeString('ko-KR')
              : '-'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">메시지</span>
          <span className="text-sm font-medium">{automationStatus.message}</span>
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            예정 스케줄
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">다음 예측</span>
            <span className="text-sm font-medium tabular-nums">{nextPrediction}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">다음 매매</span>
            <span className="text-sm font-medium tabular-nums">{nextTrading}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">다음 재학습</span>
            <span className="text-sm font-medium tabular-nums">{nextRetraining}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
