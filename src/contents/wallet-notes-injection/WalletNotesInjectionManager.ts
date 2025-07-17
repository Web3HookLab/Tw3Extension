/**
 * 钱包备注注入管理器
 * 负责在推文详情页面检测钱包地址并注入备注卡片
 */

import type { WalletNote } from '~src/types/wallet-notes.types'
import {
  extractWalletAddresses,
  extractTweetText,
  isTweetDetailPage,
  type WalletAddressInfo
} from './utils/wallet-detection.utils'
import { WalletNotesBadge } from './components/badges/WalletNotesBadge'
import { DataService } from '~src/services/notes.service'

export class WalletNotesInjectionManager {
  private observer: MutationObserver | null = null
  private processedElements = new Set<Element>()
  private walletNotes: WalletNote[] = []
  private isInitialized = false
  private injectedElements = new Set<Element>() // 跟踪所有注入的元素

  constructor() {
    console.log('🚀 钱包备注注入管理器初始化')
  }

  /**
   * 初始化管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ 钱包备注注入管理器已初始化，跳过')
      return
    }

    try {
      // 使用重试机制检查页面
      const maxRetries = 5
      let retryCount = 0

      const tryInitialize = async (): Promise<boolean> => {
        retryCount++
        console.log(`🔄 尝试初始化钱包备注注入 (${retryCount}/${maxRetries})`)

        // 检查是否为推文详情页面
        if (!isTweetDetailPage()) {
          if (retryCount < maxRetries) {
            console.log('📍 页面还未完全加载，稍后重试...')
            setTimeout(() => tryInitialize(), 1000)
            return false
          } else {
            console.log('📍 当前页面不是推文详情页面，跳过钱包备注注入')
            return false
          }
        }

        console.log('📍 当前页面是推文详情页面，开始初始化钱包备注注入')

        // 加载本地钱包备注数据
        await this.loadWalletNotes()

        // 开始监听DOM变化
        this.startObserving()

        // 等待页面稳定后处理推文
        setTimeout(async () => {
          await this.processExistingTweets()
        }, 500)

        this.isInitialized = true
        console.log('✅ 钱包备注注入管理器初始化完成')
        return true
      }

      await tryInitialize()

    } catch (error) {
      console.error('❌ 钱包备注注入管理器初始化失败:', error)
    }
  }

  /**
   * 加载本地钱包备注数据
   */
  private async loadWalletNotes(): Promise<void> {
    try {
      this.walletNotes = await DataService.getLocalWalletNotes()
      console.log('📦 已加载钱包备注数据:', this.walletNotes.length, '条')
    } catch (error) {
      console.error('❌ 加载钱包备注数据失败:', error)
      this.walletNotes = []
    }
  }

  /**
   * 开始监听DOM变化
   */
  private startObserving(): void {
    if (this.observer) {
      this.observer.disconnect()
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldProcess = true
        }
      })

      if (shouldProcess) {
        // 使用节流避免频繁处理
        this.throttledProcessTweets()
      }
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    console.log('👀 开始监听DOM变化')
  }

  /**
   * 节流处理推文（避免频繁调用）
   */
  private throttledProcessTweets = this.throttle(async () => {
    // 检查管理器是否仍然有效
    if (!this.isInitialized) {
      console.log('⚠️ 管理器已销毁，跳过推文处理')
      return
    }

    // 再次检查页面类型
    if (!isTweetDetailPage()) {
      console.log('⚠️ 当前页面不是推文详情页面，跳过推文处理')
      return
    }

    await this.processExistingTweets()
  }, 500)

  /**
   * 处理页面中现有的推文
   */
  private async processExistingTweets(): Promise<void> {
    try {
      // 安全检查：确保管理器仍然有效且在正确的页面
      if (!this.isInitialized) {
        console.log('⚠️ 管理器已销毁，停止处理推文')
        return
      }

      if (!isTweetDetailPage()) {
        console.log('⚠️ 当前页面不是推文详情页面，停止处理推文')
        return
      }

      // 等待页面内容加载完成
      await this.waitForTweetContent()

      // 再次检查管理器状态（因为等待期间可能被销毁）
      if (!this.isInitialized) {
        console.log('⚠️ 等待期间管理器被销毁，停止处理推文')
        return
      }

      // 查找推文容器 - 使用更精确的选择器
      const tweetSelectors = [
        'article[data-testid="tweet"]',
        'div[data-testid="tweetText"]',
        'article[role="article"]',
        '[data-testid="tweet"]'
      ]

      let tweetElements: Element[] = []

      for (const selector of tweetSelectors) {
        tweetElements = Array.from(document.querySelectorAll(selector))
        if (tweetElements.length > 0) {
          console.log(`✅ 使用选择器 "${selector}" 找到 ${tweetElements.length} 个推文元素`)
          break
        }
      }

      console.log('🔍 找到推文元素:', tweetElements.length, '个')

      if (tweetElements.length === 0) {
        console.log('⚠️ 未找到推文元素，可能页面还在加载中')
        return
      }

      for (const tweetElement of tweetElements) {
        // 每次处理前检查管理器状态
        if (!this.isInitialized) {
          console.log('⚠️ 处理过程中管理器被销毁，停止处理')
          break
        }

        if (!this.processedElements.has(tweetElement)) {
          await this.processTweetElement(tweetElement)
          this.processedElements.add(tweetElement)
        }
      }

    } catch (error) {
      console.error('❌ 处理推文时出错:', error)
    }
  }

  /**
   * 等待推文内容加载完成
   */
  private async waitForTweetContent(): Promise<void> {
    return new Promise((resolve) => {
      const maxWaitTime = 5000 // 最多等待5秒
      const checkInterval = 100 // 每100ms检查一次
      let elapsedTime = 0

      const checkContent = () => {
        const hasTweetContent = document.querySelector('article[data-testid="tweet"]') ||
                               document.querySelector('[data-testid="tweetText"]') ||
                               document.querySelector('article[role="article"]')

        if (hasTweetContent || elapsedTime >= maxWaitTime) {
          resolve()
        } else {
          elapsedTime += checkInterval
          setTimeout(checkContent, checkInterval)
        }
      }

      checkContent()
    })
  }

  /**
   * 处理单个推文元素
   */
  private async processTweetElement(tweetElement: Element): Promise<void> {
    try {
      // 提取推文文本
      const tweetText = extractTweetText(tweetElement)
      console.log('📝 提取的推文文本:', tweetText ? `"${tweetText.substring(0, 100)}..."` : '(空)')

      if (!tweetText) {
        console.log('⚠️ 推文文本为空，跳过处理')
        return
      }

      // 检测钱包地址
      const walletAddresses = extractWalletAddresses(tweetText)
      console.log('🔍 钱包地址检测结果:', walletAddresses.length, '个地址')

      if (walletAddresses.length === 0) {
        console.log('📝 推文中未发现钱包地址')
        return
      }

      console.log('💰 在推文中发现钱包地址:', walletAddresses.map(w => `${w.networkType}:${w.address.substring(0, 10)}...`))

      // 为每个钱包地址注入备注卡片
      for (const walletInfo of walletAddresses) {
        await this.injectWalletNoteCard(tweetElement, walletInfo)
      }

    } catch (error) {
      console.error('❌ 处理推文元素时出错:', error)
    }
  }

  /**
   * 注入钱包备注卡片
   */
  private async injectWalletNoteCard(
    tweetElement: Element, 
    walletInfo: WalletAddressInfo
  ): Promise<void> {
    try {
      // 检查是否已经注入过
      const existingCard = tweetElement.querySelector(
        `[data-wallet-address="${walletInfo.address}"]`
      )
      if (existingCard) {
        return
      }

      // 查找钱包备注
      const existingNote = this.findWalletNote(walletInfo.address)

      // 创建徽章实例（使用静态导入）
      const badge = new WalletNotesBadge({
        walletAddress: walletInfo.address,
        networkType: walletInfo.networkType,
        existingNote
      })

      // 查找合适的注入位置（推文文本容器）
      const textContainer = tweetElement.querySelector('[data-testid="tweetText"]') ||
                           tweetElement.querySelector('[lang]') ||
                           tweetElement

      if (textContainer) {
        // 创建容器并注入
        const cardContainer = document.createElement('div')
        cardContainer.style.marginTop = '8px'
        cardContainer.setAttribute('data-wallet-address', walletInfo.address)
        cardContainer.setAttribute('data-tw3track-wallet-card', 'true') // 添加标识符便于清理

        const cardElement = await badge.render()
        cardContainer.appendChild(cardElement)

        // 插入到推文文本后面
        textContainer.parentNode?.insertBefore(cardContainer, textContainer.nextSibling)

        // 记录注入的元素
        this.injectedElements.add(cardContainer)

        console.log('✅ 钱包备注卡片注入成功:', walletInfo.address)
      }

    } catch (error) {
      console.error('❌ 注入钱包备注卡片失败:', error)
    }
  }

  /**
   * 查找钱包备注
   */
  private findWalletNote(walletAddress: string): WalletNote | null {
    return this.walletNotes.find(note => 
      note.wallet_address.toLowerCase() === walletAddress.toLowerCase()
    ) || null
  }

  /**
   * 更新钱包备注数据（当缓存更新时调用）
   */
  async updateWalletNotes(newNotes: WalletNote[]): Promise<void> {
    this.walletNotes = newNotes
    console.log('🔄 钱包备注数据已更新:', newNotes.length, '条')
    
    // 重新处理页面中的推文
    this.processedElements.clear()
    await this.processExistingTweets()
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    // 清理所有注入的钱包卡片
    this.cleanupInjectedElements()

    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }

    this.processedElements.clear()
    this.injectedElements.clear()
    this.walletNotes = []
    this.isInitialized = false

    console.log('🗑️ 钱包备注注入管理器已销毁')
  }

  /**
   * 清理所有注入的钱包卡片元素
   */
  private cleanupInjectedElements(): void {
    let cleanedCount = 0

    // 清理通过 injectedElements 跟踪的元素
    this.injectedElements.forEach(element => {
      try {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
          cleanedCount++
        }
      } catch (error) {
        console.warn('⚠️ 清理注入元素时出错:', error)
      }
    })

    // 额外清理：查找所有带有标识符的钱包卡片
    const allWalletCards = document.querySelectorAll('[data-tw3track-wallet-card="true"]')
    allWalletCards.forEach(card => {
      try {
        if (card.parentNode) {
          card.parentNode.removeChild(card)
          cleanedCount++
        }
      } catch (error) {
        console.warn('⚠️ 清理钱包卡片时出错:', error)
      }
    })

    console.log(`🧹 已清理 ${cleanedCount} 个钱包卡片元素`)
  }

  /**
   * 获取管理器状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      walletNotesCount: this.walletNotes.length,
      processedElementsCount: this.processedElements.size,
      currentUrl: window.location.href,
      isTweetDetailPage: isTweetDetailPage()
    }
  }

  /**
   * 节流函数
   */
  private throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        func(...args)
        timeoutId = null
      }, delay)
    }
  }
}
