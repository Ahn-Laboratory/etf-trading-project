"""
한국 주식 실시간 데이터 수집 스크립트
무료로 사용 가능한 여러 방법을 제공합니다.
"""

import requests
from datetime import datetime
from typing import Dict, List
import time
import re
from bs4 import BeautifulSoup


# ============================================================
# 방법 1: 네이버 증권 웹 크롤링 (실시간)
# ============================================================
def get_naver_realtime(stock_code: str) -> Dict:
    """
    네이버 증권에서 실시간 주가 데이터 가져오기

    Args:
        stock_code: 종목코드 (예: "005930" - 삼성전자)

    Returns:
        실시간 시세 정보 딕셔너리
    """
    url = f"https://finance.naver.com/item/main.naver?code={stock_code}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.encoding = 'euc-kr'
        soup = BeautifulSoup(response.text, 'html.parser')

        # 종목명
        name_tag = soup.select_one('.wrap_company h2 a')
        name = name_tag.text.strip() if name_tag else ""

        # 현재가
        price_tag = soup.select_one('.no_today .blind')
        price = int(price_tag.text.replace(",", "")) if price_tag else 0

        # 전일대비
        change_tag = soup.select_one('.no_exday .blind')
        change_text = change_tag.text.replace(",", "") if change_tag else "0"
        change = int(change_text)

        # 등락 방향 확인
        is_down = soup.select_one('.no_exday em.bu_p')
        if not is_down:  # 하락인 경우
            change = -abs(change)

        # 등락률
        rate_tag = soup.select_one('.no_exday .blind')
        rate_tags = soup.select('.no_exday .blind')
        change_rate = 0
        if len(rate_tags) >= 2:
            rate_text = rate_tags[1].text.replace("%", "")
            change_rate = float(rate_text)
            if change < 0:
                change_rate = -abs(change_rate)

        # 거래량, 시가, 고가, 저가
        table = soup.select('.no_info tr td .blind')
        volume = high = low = open_price = 0
        if len(table) >= 4:
            open_price = int(table[0].text.replace(",", ""))
            high = int(table[1].text.replace(",", ""))
            volume = int(table[2].text.replace(",", ""))
            low = int(table[3].text.replace(",", ""))

        return {
            "code": stock_code,
            "name": name,
            "price": price,
            "change": change,
            "change_rate": change_rate,
            "volume": volume,
            "high": high,
            "low": low,
            "open": open_price,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error fetching {stock_code}: {e}")
        return {}


# ============================================================
# 방법 2: 네이버 증권 시세 API (더 안정적)
# ============================================================
def get_naver_stock_api(stock_code: str) -> Dict:
    """
    네이버 증권 시세 API 사용

    Args:
        stock_code: 종목코드
    """
    url = f"https://m.stock.naver.com/api/stock/{stock_code}/basic"
    headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
        "Referer": "https://m.stock.naver.com/"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        data = response.json()

        return {
            "code": stock_code,
            "name": data.get("stockName", ""),
            "price": int(data.get("closePrice", "0").replace(",", "")),
            "change": int(data.get("compareToPreviousClosePrice", "0").replace(",", "")),
            "change_rate": float(data.get("fluctuationsRatio", "0")),
            "volume": int(data.get("accumulatedTradingVolume", "0").replace(",", "")),
            "high": int(data.get("highPrice", "0").replace(",", "")),
            "low": int(data.get("lowPrice", "0").replace(",", "")),
            "open": int(data.get("openPrice", "0").replace(",", "")),
            "market_cap": data.get("marketValue", ""),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error fetching {stock_code}: {e}")
        return {}


# ============================================================
# 방법 3: 다음 금융 API (실시간)
# ============================================================
def get_daum_realtime(stock_code: str) -> Dict:
    """
    다음 금융에서 실시간 주가 데이터 가져오기

    Args:
        stock_code: 종목코드 (예: "005930")
    """
    # 다음 금융은 A + 종목코드 형식 사용
    url = f"https://finance.daum.net/api/quotes/A{stock_code}"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://finance.daum.net/"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        data = response.json()

        # change 필드가 문자열("RISE", "FALL" 등)일 수 있음
        change_val = data.get("change", 0)
        if isinstance(change_val, str):
            change_val = 0

        price = data.get("tradePrice", 0)
        change_price = data.get("changePrice", 0)  # 실제 변동 금액

        return {
            "code": stock_code,
            "name": data.get("name", ""),
            "price": int(price) if price else 0,
            "change": int(change_price) if change_price else 0,
            "change_rate": float(data.get("changeRate", 0)) * 100,
            "volume": int(data.get("accTradeVolume", 0) or 0),
            "high": int(data.get("highPrice", 0) or 0),
            "low": int(data.get("lowPrice", 0) or 0),
            "open": int(data.get("openingPrice", 0) or 0),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"Error fetching from Daum: {e}")
        return {}


# ============================================================
# 방법 4: pykrx 라이브러리 사용 (pip install pykrx)
# ============================================================
def get_pykrx_data(stock_code: str, days: int = 5):
    """
    pykrx를 사용한 주가 데이터 조회 (일봉/분봉)

    설치: pip install pykrx
    """
    try:
        from pykrx import stock
        from datetime import timedelta

        end_date = datetime.now().strftime("%Y%m%d")
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")

        df = stock.get_market_ohlcv(start_date, end_date, stock_code)
        return df
    except ImportError:
        print("pykrx가 설치되지 않았습니다: pip install pykrx")
        return None


# ============================================================
# 방법 5: yfinance 사용 (pip install yfinance)
# ============================================================
def get_yfinance_data(stock_code: str, period: str = "1d", interval: str = "1m"):
    """
    yfinance를 사용한 주가 데이터 조회
    한국 주식: .KS (코스피), .KQ (코스닥)

    설치: pip install yfinance
    """
    try:
        import yfinance as yf

        if not stock_code.endswith(('.KS', '.KQ')):
            stock_code = f"{stock_code}.KS"

        ticker = yf.Ticker(stock_code)
        return ticker.history(period=period, interval=interval)
    except ImportError:
        print("yfinance가 설치되지 않았습니다: pip install yfinance")
        return None


# ============================================================
# 여러 종목 한번에 조회
# ============================================================
def get_multiple_stocks(stock_codes: List[str]) -> List[Dict]:
    """여러 종목의 실시간 시세 조회"""
    results = []
    for code in stock_codes:
        data = get_naver_stock_api(code)
        if data:
            results.append(data)
        time.sleep(0.1)  # 요청 간 딜레이
    return results


# ============================================================
# 실시간 모니터링
# ============================================================
def monitor_stocks(stock_codes: List[str], interval_seconds: int = 5):
    """
    여러 종목의 실시간 시세를 지속적으로 모니터링

    Args:
        stock_codes: 종목코드 리스트
        interval_seconds: 갱신 주기 (초)
    """
    print(f"실시간 모니터링 시작 (종목: {len(stock_codes)}개, 갱신주기: {interval_seconds}초)")
    print("Ctrl+C로 종료")
    print("=" * 85)

    try:
        while True:
            print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
            print("-" * 85)
            print(f"{'종목코드':<10} {'종목명':<12} {'현재가':>12} {'전일대비':>10} {'등락률':>8} {'거래량':>15}")
            print("-" * 85)

            for code in stock_codes:
                data = get_naver_stock_api(code)
                if data:
                    change_sign = "+" if data['change'] > 0 else ""
                    rate_sign = "+" if data['change_rate'] > 0 else ""
                    print(f"{data['code']:<10} {data['name']:<12} {data['price']:>12,} "
                          f"{change_sign}{data['change']:>9,} {rate_sign}{data['change_rate']:>6.2f}% "
                          f"{data['volume']:>15,}")
                time.sleep(0.1)

            time.sleep(interval_seconds)

    except KeyboardInterrupt:
        print("\n\n모니터링 종료")


# ============================================================
# 메인 실행
# ============================================================
if __name__ == "__main__":
    # 주요 종목 코드
    MAJOR_STOCKS = [
        "005930",  # 삼성전자
        "000660",  # SK하이닉스
        "035420",  # NAVER
        "035720",  # 카카오
        "005380",  # 현대차
    ]

    print("=" * 60)
    print("한국 주식 실시간 데이터 수집기")
    print("=" * 60)

    # 네이버 모바일 API 테스트
    print("\n[1] 네이버 증권 API - 삼성전자 실시간 시세")
    samsung = get_naver_stock_api("005930")
    if samsung:
        print(f"  종목: {samsung['name']} ({samsung['code']})")
        print(f"  현재가: {samsung['price']:,}원")
        print(f"  전일대비: {samsung['change']:+,}원 ({samsung['change_rate']:+.2f}%)")
        print(f"  거래량: {samsung['volume']:,}")
        print(f"  고가/저가: {samsung['high']:,} / {samsung['low']:,}")
        print(f"  시가총액: {samsung['market_cap']}")

    # 다음 금융 테스트
    print("\n[2] 다음 금융 API - SK하이닉스")
    hynix = get_daum_realtime("000660")
    if hynix:
        print(f"  종목: {hynix['name']} ({hynix['code']})")
        print(f"  현재가: {hynix['price']:,}원")
        print(f"  전일대비: {hynix['change']:+,}원 ({hynix['change_rate']:+.2f}%)")

    # 여러 종목 조회
    print("\n[3] 주요 종목 시세")
    print("-" * 70)
    stocks = get_multiple_stocks(MAJOR_STOCKS)
    for s in stocks:
        change_sign = "+" if s['change'] > 0 else ""
        print(f"  {s['name']:<10} {s['price']:>10,}원  {change_sign}{s['change']:>8,} ({s['change_rate']:+.2f}%)")

    print("\n" + "=" * 60)
    print("실시간 모니터링 시작: monitor_stocks(MAJOR_STOCKS)")
    print("=" * 60)

    # 실시간 모니터링 (주석 해제하여 사용)
    monitor_stocks(MAJOR_STOCKS, interval_seconds=3)
