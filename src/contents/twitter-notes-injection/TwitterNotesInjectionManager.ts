/**
 * Twitter备注注入管理器
 * 负责管理Twitter页面的备注徽章注入、DOM观察和消息处理
 */

import type {
  TwitterNotesInjectionConfig,
  TwitterNotesMessage
} from './types/twitter-notes-injection.types'
import type { TwitterNote } from '~src/types/twitter-notes.types'
import { APP_CONFIG } from '~src/config/config'
import { TwitterNotesDataService } from './services/twitter-notes-data.service'
import {
  getPageType,
  getDetailedPageType,
  isSupportedPage
} from './utils/extraction.utils'
import { clearInjectedBadges, validateInjectionEnvironment } from './utils/injection.utils'
import { TwitterNotesBadge } from './components/badges/TwitterNotesBadge'

export class TwitterNotesInjectionManager {
  private observer: MutationObserver | null = null
  private injectionLock: Map<string, boolean> = new Map()
  private injectedBadges: Set<string> = new Set()
  private currentRestId: string | null = null
  private lastUrl: string = ''
  private debounceTimer: NodeJS.Timeout | null = null
  private healthCheckTimer: NodeJS.Timeout | null = null
  private localNotes: TwitterNote[] = []

  // 配置
  private config: TwitterNotesInjectionConfig = {
    enabled: true,
    maxRetries: 3,
    injectionDelay: 1000,
    debounceDelay: 500,
    cacheExpiry: APP_CONFIG.TWITTER_CACHE.EXPIRY_TIME
  }



  constructor() {
    this.init()
  }

  /**
   * 初始化管理器
   */
  private async init() {
    try {
      console.log('🚀 Twitter备注注入管理器初始化开始')
      
      // 验证注入环境
      if (!validateInjectionEnvironment()) {
        console.error('❌ 注入环境验证失败')
        return
      }

      // 加载本地备注数据
      await this.loadLocalNotes()
      
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

      console.log('✅ Twitter备注注入管理器初始化完成')
    } catch (error) {
      console.error('❌ Twitter备注注入管理器初始化失败:', error)
    }
  }

  /**
   * 加载本地备注数据
   */
  private async loadLocalNotes() {
    try {
      this.localNotes = await TwitterNotesDataService.getLocalTwitterNotes()
      console.log('📦 加载本地备注数据:', this.localNotes.length, '条')
    } catch (error) {
      console.error('❌ 加载本地备注数据失败:', error)
      this.localNotes = []
    }
  }

  /**
   * 检查并注入
   */
  private async checkAndInject() {
    try {
      // 检查功能是否启用
      if (!this.config.enabled) {
        console.log('⏸️ 备注注入功能已禁用，跳过注入')
        return
      }

      // 检查是否在支持的页面
      if (!isSupportedPage()) {
        console.log('❌ 不是支持的页面')
        return
      }

      const pageInfo = getDetailedPageType()
      console.log('🔍 检查页面信息:', pageInfo, '路径:', location.pathname)

      // 根据页面类型执行不同的注入策略
      switch (pageInfo.pageType) {
        case 'profile':
          await this.handleProfilePage()
          break
        case 'tweet-detail':
          await this.handleTweetDetailPage()
          break
        case 'home':
        case 'search':
        case 'other':
          await this.handleTweetListPage()
          break
        default:
          console.log('❌ 不支持的页面类型:', pageInfo.pageType)
      }
    } catch (error) {
      console.error('❌ 检查并注入时出错:', error)
    }
  }

  /**
   * 处理用户主页
   */
  private async handleProfilePage() {
    try {
      console.log('📍 处理用户主页')

      // 从URL提取用户信息
      const screenName = location.pathname.slice(1) // 去掉开头的 /
      if (!screenName) {
        console.log('❌ 无法从URL提取用户名')
        return
      }

      // 查找本地备注
      const existingNote = this.localNotes.find(note =>
        note.screen_name?.toLowerCase() === screenName.toLowerCase()
      )

      // 不管有没有备注都要注入按钮
      await this.injectUserActionsBadge(existingNote, screenName)

      // 处理用户主页的推文列表
      await this.handleTweetListPage()
    } catch (error) {
      console.error('❌ 处理用户主页时出错:', error)
    }
  }

  /**
   * 处理推文详情页面
   */
  private async handleTweetDetailPage() {
    try {
      console.log('📍 处理推文详情页面')

      // 1. 处理主推文
      const { extractScreenNameFromTweetUrl } = await import('./utils/extraction.utils')
      const mainScreenName = extractScreenNameFromTweetUrl()

      if (mainScreenName) {
        const mainNote = this.localNotes.find(note =>
          note.screen_name?.toLowerCase() === mainScreenName.toLowerCase()
        )

        if (mainNote) {
          await this.injectGrokActionsBadge(mainNote, mainScreenName)
        }
      }

      // 2. 处理页面中的所有推文（包括评论）
      await this.handleAllTweetsInPage()

    } catch (error) {
      console.error('❌ 处理推文详情页面时出错:', error)
    }
  }

  /**
   * 处理包含推文列表的页面
   */
  private async handleTweetListPage() {
    try {
      console.log('📍 处理推文列表页面')

      // 查找所有推文容器
      const tweetElements = document.querySelectorAll('[data-testid="tweet"]')
      console.log(`📊 找到 ${tweetElements.length} 个推文容器`)

      for (const tweetElement of Array.from(tweetElements)) {
        try {
          // 从推文元素提取用户信息
          const { extractScreenNameFromTweetElement } = await import('./utils/extraction.utils')
          const screenName = extractScreenNameFromTweetElement(tweetElement)

          if (!screenName) {
            continue
          }

          // 查找本地备注（更严格的匹配）
          const existingNote = this.findMatchingNote(screenName)

          if (!existingNote) {
            console.log('📝 未找到匹配的备注，跳过注入:', screenName)
            continue // 没有备注的用户不显示
          }

          console.log('✅ 找到匹配的备注:', { screenName, restId: existingNote.twitter_rest_id })

          // 在 Grok actions 位置注入备注标签
          await this.injectGrokActionsBadgeInTweet(tweetElement, existingNote, screenName)
        } catch (error) {
          console.warn('⚠️ 处理单个推文时出错:', error)
          continue
        }
      }
    } catch (error) {
      console.error('❌ 处理推文列表页面时出错:', error)
    }
  }

  /**
   * 处理页面中所有推文（包括评论）- 专门用于推文详情页面
   */
  private async handleAllTweetsInPage() {
    try {
      console.log('📍 处理页面中所有推文（包括评论）')

      // 扫描所有推文元素，包括主推文和评论
      const tweetElements = document.querySelectorAll('article[data-testid="tweet"]')
      console.log(`🔍 找到 ${tweetElements.length} 个推文元素`)

      for (const tweetElement of Array.from(tweetElements)) {
        try {
          const { extractScreenNameFromTweetElement } = await import('./utils/extraction.utils')
          const screenName = extractScreenNameFromTweetElement(tweetElement)

          if (!screenName) continue

          const existingNote = this.findMatchingNote(screenName)

          if (existingNote) {
            console.log('✅ 找到匹配的备注:', { screenName, restId: existingNote.twitter_rest_id })
            await this.injectGrokActionsBadgeInTweet(tweetElement, existingNote, screenName)
          }
        } catch (error) {
          console.warn('⚠️ 处理单个推文时出错:', error)
        }
      }
    } catch (error) {
      console.error('❌ 处理页面所有推文时出错:', error)
    }
  }

  /**
   * 在用户操作按钮区域注入备注按钮
   */
  private async injectUserActionsBadge(note: TwitterNote | null, screenName: string) {
    try {
      console.log('📍 开始注入用户操作按钮区域备注')

      const { findUserActionsInjectionPoint } = await import('./utils/injection.utils')
      const injectionResult = findUserActionsInjectionPoint()

      if (!injectionResult.success || !injectionResult.container) {
        console.log('❌ 未找到用户操作按钮注入点')
        return
      }

      // 如果没有备注，需要先获取用户的真实rest_id
      let actualRestId = note?.twitter_rest_id
      if (!actualRestId) {
        console.log('🔍 没有备注，尝试从页面获取rest_id...')
        try {
          const { extractRestIdFromProfile } = await import('./utils/extraction.utils')
          actualRestId = extractRestIdFromProfile()
          console.log('📍 从页面提取的rest_id:', actualRestId)
        } catch (error) {
          console.warn('⚠️ 无法从页面提取rest_id，使用screen_name作为标识:', error)
          actualRestId = screenName
        }
      }

      // 生成唯一ID
      const badgeId = actualRestId ? `user-actions-${actualRestId}` : `user-actions-${screenName}`
      if (this.injectedBadges.has(badgeId)) {
        console.log('✅ 用户操作按钮徽章已存在')
        return
      }

      // 创建徽章
      const badgeContainer = document.createElement('div')
      badgeContainer.className = 'tw3track-note-badge'
      badgeContainer.setAttribute('data-context', 'profile-actions')
      badgeContainer.setAttribute('data-rest-id', actualRestId || screenName)

      new TwitterNotesBadge(badgeContainer, {
        restId: actualRestId || screenName,
        screenName: screenName,
        existingNote: note,
        onUpdate: (updatedNote) => {
          console.log('📝 用户操作按钮徽章更新:', updatedNote)
        }
      })

      // 注入徽章 - 在userActions前面
      const { smartInjectBadge } = await import('./utils/injection.utils')
      if (smartInjectBadge(injectionResult.container, badgeContainer, 'before')) {
        this.injectedBadges.add(badgeId)
        console.log('✅ 用户操作按钮徽章注入成功')
      }
    } catch (error) {
      console.error('❌ 注入用户操作按钮徽章时出错:', error)
    }
  }

  /**
   * 在Grok actions位置注入备注标签
   */
  private async injectGrokActionsBadge(note: TwitterNote, screenName: string) {
    try {
      console.log('📍 开始注入Grok actions备注标签')

      const grokElement = document.querySelector('[aria-label="Grok actions"]')
      if (!grokElement) {
        console.log('❌ 未找到Grok actions元素')
        return
      }

      const { findGrokActionsInjectionPoint } = await import('./utils/injection.utils')
      const injectionResult = findGrokActionsInjectionPoint(grokElement.closest('article') || document.body)

      if (!injectionResult.success || !injectionResult.container) {
        console.log('❌ 未找到Grok actions注入点')
        return
      }

      const badgeId = `grok-actions-${note.twitter_rest_id}`
      if (this.injectedBadges.has(badgeId)) {
        console.log('✅ Grok actions徽章已存在')
        return
      }

      // 创建徽章
      const badgeContainer = document.createElement('div')
      badgeContainer.className = 'tw3track-note-badge'
      badgeContainer.setAttribute('data-context', 'tweet-actions')
      badgeContainer.setAttribute('data-rest-id', note.twitter_rest_id)

      new TwitterNotesBadge(badgeContainer, {
        restId: note.twitter_rest_id,
        screenName: screenName,
        existingNote: note,
        onUpdate: (updatedNote) => {
          console.log('📝 Grok actions徽章更新:', updatedNote)
        }
      })

      // 注入徽章 - 使用before位置，显示在Grok actions前面
      const { smartInjectBadge } = await import('./utils/injection.utils')
      if (smartInjectBadge(injectionResult.container, badgeContainer, 'before')) {
        this.injectedBadges.add(badgeId)
        console.log('✅ Grok actions徽章注入成功')
      }
    } catch (error) {
      console.error('❌ 注入Grok actions徽章时出错:', error)
    }
  }

  /**
   * 更严格的备注匹配逻辑
   */
  private findMatchingNote(screenName: string): TwitterNote | null {
    try {
      // 精确匹配 screen_name
      const matchingNotes = this.localNotes.filter(note =>
        note.screen_name?.toLowerCase() === screenName.toLowerCase()
      )

      if (matchingNotes.length === 0) {
        return null
      }

      if (matchingNotes.length === 1) {
        return matchingNotes[0]
      }

      // 如果有多个匹配，选择最新的（基于时间戳或其他标准）
      console.log('⚠️ 发现多个匹配的备注:', { screenName, count: matchingNotes.length })
      return matchingNotes[0] // 返回第一个匹配的
    } catch (error) {
      console.error('❌ 查找匹配备注时出错:', error)
      return null
    }
  }

  /**
   * 验证用户身份的严格性检查
   */
  private async verifyUserIdentity(
    tweetElement: Element,
    screenName: string,
    note: TwitterNote
  ): Promise<boolean> {
    try {
      console.log('🔍 开始验证用户身份:', { screenName, noteUser: note.screen_name, restId: note.twitter_rest_id })

      // 1. 验证 screen_name 一致性
      if (note.screen_name?.toLowerCase() !== screenName.toLowerCase()) {
        console.log('❌ screen_name 不匹配:', { expected: screenName, actual: note.screen_name })
        return false
      }

      // 2. 验证 restId 有效性
      if (!note.twitter_rest_id || note.twitter_rest_id.length < 10) {
        console.log('❌ restId 无效:', note.twitter_rest_id)
        return false
      }

      // 3. 确保在正确的推文容器内
      const tweetContainer = tweetElement.closest('article[data-testid="tweet"]')
      if (!tweetContainer) {
        console.log('❌ 未找到推文容器')
        return false
      }

      // 4. 验证推文上下文 - 检查用户名链接是否真的属于这个推文容器
      const userLinks = tweetContainer.querySelectorAll('a[href^="/"]')
      let hasMatchingUserLink = false
      let foundUserNameArea = false

      // 首先检查是否有用户名区域
      const userNameArea = tweetContainer.querySelector('[data-testid="User-Name"]')
      if (userNameArea) {
        const userNameText = userNameArea.textContent || ''
        if (userNameText.includes(`@${screenName}`)) {
          foundUserNameArea = true
          console.log('✅ 在用户名区域找到匹配的screen_name:', screenName)
        }
      }

      // 如果用户名区域验证失败，直接返回false
      if (!foundUserNameArea) {
        console.log('❌ 用户名区域验证失败，screen_name不匹配当前推文:', screenName)
        return false
      }

      // 进一步验证用户链接
      for (const link of Array.from(userLinks)) {
        const href = link.getAttribute('href')
        const linkScreenName = href?.slice(1)?.split('/')[0]

        if (linkScreenName === screenName) {
          // 检查链接是否在当前推文容器的用户名区域内
          const linkParent = link.closest('[data-testid="User-Name"]')

          if (linkParent && tweetContainer.contains(linkParent)) {
            hasMatchingUserLink = true
            console.log('✅ 找到匹配的用户链接:', href)
            break
          }
        }
      }

      if (!hasMatchingUserLink) {
        console.log('❌ 未找到匹配的用户链接，可能是错误的用户识别')
        return false
      }

      console.log('✅ 用户身份验证通过:', screenName)
      return true
    } catch (error) {
      console.error('❌ 用户身份验证时出错:', error)
      return false
    }
  }

  /**
   * 在推文的Grok actions位置注入备注标签
   */
  private async injectGrokActionsBadgeInTweet(tweetElement: Element, note: TwitterNote, screenName: string) {
    try {
      console.log('📍 开始在推文中注入Grok actions备注标签', {
        screenName,
        noteUser: note.screen_name,
        restId: note.twitter_rest_id,
        tweetElementInfo: {
          tagName: tweetElement.tagName,
          testId: tweetElement.getAttribute('data-testid'),
          hasUserName: !!tweetElement.querySelector('[data-testid="User-Name"]')
        }
      })

      // 1. 严格验证用户身份
      const isValidUser = await this.verifyUserIdentity(tweetElement, screenName, note)
      if (!isValidUser) {
        console.log('⚠️ 用户身份验证失败，跳过注入:', { screenName, noteUser: note.screen_name })
        return
      }

      const { findGrokActionsInjectionPoint } = await import('./utils/injection.utils')
      const injectionResult = findGrokActionsInjectionPoint(tweetElement)

      if (!injectionResult.success || !injectionResult.container) {
        console.log('❌ 未找到推文中的Grok actions注入点')
        return
      }

      console.log('🎯 找到注入点，准备注入徽章:', {
        screenName,
        restId: note.twitter_rest_id,
        containerInfo: {
          tagName: injectionResult.container.tagName,
          className: injectionResult.container.className,
          parentElement: injectionResult.container.parentElement?.tagName
        }
      })

      // 2. 检查是否已经注入过（使用更精确的检查）
      const existingBadge = tweetElement.querySelector(`[data-rest-id="${note.twitter_rest_id}"]`)
      if (existingBadge) {
        console.log('✅ 徽章已存在，跳过注入:', note.twitter_rest_id)
        return
      }

      const badgeId = `tweet-grok-${note.twitter_rest_id}-${Date.now()}`
      if (this.injectedBadges.has(badgeId)) {
        console.log('✅ 推文Grok actions徽章已存在')
        return
      }

      // 创建徽章
      const badgeContainer = document.createElement('div')
      badgeContainer.className = 'tw3track-note-badge'
      badgeContainer.setAttribute('data-context', 'tweet-actions')
      badgeContainer.setAttribute('data-rest-id', note.twitter_rest_id)

      new TwitterNotesBadge(badgeContainer, {
        restId: note.twitter_rest_id,
        screenName: screenName,
        existingNote: note,
        onUpdate: (updatedNote) => {
          console.log('📝 推文Grok actions徽章更新:', updatedNote)
        }
      })

      // 确保注入到正确的推文容器内
      const tweetContainer = tweetElement.closest('article[data-testid="tweet"]')
      if (!tweetContainer) {
        console.error('❌ 未找到推文容器，无法注入徽章')
        return
      }

      // 直接在Grok actions容器前插入徽章，而不是使用smartInjectBadge
      try {
        injectionResult.container.parentNode?.insertBefore(badgeContainer, injectionResult.container)
        this.injectedBadges.add(badgeId)

        console.log('✅ 推文Grok actions徽章注入成功', {
          screenName,
          restId: note.twitter_rest_id,
          badgeId,
          injectedPosition: 'before',
          containerParent: injectionResult.container.parentElement?.tagName,
          tweetContainer: tweetElement.getAttribute('data-testid')
        })

        // 验证徽章是否真的注入到了正确的推文中
        const injectedBadge = tweetContainer.querySelector(`[data-rest-id="${note.twitter_rest_id}"]`)
        if (injectedBadge) {
          console.log('✅ 徽章注入验证成功，徽章在正确的推文容器中')
        } else {
          console.error('❌ 徽章注入验证失败，徽章可能注入到了错误的位置')
          // 如果验证失败，移除错误注入的徽章
          badgeContainer.remove()
          this.injectedBadges.delete(badgeId)
        }
      } catch (error) {
        console.error('❌ 直接注入徽章失败:', error)
      }
    } catch (error) {
      console.error('❌ 注入推文Grok actions徽章时出错:', error)
    }
  }




  /**
   * 设置DOM观察器
   */
  private setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      // 防抖处理，避免频繁触发
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }

      this.debounceTimer = setTimeout(() => {
        this.handleMutations(mutations)
      }, this.config.debounceDelay)
    })

    // 更全面的观察配置
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false, // 不监听属性变化，减少噪音
    })

    // 添加滚动监听
    this.setupScrollListener()

    console.log('👀 DOM观察器设置完成')
  }

  /**
   * 设置滚动监听
   */
  private setupScrollListener() {
    let scrollTimer: NodeJS.Timeout | null = null

    window.addEventListener('scroll', () => {
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }

      scrollTimer = setTimeout(() => {
        // 滚动停止后检查新内容
        console.log('📜 滚动停止，检查新内容')
        this.checkAndInject()
      }, 500)
    }, { passive: true })

    console.log('📜 滚动监听器设置完成')
  }

  /**
   * 处理DOM变化
   */
  private handleMutations(mutations: MutationRecord[]) {
    let shouldCheck = false

    // 检查URL变化
    if (location.href !== this.lastUrl) {
      console.log('🔄 URL变化:', this.lastUrl, '->', location.href)
      this.handleUrlChange()
      shouldCheck = true
    }

    // 更宽松的DOM变化检查
    if (!shouldCheck) {
      const hasRelevantChanges = mutations.some(mutation => {
        if (mutation.type !== 'childList') return false

        return Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return false

          const element = node as Element
          // 检查是否添加了推文相关元素
          return element.querySelector('article[data-testid="tweet"]') ||
                 element.querySelector('[data-testid*="User"]') ||
                 element.querySelector('[data-testid="userActions"]') ||
                 element.querySelector('[aria-label="Grok actions"]') ||
                 element.matches('article[data-testid="tweet"]')
        })
      })

      if (hasRelevantChanges) {
        console.log('🔄 检测到推文相关DOM变化')
        shouldCheck = true
      }
    }

    if (shouldCheck) {
      // 缩短延迟时间，提高响应速度
      setTimeout(() => this.checkAndInject(), Math.min(this.config.injectionDelay, 300))
    }
  }

  /**
   * 处理URL变化
   */
  private handleUrlChange() {
    // 清理旧的注入
    this.clearAllBadges()

    // 重置状态
    this.currentRestId = null
    this.injectedBadges.clear()
    this.lastUrl = location.href

    // 重新加载本地备注数据
    this.loadLocalNotes()
  }

  /**
   * 注入样式
   */
  private injectStyles() {
    if (document.getElementById('tw3track-twitter-notes-styles')) return

    const style = document.createElement('style')
    style.id = 'tw3track-twitter-notes-styles'
    style.textContent = `
      .tw3track-note-badge {
        display: inline-flex !important;
        align-items: center !important;
        margin-left: 8px !important;
        vertical-align: middle !important;
        position: relative !important;
        z-index: 1000 !important;
        flex-shrink: 0 !important;
      }
      
      .tw3track-note-badge button {
        transition: all 0.2s ease-in-out !important;
      }
      
      .tw3track-note-badge button:hover {
        transform: scale(1.05) !important;
      }
      
      .tw3track-note-badge button:active {
        transform: scale(0.95) !important;
      }
    `
    
    document.head.appendChild(style)
    console.log('🎨 样式注入完成')
  }

  /**
   * 设置消息监听
   */
  private setupMessageListener() {
    const messageListener = (message: TwitterNotesMessage, sender: any, sendResponse: any) => {
      console.log('📥 注入管理器收到消息:', message.type, '当前页面:', location.href)

      switch (message.type) {
        case 'TWITTER_NOTES_CACHE_UPDATED':
          console.log('🔄 注入管理器：处理缓存更新消息，备注数量:', message.notes?.length || 0)
          console.log('📋 注入管理器：收到的备注数据:', message.notes)
          this.handleCacheUpdate(message.notes || [])
          break
        case 'TWITTER_NOTES_UPDATED':
          console.log('🔄 注入管理器：处理备注更新消息:', message.restId)
          this.handleNoteUpdate(message.restId!, message.note)
          break
        case 'TWITTER_NOTES_DELETED':
          console.log('🔄 注入管理器：处理备注删除消息:', message.restId)
          this.handleNoteDelete(message.restId!)
          break
        default:
          console.log('❓ 注入管理器：收到未知消息类型:', message.type)
      }

      // 返回true表示消息已处理
      return true
    }

    chrome.runtime.onMessage.addListener(messageListener)
    console.log('👂 注入管理器消息监听器设置完成，当前页面:', location.href)
  }

  /**
   * 处理缓存更新
   */
  private async handleCacheUpdate(notes: TwitterNote[]) {
    console.log('🔄 注入管理器：处理缓存更新，新备注数量:', notes.length)
    console.log('📋 注入管理器：更新前本地备注数量:', this.localNotes.length)

    const oldNotes = this.localNotes
    this.localNotes = notes

    console.log('📋 注入管理器：更新后本地备注数量:', this.localNotes.length)

    // 精确更新：比较新旧数据，只更新有变化的徽章
    await this.updateChangedBadges(oldNotes, notes)

    console.log('✅ 注入管理器：缓存更新处理完成')
  }

  /**
   * 处理备注更新
   */
  private handleNoteUpdate(restId: string, note: TwitterNote | null) {
    console.log('🔄 处理备注更新:', restId, note)

    if (note) {
      // 更新本地缓存
      const index = this.localNotes.findIndex(n => n.twitter_rest_id === restId)
      if (index >= 0) {
        this.localNotes[index] = note
      } else {
        this.localNotes.push(note)
      }
    }

    // 更新对应的徽章
    this.updateBadgeForUser(restId, note)
  }

  /**
   * 处理备注删除
   */
  private handleNoteDelete(restId: string) {
    console.log('🔄 处理备注删除:', restId)

    // 从本地缓存移除
    this.localNotes = this.localNotes.filter(note => note.twitter_rest_id !== restId)

    // 更新徽章为"添加备注"状态
    this.updateBadgeForUser(restId, null)
  }

  /**
   * 精确更新有变化的徽章
   */
  private async updateChangedBadges(oldNotes: TwitterNote[], newNotes: TwitterNote[]) {
    try {
      console.log('🔄 精确更新徽章，旧数据:', oldNotes.length, '条，新数据:', newNotes.length, '条')

      // 创建映射以便快速查找
      const oldNotesMap = new Map(oldNotes.map(note => [note.twitter_rest_id, note]))
      const newNotesMap = new Map(newNotes.map(note => [note.twitter_rest_id, note]))

      // 处理更新和新增的备注
      for (const [restId, newNote] of Array.from(newNotesMap.entries())) {
        const oldNote = oldNotesMap.get(restId)

        if (!oldNote) {
          // 新增的备注：需要注入新徽章
          console.log('➕ 发现新增备注:', restId)
          await this.injectNewBadgeForNote(newNote)
        } else if (JSON.stringify(oldNote) !== JSON.stringify(newNote)) {
          // 更新的备注：更新现有徽章
          console.log('🔄 发现更新备注:', restId)
          this.updateBadgeForUser(restId, newNote)
        }
      }

      // 处理删除的备注
      for (const [restId, oldNote] of Array.from(oldNotesMap.entries())) {
        if (!newNotesMap.has(restId)) {
          // 删除的备注：更新徽章为"添加备注"状态
          console.log('🗑️ 发现删除备注:', restId)
          this.updateBadgeForUser(restId, null)
        }
      }

      console.log('✅ 精确更新徽章完成')
    } catch (error) {
      console.error('❌ 精确更新徽章时出错:', error)
      // 如果精确更新失败，回退到全量刷新
      console.log('🔄 回退到全量刷新徽章')
      await this.refreshAllBadges()
    }
  }

  /**
   * 为新备注注入徽章
   */
  private async injectNewBadgeForNote(note: TwitterNote) {
    try {
      // 根据当前页面类型决定注入策略
      const pageInfo = getDetailedPageType()

      if (pageInfo.pageType === 'profile') {
        // 在用户主页注入
        await this.injectUserActionsBadge(note, note.screen_name)
      } else {
        // 在推文列表中查找并注入
        const tweets = document.querySelectorAll('article[data-testid="tweet"]')
        for (const tweet of Array.from(tweets)) {
          const { extractScreenNameFromTweetElement } = await import('./utils/extraction.utils')
          const screenName = extractScreenNameFromTweetElement(tweet)

          if (screenName && screenName.toLowerCase() === note.screen_name.toLowerCase()) {
            await this.injectGrokActionsBadgeInTweet(tweet, note, screenName)
          }
        }
      }
    } catch (error) {
      console.error('❌ 为新备注注入徽章时出错:', error)
    }
  }

  /**
   * 刷新所有徽章
   */
  private async refreshAllBadges() {
    try {
      console.log('🔄 刷新所有徽章，当前备注数量:', this.localNotes.length)

      // 清理现有徽章
      this.clearAllBadges()

      // 等待一小段时间确保DOM清理完成
      await new Promise(resolve => setTimeout(resolve, 100))

      // 重新注入
      console.log('🔄 开始重新注入徽章')
      await this.checkAndInject()

      console.log('✅ 徽章刷新完成，当前注入数量:', this.injectedBadges.size)
    } catch (error) {
      console.error('❌ 刷新所有徽章时出错:', error)
    }
  }

  /**
   * 更新特定用户的徽章
   */
  private updateBadgeForUser(restId: string, note: TwitterNote | null) {
    try {
      console.log('🔄 开始更新用户徽章:', restId, '备注:', note?.note)

      // 查找该用户的所有徽章
      const badges = document.querySelectorAll(`[data-rest-id="${restId}"]`)
      console.log('🔍 找到徽章数量:', badges.length)

      if (badges.length === 0) {
        console.log('⚠️ 未找到该用户的徽章，可能需要重新注入')
        // 如果没有找到徽章，尝试重新注入
        setTimeout(() => {
          this.checkAndInject()
        }, 100)
        return
      }

      badges.forEach((badge, index) => {
        console.log(`🔄 更新第${index + 1}个徽章:`, badge)

        // 方法1：触发自定义事件
        const updateEvent = new CustomEvent('tw3track-note-update', {
          detail: { restId, note }
        })
        badge.dispatchEvent(updateEvent)

        // 方法2：直接发送消息给徽章（备用方案）
        try {
          chrome.runtime.sendMessage({
            type: 'TWITTER_NOTES_CACHE_UPDATED',
            notes: note ? [note] : []
          }).catch(() => {
            // 忽略发送失败
          })
        } catch (error) {
          console.log('⚠️ 发送消息失败:', error)
        }
      })

      console.log('✅ 已更新用户徽章:', restId, badges.length, '个')
    } catch (error) {
      console.error('❌ 更新用户徽章时出错:', error)
    }
  }

  /**
   * 移除特定用户的徽章
   */
  private removeBadgeForUser(restId: string) {
    try {
      const badges = document.querySelectorAll(`[data-rest-id="${restId}"]`)

      badges.forEach(badge => {
        badge.remove()
      })

      // 从已注入集合中移除
      this.injectedBadges.forEach(badgeId => {
        if (badgeId.includes(restId)) {
          this.injectedBadges.delete(badgeId)
        }
      })

      console.log('🗑️ 已移除用户徽章:', restId, badges.length, '个')
    } catch (error) {
      console.error('❌ 移除用户徽章时出错:', error)
    }
  }



  /**
   * 启动健康检查
   */
  private startHealthCheck() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck()
    }, 5000) // 每30秒检查一次

    console.log('💓 健康检查已启动')
  }

  /**
   * 执行健康检查
   */
  private performHealthCheck() {
    try {
      // 检查观察器状态
      if (!this.observer) {
        console.warn('⚠️ DOM观察器丢失，重新设置')
        this.setupObserver()
      }

      // 检查注入状态
      const stats = {
        injectedBadges: this.injectedBadges.size,
        localNotes: this.localNotes.length,
        currentUrl: location.href
      }

      console.log('💓 健康检查:', stats)
    } catch (error) {
      console.error('❌ 健康检查失败:', error)
    }
  }

  /**
   * 强制刷新所有徽章
   */
  public forceRefresh() {
    console.log('🔄 强制刷新所有徽章')
    this.clearAllBadges()
    setTimeout(() => this.checkAndInject(), 100)
  }

  /**
   * 清理所有徽章
   */
  private clearAllBadges() {
    const badges = document.querySelectorAll('.tw3track-note-badge')
    badges.forEach(badge => badge.remove())

    // 清理注入标记
    const injectedContainers = document.querySelectorAll('[data-tw3track-injected]')
    injectedContainers.forEach(container => {
      container.removeAttribute('data-tw3track-injected')
    })

    this.injectedBadges.clear()
    console.log(`🧹 已清理 ${badges.length} 个徽章和注入标记`)
  }

  /**
   * 获取管理器状态
   */
  public getStatus() {
    return {
      enabled: this.config.enabled,
      injectedBadges: this.injectedBadges.size,
      localNotes: this.localNotes.length,
      currentRestId: this.currentRestId,
      currentUrl: location.href,
      pageType: getPageType()
    }
  }

  /**
   * 启用/禁用功能
   */
  public setEnabled(enabled: boolean) {
    this.config.enabled = enabled

    if (!enabled) {
      this.clearAllBadges()
    } else {
      this.checkAndInject()
    }

    console.log('⚙️ 功能状态已更新:', enabled)
  }

  /**
   * 清理管理器
   */
  public cleanup() {
    try {
      // 停止观察器
      if (this.observer) {
        this.observer.disconnect()
        this.observer = null
      }

      // 清理定时器
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = null
      }

      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer)
        this.healthCheckTimer = null
      }

      // 清理徽章
      this.clearAllBadges()

      // 重置状态
      this.injectionLock.clear()
      this.currentRestId = null
      this.lastUrl = ''

      console.log('🧹 Twitter备注注入管理器已清理')
    } catch (error) {
      console.error('❌ 清理管理器时出错:', error)
    }
  }
}
