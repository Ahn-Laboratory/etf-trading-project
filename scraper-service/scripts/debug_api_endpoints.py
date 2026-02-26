"""
TradingView CSV Download API Endpoint Debugger

CSV 다운로드 시 실제 API 요청을 캡처하여 분석합니다.
Network 탭의 모든 요청을 기록하고, CSV 다운로드 관련 API를 찾습니다.
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import List, Dict, Any
from playwright.async_api import async_playwright, Page, Request, Response

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# 저장 경로
OUTPUT_DIR = Path(__file__).parent.parent / "logs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


class APIEndpointDebugger:
    """API 엔드포인트 디버거"""

    def __init__(self, headless: bool = False):
        self.headless = headless
        self.captured_requests: List[Dict[str, Any]] = []
        self.csv_related_requests: List[Dict[str, Any]] = []

    async def capture_request(self, request: Request) -> None:
        """요청 캡처"""
        url = request.url
        method = request.method
        resource_type = request.resource_type

        request_info = {
            "url": url,
            "method": method,
            "resource_type": resource_type,
            "headers": request.headers,
        }

        self.captured_requests.append(request_info)

        # CSV 관련 요청 필터링
        if any(keyword in url.lower() for keyword in ["csv", "download", "export", "history", "timeseries"]):
            logger.info(f"🔍 CSV 관련 요청 발견: {url}")
            self.csv_related_requests.append(request_info)

        # TradingView Datafeed API 관련
        if any(keyword in url.lower() for keyword in ["history", "symbol", "datafeed", "tradingview"]):
            if resource_type in ["xhr", "fetch"]:
                logger.info(f"📊 Data API 요청: {url}")

    async def capture_response(self, response: Response) -> None:
        """응답 캡처"""
        url = response.url
        status = response.status

        # CSV 다운로드 응답
        if any(keyword in url.lower() for keyword in ["csv", "download", "export"]):
            if status == 200:
                logger.info(f"✅ CSV 다운로드 성공: {url}")
                content_type = response.headers.get("content-type", "")
                logger.info(f"   Content-Type: {content_type}")

    async def run_debug(self, symbol: str = "AAPL") -> Dict[str, Any]:
        """
        디버깅 실행

        Args:
            symbol: 테스트할 종목 심볼

        Returns:
            캡처된 API 요청 정보
        """
        results = {
            "symbol": symbol,
            "csv_requests": [],
            "api_requests": [],
            "potential_endpoints": [],
        }

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=self.headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                ],
            )

            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            )

            # 쿠키 로드
            cookies_file = Path(__file__).parent.parent / "cookies.json"
            if cookies_file.exists():
                with open(cookies_file, "r") as f:
                    cookies = json.load(f)
                    await context.add_cookies(cookies)
                    logger.info(f"쿠키 로드됨: {len(cookies)}개")

            page = await context.new_page()

            # Network 리스너 등록
            page.on("request", lambda r: asyncio.create_task(self.capture_request(r)))
            page.on("response", lambda r: asyncio.create_task(self.capture_response(r)))

            logger.info(f"차트 페이지로 이동 중... ({symbol})")
            await page.goto("https://kr.tradingview.com/chart/")
            await page.wait_for_load_state("domcontentloaded")
            await asyncio.sleep(3)

            # 팝업 닫기
            await self.dismiss_overlays(page)

            # 심볼 검색
            logger.info(f"심볼 검색: {symbol}")
            try:
                symbol_btn = page.locator("#header-toolbar-symbol-search")
                await symbol_btn.click(timeout=5000)
                await asyncio.sleep(1)

                search_input = page.get_by_role("searchbox").or_(
                    page.get_by_placeholder("심볼, ISIN 또는 CUSIP")
                ).or_(page.locator('input[data-role="search"]')).first

                await search_input.fill(symbol)
                await asyncio.sleep(2)

                # 첫 번째 결과 클릭
                first_result = page.locator('[data-role="list-item"]').first
                await first_result.click(timeout=3000)
                await asyncio.sleep(2)

                logger.info(f"심볼 선택 완료: {symbol}")
            except Exception as e:
                logger.error(f"심볼 선택 실패: {e}")

            # 1Y 버튼 클릭 (일봉 데이터)
            logger.info("1Y 버튼 클릭...")
            try:
                period_button = page.locator('button:has-text("1Y")').first
                await period_button.click(timeout=5000)
                await asyncio.sleep(2)
            except Exception as e:
                logger.error(f"1Y 버튼 클릭 실패: {e}")

            # CSV 다운로드 시도
            logger.info("CSV 다운로드 시도...")

            # 레이아웃 메뉴 클릭
            arrow_clicked = await page.evaluate("""
                () => {
                    const arrows = document.querySelectorAll('div[class*="arrow"]');
                    if (arrows.length > 0) {
                        arrows[0].click();
                        return true;
                    }
                    return false;
                }
            """)

            if arrow_clicked:
                await asyncio.sleep(1)

                # "차트 데이터 다운로드" 클릭
                try:
                    download_option = page.get_by_role("row", name="차트 데이터 다운로드")
                    await download_option.click(timeout=5000)
                except:
                    download_option = page.locator("text=차트 데이터 다운로드")
                    await download_option.click(timeout=5000)

                await asyncio.sleep(2)

                # 다운로드 버튼 클릭 전에 대기
                logger.info("다운로드 버튼 클릭 전...")

                # 다운로드 버튼 클릭
                try:
                    download_btn = page.get_by_role("button", name="다운로드")
                    await download_btn.click(timeout=5000)

                    # 네트워크 요청이 완료될 때까지 대기
                    await asyncio.sleep(3)
                    logger.info("다운로드 요청 완료")
                except Exception as e:
                    logger.error(f"다운로드 버튼 클릭 실패: {e}")

            await asyncio.sleep(3)

            # 결과 정리
            results["csv_requests"] = self.csv_related_requests

            # TradingView API 요청 필터링
            api_patterns = [
                "/history",
                "/symbol",
                "/timeseries",
                "/datafeed",
                "tradingview",
                "proxy",
            ]

            for req in self.captured_requests:
                if req["resource_type"] in ["xhr", "fetch"]:
                    url = req["url"]
                    if any(pattern in url.lower() for pattern in api_patterns):
                        results["api_requests"].append(req)

                        # 잠재적 다운로드 엔드포인트
                        if "history" in url.lower() or "timeseries" in url.lower():
                            results["potential_endpoints"].append({
                                "url": url,
                                "method": req["method"],
                                "headers": {k: v for k, v in req["headers"].items()
                                           if k.lower() in ["authorization", "cookie", "content-type"]},
                            })

            await browser.close()

        return results

    async def dismiss_overlays(self, page: Page) -> None:
        """팝업/오버레이 닫기"""
        try:
            # 닫기 버튼 클릭
            close_btns = page.locator(
                '#overlap-manager-root button[aria-label="닫기"], '
                '#overlap-manager-root button[aria-label="Close"]'
            )
            count = await close_btns.count()
            for i in range(count):
                try:
                    await close_btns.nth(i).click(timeout=1000)
                    await asyncio.sleep(0.5)
                except:
                    pass

            # ESC 키
            await page.keyboard.press("Escape")
            await asyncio.sleep(0.3)
        except Exception as e:
            logger.debug(f"오버레이 닫기 중 오류: {e}")

    def save_results(self, results: Dict[str, Any], filename: str = None) -> Path:
        """결과 저장"""
        if filename is None:
            filename = f"api_debug_{results['symbol']}_{asyncio.get_event_loop().time()}.json"

        output_path = OUTPUT_DIR / filename

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        logger.info(f"결과 저장됨: {output_path}")
        return output_path


async def main():
    """메인 실행"""
    import argparse

    parser = argparse.ArgumentParser(description="TradingView API 엔드포인트 디버거")
    parser.add_argument("--symbol", default="AAPL", help="테스트할 종목 심볼")
    parser.add_argument("--headless", action="store_true", help="Headless 모드")
    args = parser.parse_args()

    debugger = APIEndpointDebugger(headless=args.headless)

    logger.info(f"=== API Endpoint Debugger 시작 ({args.symbol}) ===")

    results = await debugger.run_debug(args.symbol)

    # 결과 출력
    logger.info(f"\n=== 결과 요약 ===")
    logger.info(f"CSV 관련 요청: {len(results['csv_requests'])}개")
    logger.info(f"API 요청: {len(results['api_requests'])}개")
    logger.info(f"잠재적 엔드포인트: {len(results['potential_endpoints'])}개")

    if results["potential_endpoints"]:
        logger.info(f"\n=== 발견된 API 엔드포인트 ===")
        for endpoint in results["potential_endpoints"]:
            logger.info(f"URL: {endpoint['url']}")
            logger.info(f"Method: {endpoint['method']}")
            if endpoint.get("headers"):
                logger.info(f"Headers: {endpoint['headers']}")

    # 결과 저장
    debugger.save_results(results)

    logger.info("\n=== 디버깅 완료 ===")


if __name__ == "__main__":
    asyncio.run(main())
