// 推特用户数据类型定义
export interface TwitterKol {
  followers_count: number;
  name: string;
  profile_image_url_https: string;
  screen_name: string;
}

export interface TwitterUserData {
  kol_count: number;
  kol_list: TwitterKol[];
  name: string;
  name_changes: number;
  name_list: string[];
  profile_image_url_https: string;
  pump_token_count: number;
  pump_token_success_count: number;
  raydium_token_count: number;
  raydium_token_success_count: number;
  rest_id: string;
  screen_name: string;
  screen_name_changes: number;
  screen_name_list: string[];
  twitter_follow_event_count: number;
  wallet_address_list: string[];
}

export interface TwitterStatusResponse {
  code: number;
  msg: string;
  data: TwitterUserData;
  timestamp: string;
}

// 缓存数据结构
export interface TwitterCacheData {
  data: TwitterUserData;
  timestamp: number;
  rest_id: string;
}

// JSON-LD 数据结构
export interface TwitterJsonLD {
  "@context": string;
  "@type": string;
  dateCreated: string;
  mainEntity: {
    "@type": string;
    additionalName: string;
    description: string;
    givenName: string;
    homeLocation: {
      "@type": string;
      name: string;
    };
    identifier: string;
    image: {
      "@type": string;
      contentUrl: string;
      thumbnailUrl: string;
    };
    interactionStatistic: Array<{
      "@type": string;
      interactionType: string;
      name: string;
      userInteractionCount: number;
    }>;
    url: string;
  };
  contentRating: string;
}

// 关注事件数据类型
export interface TwitterFollowEvent {
  change_type: 'add' | 'del';
  event_time: string;
  followers_count: number;
  name: string;
  profile_image_url_https: string;
  screen_name: string;
}

export interface TwitterFollowChangesData {
  data: TwitterFollowEvent[];
  has_more: boolean;
  next_offset: number;
}

export interface TwitterFollowChangesResponse {
  code: number;
  msg: string;
  data: TwitterFollowChangesData;
  timestamp: string;
}


// 关注事件缓存数据
export interface TwitterFollowChangesCacheData {
  data: TwitterFollowChangesData;
  timestamp: number;
  rest_id: string;
  offset: number;
}

// 用户历史数据类型
export interface TwitterUserHistoryItem {
  description: string;
  location: string;
  name: string;
  pinned_tweet_ids_str: number | null;
  profile_banner_url: string;
  profile_image_url_https: string;
  rest_id: number;
  scraped_at: number;
  screen_name: string;
}

export interface TwitterUserHistoryData {
  data: TwitterUserHistoryItem[];
  has_more: boolean;
  next_offset: number;
}

export interface TwitterUserHistoryResponse {
  code: number;
  msg: string;
  data: TwitterUserHistoryData;
  timestamp: string;
}

// 用户历史缓存数据
export interface TwitterUserHistoryCacheData {
  data: TwitterUserHistoryData;
  timestamp: number;
  rest_id: string;
  offset: number;
}

// 组件状态类型
export type TwitterDisplayState = 'loading' | 'success' | 'error' | 'not-logged-in' | 'no-data';

export interface TwitterDisplayProps {
  restId: string;
  onStateChange?: (state: TwitterDisplayState) => void;
} 