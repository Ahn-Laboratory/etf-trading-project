import { NextResponse } from 'next/server';
import { generateDummyPortfolio } from '@/lib/dummy-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TRADING_SERVICE_URL = process.env.TRADING_SERVICE_URL || 'http://localhost:8002';

export async function GET() {
  try {
    const response = await fetch(`${TRADING_SERVICE_URL}/api/trading/portfolio`, {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const data = await response.json();
      console.log('[BFF] trading/portfolio: 실서비스 데이터 사용');
      return NextResponse.json(data);
    }
    throw new Error(`Trading service responded with ${response.status}`);
  } catch (error) {
    console.log('[BFF] trading/portfolio: 더미 데이터 사용 -', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json(generateDummyPortfolio());
  }
}
