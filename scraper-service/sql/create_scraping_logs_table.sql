-- Scraping logs table for storing all scraping activity logs
CREATE TABLE IF NOT EXISTS scraping_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL,
    timestamp DATETIME(3) NOT NULL,
    level ENUM('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,
    symbol VARCHAR(20),
    timeframe VARCHAR(10),
    message TEXT NOT NULL,
    extra_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_job_id (job_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_level (level),
    INDEX idx_symbol (symbol),
    INDEX idx_job_timestamp (job_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
