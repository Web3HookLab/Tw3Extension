/**
 * 删帖榜单相关类型定义
 */

// 时间范围选项
export type TimeRange = 'today' | '7days' | '30days' | 'all';

// 排序方式
export type SortBy = 'deleted_count' | 'latest_delete';

// 排序顺序
export type SortOrder = 'desc' | 'asc';

// API 请求参数接口
export interface ApiFilterOptions {
  time_range: TimeRange;
  sort_by: SortBy;
  order: SortOrder;
  limit: number;
  offset: number;
}

// 本地筛选条件接口
export interface LocalFilterOptions {
  search_query: string;  // 统一搜索关键词（同时搜索用户名和显示名称）
}

// 完整筛选条件接口
export interface FilterOptions extends ApiFilterOptions, LocalFilterOptions {}

// 用户排名数据接口
export interface UserRanking {
  rank: number;
  rest_id: string;
  name: string;
  screen_name: string;
  profile_image_url_https: string;
  deleted_count: number;
  latest_delete_time: string;
  total_tweets: number;
  delete_rate: number;
}

// API 响应数据接口
export interface LeaderboardResponse {
  code: number;
  msg: string;
  data: {
    time_range: TimeRange;
    total_users: number;
    rankings: UserRanking[];
    next_offset: number;
    has_more: boolean;
  };
}

// 分页信息接口
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  offset: number;
}

// 统计信息接口
export interface StatsInfo {
  totalUsers: number;
  currentPage: number;
  totalPages: number;
  showing: string;
  cacheTime: string;
}

// 组件状态接口
export interface LeaderboardState {
  // 原始数据（从 API 获取的所有数据）
  rawRankings: UserRanking[];
  // 筛选后的数据（本地搜索筛选结果）
  filteredRankings: UserRanking[];
  // 当前显示的数据（用于下滑加载显示）
  displayedRankings: UserRanking[];

  loading: boolean;
  loadingMore: boolean; // 加载更多数据的状态
  error: string | null;

  // 筛选状态
  filters: FilterOptions;

  // 下滑加载状态
  hasMore: boolean;     // 是否还有更多数据可加载
  currentOffset: number; // 当前 API 偏移量
  displayCount: number;  // 当前显示的数据数量

  // 统计信息
  stats: StatsInfo;

  // 缓存状态
  lastUpdated: Date | null;
  cacheExpiry: Date | null;
}

// Hook 返回值接口
export interface UseDeletedTweetsLeaderboard {
  // 状态
  state: LeaderboardState;
  
  // 操作方法
  actions: {
    // 获取数据
    fetchData: (filters?: Partial<FilterOptions>) => Promise<void>;

    // 加载更多数据
    loadMore: () => Promise<void>;

    // 刷新数据
    refreshData: () => Promise<void>;

    // 更新筛选条件
    updateFilters: (filters: Partial<FilterOptions>) => void;

    // 重置状态
    reset: () => void;
  };
}

// 筛选面板 Props
export interface FilterPanelProps {
  filters: FilterOptions;
  loading: boolean;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  onRefresh: () => void;
  onExport?: () => void;
}

// 统计面板 Props
export interface StatsPanelProps {
  stats: StatsInfo;
  loading: boolean;
  filters?: FilterOptions; // 添加筛选条件以显示搜索状态
}

// 榜单表格 Props
export interface LeaderboardTableProps {
  rankings: UserRanking[];
  loading: boolean;
  error: string | null;
}

// 用户行 Props
export interface UserRowProps {
  ranking: UserRanking;
  index: number;
}

// 加载更多控制 Props
export interface LoadMoreControlsProps {
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  displayCount: number;
  totalCount: number;
}

// 默认筛选条件
export const DEFAULT_FILTERS: FilterOptions = {
  time_range: 'today',
  sort_by: 'deleted_count',
  order: 'desc',
  limit: 100,  // API 每次获取的数量
  offset: 0,
  search_query: '',
};

// 默认分页信息
export const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  pageSize: 50,
  total: 0,
  hasMore: false,
  offset: 0,
};

// 页面大小选项
export const PAGE_SIZE_OPTIONS = [20, 50, 100];

// 时间范围选项
export const TIME_RANGE_OPTIONS: { value: TimeRange; labelKey: string }[] = [
  { value: 'today', labelKey: 'deletedTweetsLeaderboard.timeRange.today' },
  { value: '7days', labelKey: 'deletedTweetsLeaderboard.timeRange.7days' },
  { value: '30days', labelKey: 'deletedTweetsLeaderboard.timeRange.30days' },
  { value: 'all', labelKey: 'deletedTweetsLeaderboard.timeRange.all' },
];

// 排序方式选项
export const SORT_BY_OPTIONS: { value: SortBy; labelKey: string }[] = [
  { value: 'deleted_count', labelKey: 'deletedTweetsLeaderboard.sortBy.deleted_count' },
  { value: 'latest_delete', labelKey: 'deletedTweetsLeaderboard.sortBy.latest_delete' },
];

// 排序顺序选项
export const SORT_ORDER_OPTIONS: { value: SortOrder; labelKey: string }[] = [
  { value: 'desc', labelKey: 'deletedTweetsLeaderboard.order.desc' },
  { value: 'asc', labelKey: 'deletedTweetsLeaderboard.order.asc' },
];

// 缓存配置
export const CACHE_CONFIG = {
  // 缓存时间（毫秒）
  CACHE_DURATION: {
    today: 5 * 60 * 1000,      // 5分钟
    '7days': 30 * 60 * 1000,   // 30分钟
    '30days': 2 * 60 * 60 * 1000, // 2小时
    all: 6 * 60 * 60 * 1000,   // 6小时
  },
  
  // 存储键
  STORAGE_KEY: 'deleted_tweets_leaderboard_cache',
};

// 错误类型
export interface ApiError {
  code: number;
  message: string;
  details?: any;
}

// 导出数据格式
export interface ExportData {
  rank: number;
  username: string;
  displayName: string;
  deletedCount: number;
  totalTweets: number;
  deleteRate: string;
  latestDelete: string;
}
