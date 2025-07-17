/**
 * Twitter设置服务
 * 管理Twitter相关的用户设置
 */

import { Storage } from '@plasmohq/storage'
import { APP_CONFIG } from '~src/config/config'

const storage = new Storage({ area: 'local' })

export class TwitterSettingsService {
  private static readonly AUTO_QUERY_KEY = APP_CONFIG.STORAGE_KEYS.TWITTER_AUTO_QUERY
  private static readonly SHOW_KOL_LIST_KEY = 'twitter_show_kol_list'
  private static readonly INJECTION_DELAY_KEY = 'twitter_injection_delay'
  private static readonly MAX_RETRIES_KEY = 'twitter_max_retries'

  /**
   * 获取自动查询设置
   */
  static async getAutoQueryEnabled(): Promise<boolean> {
    try {
      const enabled = await storage.get(this.AUTO_QUERY_KEY)
      
      if (enabled === null || enabled === undefined) {
        return APP_CONFIG.DEFAULTS.TWITTER_AUTO_QUERY
      }
      
      // 处理boolean值
      if (typeof enabled === 'boolean') {
        return enabled
      }
      
      // 处理字符串值（向后兼容）
      if (typeof enabled === 'string') {
        return enabled === 'true'
      }
      
      return APP_CONFIG.DEFAULTS.TWITTER_AUTO_QUERY
    } catch (error) {
      console.error('❌ 获取自动查询设置失败:', error)
      return APP_CONFIG.DEFAULTS.TWITTER_AUTO_QUERY
    }
  }

  /**
   * 设置自动查询
   */
  static async setAutoQueryEnabled(enabled: boolean): Promise<void> {
    try {
      await storage.set(this.AUTO_QUERY_KEY, enabled)
      console.log('💾 自动查询设置已保存:', enabled)
    } catch (error) {
      console.error('❌ 保存自动查询设置失败:', error)
      throw error
    }
  }

  /**
   * 获取KOL列表显示设置
   */
  static async getShowKolListEnabled(): Promise<boolean> {
    try {
      const enabled = await storage.get(this.SHOW_KOL_LIST_KEY)

      if (enabled === null || enabled === undefined) {
        return true // 默认为true
      }

      // 处理boolean值
      if (typeof enabled === 'boolean') {
        return enabled
      }

      // 处理字符串值（向后兼容）
      if (typeof enabled === 'string') {
        return enabled === 'true'
      }

      return true // 默认为true
    } catch (error) {
      console.error('❌ 获取KOL列表设置失败:', error)
      return true
    }
  }

  /**
   * 设置KOL列表显示
   */
  static async setShowKolListEnabled(enabled: boolean): Promise<void> {
    try {
      await storage.set(this.SHOW_KOL_LIST_KEY, enabled)
      console.log('💾 KOL列表设置已保存:', enabled)
    } catch (error) {
      console.error('❌ 保存KOL列表设置失败:', error)
      throw error
    }
  }

  /**
   * 获取注入延迟设置
   */
  static async getInjectionDelay(): Promise<number> {
    try {
      const delay = await storage.get(this.INJECTION_DELAY_KEY)
      return typeof delay === 'number' ? delay : 1000 // 默认1秒
    } catch (error) {
      console.error('❌ 获取注入延迟设置失败:', error)
      return 1000
    }
  }

  /**
   * 设置注入延迟
   */
  static async setInjectionDelay(delay: number): Promise<void> {
    try {
      await storage.set(this.INJECTION_DELAY_KEY, delay)
      console.log('💾 注入延迟设置已保存:', delay)
    } catch (error) {
      console.error('❌ 保存注入延迟设置失败:', error)
      throw error
    }
  }

  /**
   * 获取最大重试次数
   */
  static async getMaxRetries(): Promise<number> {
    try {
      const retries = await storage.get(this.MAX_RETRIES_KEY)
      return typeof retries === 'number' ? retries : 3 // 默认3次
    } catch (error) {
      console.error('❌ 获取最大重试次数失败:', error)
      return 3
    }
  }

  /**
   * 设置最大重试次数
   */
  static async setMaxRetries(retries: number): Promise<void> {
    try {
      await storage.set(this.MAX_RETRIES_KEY, retries)
      console.log('💾 最大重试次数已保存:', retries)
    } catch (error) {
      console.error('❌ 保存最大重试次数失败:', error)
      throw error
    }
  }

  /**
   * 获取所有设置
   */
  static async getAllSettings() {
    return {
      autoQuery: await this.getAutoQueryEnabled(),
      showKolList: await this.getShowKolListEnabled(),
      injectionDelay: await this.getInjectionDelay(),
      maxRetries: await this.getMaxRetries()
    }
  }

  /**
   * 重置所有设置为默认值
   */
  static async resetToDefaults(): Promise<void> {
    try {
      await this.setAutoQueryEnabled(APP_CONFIG.DEFAULTS.TWITTER_AUTO_QUERY)
      await this.setShowKolListEnabled(true)
      await this.setInjectionDelay(1000)
      await this.setMaxRetries(3)
      console.log('🔄 所有设置已重置为默认值')
    } catch (error) {
      console.error('❌ 重置设置失败:', error)
      throw error
    }
  }
}
