// 用户状态接口定义
export interface UserInfo {
  user_id: string;
  plan_id: number;
  plan: string;
  limit: number;
  used: number;
  deletion_reminder: boolean;
  follow_trends: boolean;
  expiry_date: string;
  next_reset_date: string;
  is_blacklisted: boolean;
  max_twitter_accounts: number;
  max_wallet_addresses: number;
  twitter_notes_count: number;
  wallet_notes_count: number;
  twitter_notes_over_limit: boolean;
  wallet_notes_over_limit: boolean;
}
// API响应接口
export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
  timestamp: string;
}
// 检测黑名单
export interface BlacklistCheckResult {
  isBlacklisted: boolean;
  shouldLogout: boolean;
  message?: string;
}
// 认证状态Hook数据
export interface AuthState {
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
}