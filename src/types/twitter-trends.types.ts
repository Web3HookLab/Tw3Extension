// Twitter 趋势相关类型定义

/**
 * Twitter 关注者信息
 */
export interface TwitterFollower {
  event_time: string;
  name: string;
  profile_image_url_https: string;
  screen_name: string;
  user_id: string;
}

/**
 * Twitter 趋势项目
 */
export interface TwitterTrendItem {
  follower_count: number;
  followers: TwitterFollower[];
  description: string | null;
  name: string;
  profile_image: string;
  screen_name: string;
}

/**
 * Twitter 趋势 API 响应
 */
export interface TwitterTrendsResponse {
  code: number;
  msg: string;
  data: {
    data: TwitterTrendItem[];
    has_more: boolean;
    hours?: number;
    minutes?: number;
    msg: string;
    next_offset: number;
  };
  timestamp?: string;
}

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  timeUnit: 'minute' | 'hour';
  timeValue: number;
}

/**
 * Twitter 趋势控制栏 Props
 */
export interface TwitterTrendsControlsProps {
  preferences: UserPreferences;
  loading: boolean;
  isPaused: boolean;
  onTimeUnitChange: (unit: 'minute' | 'hour') => void;
  onTimeValueChange: (value: string) => void;
  onTogglePause: () => void;
  onRefresh: () => void;
  onForceRefresh: () => void;
}

/**
 * Twitter 趋势列表 Props
 */
export interface TwitterTrendsListProps {
  trends: TwitterTrendItem[];
  loading: boolean;
  error: string | null;
  showAll: boolean;
  trendsCount: number;
  onShowAllToggle: () => void;
  onOpenTwitterProfile: (screenName: string) => void;
  onShowAllFollowers: (followers: TwitterFollower[], trendName: string) => void;
}

/**
 * Twitter 关注者对话框 Props
 */
export interface TwitterFollowersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followers: TwitterFollower[];
  trendName: string;
  onOpenTwitterProfile: (screenName: string) => void;
}
