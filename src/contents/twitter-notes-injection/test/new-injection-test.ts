/**
 * 新注入系统测试文件
 * 用于验证重构后的注入功能
 */

import { TwitterNotesInjectionManager } from '../TwitterNotesInjectionManager'
import { getPageType } from '../utils/extraction.utils'
import { getInjectionStats } from '../utils/injection.utils'

/**
 * 测试新注入系统
 */
export class NewInjectionTester {
  /**
   * 运行完整测试
   */
  static async runTest() {
    console.log('🚀 开始测试新注入系统...')
    
    const results = {
      pageType: getPageType(),
      url: location.href,
      pathname: location.pathname,
      timestamp: new Date().toISOString()
    }
    
    console.log('📋 测试环境:', results)
    
    // 测试页面类型检测
    this.testPageTypeDetection()
    
    // 测试注入点查找
    this.testInjectionPoints()
    
    // 测试用户识别
    await this.testUserIdentification()
    
    console.log('✅ 新注入系统测试完成')
    return results
  }
  
  /**
   * 测试页面类型检测
   */
  static testPageTypeDetection() {
    console.log('🔍 测试页面类型检测...')
    
    const pageType = getPageType()
    console.log('📄 当前页面类型:', pageType)
    
    // 检测各种页面元素
    const elements = {
      userActions: document.querySelector('[data-testid="userActions"]'),
      grokActions: document.querySelector('[aria-label="Grok actions"]'),
      tweets: document.querySelectorAll('[data-testid="tweet"]'),
      userNames: document.querySelectorAll('[data-testid="User-Name"]')
    }
    
    console.log('🎯 页面元素检测:', {
      userActions: !!elements.userActions,
      grokActions: !!elements.grokActions,
      tweetsCount: elements.tweets.length,
      userNamesCount: elements.userNames.length
    })
  }
  
  /**
   * 测试注入点查找
   */
  static testInjectionPoints() {
    console.log('🎯 测试注入点查找...')
    
    const stats = getInjectionStats()
    console.log('📊 注入统计:', stats)
  }
  
  /**
   * 测试用户识别
   */
  static async testUserIdentification() {
    console.log('👤 测试用户识别...')
    
    const pageType = getPageType()
    
    if (pageType === 'profile') {
      // 测试用户主页识别
      const screenName = location.pathname.slice(1)
      console.log('🏠 用户主页识别:', { screenName })
    } else if (pageType === 'tweet-detail') {
      // 测试推文详情页识别
      const { extractScreenNameFromTweetUrl } = await import('../utils/extraction.utils')
      const screenName = extractScreenNameFromTweetUrl()
      console.log('📝 推文详情页识别:', { screenName })
    } else {
      // 测试推文列表识别
      const tweets = document.querySelectorAll('[data-testid="tweet"]')
      console.log('📋 推文列表识别:', { tweetsCount: tweets.length })
      
      if (tweets.length > 0) {
        const { extractScreenNameFromTweetElement } = await import('../utils/extraction.utils')
        const firstTweet = tweets[0]
        const screenName = extractScreenNameFromTweetElement(firstTweet)
        console.log('👤 第一条推文用户:', { screenName })
      }
    }
  }
  
  /**
   * 清理测试
   */
  static cleanup() {
    console.log('🧹 清理测试环境...')
    
    // 清理所有徽章
    const badges = document.querySelectorAll('.tw3track-note-badge')
    badges.forEach(badge => badge.remove())
    
    // 清理注入标记
    const injectedContainers = document.querySelectorAll('[data-tw3track-injected]')
    injectedContainers.forEach(container => {
      container.removeAttribute('data-tw3track-injected')
    })
    
    console.log('✅ 清理完成，移除了', badges.length, '个徽章')
  }
}

// 将测试工具添加到全局对象
if (typeof window !== 'undefined') {
  (window as any).newInjectionTester = NewInjectionTester
  console.log('🛠️ 新注入系统测试工具已加载，使用 newInjectionTester.runTest() 开始测试')
}
