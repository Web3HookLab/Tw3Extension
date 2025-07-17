/**
 * 钱包备注注入功能入口文件
 * 只在推文详情页面激活，检测钱包地址并注入备注卡片
 */

import type { PlasmoCSConfig } from "plasmo"
import { WalletNotesInjectionManager } from './WalletNotesInjectionManager'

// Plasmo配置 - 只在Twitter/X页面激活
export const config: PlasmoCSConfig = {
  matches: ["https://x.com/*", "https://twitter.com/*"],
  all_frames: false,
  run_at: "document_end"
}

// 全局管理器实例
let manager: WalletNotesInjectionManager | null = null

/**
 * 全局页面类型检查 - 确保只在推文详情页面运行
 */
function isValidPageForWalletInjection(): boolean {
  const { isTweetDetailPage } = require('./utils/wallet-detection.utils')
  const isValid = isTweetDetailPage()

  if (!isValid) {
    console.log('🚫 当前页面不是推文详情页面，禁止钱包备注注入活动')
  }

  return isValid
}

/**
 * 初始化钱包备注注入管理器
 */
function initializeManager() {
  if (manager) {
    console.log('⚠️ 钱包备注注入管理器已存在，跳过初始化')
    return
  }

  try {
    console.log('🚀 开始初始化钱包备注注入管理器，当前页面:', location.href)

    // 严格检查：只在推文详情页面才初始化
    if (!isValidPageForWalletInjection()) {
      console.log('📍 当前页面不是推文详情页面，跳过钱包备注注入初始化')
      return
    }

    console.log('✅ 确认为推文详情页面，开始初始化钱包备注注入')
    manager = new WalletNotesInjectionManager()
    // 异步初始化在管理器内部处理
    manager.initialize()

    console.log('✅ 钱包备注注入管理器初始化成功')
  } catch (error) {
    console.error('❌ 钱包备注注入管理器初始化失败:', error)
  }
}

/**
 * 清理管理器和所有注入的元素
 */
function cleanupManager() {
  if (manager) {
    manager.destroy()
    manager = null
    console.log('🧹 钱包备注注入管理器已清理')
  }

  // 额外的全局清理：确保清理所有钱包卡片
  cleanupAllWalletCards()
}

/**
 * 全局清理所有钱包卡片（防止遗漏）
 */
function cleanupAllWalletCards() {
  try {
    const allWalletCards = document.querySelectorAll('[data-tw3track-wallet-card="true"]')
    let cleanedCount = 0

    allWalletCards.forEach(card => {
      try {
        if (card.parentNode) {
          card.parentNode.removeChild(card)
          cleanedCount++
        }
      } catch (error) {
        console.warn('⚠️ 全局清理钱包卡片时出错:', error)
      }
    })

    if (cleanedCount > 0) {
      console.log(`🧹 全局清理了 ${cleanedCount} 个遗留的钱包卡片`)
    }
  } catch (error) {
    console.error('❌ 全局清理钱包卡片失败:', error)
  }
}

/**
 * 处理页面导航变化 - 严格限制在推文详情页面
 */
function handleNavigationChange() {
  console.log('🔄 页面导航变化，检查是否需要初始化钱包备注注入')

  // 先清理现有的管理器
  cleanupManager()

  // 立即检查页面类型
  const { isTweetDetailPage } = require('./utils/wallet-detection.utils')

  console.log('🔍 页面导航检查:', {
    url: location.href,
    isTweetDetailPage: isTweetDetailPage()
  })

  if (!isTweetDetailPage()) {
    console.log('📍 当前页面不是推文详情页面，跳过钱包备注注入')
    return
  }

  // 如果是推文详情页面，使用重试机制确保内容加载完成
  let retryCount = 0
  const maxRetries = 3
  const baseDelay = 500

  const tryInitialize = async () => {
    retryCount++
    console.log(`🔄 尝试初始化钱包备注注入 (${retryCount}/${maxRetries})`)

    try {
      // 再次确认页面类型（因为页面可能还在变化）
      if (isTweetDetailPage()) {
        console.log('✅ 确认为推文详情页面，开始初始化')
        initializeManager()
        return
      }

      // 如果页面类型变了，停止重试
      console.log('📍 页面类型已变化，停止初始化')
    } catch (error) {
      console.error('❌ 初始化检查时出错:', error)
      if (retryCount < maxRetries) {
        setTimeout(tryInitialize, baseDelay * retryCount)
      }
    }
  }

  // 稍等一下再尝试，让页面内容加载
  setTimeout(tryInitialize, 300)
}

/**
 * 监听来自background的消息
 */
function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('📨 钱包备注注入收到消息:', message.type)

    switch (message.type) {
      case 'WALLET_NOTES_CACHE_UPDATED':
        // 钱包备注缓存更新
        if (manager && message.notes) {
          console.log('🔄 更新钱包备注缓存:', message.notes.length, '条')
          manager.updateWalletNotes(message.notes)
        }
        break

      case 'PAGE_NAVIGATION':
        // 页面导航变化
        handleNavigationChange()
        break

      default:
        // 忽略其他消息类型（如推特备注相关消息）
        break
    }

    // 发送响应（避免警告）
    sendResponse({ received: true })
  })

  console.log('📡 钱包备注消息监听器已设置')
}

/**
 * 监听URL变化（SPA导航）- 改进版本
 */
function setupUrlChangeListener() {
  let currentUrl = location.href
  let debounceTimer: NodeJS.Timeout | null = null

  // 防抖处理导航变化
  const debouncedHandleNavigation = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = setTimeout(() => {
      if (currentUrl !== location.href) {
        const oldUrl = currentUrl
        currentUrl = location.href
        console.log('🔄 URL变化检测:', oldUrl, '->', currentUrl)

        // 立即清理之前的钱包卡片
        cleanupAllWalletCards()

        handleNavigationChange()
      }
    }, 300) // 300ms防抖
  }

  // 监听popstate事件（浏览器前进后退）
  window.addEventListener('popstate', debouncedHandleNavigation)

  // 监听hashchange事件
  window.addEventListener('hashchange', debouncedHandleNavigation)

  // 监听pushState和replaceState（程序化导航）
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function(...args) {
    const result = originalPushState.apply(history, args)
    debouncedHandleNavigation()
    return result
  }

  history.replaceState = function(...args) {
    const result = originalReplaceState.apply(history, args)
    debouncedHandleNavigation()
    return result
  }

  // 监听DOM变化（用于检测动态内容加载）
  const observer = new MutationObserver(() => {
    debouncedHandleNavigation()
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  })

  console.log('🔗 增强型URL变化监听器已设置')
}

// 设置消息监听器
setupMessageListener()

// 设置URL变化监听器
setupUrlChangeListener()

// 页面加载完成后初始化 - 只在推文详情页面
function initializeIfTweetDetailPage() {
  const { isTweetDetailPage } = require('./utils/wallet-detection.utils')

  console.log('🔍 检查页面类型:', {
    url: location.href,
    isTweetDetailPage: isTweetDetailPage(),
    readyState: document.readyState
  })

  if (isTweetDetailPage()) {
    console.log('✅ 检测到推文详情页面，开始初始化钱包备注注入')
    initializeManager()
  } else {
    console.log('📍 当前页面不是推文详情页面，跳过钱包备注注入')
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // DOM加载完成后稍等一下再初始化，确保页面内容已渲染
    setTimeout(initializeIfTweetDetailPage, 300)
  })
} else {
  // 页面已经加载完成，立即检查并初始化
  setTimeout(initializeIfTweetDetailPage, 100)
}

// 页面卸载时清理
window.addEventListener('beforeunload', cleanupManager)

