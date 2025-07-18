/**
 * Twitter数据显示管理器
 * 负责管理Twitter页面的数据注入、DOM观察和消息处理
 */

import type {
  TwitterDataDisplayConfig,
  InjectionTarget
} from '~src/types/twitter-display.types'
import type { TwitterJsonLD } from '~src/types/twitter-data.types'
import { APP_CONFIG } from '~src/config/config'
import { TwitterSettingsService } from './services/twitter-settings.service'
import { TwitterInjectionService } from './services/twitter-injection.service'

/**
 * 检查是否为有效的Twitter用户页面
 * 基于实际的注入目标进行检查
 */
function isValidPageForTwitterDisplay(): boolean {
  // 检查URL是否为Twitter用户页面
  const urlPattern = /^https:\/\/(x|twitter)\.com\/[^\/]+\/?$/
  const isUserPage = urlPattern.test(window.location.href)

  if (!isUserPage) {
    return false
  }

  // 检查关键元素是否存在（按优先级顺序）
  const keyElements = [
    '[data-testid="UserName"]',           // 最可靠，每个用户页面都有
    '[data-testid="userActions"]',        // 用户操作按钮，很稳定
    '[data-testid="UserProfileHeader_Items"]', // 用户资料头部信息
    '[data-testid="UserJoinDate"]',       // 加入日期
  ]

  // 检查哪些关键元素存在
  const availableElements = keyElements.filter(selector =>
    !!document.querySelector(selector)
  )

  // 分别检查高优先级元素
  const hasUserName = !!document.querySelector('[data-testid="UserName"]')
  const hasUserActions = !!document.querySelector('[data-testid="userActions"]')

  // 判断页面是否有效：
  // 1. 最好有UserName或userActions（高优先级）
  // 2. 或者至少有2个其他关键元素
  const isValidPage = (hasUserName || hasUserActions) || (availableElements.length >= 2)

  console.log('🔍 Twitter用户页面检测:', {
    url: window.location.href,
    isUserPage,
    hasUserName,
    hasUserActions,
    availableElements: availableElements.length,
    foundElements: availableElements,
    result: isValidPage
  })

  return isValidPage
}

export class TwitterDataDisplayManager {
  private static instance: TwitterDataDisplayManager | null = null
  private isInitialized = false

  private observer: MutationObserver | null = null
  private injectionLock: Map<string, boolean> = new Map() // 注入锁
  private injectedRestIds: Set<string> = new Set() // 已注入的restId
  private currentRestId: string | null = null // 当前页面的restId
  private lastUrl: string = ''
  private autoQueryEnabled: boolean = true
  private showKolListEnabled: boolean = true
  private debounceTimer: NodeJS.Timeout | null = null
  private healthCheckTimer: NodeJS.Timeout | null = null

  // 配置
  private config: TwitterDataDisplayConfig = {
    autoQueryEnabled: true,
    showKolList: true,
    maxRetries: 3,
    injectionDelay: 300, // 减少注入延迟从1000ms到300ms
    debounceDelay: 200,  // 减少防抖延迟从500ms到200ms
    cacheExpiry: APP_CONFIG.TWITTER_CACHE.EXPIRY_TIME
  }

  // 注入目标配置（按优先级排序，优化后更稳定）
  private injectionTargets: InjectionTarget[] = [
    // 新增：使用稳定的 userActions 作为主要注入点
    {
      name: 'UserName',
      selector: '[data-testid="UserName"]',
      findContainer: (element: Element) => {
        // 简化容器查找，减少嵌套层级依赖
        return element.parentElement?.parentElement || element.parentElement;
      },
      insertPosition: 'after',
      priority: 1
    },
    {
      name: 'UserActions',
      selector: '[data-testid="userActions"]',
      findContainer: (element: Element) => element.parentElement,
      insertPosition: 'after',
      priority: 2
    },
    {
      name: 'UserDescription',
      selector: '[data-testid="UserDescription"]',
      findContainer: (element: Element) => {
        // 更稳定的容器查找逻辑
        const container = element.closest('[data-testid="UserDescription"]')?.parentElement;
        return container || element.parentElement;
      },
      insertPosition: 'after',
      priority: 3
    },
    {
      name: 'UserProfileHeader_Items',
      selector: '[data-testid="UserProfileHeader_Items"]',
      findContainer: (element: Element) => {
        // 更稳定的容器查找逻辑
        const container = element.closest('[data-testid="UserProfileHeader_Items"]')?.parentElement;
        return container || element.parentElement;
      },
      insertPosition: 'after',
      priority: 4
    },
    {
      name: 'UserJoinDate',
      selector: '[data-testid="UserJoinDate"]',
      findContainer: (element: Element) => {
        // 简化容器查找，减少依赖动态CSS类
        return element.parentElement?.parentElement || element.parentElement;
      },
      insertPosition: 'after',
      priority: 5
    },
    {
      name: 'FollowersSection',
      selector: 'a[href*="/verified_followers"], a[href*="/followers"]',
      findContainer: (element: Element) => {
        // 简化容器查找
        return element.parentElement?.parentElement || element.parentElement;
      },
      insertPosition: 'after',
      priority: 6
    },
  ]

  private constructor() {
    // 私有构造函数，防止直接实例化
  }

  /**
   * 获取单例实例
   */
  static getInstance(): TwitterDataDisplayManager {
    if (!this.instance) {
      this.instance = new TwitterDataDisplayManager()
    }
    return this.instance
  }

  /**
   * 初始化管理器（静态方法）
   */
  static async initialize(): Promise<void> {
    const manager = this.getInstance()
    if (!manager.isInitialized) {
      await manager.init()
    }
  }

  /**
   * 销毁管理器（静态方法）
   */
  static destroy(): void {
    if (this.instance) {
      this.instance.cleanup()
      this.instance = null
    }
  }

  /**
   * 初始化管理器
   */
  private async init() {
    try {
      console.log('🚀 Twitter数据显示管理器初始化开始')

      // 使用重试机制检查页面
      const maxRetries = 5
      let retryCount = 0

      const tryInitialize = async (): Promise<boolean> => {
        retryCount++
        console.log(`🔄 尝试初始化Twitter数据显示 (${retryCount}/${maxRetries})`)

        // 检查是否为有效页面
        if (!isValidPageForTwitterDisplay()) {
          if (retryCount < maxRetries) {
            console.log('📍 页面还未完全加载，稍后重试...')
            setTimeout(() => tryInitialize(), 1000)
            return false
          } else {
            console.log('📍 当前页面不适合Twitter数据显示，跳过初始化')
            return false
          }
        }

        // 检查注入目标是否可用
        if (!this.checkInjectionTargetsAvailability()) {
          if (retryCount < maxRetries) {
            console.log('🎯 注入目标未准备好，稍后重试...')
            setTimeout(() => tryInitialize(), 1000)
            return false
          } else {
            console.log('🎯 注入目标检查超时，跳过初始化')
            return false
          }
        }

        console.log('📍 页面和注入目标都已准备好，开始初始化')

        // 获取设置
        await this.loadSettings()

        // 注入样式
        this.injectStyles()

        // 设置观察器
        this.setupObserver()

        // 设置消息监听
        this.setupMessageListener()

        // 启动健康检查
        this.startHealthCheck()

        // 初始检查
        setTimeout(() => this.checkAndInject(), this.config.injectionDelay)

        // 添加调试工具
        this.setupDebugTools()

        this.isInitialized = true
        console.log('✅ Twitter数据显示管理器初始化完成')
        return true
      }

      await tryInitialize()
    } catch (error) {
      console.error('❌ Twitter数据显示管理器初始化失败:', error)
    }
  }

  /**
   * 检查注入目标可用性（基于实际注入目标列表）
   */
  private checkInjectionTargetsAvailability(): boolean {
    console.log('🎯 检查注入目标可用性...')

    const availableTargets = this.injectionTargets.filter(target => {
      const element = document.querySelector(target.selector)
      const available = !!element
      console.log(`- ${target.name}: ${available ? '✅' : '❌'}`)
      return available
    })

    const hasHighPriorityTargets = availableTargets.some(target =>
      target.priority <= 2 // UserName 或 UserActions
    )

    if (availableTargets.length === 0) {
      console.log('❌ 没有可用的注入目标')
      return false
    }

    if (!hasHighPriorityTargets) {
      console.log('⚠️ 缺少高优先级注入目标，可能页面还未完全加载')
      return false
    }

    console.log(`✅ 找到 ${availableTargets.length} 个可用注入目标，包含高优先级目标`)
    return true
  }

  /**
   * 设置调试工具
   */
  private setupDebugTools() {
    // 添加全局调试函数
    (window as any).tw3trackStatsDebug = {
      manager: this,
      getStatus: () => ({
        autoQueryEnabled: this.autoQueryEnabled,
        showKolListEnabled: this.showKolListEnabled,
        currentRestId: this.currentRestId,
        injectedRestIds: Array.from(this.injectedRestIds),
        injectionLock: Object.fromEntries(this.injectionLock),
        lastUrl: this.lastUrl,
        config: this.config
      }),
      forceInject: () => {
        console.log('🔧 强制执行注入...')
        this.checkAndInject()
      },
      clearCards: () => {
        console.log('🧹 清理所有卡片...')
        this.clearInjectedCards()
      },
      testInjectionTargets: () => {
        console.log('🎯 测试注入目标:')
        this.injectionTargets.forEach(target => {
          const element = document.querySelector(target.selector)
          console.log(`- ${target.name}: ${element ? '✅ 存在' : '❌ 不存在'}`)
          if (element) {
            const container = target.findContainer(element)
            console.log(`  容器: ${container ? '✅ 找到' : '❌ 未找到'}`)
          }
        })
      },
      extractRestId: () => {
        const restId = this.extractRestId()
        console.log('🔑 提取的 restId:', restId)
        return restId
      }
    }

    console.log('🔧 调试工具已添加到 window.tw3trackStatsDebug')
  }

  /**
   * 加载设置
   */
  private async loadSettings() {
    try {
      const settings = await TwitterSettingsService.getAllSettings()
      
      this.autoQueryEnabled = settings.autoQuery
      this.showKolListEnabled = settings.showKolList
      this.config.injectionDelay = settings.injectionDelay
      this.config.maxRetries = settings.maxRetries
      
      console.log('🔧 设置加载完成:', settings)
    } catch (error) {
      console.error('❌ 加载设置失败:', error)
    }
  }

  /**
   * 检查并注入
   */
  private async checkAndInject() {
    try {
      console.log('🔍 开始检查注入条件...')

      // 检查自动查询是否启用
      if (!this.autoQueryEnabled) {
        console.log('⏸️ 自动查询已禁用，跳过注入')
        return
      }

      // 检查是否在用户资料页面
      const isProfilePage = this.isUserProfilePage()
      console.log('📄 页面类型检查:', isProfilePage ? '✅ 用户资料页面' : '❌ 非用户资料页面')
      if (!isProfilePage) {
        return
      }

      // 检查是否有基本的用户资料元素
      const userNameElement = document.querySelector('[data-testid="UserName"]')
      const userHeaderElement = document.querySelector('[data-testid="UserProfileHeader_Items"]')
      const userJoinDateElement = document.querySelector('[data-testid="UserJoinDate"]')
      const userActionsElement = document.querySelector('[data-testid="userActions"]')

      console.log('🔍 用户资料元素检查:')
      console.log('- UserName:', userNameElement ? '✅' : '❌')
      console.log('- UserProfileHeader_Items:', userHeaderElement ? '✅' : '❌')
      console.log('- UserJoinDate:', userJoinDateElement ? '✅' : '❌')
      console.log('- userActions:', userActionsElement ? '✅' : '❌')

      const hasUserProfile = userNameElement || userHeaderElement || userJoinDateElement || userActionsElement

      if (!hasUserProfile) {
        console.log('❌ 未找到任何用户资料元素，可能页面未完全加载')
        return
      }

      // 提取用户rest_id
      console.log('🔑 开始提取用户ID...')
      const restId = this.extractRestId()
      if (!restId) {
        console.log('❌ 无法提取用户ID，可能需要等待页面完全加载')
        // 如果有用户资料元素但无法提取restId，延迟重试
        setTimeout(() => this.checkAndInject(), 2000)
        return
      }
      console.log('✅ 成功提取用户ID:', restId)

      // 检查注入锁
      if (this.injectionLock.get(restId)) {
        console.log('🔒 注入正在进行中，跳过:', restId)
        return
      }

      // 严格检查是否已注入
      if (this.isAlreadyInjected(restId)) {
        console.log('✅ 卡片已存在，跳过注入:', restId)
        return
      }

      // 检查注入目标可用性
      console.log('🎯 检查注入目标可用性...')
      const availableTargets = this.injectionTargets.filter(target => {
        const element = document.querySelector(target.selector)
        const available = !!element
        console.log(`- ${target.name}: ${available ? '✅' : '❌'}`)
        return available
      })

      if (availableTargets.length === 0) {
        console.log('❌ 没有可用的注入目标，延迟重试')
        setTimeout(() => this.checkAndInject(), 2000)
        return
      }

      console.log(`✅ 找到 ${availableTargets.length} 个可用注入目标`)

      // 执行注入
      await this.performInjection(restId)
    } catch (error) {
      console.error('❌ 检查和注入过程出错:', error)
      console.error('错误堆栈:', error.stack)
    }
  }

  /**
   * 检查是否已注入
   */
  private isAlreadyInjected(restId: string): boolean {
    // 检查DOM中是否存在卡片
    const hasStatsCard = document.querySelector('.tw3track-stats-card') !== null
    const hasKolCard = document.querySelector('.tw3track-kol-card') !== null
    const hasAnyCard = hasStatsCard || hasKolCard

    // 检查状态记录
    const hasRestId = this.injectedRestIds.has(restId)
    const isCurrent = this.currentRestId === restId

    // 如果状态记录显示已注入，但DOM中没有卡片，说明卡片被移除了，需要清理状态
    if (hasRestId && isCurrent && !hasAnyCard) {
      console.log('🧹 检测到卡片丢失，清理注入状态:', restId)
      this.injectedRestIds.delete(restId)
      this.currentRestId = null
      return false
    }

    // 只有当DOM中有卡片且状态记录正确时，才认为已注入
    const isInjected = hasRestId && isCurrent && hasAnyCard

    if (isInjected) {
      console.log('🔍 注入状态检查通过:', { hasRestId, isCurrent, hasStatsCard, hasKolCard })
    } else if (!hasAnyCard && (hasRestId || isCurrent)) {
      console.log('🔍 卡片不存在，需要重新注入:', { hasRestId, isCurrent, hasStatsCard, hasKolCard })
    }

    return isInjected
  }

  /**
   * 执行注入
   */
  private async performInjection(restId: string) {
    // 设置注入锁
    this.injectionLock.set(restId, true)
    
    try {
      console.log('🚀 开始注入卡片:', restId)
      
      // 使用注入服务执行注入
      const success = await TwitterInjectionService.injectCards(
        restId, 
        this.injectionTargets,
        this.showKolListEnabled
      )
      
      if (success) {
        // 记录成功注入
        this.injectedRestIds.add(restId)
        this.currentRestId = restId
        console.log('✅ 卡片注入成功:', restId)
      } else {
        console.log('❌ 卡片注入失败，尝试重试机制')
        this.retryInjection(restId)
      }
    } finally {
      // 释放注入锁
      this.injectionLock.delete(restId)
    }
  }

  /**
   * 重试注入
   */
  private retryInjection(restId: string, attempt: number = 1) {
    if (attempt > this.config.maxRetries) {
      console.log(`❌ 注入重试次数已达上限 (${this.config.maxRetries})`)
      return
    }
    
    console.log(`🔄 注入重试 ${attempt}/${this.config.maxRetries}`)
    
    setTimeout(() => {
      if (!this.isAlreadyInjected(restId)) {
        this.performInjection(restId).catch(() => {
          this.retryInjection(restId, attempt + 1)
        })
      }
    }, 1000 * attempt) // 递增延迟
  }

  /**
   * 检查是否为用户资料页面
   */
  private isUserProfilePage(): boolean {
    const pathname = location.pathname
    const hostname = location.hostname

    // 排除非支持的域名
    if (!hostname.includes('x.com') && !hostname.includes('twitter.com')) {
      console.log('❌ 不支持的域名:', hostname)
      return false
    }

    // 排除主页面（根路径）
    if (pathname === '/' || pathname === '') {
      console.log('❌ 排除主页面:', pathname)
      return false
    }

    // 排除推文详情页面（交给钱包备注注入模块处理）
    const isTweetDetailPage = /^\/[^\/]+\/status\/\d+/.test(pathname)
    if (isTweetDetailPage) {
      console.log('❌ 排除推文详情页面（由钱包备注注入模块处理）:', pathname)
      return false
    }

    // 检查URL模式：/username 或 /username/ 或 /username/子页面
    // 支持子页面：with_replies, highlights, media, articles
    const isProfilePattern = /^\/[^\/]+(?:\/(with_replies|highlights|media|articles))?(?:\/)?$/.test(pathname)

    // 排除特殊页面
    const excludePatterns = [
      '/home', '/explore', '/notifications', '/messages',
      '/bookmarks', '/lists', '/profile', '/settings',
      '/i/', '/search', '/compose', '/login', '/signup',
      '/tos', '/privacy', '/rules', '/help'
    ]

    const isExcluded = excludePatterns.some(pattern => pathname.startsWith(pattern))

    const result = isProfilePattern && !isExcluded
    console.log('� 页面检查:', {
      hostname,
      pathname,
      isProfilePattern,
      isExcluded,
      isTweetDetailPage,
      result
    })

    return result
  }

  /**
   * 提取用户rest_id
   */
  private extractRestId(): string | null {
    try {
      // 查找JSON-LD脚本
      const jsonLDScripts = document.querySelectorAll('script[type="application/ld+json"]')
      
      for (const script of jsonLDScripts) {
        try {
          const data: TwitterJsonLD = JSON.parse(script.textContent || '')
          
          if (data['@type'] === 'ProfilePage' && 
              data.mainEntity && 
              data.mainEntity.identifier) {
            console.log('✅ 提取到用户ID:', data.mainEntity.identifier)
            return data.mainEntity.identifier
          }
        } catch (parseError) {
          console.warn('⚠️ JSON-LD解析失败:', parseError)
          continue
        }
      }
      
      console.log('❌ 未找到有效的JSON-LD数据')
      return null
    } catch (error) {
      console.error('❌ 提取用户ID时出错:', error)
      return null
    }
  }

  /**
   * 注入样式
   */
  private injectStyles() {
    if (document.getElementById('tw3track-twitter-styles')) return
    
    const style = document.createElement('style')
    style.id = 'tw3track-twitter-styles'
    style.textContent = `
      .tw3track-stats-card {
        margin: 10px 0;
        z-index: 1000;
      }
      
      .tw3track-kol-card {
        margin: 10px 0;
        z-index: 1000;
      }
      
      .tw3track-stats-card:hover,
      .tw3track-kol-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
      }
      
      @keyframes tw3track-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes tw3track-slideDown {
        0% { 
          opacity: 0; 
          transform: translateY(-10px); 
          max-height: 0; 
        }
        100% { 
          opacity: 1; 
          transform: translateY(0); 
          max-height: 500px; 
        }
      }
      
      @keyframes tw3track-slideUp {
        0% { 
          opacity: 1; 
          transform: translateY(0); 
          max-height: 500px; 
        }
        100% { 
          opacity: 0; 
          transform: translateY(-10px); 
          max-height: 0; 
        }
      }
      
      .tw3track-refresh-btn:hover,
      .tw3track-toggle-btn:hover,
      .tw3track-history-btn:hover {
        background-color: rgba(59, 130, 246, 0.1) !important;
      }

      /* KOL卡片滚动条样式 */
      .tw3track-kol-card ::-webkit-scrollbar {
        width: 6px;
      }

      .tw3track-kol-card ::-webkit-scrollbar-track {
        background: transparent;
      }

      .tw3track-kol-card ::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.5);
        border-radius: 3px;
      }

      .tw3track-kol-card ::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.8);
      }

      /* 暗色模式下的滚动条 */
      [data-theme="dark"] .tw3track-kol-card ::-webkit-scrollbar-thumb,
      .dark .tw3track-kol-card ::-webkit-scrollbar-thumb {
        background: rgba(113, 113, 122, 0.5);
      }

      [data-theme="dark"] .tw3track-kol-card ::-webkit-scrollbar-thumb:hover,
      .dark .tw3track-kol-card ::-webkit-scrollbar-thumb:hover {
        background: rgba(113, 113, 122, 0.8);
      }
    `
    document.head.appendChild(style)
  }

  /**
   * 清理注入的卡片
   */
  private clearInjectedCards() {
    try {
      const cleanedCount = TwitterInjectionService.cleanupInjectedElements()

      // 清理状态
      this.injectedRestIds.clear()
      this.currentRestId = null

      // 清理注入锁
      this.injectionLock.clear()

      if (cleanedCount > 0) {
        console.log(`🧹 已清理 ${cleanedCount} 个注入元素`)
      }
    } catch (error) {
      console.error('❌ 清理卡片时出错:', error)
    }
  }

  /**
   * 仅移除KOL卡片
   */
  private removeKolCards() {
    try {
      const kolCards = document.querySelectorAll('.tw3track-kol-card')
      let removedCount = 0

      kolCards.forEach(card => {
        card.remove()
        removedCount++
      })

      if (removedCount > 0) {
        console.log(`🧹 已移除 ${removedCount} 个KOL卡片`)
      }
    } catch (error) {
      console.error('❌ 移除KOL卡片时出错:', error)
    }
  }

  /**
   * 设置DOM观察器
   */
  private setupObserver() {
    // 合并关键元素和注入目标选择器
    const keyElements = [
      '[data-testid="UserName"]',
      '[data-testid="userActions"]',
      '[data-testid="UserProfileHeader_Items"]',
      '[data-testid="UserJoinDate"]',
    ]

    const injectionSelectors = [
      ...keyElements,  // 使用keyElements
      '[data-testid="UserDescription"]',
      'a[href*="/verified_followers"]',
      'a[href*="/followers"]'
    ]

    this.observer = new MutationObserver((mutations) => {
      // 只处理与关键元素和注入目标相关的变化
      const hasRelevantChanges = mutations.some(mutation => {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes)
          const removedNodes = Array.from(mutation.removedNodes)

          // 检查新增节点是否包含关键元素
          const hasRelevantAdditions = addedNodes.some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element

              // 检查是否包含任何关键元素或注入目标
              return injectionSelectors.some(selector => {
                return element.querySelector(selector) || element.matches(selector)
              })
            }
            return false
          })

          // 检查移除的节点是否包含我们的卡片
          const hasCardRemoved = removedNodes.some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              return element.classList.contains('tw3track-stats-card') ||
                     element.classList.contains('tw3track-kol-card') ||
                     element.querySelector('.tw3track-stats-card') ||
                     element.querySelector('.tw3track-kol-card')
            }
            return false
          })

          return hasRelevantAdditions || hasCardRemoved
        }
        return false
      })

      if (!hasRelevantChanges) {
        return
      }

      // 防抖处理，避免频繁触发
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }

      this.debounceTimer = setTimeout(() => {
        this.handleMutations(mutations)
      }, this.config.debounceDelay)
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    console.log('👀 DOM观察器设置完成（基于关键元素和注入目标优化）')
  }

  /**
   * 处理DOM变化
   */
  private handleMutations(mutations: MutationRecord[]) {
    let shouldCheck = false

    // 检查URL变化
    if (this.lastUrl !== location.href) {
      console.log('🔄 URL变化:', this.lastUrl, '->', location.href)
      this.lastUrl = location.href
      this.handleUrlChange()
      shouldCheck = true
    }

    // 检查是否有卡片被移除
    if (!shouldCheck) {
      const hasCardRemoved = mutations.some(mutation =>
        mutation.type === 'childList' &&
        Array.from(mutation.removedNodes).some(node =>
          node.nodeType === Node.ELEMENT_NODE &&
          ((node as Element).classList.contains('tw3track-stats-card') ||
           (node as Element).classList.contains('tw3track-kol-card') ||
           (node as Element).querySelector('.tw3track-stats-card') ||
           (node as Element).querySelector('.tw3track-kol-card'))
        )
      )

      if (hasCardRemoved) {
        console.log('🔄 检测到卡片被移除，需要重新检查注入状态')
        shouldCheck = true
      }
    }

    // 检查DOM变化（只在特定条件下）
    if (!shouldCheck) {
      const hasRelevantChanges = mutations.some(mutation =>
        mutation.type === 'childList' &&
        Array.from(mutation.addedNodes).some(node =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).querySelector('[data-testid*="User"]')
        )
      )

      if (hasRelevantChanges) {
        console.log('🔄 检测到相关DOM变化')
        shouldCheck = true
      }
    }

    if (shouldCheck) {
      // 延迟检查，等待页面稳定
      setTimeout(() => this.checkAndInject(), this.config.injectionDelay)
    }
  }

  /**
   * 处理URL变化
   */
  private handleUrlChange() {
    const newRestId = this.extractRestId()

    if (newRestId !== this.currentRestId) {
      console.log('🔄 用户页面变化:', this.currentRestId, '->', newRestId)

      // 清理旧的注入
      this.clearInjectedCards()

      // 重置状态
      this.currentRestId = null
      this.injectedRestIds.clear()
    }
  }

  /**
   * 设置消息监听
   */
  private setupMessageListener() {
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
      // 处理旧格式的消息（TWITTER_SETTINGS_CHANGED）
      if (message.type === 'TWITTER_SETTINGS_CHANGED') {
        const { settingType, enabled } = message.payload

        if (settingType === 'auto-query') {
          this.autoQueryEnabled = enabled
          console.log('🔄 自动查询设置已更新:', enabled)

          if (!enabled) {
            this.clearInjectedCards()
          } else {
            // 延迟一点再检查注入，确保页面稳定
            setTimeout(() => this.checkAndInject(), 500)
          }
        } else if (settingType === 'kol-list') {
          this.showKolListEnabled = enabled
          console.log('🔄 KOL列表设置已更新:', enabled)

          if (enabled) {
            // 开启KOL列表：如果自动查询也开启，则重新注入
            if (this.autoQueryEnabled) {
              console.log('🔄 重新注入卡片以显示KOL列表')
              setTimeout(() => this.checkAndInject(), 500)
            }
          } else {
            // 关闭KOL列表：只移除KOL卡片，保留统计卡片
            this.removeKolCards()
          }
        }

        sendResponse({ success: true })
      }
      // 处理新格式的消息（直接的消息类型）
      else if (message.type === 'TWITTER_AUTO_QUERY_CHANGED') {
        this.autoQueryEnabled = message.enabled
        console.log('🔄 自动查询设置已更新:', message.enabled)

        if (!message.enabled) {
          this.clearInjectedCards()
        } else {
          setTimeout(() => this.checkAndInject(), 500)
        }

        sendResponse({ success: true })
      }
      else if (message.type === 'TWITTER_KOL_SETTING_CHANGED') {
        this.showKolListEnabled = message.enabled
        console.log('🔄 KOL列表设置已更新:', message.enabled)

        if (message.enabled) {
          // 开启KOL列表：如果自动查询也开启，则重新注入
          if (this.autoQueryEnabled) {
            console.log('🔄 重新注入卡片以显示KOL列表')
            setTimeout(() => this.checkAndInject(), 500)
          }
        } else {
          // 关闭KOL列表：只移除KOL卡片，保留统计卡片
          this.removeKolCards()
        }

        sendResponse({ success: true })
      }
    })
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck() {
    // 每30秒检查一次卡片是否还存在
    this.healthCheckTimer = setInterval(() => {
      if (this.autoQueryEnabled && this.currentRestId) {
        const hasStatsCard = document.querySelector('.tw3track-stats-card') !== null
        const hasKolCard = document.querySelector('.tw3track-kol-card') !== null
        const shouldHaveKolCard = this.showKolListEnabled

        // 如果应该有卡片但没有，或者KOL卡片状态不对，则重新注入
        if (!hasStatsCard || (shouldHaveKolCard && !hasKolCard)) {
          console.log('🔄 健康检查发现卡片丢失，重新注入:', {
            hasStatsCard,
            hasKolCard,
            shouldHaveKolCard,
            currentRestId: this.currentRestId
          })
          this.checkAndInject()
        }
      }
    }, 5000) // 30秒检查一次
  }

  /**
   * 清理资源
   */
  public cleanup() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = null
    }

    this.clearInjectedCards()
    console.log('🧹 Twitter数据显示管理器已清理')
  }
}
