#!/usr/bin/env python3
"""
Database Service for TradingView Data Upload

Handles SSH tunnel connection and data upload to remote MySQL database.
Uses the SSH tunneling approach described in .claude/skills/db-ssh-tunneling/skill.md
"""

import os
import logging
import pandas as pd
from pathlib import Path
from typing import Optional
from datetime import datetime
from contextlib import contextmanager

from sqlalchemy import (
    create_engine,
    text,
    MetaData,
    Table,
    Column,
    DateTime,
    Float,
    BigInteger,
)
from sqlalchemy.orm import sessionmaker
from sshtunnel import SSHTunnelForwarder

logger = logging.getLogger(__name__)


class DatabaseService:
    """Service for uploading TradingView CSV data to remote MySQL database"""

    def __init__(
        self,
        ssh_host: str = "ahnbi2.suwon.ac.kr",
        ssh_user: str = "ahnbi2",
        ssh_key_path: Optional[str] = None,
        remote_bind_port: int = 5100,
        local_bind_port: int = 3306,
        db_user: str = "ahnbi2",
        db_password: str = "bigdata",
        db_name: str = "etf2_db",
        use_existing_tunnel: bool = True,
    ):
        """
        Initialize database service.

        Args:
            ssh_host: SSH server hostname
            ssh_user: SSH username
            ssh_key_path: Path to SSH private key (default: ~/.ssh/id_rsa)
            remote_bind_port: MySQL port on remote server
            local_bind_port: Local port for SSH tunnel
            db_user: MySQL username
            db_password: MySQL password
            db_name: MySQL database name
            use_existing_tunnel: If True, use existing SSH tunnel on local port
        """
        self.ssh_host = ssh_host
        self.ssh_user = ssh_user
        self.ssh_key_path = ssh_key_path or os.path.expanduser("~/.ssh/id_rsa")
        self.remote_bind_port = remote_bind_port
        self.local_bind_port = local_bind_port
        self.db_user = db_user
        self.db_password = db_password
        self.db_name = db_name
        self.use_existing_tunnel = use_existing_tunnel

        self.tunnel: Optional[SSHTunnelForwarder] = None
        self.engine = None
        self.Session = None

    def _check_existing_tunnel(self) -> bool:
        """Check if SSH tunnel is already running on local port"""
        import socket

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            sock.connect(("127.0.0.1", self.local_bind_port))
            sock.close()
            return True
        except (socket.error, ConnectionRefusedError):
            return False

    def connect(self):
        """Establish connection to remote database"""
        try:
            if self.use_existing_tunnel and self._check_existing_tunnel():
                # Use existing SSH tunnel
                logger.info(f"Using existing SSH tunnel on port {self.local_bind_port}")
                db_url = f"mysql+pymysql://{self.db_user}:{self.db_password}@127.0.0.1:{self.local_bind_port}/{self.db_name}"
            else:
                # Create new SSH tunnel
                logger.info("Creating new SSH tunnel...")
                self.tunnel = SSHTunnelForwarder(
                    (self.ssh_host, 22),
                    ssh_username=self.ssh_user,
                    ssh_pkey=self.ssh_key_path,
                    remote_bind_address=("127.0.0.1", self.remote_bind_port),
                    local_bind_address=("127.0.0.1", 0),  # Random available port
                )
                self.tunnel.start()
                local_port = self.tunnel.local_bind_port
                logger.info(f"SSH tunnel established on port {local_port}")
                db_url = f"mysql+pymysql://{self.db_user}:{self.db_password}@127.0.0.1:{local_port}/{self.db_name}"

            self.engine = create_engine(
                db_url, pool_pre_ping=True, pool_recycle=3600, echo=False
            )
            self.Session = sessionmaker(bind=self.engine)

            # Test connection
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
            logger.info("Database connection successful")

        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            self.close()
            raise

    def close(self):
        """Close database connection and SSH tunnel"""
        if self.engine:
            self.engine.dispose()
            self.engine = None

        if self.tunnel:
            self.tunnel.stop()
            self.tunnel = None
            logger.info("SSH tunnel closed")

    @contextmanager
    def get_session(self):
        """Get database session context manager"""
        session = self.Session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def get_table_name(self, symbol: str, timeframe: str) -> str:
        """
        Get table name for a symbol and timeframe.

        Args:
            symbol: Stock symbol (e.g., AAPL, NVDA)
            timeframe: Time period (e.g., D, 1h, 10m)

        Returns:
            Table name in format {symbol}_{timeframe}
        """
        # Map common period names to DB conventions
        timeframe_map = {
            "12개월": "D",  # Daily for 12-month data
            "1개월": "D",  # Daily for 1-month data
            "1주": "D",  # Daily for 1-week data
            "1일": "1h",  # Hourly for 1-day data
            "1시간": "10m",  # 10-min for 1-hour view
            "10분": "1m",  # 1-min for 10-minute view
        }

        tf = timeframe_map.get(timeframe, timeframe)
        return f"{symbol}_{tf}"

    def table_exists(self, table_name: str) -> bool:
        """Check if table exists in database"""
        with self.engine.connect() as conn:
            result = conn.execute(
                text("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = :db_name AND TABLE_NAME = :table_name
            """),
                {"db_name": self.db_name, "table_name": table_name},
            )
            count = result.scalar()
            return count > 0

    def create_table_if_not_exists(self, table_name: str):
        """Create table for stock data if it doesn't exist"""
        if self.table_exists(table_name):
            logger.info(f"Table {table_name} already exists")
            return

        create_sql = f"""
        CREATE TABLE `{table_name}` (
            `time` DATETIME NOT NULL,
            `symbol` VARCHAR(32) NOT NULL,
            `timeframe` VARCHAR(16) NOT NULL,
            `open` DOUBLE,
            `high` DOUBLE,
            `low` DOUBLE,
            `close` DOUBLE,
            `volume` BIGINT,
            `rsi` DOUBLE,
            `macd` DOUBLE,
            PRIMARY KEY (`time`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """

        with self.engine.connect() as conn:
            conn.execute(text(create_sql))
            conn.commit()
        logger.info(f"Created table {table_name}")

    def parse_tradingview_csv(self, csv_path: Path) -> pd.DataFrame:
        """
        Parse TradingView exported CSV file.

        Expected columns: time, open, high, low, close, volume
        Optional: Any indicator columns

        Args:
            csv_path: Path to CSV file

        Returns:
            DataFrame with parsed data
        """
        df = pd.read_csv(csv_path)

        # Standardize column names
        df.columns = df.columns.str.lower().str.strip()

        # Parse time column - TradingView uses ISO format when selected
        if "time" in df.columns:
            if pd.api.types.is_numeric_dtype(df["time"]):
                df["time"] = pd.to_datetime(df["time"], unit="s")
            else:
                df["time"] = pd.to_datetime(df["time"])
        elif "date" in df.columns:
            if pd.api.types.is_numeric_dtype(df["date"]):
                df["time"] = pd.to_datetime(df["date"], unit="s")
            else:
                df["time"] = pd.to_datetime(df["date"])
            df.drop("date", axis=1, inplace=True)

        # Ensure required columns exist
        required_cols = ["time", "open", "high", "low", "close"]
        for col in required_cols:
            if col not in df.columns:
                raise ValueError(f"Missing required column: {col}")

        # Add volume if missing
        if "volume" not in df.columns:
            df["volume"] = 0

        # Add RSI and MACD as null if not present
        import numpy as np

        if "rsi" not in df.columns:
            df["rsi"] = np.nan
        if "macd" not in df.columns:
            df["macd"] = np.nan

        # Select only the columns we need
        df = df[["time", "open", "high", "low", "close", "volume", "rsi", "macd"]]

        # Convert numeric columns
        for col in ["open", "high", "low", "close", "volume", "rsi", "macd"]:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        # Drop rows with null time
        df = df.dropna(subset=["time"])

        # Sort by time
        df = df.sort_values("time").reset_index(drop=True)

        return df

    def upload_csv(
        self,
        csv_path: Path,
        symbol: str,
        timeframe: str,
        replace_existing: bool = False,
    ) -> int:
        """
        Upload CSV data to database.

        Args:
            csv_path: Path to CSV file
            symbol: Stock symbol
            timeframe: Time period
            replace_existing: If True, replace existing data; if False, append only new

        Returns:
            Number of rows inserted
        """
        table_name = self.get_table_name(symbol, timeframe)

        # Parse CSV
        df = self.parse_tradingview_csv(csv_path)
        if df.empty:
            logger.warning(f"No data in CSV: {csv_path}")
            return 0

        logger.info(f"Parsed {len(df)} rows from {csv_path.name}")

        # Create table if needed
        self.create_table_if_not_exists(table_name)

        # Upload data
        with self.engine.connect() as conn:
            if replace_existing:
                # Get time range in CSV
                min_time = df["time"].min()
                max_time = df["time"].max()

                # Delete existing data in range
                delete_sql = text(f"""
                    DELETE FROM `{table_name}`
                    WHERE `time` >= :min_time AND `time` <= :max_time
                """)
                result = conn.execute(
                    delete_sql, {"min_time": min_time, "max_time": max_time}
                )
                deleted = result.rowcount
                if deleted > 0:
                    logger.info(f"Deleted {deleted} existing rows in time range")

            # Insert data using pandas to_sql with REPLACE
            # Convert DataFrame to list of dicts for insert
            # Replace NaN with None for MySQL compatibility
            import numpy as np

            records = df.replace({np.nan: None}).to_dict("records")

            for record in records:
                record["symbol"] = symbol
                record["timeframe"] = timeframe

            insert_sql = text(f"""
                INSERT INTO `{table_name}` (`time`, `symbol`, `timeframe`, `open`, `high`, `low`, `close`, `volume`, `rsi`, `macd`)
                VALUES (:time, :symbol, :timeframe, :open, :high, :low, :close, :volume, :rsi, :macd)
                ON DUPLICATE KEY UPDATE
                    `open` = VALUES(`open`),
                    `high` = VALUES(`high`),
                    `low` = VALUES(`low`),
                    `close` = VALUES(`close`),
                    `volume` = VALUES(`volume`),
                    `rsi` = VALUES(`rsi`),
                    `macd` = VALUES(`macd`)
            """)

            for record in records:
                conn.execute(insert_sql, record)
            conn.commit()

        logger.info(f"Uploaded {len(records)} rows to {table_name}")
        return len(records)

    def upload_csv_batch(
        self, csv_dir: Path, file_pattern: str = "*.csv", replace_existing: bool = False
    ) -> dict:
        """
        Upload multiple CSV files from directory.

        Expects filenames in format: {symbol}_{timeframe}.csv or
        pattern that can be parsed.

        Args:
            csv_dir: Directory containing CSV files
            file_pattern: Glob pattern for CSV files
            replace_existing: Whether to replace existing data

        Returns:
            Dict mapping filename to rows uploaded
        """
        results = {}
        csv_files = list(Path(csv_dir).glob(file_pattern))

        for csv_path in csv_files:
            try:
                # Parse filename to get symbol and timeframe
                # Expected format: AAPL_D.csv or NVDA_1h.csv
                name_parts = csv_path.stem.split("_")
                if len(name_parts) >= 2:
                    symbol = name_parts[0]
                    timeframe = "_".join(name_parts[1:])  # Handle multi-part timeframes
                else:
                    logger.warning(f"Cannot parse filename: {csv_path.name}, skipping")
                    continue

                rows = self.upload_csv(csv_path, symbol, timeframe, replace_existing)
                results[csv_path.name] = rows

            except Exception as e:
                logger.error(f"Failed to upload {csv_path.name}: {e}")
                results[csv_path.name] = f"ERROR: {e}"

        return results


# Utility function for standalone usage
def upload_tradingview_data(
    csv_path: str, symbol: str, timeframe: str, use_existing_tunnel: bool = True
) -> int:
    """
    Convenience function to upload TradingView CSV data.

    Args:
        csv_path: Path to CSV file
        symbol: Stock symbol
        timeframe: Timeframe (e.g., D, 1h, 10m)
        use_existing_tunnel: Whether to use existing SSH tunnel

    Returns:
        Number of rows uploaded
    """
    db = DatabaseService(use_existing_tunnel=use_existing_tunnel)
    try:
        db.connect()
        rows = db.upload_csv(Path(csv_path), symbol, timeframe)
        return rows
    finally:
        db.close()


if __name__ == "__main__":
    # Example usage
    import sys

    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    if len(sys.argv) < 4:
        print("Usage: python db_service.py <csv_path> <symbol> <timeframe>")
        print("Example: python db_service.py ~/Downloads/AAPL_export.csv AAPL D")
        sys.exit(1)

    csv_path = sys.argv[1]
    symbol = sys.argv[2]
    timeframe = sys.argv[3]

    rows = upload_tradingview_data(csv_path, symbol, timeframe)
    print(f"Uploaded {rows} rows")
