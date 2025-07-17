/**
 * Twitter备注注入功能调试工具
 * 用于测试和调试注入功能
 */

import { TwitterNotesInjectionManager } from '../TwitterNotesInjectionManager'
import { TwitterNotesInjectionService } from '../services/twitter-notes-injection.service'
import { TwitterNotesDataService } from '../services/twitter-notes-data.service'
import { getPageType, isSupportedPage } from '../utils/extraction.utils'
import { getInjectionStats } from '../utils/injection.utils'

/**
 * 调试工具类
 */
export class TwitterNotesDebugger {
  /**
   * 获取当前页面状态
   */
  static getPageStatus() {
    return {
      url: location.href,
      pathname: location.pathname,
      pageType: getPageType(),
      isSupported: isSupportedPage(),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 获取注入统计
   */
  static getInjectionStats() {
    return getInjectionStats()
  }

  /**
   * 获取缓存统计
   */
  static async getCacheStats() {
    return await TwitterNotesDataService.getCacheStats()
  }

  /**
   * 测试用户识别
   */
  static async testUserIdentification() {
    try {
      const pageType = getPageType()
      console.log('🔍 页面类型:', pageType)

      if (pageType === 'profile') {
        const userInfo = await TwitterNotesInjectionService.extractProfileUserInfo()
        console.log('👤 用户主页信息:', userInfo)
        return userInfo
      } else {
        const userNameElements = document.querySelectorAll('[data-testid="User-Name"]')
        console.log('📊 找到推文用户名元素:', userNameElements.length, '个')
        
        const localNotes = await TwitterNotesDataService.getLocalTwitterNotes()
        console.log('📦 本地备注数据:', localNotes.length, '条')

        const results = []
        for (let i = 0; i < Math.min(userNameElements.length, 3); i++) {
          const element = userNameElements[i]
          const userInfo = await TwitterNotesInjectionService.extractTweetUserInfo(element, localNotes)
          if (userInfo) {
            results.push(userInfo)
            console.log(`👤 推文用户信息 ${i + 1}:`, userInfo)
          }
        }
        
        return results
      }
    } catch (error) {
      console.error('❌ 测试用户识别失败:', error)
      return null
    }
  }

  /**
   * 测试数据服务
   */
  static async testDataService() {
    try {
      console.log('🔄 测试数据服务...')
      
      const localNotes = await TwitterNotesDataService.getLocalTwitterNotes()
      console.log('📦 本地备注数据:', localNotes.length, '条')
      
      if (localNotes.length > 0) {
        console.log('📝 备注示例:', localNotes[0])
      }
      
      const cacheStats = await TwitterNotesDataService.getCacheStats()
      console.log('📊 缓存统计:', cacheStats)
      
      return {
        localNotesCount: localNotes.length,
        cacheStats,
        sampleNote: localNotes[0] || null
      }
    } catch (error) {
      console.error('❌ 测试数据服务失败:', error)
      return null
    }
  }

  /**
   * 运行完整测试
   */
  static async runFullTest() {
    console.log('🚀 开始完整测试...')
    
    const results = {
      pageStatus: this.getPageStatus(),
      injectionStats: this.getInjectionStats(),
      cacheStats: await this.getCacheStats(),
      userIdentification: await this.testUserIdentification(),
      dataService: await this.testDataService()
    }
    
    console.log('📋 完整测试结果:', results)
    return results
  }

  /**
   * 清理所有徽章
   */
  static clearAllBadges() {
    const badges = document.querySelectorAll('.tw3track-note-badge')
    badges.forEach(badge => badge.remove())
    console.log('🧹 已清理', badges.length, '个徽章')
    return badges.length
  }

  /**
   * 强制重新注入
   */
  static forceReinject() {
    // 清理现有徽章
    this.clearAllBadges()
    
    // 触发重新注入
    if ((window as any).tw3trackNotesInjection) {
      (window as any).tw3trackNotesInjection.reinitialize()
      console.log('🔄 已触发重新注入')
    } else {
      console.warn('⚠️ 注入管理器未找到')
    }
  }

  /**
   * 获取管理器状态
   */
  static getManagerStatus() {
    if ((window as any).tw3trackNotesInjection) {
      return (window as any).tw3trackNotesInjection.getStatus()
    } else {
      return null
    }
  }
}

// 将调试工具添加到全局对象
if (typeof window !== 'undefined') {
  (window as any).tw3trackNotesDebugger = TwitterNotesDebugger
  console.log('🛠️ Twitter备注调试工具已加载，使用 tw3trackNotesDebugger 访问')
}
