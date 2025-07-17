/**
 * Twitter备注注入模块主入口
 * 负责初始化TwitterNotesInjectionManager并管理生命周期
 */

import { TwitterNotesInjectionManager } from './TwitterNotesInjectionManager'

// 管理器实例
let manager: TwitterNotesInjectionManager | null = null

/**
 * 初始化Twitter备注注入管理器
 */
function initializeManager() {
  if (manager) {
    console.log('⚠️ Twitter备注注入管理器已存在，跳过初始化')
    return
  }

  try {
    console.log('🚀 开始初始化Twitter备注注入管理器，当前页面:', location.href)
    console.log('📍 当前时间:', new Date().toISOString())

    manager = new TwitterNotesInjectionManager()

    console.log('✅ Twitter备注注入管理器初始化成功');

    // 添加全局调试函数
    (window as any).tw3trackDebug = {
      manager,
      getStatus: () => manager?.getStatus(),
      testMessage: () => {
        console.log('🧪 测试消息接收...')
        chrome.runtime.sendMessage({
          type: 'TWITTER_NOTES_CACHE_UPDATED',
          notes: []
        }).catch(console.error)
      }
    }

    console.log('🔧 调试工具已添加到 window.tw3trackDebug')
  } catch (error) {
    console.error('❌ Twitter备注注入管理器初始化失败:', error)
  }
}

/**
 * 清理管理器
 */
function cleanupManager() {
  if (manager) {
    try {
      manager.cleanup()
      manager = null
      console.log('🧹 Twitter备注注入管理器已清理')
    } catch (error) {
      console.error('❌ 清理Twitter备注注入管理器失败:', error)
    }
  }
}

/**
 * 获取管理器状态
 */
function getManagerStatus() {
  if (manager) {
    return manager.getStatus()
  } else {
    return {
      enabled: false,
      injectedBadges: 0,
      localNotes: 0,
      currentRestId: null,
      currentUrl: location.href,
      pageType: 'unknown'
    }
  }
}

/**
 * 启用/禁用功能
 */
function setEnabled(enabled: boolean) {
  if (manager) {
    manager.setEnabled(enabled)
  } else if (enabled) {
    initializeManager()
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initializeManager()
    } catch (error) {
      console.error('❌ Twitter备注DOMContentLoaded初始化失败:', error)
    }
  })
} else {
  // 延迟初始化，确保页面完全加载
  setTimeout(() => {
    try {
      initializeManager()
    } catch (error) {
      console.error('❌ Twitter备注延迟初始化失败:', error)
    }
  }, 100)
}

// 页面卸载时清理
window.addEventListener('beforeunload', cleanupManager)

// 导出管理器实例和控制函数（用于调试和外部控制）
export { 
  manager, 
  initializeManager, 
  cleanupManager, 
  getManagerStatus, 
  setEnabled 
}

// 导入调试工具（仅在开发环境）
if (process.env.NODE_ENV === 'development') {
  import('./test/debug').catch(console.warn)
}

// 全局调试接口
if (typeof window !== 'undefined') {
  (window as any).tw3trackNotesInjection = {
    getStatus: getManagerStatus,
    setEnabled,
    cleanup: cleanupManager,
    reinitialize: () => {
      cleanupManager()
      initializeManager()
    }
  }
}
