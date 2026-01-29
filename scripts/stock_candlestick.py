"""
주식 히스토리컬 데이터 조회 & 캔들스틱 차트 시각화

사용법:
    python scripts/stock_candlestick.py                          # AAPL 1년 일봉
    python scripts/stock_candlestick.py -t NVDA                  # NVDA 1년 일봉
    python scripts/stock_candlestick.py -t 005930.KS -p 6mo      # 삼성전자 6개월
    python scripts/stock_candlestick.py -t AAPL -p 2y -i 1wk     # AAPL 2년 주봉
    python scripts/stock_candlestick.py -t TSLA -p max            # TSLA 전체 기간

인자:
    -t, --ticker    티커 (기본값: AAPL, 한국주식: 005930.KS)
    -p, --period    기간 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, max)
    -i, --interval  봉 간격 (1m, 5m, 15m, 30m, 1h, 1d, 1wk, 1mo)
    -o, --output    차트 HTML 저장 경로
    --no-volume     거래량 비표시
    --ma            이동평균선 (예: --ma 5 20 60)
"""

import argparse
import sys
from datetime import datetime

import pandas as pd
import yfinance as yf
import plotly.graph_objects as go
from plotly.subplots import make_subplots


PERIODS = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'max']
INTERVALS = ['1m', '5m', '15m', '30m', '1h', '1d', '1wk', '1mo']


def fetch_and_chart(ticker='AAPL', period='1y', interval='1d',
                    show_volume=True, ma_periods=None, output=None):
    print(f"{'=' * 60}")
    print(f"  Stock Candlestick Chart")
    print(f"{'=' * 60}")
    print(f"  Ticker:   {ticker}")
    print(f"  Period:   {period}")
    print(f"  Interval: {interval}")
    if ma_periods:
        print(f"  MA:       {', '.join(str(m) for m in ma_periods)}")
    print(f"{'=' * 60}\n")

    # 데이터 다운로드
    print(f"Fetching {ticker} data from Yahoo Finance...")
    stock = yf.Ticker(ticker)
    df = stock.history(period=period, interval=interval)

    if df.empty:
        print(f"[ERROR] No data returned for {ticker}. Check the ticker symbol.")
        sys.exit(1)

    print(f"  {len(df)} candles received")
    print(f"  Period: {df.index[0].strftime('%Y-%m-%d')} ~ {df.index[-1].strftime('%Y-%m-%d')}")

    # 종목 정보
    info = stock.info
    name = info.get('shortName', info.get('longName', ticker))
    currency = info.get('currency', 'USD')

    # 요약 통계
    print(f"\n{'Summary':}")
    print(f"{'-' * 40}")
    print(f"  Name:       {name}")
    print(f"  Currency:   {currency}")
    print(f"  High:       {df['High'].max():.2f}")
    print(f"  Low:        {df['Low'].min():.2f}")
    print(f"  Avg Close:  {df['Close'].mean():.2f}")
    print(f"  Avg Volume: {df['Volume'].mean():,.0f}")
    latest = df.iloc[-1]
    print(f"  Latest:     O={latest['Open']:.2f} H={latest['High']:.2f} "
          f"L={latest['Low']:.2f} C={latest['Close']:.2f}")
    print()

    # 차트 생성
    rows = 2 if show_volume else 1
    row_heights = [0.75, 0.25] if show_volume else [1.0]

    fig = make_subplots(
        rows=rows, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.03,
        row_heights=row_heights,
    )

    # 캔들스틱
    fig.add_trace(
        go.Candlestick(
            x=df.index,
            open=df['Open'],
            high=df['High'],
            low=df['Low'],
            close=df['Close'],
            name='OHLC',
            increasing_line_color='#26a69a',
            decreasing_line_color='#ef5350',
        ),
        row=1, col=1,
    )

    # 이동평균선
    ma_colors = ['#FF6D00', '#2962FF', '#AB47BC', '#00BFA5']
    if ma_periods:
        for i, ma in enumerate(ma_periods):
            ma_col = df['Close'].rolling(window=ma).mean()
            color = ma_colors[i % len(ma_colors)]
            fig.add_trace(
                go.Scatter(
                    x=df.index,
                    y=ma_col,
                    name=f'MA{ma}',
                    line=dict(color=color, width=1),
                ),
                row=1, col=1,
            )

    # 거래량
    if show_volume:
        colors = ['#26a69a' if c >= o else '#ef5350'
                  for c, o in zip(df['Close'], df['Open'])]
        fig.add_trace(
            go.Bar(
                x=df.index,
                y=df['Volume'],
                name='Volume',
                marker_color=colors,
                opacity=0.7,
            ),
            row=2, col=1,
        )

    # 레이아웃
    fig.update_layout(
        title=f'{name} ({ticker}) - {interval.upper()} Chart',
        template='plotly_dark',
        xaxis_rangeslider_visible=False,
        height=700,
        margin=dict(l=60, r=30, t=60, b=30),
        legend=dict(
            orientation='h',
            yanchor='bottom',
            y=1.02,
            xanchor='right',
            x=1,
        ),
        font=dict(size=12),
    )

    fig.update_yaxes(title_text=f'Price ({currency})', row=1, col=1)
    if show_volume:
        fig.update_yaxes(title_text='Volume', row=2, col=1)

    # 주말/휴장일 갭 제거 (일봉 이상일 때)
    if interval in ('1d', '1wk', '1mo'):
        all_dates = pd.date_range(start=df.index.min(), end=df.index.max(), freq='D')
        trading_dates = df.index.normalize()
        non_trading = all_dates.difference(trading_dates)
        fig.update_xaxes(
            rangebreaks=[
                dict(values=[d.strftime('%Y-%m-%d') for d in non_trading]),
            ]
        )

    # 저장 또는 표시
    if output:
        fig.write_html(output)
        print(f"Chart saved to: {output}")
    else:
        output_path = f"scripts/{ticker.replace('.', '_')}_{period}_{interval}_chart.html"
        fig.write_html(output_path)
        print(f"Chart saved to: {output_path}")
        fig.show()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Stock candlestick chart using Yahoo Finance + Plotly'
    )
    parser.add_argument('-t', '--ticker', type=str, default='AAPL',
                        help='Ticker symbol (default: AAPL, Korean: 005930.KS)')
    parser.add_argument('-p', '--period', type=str, default='1y',
                        help=f'Data period (default: 1y). Options: {", ".join(PERIODS)}')
    parser.add_argument('-i', '--interval', type=str, default='1d',
                        help=f'Candle interval (default: 1d). Options: {", ".join(INTERVALS)}')
    parser.add_argument('-o', '--output', type=str, default=None,
                        help='Output HTML file path')
    parser.add_argument('--no-volume', action='store_true',
                        help='Hide volume bars')
    parser.add_argument('--ma', type=int, nargs='+', default=None,
                        help='Moving average periods (e.g., --ma 5 20 60)')

    args = parser.parse_args()

    try:
        fetch_and_chart(
            ticker=args.ticker,
            period=args.period,
            interval=args.interval,
            show_volume=not args.no_volume,
            ma_periods=args.ma,
            output=args.output,
        )
    except KeyboardInterrupt:
        print('\n\nStopped by user')
    except Exception as e:
        print(f'\n[ERROR] {type(e).__name__}: {e}')
        sys.exit(1)
