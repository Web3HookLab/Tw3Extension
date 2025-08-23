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
    // 推特删除推文
    TWITTER_DELETED_TWEETS: '/api/twitter/user_deleted_tweets',
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
    // CA热榜
    LEADERBOARD: '/leaderboard',
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

// WebSocket配置
export const WEBSOCKET_CONFIG = {
  // WebSocket连接地址
  BASE_URL: 'wss://api.tw3track.com/ws',

  // 连接配置
  CONNECTION: {
    RECONNECT_INTERVAL: 5000,        // 重连间隔（毫秒）
    MAX_RECONNECT_ATTEMPTS: 10,      // 最大重连次数
    HEARTBEAT_INTERVAL: 30000,       // 心跳间隔（毫秒）
    PONG_TIMEOUT: 10000,            // 心跳响应超时（毫秒）
    CONNECTION_TIMEOUT: 15000,       // 连接超时（毫秒）
  },

  // 默认订阅配置
  DEFAULT_SUBSCRIPTION: {
    action: "subscribe",
    event: "realtime_ca",
    network: "solana",
    min_followers: 1000,
    filters: {
      contract_addresses: [],
      keywords: [],
      rest_id_blacklist: [],
      mention_filters: {
        min_total_mentions: 0,
        max_total_mentions: 0,
        min_unique_users: 0,
        max_unique_users: 0,
        min_last_5_min: 0,
        min_last_20_min: 0,
        min_last_30_min: 0,
        min_last_1_hour: 0
      },
      user_quality_filters: {
        max_name_changes: 15,
        max_screen_name_changes: 15,
        min_first_mention_followers: 0,
        min_last_mention_followers: 0,
        require_user_description: false
      },
      ca_event_filters: {
        min_pump_launch_count: 0,
        max_pump_launch_count: 0,
        min_pump_migrate_count: 0,
        max_pump_migrate_count: 0,
        min_raydium_launch_count: 0,
        max_raydium_launch_count: 0,
        min_raydium_migrate_count: 0,
        max_raydium_migrate_count: 0,
        min_total_ca_launches: 0,
        min_total_ca_migrates: 0
      },
      ca_history_filters: {
        min_today_count: 0,
        max_today_count: 0,
        max_today_deleted: 0,
        min_last_7_days_count: 0,
        max_last_7_days_count: 0,
        min_last_30_days_count: 0,
        max_last_30_days_count: 0,
        min_total_count: 0,
        max_total_count: 0
      },
      token_quality_filters: {
        require_description: false,
        require_image: false,
        require_twitter: false,
        require_website: false
      }
    }
  }
} as const;

// 应用配置
export const APP_CONFIG = {
  // 存储键名
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_INFO: 'user_info',
    TWITTER_AUTO_QUERY: 'twitter_auto_query',
    TWITTER_DATA_CACHE: 'twitter_data_cache',
    // 实时CA相关存储键
    REALTIME_CA_CACHE: 'realtime_ca_cache',
    REALTIME_CA_SETTINGS: 'realtime_ca_settings',
    REALTIME_CA_SUBSCRIPTION: 'realtime_ca_subscription',
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
  // 实时CA配置
  REALTIME_CA: {
    MAX_CACHE_SIZE: 1000,           // 最大缓存数量
    REALTIME_DISPLAY_SIZE: 50,      // 实时面板显示数量
    AUTO_CONNECT: true,             // 首次打开实时CA页面时自动连接
    AUTO_RETRY: true,               // 默认自动重试
    CACHE_EXPIRY_DAYS: 7,          // 缓存过期天数
    UPDATE_DEBOUNCE_MS: 500,       // 更新防抖时间
  },
} as const;