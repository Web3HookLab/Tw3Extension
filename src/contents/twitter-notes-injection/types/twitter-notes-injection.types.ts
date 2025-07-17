/**
 * Twitter备注注入功能相关类型定义
 */

import type { TwitterNote } from '~src/types/twitter-notes.types'

// Twitter备注注入配置
export interface TwitterNotesInjectionConfig {
  enabled: boolean
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

// 徽章数据
export interface BadgeData {
  restId: string
  screenName?: string
  existingNote: TwitterNote | null
  fromCache: boolean
  timestamp: number
}

// 注入状态
export interface InjectionState {
  isInjecting: boolean
  injectedBadges: Set<string>
  currentRestId: string | null
  lastUrl: string
  injectionLock: Map<string, boolean>
}

// 注入结果
export interface InjectionResult {
  success: boolean
  container?: Element
  targetName?: string
  error?: string
}

// 用户识别结果
export interface UserIdentificationResult {
  restId: string
  screenName: string
  source: 'profile' | 'tweet' | 'cache'
}

// 徽章状态
export type BadgeState = 'loading' | 'no-note' | 'has-note' | 'error'

// 徽章操作类型
export type BadgeAction = 'add' | 'edit' | 'view'

// 消息类型
export interface TwitterNotesMessage {
  type: 'TWITTER_NOTES_UPDATED' | 'TWITTER_NOTES_CACHE_UPDATED' | 'TWITTER_NOTES_DELETED'
  restId?: string
  note?: TwitterNote | null
  notes?: TwitterNote[]
}

// 侧边栏数据
export interface TwitterNotesSidePanelData {
  type: 'twitterNotes'
  title: string
  restId: string
  userData?: TwitterNote | null
}

// 数据加载结果
export interface DataLoadResult<T> {
  success: boolean
  data?: T
  fromCache?: boolean
  timestamp?: number
  error?: string
}

// 缓存数据结构
export interface CachedTwitterNote {
  data: TwitterNote
  timestamp: number
}

// 操作结果
export interface OperationResult {
  success: boolean
  data?: any
  error?: string
}

// 徽章配置
export interface BadgeConfig {
  showTags: boolean
  maxTags: number
  compactMode: boolean
}

// DOM元素查找配置
export interface ElementSelector {
  selector: string
  required: boolean
  timeout?: number
}

// 页面类型
export type PageType = 'profile' | 'tweet-detail' | 'home' | 'search' | 'other'

// 注入点类型
export type InjectionPointType = 'user-name' | 'user-profile' | 'tweet-header'

// 错误类型
export interface TwitterNotesError {
  code: string
  message: string
  details?: any
}
