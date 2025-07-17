/**
 * 侧边栏API服务
 * 处理会员功能的API请求
 */

import { Storage } from '@plasmohq/storage'
import { API_CONFIG, APP_CONFIG } from '~src/config/config'
import { getUserInfoFromCache } from '~src/contents/twitter-data-display/utils/user.utils'
import { TokenManager } from '~src/services/token.service'
import { getContentI18n } from '~src/utils/i18n-content'
import type {
  TwitterFollowChangesResponse,
  TwitterUserHistoryResponse,
  TwitterFollowChangesCacheData,
  TwitterUserHistoryCacheData
} from '~src/types/twitter-data.types'

const storage = new Storage({ area: 'local' })

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  fromCache?: boolean
}

export class ApiService {
  /**
   * 检查用户订阅状态
   */
  static async checkSubscription(): Promise<boolean> {
    try {
      const userInfo = await getUserInfoFromCache()
      const hasPermission = userInfo?.plan !== 'Free'
      
      console.log('🔍 订阅状态检查:', {
        plan: userInfo?.plan,
        hasPermission
      })
      
      return hasPermission
    } catch (error) {
      console.error('❌ 检查订阅状态失败:', error)
      return false
    }
  }

  /**
   * 获取用户认证信息
   */
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      // 使用TokenManager获取token
      const token = await TokenManager.getToken()

      if (!token) {
        throw new Error('未找到用户认证信息')
      }

      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Tw3Track-Extension/1.0'
      }
    } catch (error) {
      console.error('❌ 获取认证信息失败:', error)
      throw error
    }
  }

  /**
   * 发送API请求 - 支持GET和POST方法
   */
  private static async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {},
    method: 'GET' | 'POST' = 'GET'
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders()
      const url = API_CONFIG.BASE + endpoint

      let requestOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
      }

      if (method === 'POST') {
        // POST请求使用JSON请求体
        requestOptions.body = JSON.stringify(params)
        console.log('🔄 发送POST API请求:', { url, body: params })
      } else {
        // GET请求使用查询参数
        const urlWithParams = new URL(url)
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            urlWithParams.searchParams.append(key, params[key].toString())
          }
        })
        requestOptions = { ...requestOptions }
        console.log('🔄 发送GET API请求:', urlWithParams.toString())
      }

      const response = await fetch(method === 'POST' ? url : url + '?' + new URLSearchParams(params).toString(), requestOptions)

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      console.log('✅ API请求成功:', endpoint)

      return {
        success: true,
        data
      }
    } catch (error) {
      console.error('❌ API请求失败:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 获取关注事件数据
   */
  static async getFollowEvents(
    restId: string,
    offset = 0,
    limit = 200,
    forceRefresh = false
  ): Promise<ApiResponse<TwitterFollowChangesResponse>> {
    try {
      // 检查订阅状态
      const hasSubscription = await this.checkSubscription()
      if (!hasSubscription) {
        try {
          const i18n = await getContentI18n()
          const errorMessage = i18n.t('common.subscriptionRequired')
          return {
            success: false,
            error: errorMessage
          }
        } catch (error) {
          // 如果国际化加载失败，使用回退文本
          return {
            success: false,
            error: '此功能需要会员订阅'
          }
        }
      }

      // 检查缓存
      if (!forceRefresh) {
        const cached = await this.getFollowEventsCache(restId, offset)
        if (cached) {
          console.log('📦 使用关注事件缓存数据:', { restId, offset })
          // 构造完整的响应格式
          const cachedResponse: TwitterFollowChangesResponse = {
            code: 200,
            msg: 'Twitter follow changes retrieved successfully (cached)',
            data: cached.data,
            timestamp: new Date(cached.timestamp).toISOString()
          }
          return {
            success: true,
            data: cachedResponse,
            fromCache: true
          }
        }
      }

      // 使用POST请求
      const response = await this.makeRequest<TwitterFollowChangesResponse>(
        API_CONFIG.ENDPOINTS.TWITTER_FOLLOW_CHANGES,
        {
          rest_id: restId,
          offset,
          limit
        },
        'POST'
      )

      // 缓存成功的响应
      if (response.success && response.data) {
        await this.setFollowEventsCache(restId, offset, response.data)
      }

      return response
    } catch (error) {
      console.error('❌ 获取关注事件失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取关注事件失败'
      }
    }
  }

  /**
   * 获取用户历史数据
   */
  static async getUserHistory(
    restId: string,
    offset = 0,
    limit = 200,
    forceRefresh = false
  ): Promise<ApiResponse<TwitterUserHistoryResponse>> {
    try {
      // 检查订阅状态
      const hasSubscription = await this.checkSubscription()
      if (!hasSubscription) {
        try {
          const i18n = await getContentI18n()
          const errorMessage = i18n.t('common.subscriptionRequired')
          return {
            success: false,
            error: errorMessage
          }
        } catch (error) {
          // 如果国际化加载失败，使用回退文本
          return {
            success: false,
            error: '此功能需要会员订阅'
          }
        }
      }

      // 检查缓存
      if (!forceRefresh) {
        const cached = await this.getUserHistoryCache(restId, offset)
        if (cached) {
          console.log('📦 使用用户历史缓存数据:', { restId, offset })
          // 构造完整的响应格式
          const cachedResponse: TwitterUserHistoryResponse = {
            code: 200,
            msg: 'Twitter user history retrieved successfully (cached)',
            data: cached.data,
            timestamp: new Date(cached.timestamp).toISOString()
          }
          return {
            success: true,
            data: cachedResponse,
            fromCache: true
          }
        }
      }

      // 使用POST请求
      const response = await this.makeRequest<TwitterUserHistoryResponse>(
        API_CONFIG.ENDPOINTS.TWITTER_USER_HISTORY,
        {
          rest_id: restId,
          offset,
          limit
        },
        'POST'
      )

      // 缓存成功的响应
      if (response.success && response.data) {
        await this.setUserHistoryCache(restId, offset, response.data)
      }

      return response
    } catch (error) {
      console.error('❌ 获取用户历史失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户历史失败'
      }
    }
  }

  /**
   * 刷新Twitter状态数据
   */
  static async refreshTwitterStatus(restId: string): Promise<ApiResponse> {
    try {
      // 使用正确的POST方法调用API
      const token = await TokenManager.getToken()
      if (!token) {
        throw new Error('未找到用户认证信息')
      }

      const apiUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_STATUS}`
      const requestBody = {
        rest_id: restId
      }

      console.log('📡 发送API请求:', { apiUrl, requestBody })

      // 发送请求到API服务器
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Tw3Track-Extension/1.0'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ API请求成功:', data)

      if (data && data.data) {
        // 更新本地缓存 - 使用正确的缓存键格式
        const cacheKey = `twitter_data_cache_${restId}`
        const cacheData = {
          data: data.data,
          timestamp: Date.now(),
          source: 'api'
        }
        await chrome.storage.local.set({
          [cacheKey]: cacheData
        })
        console.log('💾 Twitter状态数据已更新到缓存')
      }

      return {
        success: true,
        data: data.data
      }
    } catch (error) {
      console.error('❌ 刷新Twitter状态失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '刷新数据失败'
      }
    }
  }

  /**
   * 获取API状态
   */
  static async getApiStatus(): Promise<{
    isAuthenticated: boolean
    hasSubscription: boolean
    userInfo: any
  }> {
    try {
      const token = await TokenManager.getToken()
      const userInfo = await getUserInfoFromCache()
      const isAuthenticated = !!token
      const hasSubscription = userInfo?.plan !== 'Free'

      return {
        isAuthenticated,
        hasSubscription,
        userInfo: userInfo || null
      }
    } catch (error) {
      console.error('❌ 获取API状态失败:', error)
      return {
        isAuthenticated: false,
        hasSubscription: false,
        userInfo: null
      }
    }
  }

  /**
   * 获取关注事件缓存
   */
  private static async getFollowEventsCache(
    restId: string,
    offset: number
  ): Promise<TwitterFollowChangesCacheData | null> {
    try {
      const cacheKey = `twitter_data_cache_${restId}_follow_changes_${offset}`
      const cached = await storage.get(cacheKey) as TwitterFollowChangesCacheData | null

      if (cached && cached.timestamp) {
        // 检查是否过期
        const isExpired = Date.now() - cached.timestamp >= APP_CONFIG.TWITTER_CACHE.EXPIRY_TIME
        if (!isExpired) {
          console.log('✅ 使用有效的关注事件缓存:', { restId, offset })
          return cached
        } else {
          console.log('⏰ 关注事件缓存已过期，清理缓存:', { restId, offset })
          await storage.remove(cacheKey)
        }
      }

      return null
    } catch (error) {
      console.warn('⚠️ 获取关注事件缓存失败:', error)
      return null
    }
  }

  /**
   * 设置关注事件缓存
   */
  private static async setFollowEventsCache(
    restId: string,
    offset: number,
    data: TwitterFollowChangesResponse
  ): Promise<void> {
    try {
      const cacheKey = `twitter_data_cache_${restId}_follow_changes_${offset}`
      const cacheData: TwitterFollowChangesCacheData = {
        data: data.data,
        timestamp: Date.now(),
        rest_id: restId,
        offset
      }

      await storage.set(cacheKey, cacheData)
      console.log('💾 关注事件数据已缓存:', { restId, offset })
    } catch (error) {
      console.warn('⚠️ 缓存关注事件数据失败:', error)
    }
  }

  /**
   * 获取用户历史缓存
   */
  private static async getUserHistoryCache(
    restId: string,
    offset: number
  ): Promise<TwitterUserHistoryCacheData | null> {
    try {
      const cacheKey = `twitter_data_cache_${restId}_user_history_${offset}`
      const cached = await storage.get(cacheKey) as TwitterUserHistoryCacheData | null

      if (cached && cached.timestamp) {
        // 检查是否过期
        const isExpired = Date.now() - cached.timestamp >= APP_CONFIG.TWITTER_CACHE.EXPIRY_TIME
        if (!isExpired) {
          console.log('✅ 使用有效的用户历史缓存:', { restId, offset })
          return cached
        } else {
          console.log('⏰ 用户历史缓存已过期，清理缓存:', { restId, offset })
          await storage.remove(cacheKey)
        }
      }

      return null
    } catch (error) {
      console.warn('⚠️ 获取用户历史缓存失败:', error)
      return null
    }
  }

  /**
   * 设置用户历史缓存
   */
  private static async setUserHistoryCache(
    restId: string,
    offset: number,
    data: TwitterUserHistoryResponse
  ): Promise<void> {
    try {
      const cacheKey = `twitter_data_cache_${restId}_user_history_${offset}`
      const cacheData: TwitterUserHistoryCacheData = {
        data: data.data,
        timestamp: Date.now(),
        rest_id: restId,
        offset
      }

      await storage.set(cacheKey, cacheData)
      console.log('💾 用户历史数据已缓存:', { restId, offset })
    } catch (error) {
      console.warn('⚠️ 缓存用户历史数据失败:', error)
    }
  }
}
