import { NextRequest, NextResponse } from 'next/server';

const SCRAPER_API_URL = process.env.SCRAPER_API_URL || 'http://scraper-service:8001';

interface RetryRequest {
  symbol: string;
}

interface ScraperJobResponse {
  job_id: string;
  job_type: string;
  status: string;
  symbol?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RetryRequest = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Validate symbol format (basic validation)
    const symbolPattern = /^[A-Z0-9.]{1,10}$/;
    if (!symbolPattern.test(symbol)) {
      return NextResponse.json(
        { error: 'Invalid symbol format' },
        { status: 400 }
      );
    }

    // Check if a job is already running
    const healthResponse = await fetch(`${SCRAPER_API_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!healthResponse.ok) {
      return NextResponse.json(
        { error: 'Scraper service unavailable' },
        { status: 503 }
      );
    }

    const healthData = await healthResponse.json();
    if (healthData.current_job) {
      return NextResponse.json(
        {
          error: 'A job is already running',
          current_job: healthData.current_job
        },
        { status: 409 }
      );
    }

    // Start retry job
    const retryResponse = await fetch(`${SCRAPER_API_URL}/jobs/retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols: [symbol] }),
    });

    if (!retryResponse.ok) {
      const errorData = await retryResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to start retry job' },
        { status: retryResponse.status }
      );
    }

    const jobData: ScraperJobResponse = await retryResponse.json();

    return NextResponse.json({
      success: true,
      message: `Retry started for ${symbol}`,
      job_id: jobData.job_id,
      status: jobData.status,
    });

  } catch (error) {
    console.error('Retry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current job status
    const statusResponse = await fetch(`${SCRAPER_API_URL}/jobs/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!statusResponse.ok) {
      return NextResponse.json(
        { error: 'Scraper service unavailable' },
        { status: 503 }
      );
    }

    const statusData = await statusResponse.json();
    return NextResponse.json(statusData);

  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
