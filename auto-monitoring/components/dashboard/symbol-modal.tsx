'use client';

import { useState, useEffect } from 'react';
import { SymbolScrapingStatus, TimeframeCode } from '@/lib/types';
import { TIMEFRAMES } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LogEntry {
  timestamp: string | null;
  level: string | null;
  message: string;
  raw: string;
}

interface SymbolModalProps {
  symbol: SymbolScrapingStatus;
  isOpen: boolean;
  onClose: () => void;
  onRetry: (symbol: string) => void;
}

export function SymbolModal({ symbol, isOpen, onClose, onRetry }: SymbolModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [retryStatus, setRetryStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    if (isOpen && symbol) {
      fetchLogs();
      setRetryStatus(null);
    }
  }, [isOpen, symbol]);

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await fetch(`/monitor/api/logs?symbol=${symbol.symbol}&lines=100`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRetry = async () => {
    setRetryLoading(true);
    setRetryStatus(null);
    try {
      const response = await fetch('/monitor/api/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.symbol }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setRetryStatus({ success: true, message: data.message || `Retry started for ${symbol.symbol}` });
        onRetry(symbol.symbol);
      } else {
        setRetryStatus({ success: false, message: data.error || 'Failed to start retry' });
      }
    } catch (error) {
      console.error('Failed to start retry:', error);
      setRetryStatus({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setRetryLoading(false);
    }
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 dark:text-red-400';
      case 'WARNING': return 'text-yellow-600 dark:text-yellow-400';
      case 'INFO': return 'text-green-600 dark:text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  const statusConfig = {
    pending: { bg: 'bg-gray-500', text: 'Pending' },
    in_progress: { bg: 'bg-blue-500', text: 'In Progress' },
    completed: { bg: 'bg-green-500', text: 'Completed' },
    partial: { bg: 'bg-yellow-500', text: 'Partial' },
    failed: { bg: 'bg-red-500', text: 'Failed' },
  };

  const config = statusConfig[symbol.status];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative bg-background border shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{symbol.symbol}</h2>
            <Badge className={`text-xs ${config.bg} text-white`}>
              {config.text}
            </Badge>
            {symbol.duration && (
              <span className="text-sm text-muted-foreground">
                Duration: {formatDuration(symbol.duration)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(symbol.status === 'failed' || symbol.status === 'partial') && (
              <Button
                onClick={handleRetry}
                disabled={retryLoading}
                size="sm"
                variant="outline"
              >
                {retryLoading ? '⏳ Starting...' : '🔄 Retry'}
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-muted rounded transition"
            >
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Retry Status */}
          {retryStatus && (
            <div className={`border rounded-lg p-3 ${
              retryStatus.success
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{retryStatus.success ? '✅' : '❌'}</span>
                <span className={`text-sm font-medium ${
                  retryStatus.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  {retryStatus.message}
                </span>
              </div>
              {retryStatus.success && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  페이지를 새로고침하여 진행 상황을 확인하세요.
                </p>
              )}
            </div>
          )}

          {/* Timeframes */}
          <div>
            <h3 className="text-sm font-medium mb-2">Timeframes</h3>
            <div className="grid grid-cols-4 gap-2">
              {TIMEFRAMES.map((tf) => {
                const tfData = symbol.timeframes[tf];
                const status = tfData?.status || 'pending';
                const statusColors = {
                  pending: 'bg-muted text-muted-foreground',
                  downloading: 'bg-blue-500 text-white animate-pulse',
                  success: 'bg-green-500 text-white',
                  failed: 'bg-red-500 text-white',
                };

                return (
                  <div
                    key={tf}
                    className={`p-3 rounded-lg ${statusColors[status as keyof typeof statusColors]}`}
                  >
                    <div className="font-semibold text-sm">{tf}</div>
                    <div className="text-xs opacity-80">{status}</div>
                    {tfData?.rows && (
                      <div className="text-xs mt-1">{tfData.rows.toLocaleString()} rows</div>
                    )}
                    {tfData?.error && (
                      <div className="text-xs mt-1 truncate" title={tfData.error}>
                        {tfData.error.slice(0, 30)}...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Logs</h3>
              <button
                onClick={fetchLogs}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Refresh
              </button>
            </div>
            <div className="bg-muted/50 rounded-lg border overflow-hidden">
              {logsLoading ? (
                <div className="p-4 text-center text-muted-foreground text-sm">Loading logs...</div>
              ) : logs.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No logs found for {symbol.symbol}</div>
              ) : (
                <div className="max-h-64 overflow-y-auto font-mono text-xs">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`px-3 py-1 hover:bg-muted/80 ${
                        log.level === 'ERROR' ? 'bg-red-500/10' : ''
                      }`}
                    >
                      {log.timestamp && (
                        <span className="text-muted-foreground mr-2">
                          {log.timestamp.split(' ')[1]?.split(',')[0]}
                        </span>
                      )}
                      {log.level && (
                        <span className={`mr-2 ${getLevelColor(log.level)}`}>
                          [{log.level}]
                        </span>
                      )}
                      <span className={
                        log.message.includes('✓') ? 'text-green-600 dark:text-green-400' :
                        log.message.includes('✗') ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                      }>
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
