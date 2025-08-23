/**
 * CA Leaderboard related type definitions
 */



// API request parameter types
export interface LeaderboardParams {
  start_time: string
  end_time: string
  interval: 'hour' | 'day'
  limit: number
  network_type: 'solana' | 'ethereum'
  sort_by: 'total_mentions' | 'change_rate' | 'unique_users'
  order: 'desc' | 'asc'
}

// Token minute statistics data
export interface MinuteStats {
  last_5_min: number
  last_20_min: number
  last_30_min: number
  last_1_hour: number
}

// Token ranking data - matches actual API format
export interface TokenRanking {
  rank: number
  address: string
  name: string
  symbol: string
  description: string
  image: string
  twitter: string
  website: string
  chain: string | null
  total_mentions: number
  unique_users: number
  mentions_per_user: number
  first_mentioned: string
  last_mentioned: string
  first_mention_user: {
    rest_id: string
    name: string
    screen_name: string
    followers_count: number
    profile_image_url_https: string
  }
  last_mention_user: {
    rest_id: string
    name: string
    screen_name: string
    followers_count: number
    profile_image_url_https: string
  }
  change_rate: number
  minute_stats: MinuteStats
}

// Leaderboard data structure
export interface LeaderboardData {
  start_time: string
  end_time: string
  interval: string
  network_type: string
  sort_by: string
  order: string
  rankings: TokenRanking[]
}

// API response type - matches actual API format
export interface LeaderboardResponse {
  code: number
  msg: string
  data: {
    event: string
    uuid: string
    timestamp: string
    start_time: string
    end_time: string
    interval: string
    network_type: string
    data: LeaderboardData[]
  }
  timestamp: string
}

// Filter options type
export interface FilterOptions {
  networkType: 'solana' | 'ethereum'
  timeRange: 'hour' | 'day'
  sortBy: 'total_mentions' | 'change_rate' | 'unique_users'
  limit: number
  customTimeRange?: {
    startTime: string
    endTime: string
  }
}

// Preset time range
export interface TimeRangePreset {
  label: string
  value: string
  getTimeRange: () => { start_time: string; end_time: string; interval: 'hour' | 'day' }
}

// Hook返回类型
export interface UseLeaderboardReturn {
  data: TokenRanking[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastUpdated: Date | null
}

// 组件Props类型
export interface FilterPanelProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  timeRangePreset: string
  onTimeRangePresetChange: (preset: string) => void
  onRefresh: () => void
  loading: boolean
  lastUpdated: Date | null
  showCustomTimeRange?: boolean
  onToggleCustomTimeRange?: () => void
}

export interface TokenListProps {
  tokens: TokenRanking[]
  loading: boolean
  error: string | null
  onRetry: () => void
  networkType?: 'solana' | 'ethereum'
}

export interface TokenCardProps {
  token: TokenRanking
  index: number
  networkType?: 'solana' | 'ethereum'
}

// 错误类型
export class LeaderboardError extends Error {
  public code?: string
  public details?: any

  constructor(
    message: string,
    code?: string,
    details?: any
  ) {
    super(message)
    this.name = 'LeaderboardError'
    this.code = code
    this.details = details
  }
}

// 常量定义
export const NETWORK_OPTIONS = [
  { value: 'solana', label: 'Solana' },
  { value: 'ethereum', label: 'Ethereum' }
] as const

// Sort options with translation keys
export const SORT_OPTIONS = [
  { value: 'total_mentions', labelKey: 'caLeaderboard.totalMentions' },
  { value: 'change_rate', labelKey: 'caLeaderboard.changeRate' },
  { value: 'unique_users', labelKey: 'caLeaderboard.activeUsers' }
] as const

// Helper function to get translated sort options
export const getSortOptions = (t: (key: string) => string) =>
  SORT_OPTIONS.map(option => ({
    value: option.value,
    label: t(option.labelKey)
  }))

// Time range presets with translation keys
const TIME_RANGE_PRESET_CONFIGS = [
  {
    labelKey: 'caLeaderboard.today',
    value: 'today',
    getTimeRange: () => {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return {
        start_time: startOfDay.toISOString(),
        end_time: now.toISOString(),
        interval: 'day' as const
      }
    }
  },
  {
    labelKey: 'caLeaderboard.last24Hours',
    value: 'last_24_hours',
    getTimeRange: () => {
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      return {
        start_time: twentyFourHoursAgo.toISOString(),
        end_time: now.toISOString(),
        interval: 'day' as const
      }
    }
  },
  {
    labelKey: 'caLeaderboard.last3Days',
    value: 'last_3_days',
    getTimeRange: () => {
      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      return {
        start_time: threeDaysAgo.toISOString(),
        end_time: now.toISOString(),
        interval: 'day' as const
      }
    }
  },
  {
    labelKey: 'caLeaderboard.last7Days',
    value: 'last_7_days',
    getTimeRange: () => {
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return {
        start_time: sevenDaysAgo.toISOString(),
        end_time: now.toISOString(),
        interval: 'day' as const
      }
    }
  }
] as const

// Helper function to get translated time range presets
export const getTimeRangePresets = (t: (key: string) => string): TimeRangePreset[] =>
  TIME_RANGE_PRESET_CONFIGS.map(config => ({
    label: t(config.labelKey),
    value: config.value,
    getTimeRange: config.getTimeRange
  }))

// Export the original structure for backward compatibility
export const TIME_RANGE_PRESETS: TimeRangePreset[] = TIME_RANGE_PRESET_CONFIGS.map(config => ({
  label: config.labelKey, // Will be replaced by translated label in components
  value: config.value,
  getTimeRange: config.getTimeRange
}))

// 默认筛选配置
export const DEFAULT_FILTERS: FilterOptions = {
  networkType: 'solana',
  timeRange: 'day',
  sortBy: 'total_mentions',
  limit: 50
}
