import { WEBSOCKET_CONFIG, APP_CONFIG } from '~src/config/config';
import type { RealtimeCASettings, SubscriptionConfig } from '~src/types/realtime-ca.types';

// 默认设置
export const DEFAULT_SETTINGS: RealtimeCASettings = {
  autoConnect: APP_CONFIG.REALTIME_CA.AUTO_CONNECT,
  autoRetry: APP_CONFIG.REALTIME_CA.AUTO_RETRY,
  maxCacheSize: APP_CONFIG.REALTIME_CA.MAX_CACHE_SIZE,
  cacheExpiryDays: APP_CONFIG.REALTIME_CA.CACHE_EXPIRY_DAYS,
  subscriptionConfig: {
    ...WEBSOCKET_CONFIG.DEFAULT_SUBSCRIPTION,
    filters: {
      ...WEBSOCKET_CONFIG.DEFAULT_SUBSCRIPTION.filters,
      contract_addresses: [...WEBSOCKET_CONFIG.DEFAULT_SUBSCRIPTION.filters.contract_addresses],
      keywords: [...WEBSOCKET_CONFIG.DEFAULT_SUBSCRIPTION.filters.keywords],
      rest_id_blacklist: [...WEBSOCKET_CONFIG.DEFAULT_SUBSCRIPTION.filters.rest_id_blacklist],
    }
  } as SubscriptionConfig,
};

// WebSocket配置
export const WS_CONFIG = {
  URL: WEBSOCKET_CONFIG.BASE_URL,
  RECONNECT_INTERVAL: WEBSOCKET_CONFIG.CONNECTION.RECONNECT_INTERVAL,
  MAX_RECONNECT_ATTEMPTS: WEBSOCKET_CONFIG.CONNECTION.MAX_RECONNECT_ATTEMPTS,
  HEARTBEAT_INTERVAL: WEBSOCKET_CONFIG.CONNECTION.HEARTBEAT_INTERVAL,
  PONG_TIMEOUT: WEBSOCKET_CONFIG.CONNECTION.PONG_TIMEOUT,
  CONNECTION_TIMEOUT: WEBSOCKET_CONFIG.CONNECTION.CONNECTION_TIMEOUT,
};

// 存储键名
export const STORAGE_KEYS = {
  CACHE: APP_CONFIG.STORAGE_KEYS.REALTIME_CA_CACHE,
  SETTINGS: APP_CONFIG.STORAGE_KEYS.REALTIME_CA_SETTINGS,
  SUBSCRIPTION: APP_CONFIG.STORAGE_KEYS.REALTIME_CA_SUBSCRIPTION,
};

// 显示配置
export const DISPLAY_CONFIG = {
  REALTIME_SIZE: APP_CONFIG.REALTIME_CA.REALTIME_DISPLAY_SIZE,
  MAX_CACHE_SIZE: APP_CONFIG.REALTIME_CA.MAX_CACHE_SIZE,
  UPDATE_DEBOUNCE: APP_CONFIG.REALTIME_CA.UPDATE_DEBOUNCE_MS,
  ITEMS_PER_PAGE: 20,
  SEARCH_DEBOUNCE: 300,
};

// 网络选项
export const NETWORK_OPTIONS = [
  { value: 'all', label: 'All Networks' },
  { value: 'solana', label: 'Solana' },
  { value: 'ethereum', label: 'Ethereum' },
] as const;

// 粉丝数选项
export const FOLLOWERS_OPTIONS = [
  { value: 0, label: 'No Limit' },
  { value: 100, label: '100+' },
  { value: 500, label: '500+' },
  { value: 1000, label: '1K+' },
  { value: 5000, label: '5K+' },
  { value: 10000, label: '10K+' },
  { value: 50000, label: '50K+' },
  { value: 100000, label: '100K+' },
] as const;

// 缓存大小选项
export const CACHE_SIZE_OPTIONS = [
  { value: 1000, label: '1,000 events' },
  { value: 2500, label: '2,500 events' },
  { value: 5000, label: '5,000 events' },
  { value: 7500, label: '7,500 events' },
  { value: 10000, label: '10,000 events' },
] as const;

// 缓存过期选项
export const CACHE_EXPIRY_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
] as const;

// 连接状态颜色映射
export const CONNECTION_STATUS_COLORS = {
  connecting: 'bg-yellow-500',
  connected: 'bg-green-500',
  disconnected: 'bg-gray-500',
  error: 'bg-red-500',
  reconnecting: 'bg-orange-500',
} as const;

// 连接状态文本映射 - 这些文本现在通过多语言系统处理
export const CONNECTION_STATUS_TEXT = {
  connecting: 'Connecting...',
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Connection Error',
  reconnecting: 'Reconnecting...',
} as const;

// WebSocket消息类型
export const WS_MESSAGE_TYPES = {
  // 客户端发送
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  PING: 'ping',
  GET_SUBSCRIPTIONS: 'get_subscriptions',
  GET_STATUS: 'get_status',
  ACK: 'ack',
  
  // 服务器响应
  SUBSCRIBE_SUCCESS: 'subscribe_success',
  SUBSCRIBE_ERROR: 'subscribe_error',
  UNSUBSCRIBE_SUCCESS: 'unsubscribe_success',
  PONG: 'pong',
  REALTIME_CA: 'realtime_ca',
  STATUS: 'status',
  SUBSCRIPTIONS: 'subscriptions',
  ERROR: 'error',
  CLOSE: 'close',
} as const;

// 错误代码映射
export const ERROR_CODES = {
  // 认证相关
  AUTH_TOKEN_MISSING: 'Token missing',
  AUTH_TOKEN_INVALID: 'Invalid token',
  AUTH_TOKEN_EXPIRED: 'Token expired',
  AUTH_USER_BLACKLISTED: 'User blacklisted',
  AUTH_INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  
  // 连接相关
  CONN_LIMIT_EXCEEDED: 'Connection limit exceeded',
  CONN_TIMEOUT: 'Connection timeout',
  CONN_NETWORK_ERROR: 'Network error',
  CONN_DUPLICATE: 'Duplicate connection',
  
  // 消息相关
  MSG_INVALID_FORMAT: 'Invalid message format',
  MSG_TOO_LARGE: 'Message too large',
  MSG_RATE_LIMITED: 'Rate limited',
  MSG_SEND_FAILED: 'Send failed',
  
  // 订阅相关
  SUB_INVALID_PARAMS: 'Invalid subscription parameters',
  SUB_NOT_FOUND: 'Subscription not found',
  SUB_LIMIT_EXCEEDED: 'Subscription limit exceeded',
  
  // 系统相关
  SYS_INTERNAL_ERROR: 'Internal server error',
  SYS_SERVICE_UNAVAILABLE: 'Service unavailable',
  SYS_MAINTENANCE: 'System maintenance',
  SYS_REDIS_ERROR: 'Redis error',
} as const;

// 搜索字段配置
export const SEARCH_FIELDS = {
  USER: 'user',
  CONTENT: 'content',
  SYMBOL: 'symbol',
  ADDRESS: 'address',
  ALL: 'all',
} as const;

// 排序选项
export const SORT_OPTIONS = [
  { value: 'timestamp_desc', label: 'Latest First' },
  { value: 'timestamp_asc', label: 'Oldest First' },
  { value: 'followers_desc', label: 'Most Followers' },
  { value: 'followers_asc', label: 'Least Followers' },
  { value: 'mentions_desc', label: 'Most Mentions' },
  { value: 'mentions_asc', label: 'Least Mentions' },
] as const;
