// API endpoints (basePath /trading applied automatically)
export const API_ENDPOINTS = {
  TRADING_STATUS: '/trading/api/trading/status',
  PORTFOLIO: '/trading/api/trading/portfolio',
  HISTORY: '/trading/api/trading/history',
  ORDERS: '/trading/api/trading/orders',
  HEALTH: '/trading/api/health',
} as const;

// Refresh intervals (milliseconds)
export const REFRESH_INTERVALS = {
  STATUS: 10000,     // 10 seconds
  PORTFOLIO: 30000,  // 30 seconds
  ORDERS: 10000,     // 10 seconds
  HISTORY: 60000,    // 1 minute
  HEALTH: 30000,     // 30 seconds
} as const;

// Trading service backend URL
export const TRADING_SERVICE_URL = process.env.TRADING_SERVICE_URL || 'http://localhost:8002';
export const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
export const SCRAPER_SERVICE_URL = process.env.SCRAPER_SERVICE_URL || 'http://localhost:8001';

// Navigation items
export const NAV_ITEMS = [
  { href: '/trading', label: '대시보드', icon: 'dashboard' },
  { href: '/trading/calendar', label: '달력', icon: 'calendar' },
  { href: '/trading/portfolio', label: '포트폴리오', icon: 'portfolio' },
  { href: '/trading/settings', label: '설정', icon: 'settings' },
] as const;
