/**
 * Twitter注入相关类型定义
 */

// 注入策略
export type InjectionStrategy = 'priority' | 'fallback' | 'aggressive'

// 注入配置
export interface InjectionConfig {
  strategy: InjectionStrategy
  maxRetries: number
  retryDelay: number
  timeout: number
  enableDebug: boolean
}

// 注入点信息
export interface InjectionPoint {
  element: Element
  container: Element
  targetName: string
  priority: number
  isValid: boolean
}

// 注入上下文
export interface InjectionContext {
  restId: string
  url: string
  isUserProfile: boolean
  hasUserElements: boolean
  isDarkMode: boolean
  timestamp: number
}

// 注入锁信息
export interface InjectionLock {
  restId: string
  timestamp: number
  timeout: number
  reason: string
}

// 注入历史记录
export interface InjectionHistory {
  restId: string
  url: string
  timestamp: number
  success: boolean
  targetName?: string
  error?: string
  retryCount: number
}

// DOM观察配置
export interface ObserverConfig {
  debounceDelay: number
  enableUrlWatch: boolean
  enableDomWatch: boolean
  watchSubtree: boolean
  watchAttributes: boolean
}

// 页面状态
export interface PageState {
  url: string
  pathname: string
  isUserProfile: boolean
  restId: string | null
  hasUserElements: boolean
  lastUpdate: number
}

// 清理配置
export interface CleanupConfig {
  removeElements: boolean
  clearState: boolean
  clearCache: boolean
  clearLocks: boolean
}

// 注入验证结果
export interface ValidationResult {
  isValid: boolean
  reason?: string
  suggestions?: string[]
}

// 注入性能指标
export interface InjectionMetrics {
  startTime: number
  endTime: number
  duration: number
  retryCount: number
  success: boolean
  targetName?: string
}
