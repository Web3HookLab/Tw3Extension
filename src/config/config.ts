// API配置
export const API_CONFIG = {
  BASE: 'https://api.tw3track.com',
  ENDPOINTS: {
    HEALTH_CHECK: '/health',
    USER_STATUS: '/api/user/status',
    TWITTER_TRENDS: '/api/twitter/trends',
    // 推特用户数据
    TWITTER_STATUS: '/api/twitter/status',
    // 推特关注变化
    TWITTER_FOLLOW_CHANGES: '/api/twitter/follow_changes',
    // 推特用户历史
    TWITTER_USER_HISTORY: '/api/twitter/user_history',
    //推特
    TWITTER_NOTES_LIST: '/api/twitter/notes',
    TWITTER_NOTES_ADD: '/api/twitter/notes/add',
    TWITTER_NOTES_UPDATE: '/api/twitter/notes/update',
    TWITTER_NOTES_DELETE: '/api/twitter/notes/delete',
    //钱包
    WALLET_NOTES_LIST: '/api/wallet/notes',
    WALLET_NOTES_ADD: '/api/wallet/notes/add',
    WALLET_NOTES_UPDATE: '/api/wallet/notes/update',
    WALLET_NOTES_DELETE: '/api/wallet/notes/delete',
  },
  // 请求超时配置
  REQUEST_TIMEOUT: 10000, // 10秒
} as const;

// 刷新配置 - 统一管理所有刷新相关配置
export const REFRESH_CONFIG = {
  // 基础刷新间隔（毫秒）
  // 注意：chrome.alarms API最小间隔为1分钟
  BACKGROUND_INTERVAL: 300000, // 5分钟（chrome.alarms后台刷新）

  // 手动刷新间隔（用于用户主动触发的刷新）
  MANUAL_REFRESH_COOLDOWN: 10000, // 10秒冷却时间，防止频繁刷新

  // 用户状态刷新配置
  USER_STATUS: {
    MAX_RETRY_ATTEMPTS: 3, // 最大重试次数
    RETRY_DELAY: 5000, // 重试延迟（5秒）
    BLACKLIST_CHECK_PRIORITY: true, // 优先检查黑名单状态
    ENABLE_LOGGING: true, // 启用日志记录
    CACHE_DURATION: 60000, // 状态缓存时间（1分钟）
  },
} as const;

// 应用配置
export const APP_CONFIG = {
  // 存储键名
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_INFO: 'user_info',
    TWITTER_AUTO_QUERY: 'twitter_auto_query',
    TWITTER_DATA_CACHE: 'twitter_data_cache',
  },
  // 默认语言和主题
  DEFAULTS: {
    LANGUAGE: 'en',
    THEME: 'system',
    TWITTER_AUTO_QUERY: true,
  },
  // 推特数据缓存配置
  TWITTER_CACHE: {
    EXPIRY_TIME: 300000, // 5分钟 (300秒)
    MAX_KOL_DISPLAY: 200, // 显示前200个KOL
  },
} as const;