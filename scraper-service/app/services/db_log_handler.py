"""
Direct synchronous DB logging for scraping activity.

Replaces the previous DBLogHandler (background thread + queue) approach
which was unreliable in FastAPI BackgroundTasks context.

Instead, we use direct synchronous INSERT via SQLAlchemy engine.
Also provides SyncDBLogHandler - a logging.Handler that captures ALL
logger.info/error/warning calls and writes them to DB synchronously.
"""
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import text

logger = logging.getLogger(__name__)


class SyncDBLogHandler(logging.Handler):
    """
    Synchronous logging handler that writes directly to DB in emit().
    No background thread, no queue - just direct INSERT on every log call.
    """

    def __init__(self, engine, job_id: str):
        super().__init__()
        self.engine = engine
        self.job_id = job_id

    def emit(self, record: logging.LogRecord):
        try:
            # Extract symbol/timeframe from message patterns like "[AAPL]" or "[AAPL - 12달]"
            symbol = getattr(record, "symbol", None)
            timeframe = getattr(record, "timeframe", None)

            if symbol is None and "[" in str(record.msg) and "]" in str(record.msg):
                msg = str(record.msg)
                try:
                    content = msg[msg.find("[") + 1 : msg.find("]")]
                    if " - " in content:
                        parts = content.split(" - ", 1)
                        symbol = parts[0].strip()
                        timeframe = parts[1].strip()
                    elif content.isalpha() or "." in content:
                        symbol = content.strip()
                except Exception:
                    pass

            write_log(
                self.engine,
                self.job_id,
                record.levelname,
                self.format(record),
                symbol=symbol,
                timeframe=timeframe,
            )
        except Exception:
            pass  # Never disrupt scraping


def write_log(
    engine,
    job_id: str,
    level: str,
    message: str,
    symbol: str = None,
    timeframe: str = None,
    extra_data: Dict[str, Any] = None,
):
    """
    Write a single log entry directly to scraping_logs table.
    Synchronous, blocking call - guaranteed to write before returning.
    """
    if engine is None:
        return

    try:
        with engine.connect() as conn:
            conn.execute(
                text("""
                    INSERT INTO scraping_logs
                    (job_id, timestamp, level, symbol, timeframe, message, extra_data)
                    VALUES (:job_id, :timestamp, :level, :symbol, :timeframe, :message, :extra_data)
                """),
                {
                    "job_id": job_id,
                    "timestamp": datetime.now(),
                    "level": level,
                    "symbol": symbol,
                    "timeframe": timeframe,
                    "message": message,
                    "extra_data": json.dumps(extra_data) if extra_data else None,
                },
            )
            conn.commit()
    except Exception as e:
        # Silently fail to avoid disrupting scraping
        logger.debug(f"Failed to write log to DB: {e}")
