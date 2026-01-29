import time
import argparse
from datetime import datetime
from tradingview_screener import Query
import rookiepy

# 지원하는 마켓 목록
MARKETS = [
    'america', 'korea', 'japan', 'china', 'india', 'uk', 'germany',
    'france', 'canada', 'australia', 'brazil', 'russia', 'taiwan',
    'hongkong', 'singapore', 'indonesia', 'malaysia', 'thailand',
    'vietnam', 'philippines', 'mexico', 'italy', 'spain', 'switzerland'
]

def fetch_stock(market='america', ticker='AAPL', interval=10):
    """
    특정 시장의 주식 데이터를 실시간으로 불러오기

    Args:
        market (str): 시장 (예: 'america', 'korea', 'japan')
        ticker (str): 티커/종목코드 (예: 'AAPL', '005930')
        interval (int): 데이터 갱신 간격 (초 단위, 기본값: 10초)
    """
    # 브라우저에서 TradingView 쿠키 로드
    print("Loading TradingView cookies from browser...")
    try:
        cookies = rookiepy.to_cookiejar(rookiepy.chrome(['.tradingview.com']))
        print("✓ Cookies loaded successfully\n")
    except Exception as e:
        print(f"⚠ Failed to load cookies: {e}")
        print("  Continuing without authentication (data may be delayed)\n")
        cookies = None

    print(f"Starting real-time stock data fetching...")
    print(f"  Market: {market}")
    print(f"  Ticker: {ticker}")
    print(f"  Refresh interval: {interval} seconds")
    print("Press Ctrl+C to stop\n")

    while True:
        try:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"[{timestamp}] Fetching {ticker} data...")

            # 주식 데이터 조회 (쿠키 인증 포함)
            result = (Query()
                .set_markets(market)
                .select('name', 'close', 'volume', 'market_cap_basic', 'change', 'update_mode')
                .get_scanner_data(cookies=cookies))

            # 결과 구조: (total_count, DataFrame)
            count, df = result

            # 티커 찾기
            stock_df = df[df['ticker'].str.contains(ticker, case=False, na=False)]

            if not stock_df.empty:
                print(f"[{timestamp}] {ticker} Stock Data:")
                print(f"{'-' * 80}")
                print(stock_df.to_string(index=False))
                print(f"{'-' * 80}")
            else:
                print(f"[{timestamp}] {ticker} not found in {count} results")
                print(f"  Sample tickers: {df['ticker'].head(10).tolist()}")

            # 지정된 간격으로 대기
            time.sleep(interval)

        except Exception as e:
            print(f"[ERROR] Failed to fetch data: {type(e).__name__}: {e}")
            print(f"Retrying in 5 seconds...\n")
            time.sleep(5)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Real-time stock data fetcher using TradingView Screener')
    parser.add_argument('-m', '--market', type=str, default='america',
                        help=f'Market to fetch from (default: america). Options: {", ".join(MARKETS)}')
    parser.add_argument('-t', '--ticker', type=str, default='AAPL',
                        help='Ticker/symbol to search for (default: AAPL)')
    parser.add_argument('-i', '--interval', type=int, default=10,
                        help='Refresh interval in seconds (default: 10)')

    args = parser.parse_args()

    print("=" * 60)
    print("  TradingView Stock Data Fetcher")
    print("=" * 60)

    try:
        fetch_stock(market=args.market, ticker=args.ticker, interval=args.interval)
    except KeyboardInterrupt:
        print("\n\nStopped by user")
