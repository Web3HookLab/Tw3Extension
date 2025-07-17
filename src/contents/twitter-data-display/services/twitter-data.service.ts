/**
 * Twitter数据服务
 * 通过Background处理API请求，避免CORS问题
 */

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from '@plasmohq/storage'
import { APP_CONFIG } from '~src/config/config'
import type { TwitterUserData } from '~src/types/twitter-data.types'
import type { DataLoadResult } from '~src/types/twitter-display.types'

const storage = new Storage({ area: 'local' })

interface CachedTwitterData {
  data: TwitterUserData
  timestamp: number
}

export class TwitterDataService {
  private static readonly CACHE_DURATION = APP_CONFIG.TWITTER_CACHE.EXPIRY_TIME
  private static readonly pendingRequests = new Map<string, Promise<DataLoadResult<TwitterUserData>>>()

  /**
   * 获取Twitter用户数据
   */
  static async getTwitterData(restId: string, forceRefresh = false): Promise<DataLoadResult<TwitterUserData>> {
    try {
      console.log('📊 开始获取Twitter数据:', restId, { forceRefresh })

      // 检查缓存
      if (!forceRefresh) {
        const cached = await this.getCachedData(restId)
        if (cached) {
          console.log('📦 使用缓存数据:', restId)
          return {
            success: true,
            data: cached,
            fromCache: true,
            timestamp: Date.now()
          }
        }
      }

      // 检查是否有正在进行的请求
      const requestKey = `${restId}_${forceRefresh}`
      if (this.pendingRequests.has(requestKey)) {
        console.log('🔄 复用正在进行的请求:', restId)
        return await this.pendingRequests.get(requestKey)!
      }

      console.log('🌐 通过Background请求数据:', restId)

      // 创建新的请求Promise
      const requestPromise = this.performRequest(restId, forceRefresh)
      this.pendingRequests.set(requestKey, requestPromise)

      try {
        const result = await requestPromise
        return result
      } finally {
        // 请求完成后清理
        this.pendingRequests.delete(requestKey)
      }
    } catch (error) {
      console.error('❌ 获取Twitter数据异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 执行实际的数据请求
   */
  private static async performRequest(restId: string, forceRefresh: boolean): Promise<DataLoadResult<TwitterUserData>> {
    try {
      // 通过Background请求数据
      const response = await sendToBackground({
        name: "twitter-status",
        body: { restId, forceRefresh }
      })

      if (response.success && response.data) {
        // 缓存数据
        await this.setCachedData(restId, response.data)

        console.log('✅ 数据获取成功:', restId)
        return {
          success: true,
          data: response.data,
          fromCache: false,
          timestamp: Date.now()
        }
      } else {
        console.error('❌ 数据请求失败:', response.error)
        return {
          success: false,
          error: response.error || '数据请求失败'
        }
      }
    } catch (error) {
      console.error('❌ performRequest异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 获取缓存数据
   */
  private static async getCachedData(restId: string): Promise<TwitterUserData | null> {
    try {
      const cacheKey = `${APP_CONFIG.STORAGE_KEYS.TWITTER_DATA_CACHE}_${restId}`
      const cached = await storage.get(cacheKey) as CachedTwitterData | null

      console.log('🔍 缓存调试信息:', {
        cacheKey,
        hasCached: !!cached,
        cachedType: typeof cached,
        cachedKeys: cached ? Object.keys(cached) : null,
        hasTimestamp: cached?.timestamp ? true : false,
        hasData: cached?.data ? true : false,
        timestamp: cached?.timestamp,
        currentTime: Date.now(),
        cacheAge: cached?.timestamp ? Date.now() - cached.timestamp : null,
        cacheExpiry: this.CACHE_DURATION,
        isExpired: cached?.timestamp ? (Date.now() - cached.timestamp) >= this.CACHE_DURATION : null
      })

      if (cached) {
        // 检查新格式缓存数据 {data: {...}, timestamp: number}
        if (cached.timestamp && cached.data) {
          // 检查是否过期
          if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
            console.log('✅ 使用有效缓存数据 (新格式):', restId)
            console.log('📊 缓存数据预览:', {
              kol_count: cached.data.kol_count,
              kol_list_length: cached.data.kol_list?.length,
              name: cached.data.name,
              screen_name: cached.data.screen_name
            })
            return cached.data
          }

          console.log('⏰ 缓存已过期，清理缓存:', restId)
          // 清理过期缓存
          await storage.remove(cacheKey)
        } else {
          console.log('❌ 缓存数据格式无效:', restId)
        }
      } else {
        console.log('❌ 缓存数据不存在:', restId)
      }

      return null
    } catch (error) {
      console.warn('⚠️ 获取缓存数据失败:', error)
      return null
    }
  }

  /**
   * 设置缓存数据
   */
  private static async setCachedData(restId: string, data: TwitterUserData): Promise<void> {
    try {
      const cacheKey = `${APP_CONFIG.STORAGE_KEYS.TWITTER_DATA_CACHE}_${restId}`
      const cacheData: CachedTwitterData = {
        data,
        timestamp: Date.now()
      }

      await storage.set(cacheKey, cacheData)
      console.log('💾 数据已缓存:', restId)
    } catch (error) {
      console.warn('⚠️ 缓存数据失败:', error)
    }
  }

  /**
   * 清理缓存
   */
  static async clearCache(restId?: string): Promise<void> {
    try {
      if (restId) {
        const cacheKey = `${APP_CONFIG.STORAGE_KEYS.TWITTER_DATA_CACHE}_${restId}`
        await storage.remove(cacheKey)
        console.log('🧹 已清理指定缓存:', restId)
      } else {
        // 清理所有Twitter数据缓存
        const allKeys = await storage.getAll()
        const cacheKeys = Object.keys(allKeys).filter(key =>
          key.startsWith(APP_CONFIG.STORAGE_KEYS.TWITTER_DATA_CACHE)
        )

        for (const key of cacheKeys) {
          await storage.remove(key)
        }

        console.log('🧹 已清理所有缓存')
      }
    } catch (error) {
      console.warn('⚠️ 清理缓存失败:', error)
    }
  }

  /**
   * 获取缓存统计
   */
  static async getCacheStats(): Promise<{ size: number; keys: string[] }> {
    try {
      const allKeys = await storage.getAll()
      const cacheKeys = Object.keys(allKeys).filter(key =>
        key.startsWith(APP_CONFIG.STORAGE_KEYS.TWITTER_DATA_CACHE)
      )

      return {
        size: cacheKeys.length,
        keys: cacheKeys
      }
    } catch (error) {
      console.warn('⚠️ 获取缓存统计失败:', error)
      return { size: 0, keys: [] }
    }
  }

  /**
   * 预加载数据
   */
  static async preloadData(restId: string): Promise<void> {
    try {
      console.log('🔄 预加载数据:', restId)
      await this.getTwitterData(restId, false)
    } catch (error) {
      console.warn('⚠️ 预加载失败:', error)
    }
  }

  /**
   * 调试方法：检查缓存数据
   */
  static async debugCacheData(restId: string): Promise<void> {
    try {
      const cacheKey = `${APP_CONFIG.STORAGE_KEYS.TWITTER_DATA_CACHE}_${restId}`
      const cached = await storage.get(cacheKey)

      console.log('🔍 === 缓存数据调试 ===')
      console.log('缓存键:', cacheKey)
      console.log('缓存数据:', cached)
      console.log('数据类型:', typeof cached)
      console.log('是否为对象:', cached && typeof cached === 'object')

      if (cached && typeof cached === 'object') {
        console.log('对象键:', Object.keys(cached))
        console.log('时间戳:', (cached as any).timestamp)
        console.log('数据:', (cached as any).data)

        if ((cached as any).timestamp) {
          const age = Date.now() - (cached as any).timestamp
          console.log('缓存年龄:', age, 'ms')
          console.log('缓存过期时间:', this.CACHE_DURATION, 'ms')
          console.log('是否过期:', age >= this.CACHE_DURATION)
        }
      }
      console.log('===================')
    } catch (error) {
      console.error('❌ 调试缓存数据失败:', error)
    }
  }
}

// 暴露调试方法到全局
if (typeof window !== 'undefined') {
  (window as any).debugTwitterCache = TwitterDataService.debugCacheData
}
