/**
 * Twitter数据显示相关类型定义
 */

import type { TwitterUserData } from './twitter-data.types'

// Twitter数据显示配置
export interface TwitterDataDisplayConfig {
  autoQueryEnabled: boolean
  showKolList: boolean
  maxRetries: number
  injectionDelay: number
  debounceDelay: number
  cacheExpiry: number
}

// 注入目标配置
export interface InjectionTarget {
  name: string
  selector: string
  findContainer: (element: Element) => Element | null
  insertPosition: 'before' | 'after'
  priority: number
}

// 卡片数据
export interface CardData {
  restId: string
  userData: TwitterUserData
  fromCache: boolean
  timestamp: number
}

// 注入状态
export interface InjectionState {
  isInjecting: boolean
  injectedRestIds: Set<string>
  currentRestId: string | null
  lastUrl: string
  injectionLock: Map<string, boolean>
}

// 统计项数据
export interface StatItemData {
  key: string
  value: number | string
  list?: any[]
  clickable: boolean
  title?: string
}

// 卡片状态
export type CardState = 'loading' | 'success' | 'error' | 'empty'

// 卡片配置
export interface CardConfig {
  restId: string
  isDarkMode: boolean
  showRefreshButton?: boolean
  showToggleButton?: boolean
  showHistoryButton?: boolean
  autoLoad?: boolean
}

// 格式化选项
export interface FormatOptions {
  language: 'en' | 'zh'
  compact?: boolean
  showUnit?: boolean
}

// DOM注入结果
export interface InjectionResult {
  success: boolean
  container?: Element
  targetName?: string
  error?: string
}

// 数据加载结果
export interface DataLoadResult<T = any> {
  success: boolean
  data?: T
  error?: string
  fromCache?: boolean
  timestamp?: number
}

// 用户交互事件
export interface UserInteractionEvent {
  type: 'click' | 'hover' | 'focus'
  target: string
  data?: any
  timestamp: number
}

// 卡片事件类型
export type CardEventType = 
  | 'refresh'
  | 'toggle'
  | 'history'
  | 'stat-click'
  | 'kol-click'

// 卡片事件数据
export interface CardEventData {
  type: CardEventType
  restId: string
  payload?: any
}

// Twitter设置消息
export interface TwitterSettingsMessage {
  type: 'TWITTER_SETTINGS_CHANGED'
  payload: {
    settingType: 'auto-query' | 'kol-list'
    enabled: boolean
  }
}

// 验证结果
export interface ValidationResult {
  isValid: boolean
  reason?: string
  suggestions?: string[]
}
