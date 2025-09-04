// 实时CA相关类型定义

// WebSocket连接状态
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

// 视图模式
export type ViewMode = 'realtime' | 'cache';

// 网络类型
export type NetworkType = 'solana' | 'ethereum';

// WebSocket订阅配置
export interface SubscriptionConfig {
  action: 'subscribe';
  event: 'realtime_ca';
  network: NetworkType;
  min_followers: number;
  filters: {
    contract_addresses: string[];
    keywords: string[];
    rest_id_blacklist: string[];
    mention_filters: {
      min_total_mentions: number;
      max_total_mentions: number;
      min_unique_users: number;
      max_unique_users: number;
      min_last_5_min: number;
      min_last_20_min: number;
      min_last_30_min: number;
      min_last_1_hour: number;
    };
    user_quality_filters: {
      max_name_changes: number;
      max_screen_name_changes: number;
      min_first_mention_followers: number;
      min_last_mention_followers: number;
      require_user_description: boolean;
    };
    ca_event_filters: {
      min_pump_launch_count: number;
      max_pump_launch_count: number;
      min_pump_migrate_count: number;
      max_pump_migrate_count: number;
      min_raydium_launch_count: number;
      max_raydium_launch_count: number;
      min_raydium_migrate_count: number;
      max_raydium_migrate_count: number;
      min_total_ca_launches: number;
      min_total_ca_migrates: number;
    };
    ca_history_filters: {
      min_today_count: number;
      max_today_count: number;
      max_today_deleted: number;
      min_last_7_days_count: number;
      max_last_7_days_count: number;
      min_last_30_days_count: number;
      max_last_30_days_count: number;
      min_total_count: number;
      max_total_count: number;
    };
    token_quality_filters: {
      require_description: boolean;
      require_image: boolean;
      require_twitter: boolean;
      require_website: boolean;
    };
  };
}

// CA事件用户信息
export interface CAEventUser {
  rest_id: string;
  name: string;
  screen_name: string;
  description: string;
  description_zh: string;
  description_en: string;
  followers_count: number;
  profile_image_url_https: string;
  name_changes: number;
  screen_name_changes: number;
}

// CA事件推文信息
export interface CAEventTweet {
  tweet_id: string;
  content: string;
  created_at: string;
}

// CA事件统计
export interface CAEventStats {
  pump: {
    launch_count: number;
    migrate_count: number;
  };
  raydium: {
    launch_count: number;
    migrate_count: number;
  };
}

// CA历史统计
export interface CAHistoryStats {
  today: {
    count: number;
    deleted: number;
  };
  last_7_days: {
    count: number;
    deleted: number;
  };
  last_30_days: {
    count: number;
    deleted: number;
  };
  total: {
    count: number;
    deleted: number;
  };
}

// 代币提及统计
export interface MentionStats {
  total_mentions: number;
  unique_users: number;
  first_mention_user: CAEventUser & {
    tweet_id: string;
    mention_time: string;
    tweet_time: string;  // ✨ 新增的最早提及时间
  };
  last_mention_user: CAEventUser & {
    tweet_id: string;
    mention_time: string;
  };
  minute_stats: {
    last_5_min: number;
    last_20_min: number;
    last_30_min: number;
    last_1_hour: number;
  };
}

// 代币信息
export interface TokenMention {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  twitter: string;
  website: string;
  network_type: string;
  chain: string;
  mention_stats: MentionStats;
}

// CA事件数据
export interface CAEventData {
  user: CAEventUser;
  tweet: CAEventTweet;
  ca_event: CAEventStats;
  ca_stats: CAHistoryStats;
  mentions: TokenMention[];
  network: string[];
}

// 完整的CA事件
export interface CAEvent {
  type: 'realtime_ca';
  client_id: string;
  timestamp: string;
  data: CAEventData;
  // 本地添加的字段
  id: string;           // 本地生成的唯一ID
  received_at: number;  // 接收时间戳
}

// 实时CA设置
export interface RealtimeCASettings {
  autoConnect: boolean;
  autoRetry: boolean;
  maxCacheSize: number;
  cacheExpiryDays: number;
  subscriptionConfig: SubscriptionConfig;
}

// 缓存数据结构
export interface CachedCAData {
  events: CAEvent[];
  lastUpdated: number;
  totalCount: number;
}

// WebSocket消息类型
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// 搜索结果
export interface SearchResult {
  events: CAEvent[];
  total: number;
  query: string;
}

// 过滤器状态
export interface FilterState {
  network: NetworkType;
  minFollowers: number;
  keywords: string[];
  userSearch: string;
  symbolSearch: string;
  addressSearch: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}
