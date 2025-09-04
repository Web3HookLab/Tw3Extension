/**
 * CA地址搜索相关的类型定义
 */

// 地址类型枚举
export type AddressType = 'solana' | 'ethereum' | 'unknown';

// 地址验证结果
export interface AddressValidation {
  isValid: boolean;
  type: AddressType;
  formatted: string;
  error?: string;
}

// 推文状态
export type TweetStatus = 'active' | 'deleted';

// 网络类型
export type NetworkType = 'solana' | 'ethereum';

// 用户信息接口
export interface TwitterUser {
  rest_id: string;
  name: string;
  screen_name: string;
  followers_count: number;
  profile_image_url_https: string;
  tweet_count?: number; // 在top_users中使用
  tweet_time?: string; // ✨ 最早提及时间 (ISO 8601格式)
  description_zh: string;
  description_en: string;
}

// 代币信息接口
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  twitter: string;
  website: string;
  chain: NetworkType;
}

// 推文信息接口
export interface AddressTweet {
  network: NetworkType;
  tweet_id: string;
  name: string;
  screen_name: string;
  followers_count: number;
  profile_image_url_https: string;
  tweet_time: string; // ISO 8601格式
  status: TweetStatus;
  description_zh: string;
  description_en: string;
}

// 统计信息接口
export interface AddressStats {
  total_tweets: number;
  active_tweets: number;
  deleted_tweets: number;
  most_active_date: string; // YYYY-MM-DD格式
  most_active_date_count: number;
  top_users: TwitterUser[];
  first_mention_user: TwitterUser | null;
}

// API请求参数
export interface AddressSearchRequest {
  solana_address?: string;
  eth_address?: string;
}

// API响应数据
export interface AddressSearchData {
  stats: AddressStats;
  tweets: AddressTweet[];
  token: TokenInfo;
}

// API响应接口
export interface AddressSearchResponse {
  code: number;
  msg: string;
  data: AddressSearchData;
  timestamp: string;
}

// 搜索状态
export type SearchStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error';

// 搜索结果状态
export interface SearchState {
  status: SearchStatus;
  data: AddressSearchData | null;
  error: string | null;
  lastSearchAddress: string | null;
  lastSearchType: AddressType | null;
}

// 地址输入组件Props
export interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  validation: AddressValidation;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// 地址类型指示器Props
export interface AddressTypeIndicatorProps {
  validation: AddressValidation;
  className?: string;
}

// 代币信息组件Props
export interface TokenInfoProps {
  token: TokenInfo;
  loading?: boolean;
  refreshing?: boolean;
  className?: string;
  onOpenKlineAnalysis?: (tokenData: {
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    networkType: string;
  }) => void;
}

// 搜索统计组件Props
export interface SearchStatsProps {
  stats: AddressStats;
  loading?: boolean;
  refreshing?: boolean;
  className?: string;
}

// 热门用户组件Props
export interface TopUsersProps {
  users: TwitterUser[];
  loading?: boolean;
  className?: string;
}

// 推文列表组件Props
export interface TweetsListProps {
  tweets: AddressTweet[];
  loading?: boolean;
  refreshing?: boolean;
  className?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// 搜索结果组件Props
export interface SearchResultsProps {
  searchState: SearchState;
  onRetry?: () => void;
  className?: string;
  onOpenKlineAnalysis?: (tokenData: {
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    networkType: string;
  }) => void;
}

// 主模块组件Props
export interface CAAddressSearchModuleProps {
  className?: string;
}

// 搜索历史项
export interface SearchHistoryItem {
  address: string;
  type: AddressType;
  timestamp: number;
  label?: string; // 用户自定义标签
}

// 搜索历史管理
export interface SearchHistory {
  items: SearchHistoryItem[];
  maxItems: number;
}

// Hook返回类型
export interface UseAddressSearchReturn {
  searchState: SearchState;
  searchAddress: (address: string, isRefresh?: boolean) => Promise<void>;
  clearResults: () => void;
  retry: () => void;
}

export interface UseAddressValidationReturn {
  validation: AddressValidation;
  validateAddress: (address: string) => AddressValidation;
}

export interface UseSearchHistoryReturn {
  history: SearchHistoryItem[];
  addToHistory: (item: Omit<SearchHistoryItem, 'timestamp'>) => void;
  removeFromHistory: (address: string) => void;
  clearHistory: () => void;
}

// 错误类型
export class AddressSearchError extends Error {
  constructor(
    message: string,
    public code?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AddressSearchError';
  }
}

// 常量定义
export const ADDRESS_SEARCH_CONSTANTS = {
  // Solana地址特征
  SOLANA: {
    MIN_LENGTH: 32,
    MAX_LENGTH: 44,
    BASE58_REGEX: /^[1-9A-HJ-NP-Za-km-z]+$/,
  },
  // Ethereum地址特征
  ETHEREUM: {
    LENGTH: 42,
    HEX_REGEX: /^0x[a-fA-F0-9]{40}$/,
  },
  // 搜索历史配置
  HISTORY: {
    MAX_ITEMS: 10,
    STORAGE_KEY: 'ca_address_search_history',
  },
} as const;

// 所有类型已在上面单独导出，无需重复导出
