import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { parseScrapingLog } from '@/lib/scraping-log-parser';
import { ScrapingStatus, SymbolScrapingStatus, JobStatus, ScrapingError } from '@/lib/types';
import { SYMBOLS, TIMEFRAMES } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Path to task_info.json (Docker mount - same for dev and prod)
const TASK_INFO_PATH = '/app/logs/task_info.json';

interface TimeframeInfo {
  status: string;
  rows: number;
  error?: string;
  downloaded_at?: string;
  uploaded_at?: string;
}

interface SymbolInfo {
  symbol: string;
  status: string;
  timeframes: Record<string, TimeframeInfo>;
  error?: string;
  start_time?: string;
  end_time?: string;
}

interface RetryTask {
  retry_id: string;
  parent_job_id: string;
  symbols: string[];
  status: string;
  start_time?: string;
  end_time?: string;
}

interface TaskInfoJob {
  job_id: string;
  status: string;
  symbols: Record<string, SymbolInfo>;
  current_symbol?: string;
  current_timeframe?: string;
  start_time?: string;
  end_time?: string;
  total_downloaded: number;
  total_uploaded: number;
  total_rows: number;
  retry_tasks: RetryTask[];
}

// Map timeframe status from task_info to ScrapingStatus format
function mapTimeframeStatus(status: string): 'pending' | 'downloading' | 'success' | 'failed' {
  switch (status) {
    case 'pending': return 'pending';
    case 'downloading': return 'downloading';
    case 'success': return 'success';
    case 'failed': return 'failed';
    default: return 'pending';
  }
}

// Convert task_info.json format to ScrapingStatus
function convertTaskInfoToStatus(taskInfo: TaskInfoJob): ScrapingStatus {
  // Map status from task_info to JobStatus
  const statusMap: Record<string, JobStatus> = {
    'idle': 'idle',
    'running': 'running',
    'completed': 'completed',
    'partial': 'partial',
    'stopped': 'idle',
    'error': 'error',
  };

  const status = statusMap[taskInfo.status] || 'idle';

  // Build symbols array
  const symbols: SymbolScrapingStatus[] = SYMBOLS.map(symbol => {
    const taskSymbol = taskInfo.symbols[symbol];

    if (!taskSymbol) {
      return {
        symbol,
        status: 'pending' as const,
        timeframes: {
          '12달': { status: 'pending' as const },
          '1달': { status: 'pending' as const },
          '1주': { status: 'pending' as const },
          '1일': { status: 'pending' as const },
        },
      };
    }

    // Map symbol status
    let symbolStatus: 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed' = 'pending';
    switch (taskSymbol.status) {
      case 'pending': symbolStatus = 'pending'; break;
      case 'downloading': symbolStatus = 'in_progress'; break;
      case 'uploading': symbolStatus = 'in_progress'; break;
      case 'completed': symbolStatus = 'completed'; break;
      case 'partial': symbolStatus = 'partial'; break;
      case 'failed': symbolStatus = 'failed'; break;
    }

    // Map each timeframe status from task_info
    const timeframes = taskSymbol.timeframes || {};
    const tf12 = timeframes['12달'] || { status: 'pending', rows: 0 };
    const tf1m = timeframes['1달'] || { status: 'pending', rows: 0 };
    const tf1w = timeframes['1주'] || { status: 'pending', rows: 0 };
    const tf1d = timeframes['1일'] || { status: 'pending', rows: 0 };

    // Calculate total rows from all timeframes
    const totalRows = (tf12.rows || 0) + (tf1m.rows || 0) + (tf1w.rows || 0) + (tf1d.rows || 0);

    return {
      symbol,
      status: symbolStatus,
      startedAt: taskSymbol.start_time,
      completedAt: taskSymbol.end_time,
      timeframes: {
        '12달': {
          status: mapTimeframeStatus(tf12.status),
          rows: tf12.rows || undefined,
          error: tf12.error,
        },
        '1달': {
          status: mapTimeframeStatus(tf1m.status),
          rows: tf1m.rows || undefined,
          error: tf1m.error,
        },
        '1주': {
          status: mapTimeframeStatus(tf1w.status),
          rows: tf1w.rows || undefined,
          error: tf1w.error,
        },
        '1일': {
          status: mapTimeframeStatus(tf1d.status),
          rows: tf1d.rows || undefined,
          error: tf1d.error,
        },
      },
    };
  });

  // Calculate progress
  const completedCount = Object.values(taskInfo.symbols).filter(s => s.status === 'completed').length;
  const totalSymbols = Object.keys(taskInfo.symbols).length || SYMBOLS.length;

  // Collect errors from all timeframes
  const errors: ScrapingError[] = [];
  for (const sym of Object.values(taskInfo.symbols)) {
    if (sym.timeframes) {
      for (const [tfName, tf] of Object.entries(sym.timeframes)) {
        if (tf.error) {
          errors.push({
            timestamp: sym.end_time || new Date().toISOString(),
            symbol: sym.symbol,
            timeframe: tfName as any,
            type: 'download' as const,
            message: tf.error,
          });
        }
      }
    }
  }

  return {
    status,
    lastRun: taskInfo.end_time || taskInfo.start_time || null,
    currentSession: taskInfo.start_time ? {
      startTime: taskInfo.start_time,
      headlessMode: true,
      dbUploadEnabled: true,
      sshTunnelActive: true,
    } : null,
    progress: {
      totalSymbols: totalSymbols,
      completedSymbols: completedCount,
      currentSymbol: taskInfo.current_symbol || null,
      currentTimeframe: (taskInfo.current_timeframe as '12달' | '1달' | '1주' | '1일') || null,
      percentage: totalSymbols > 0 ? Math.round((completedCount / totalSymbols) * 100) : 0,
    },
    statistics: {
      totalDownloads: taskInfo.total_downloaded,
      successfulUploads: taskInfo.total_uploaded,
      failedDownloads: Object.values(taskInfo.symbols).filter(s => s.status === 'failed' || s.status === 'partial').length,
      totalRowsUploaded: taskInfo.total_rows,
    },
    symbols,
    errors: errors.slice(-50), // Keep last 50 errors
  };
}

export async function GET() {
  try {
    // Try to read task_info.json first (new scraper-service format)
    try {
      const taskInfoContent = await fs.readFile(TASK_INFO_PATH, 'utf-8');
      const taskInfo: TaskInfoJob = JSON.parse(taskInfoContent);

      // If task_info.json exists and has valid data, use it
      if (taskInfo && taskInfo.job_id && taskInfo.job_id !== 'initial') {
        const status = convertTaskInfoToStatus(taskInfo);
        return NextResponse.json(status);
      }
    } catch (taskInfoError) {
      // task_info.json not found or invalid, fall through to log parsing
      console.log('task_info.json not available, falling back to log parsing');
    }

    // Fall back to parsing the log file
    const status = await parseScrapingLog();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching scraping status:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastRun: null,
        currentSession: null,
        progress: {
          totalSymbols: 101,
          completedSymbols: 0,
          currentSymbol: null,
          currentTimeframe: null,
          percentage: 0,
        },
        statistics: {
          totalDownloads: 0,
          successfulUploads: 0,
          failedDownloads: 0,
          totalRowsUploaded: 0,
        },
        symbols: [],
        errors: [],
      },
      { status: 500 }
    );
  }
}
