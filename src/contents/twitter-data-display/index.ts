/**
 * Twitter数据显示模块主入口
 * 负责初始化TwitterDataDisplayManager并管理生命周期
 */

import { TwitterDataDisplayManager } from './TwitterDataDisplayManager'

// 管理器实例
let manager: TwitterDataDisplayManager | null = null

/**
 * 初始化Twitter数据显示管理器
 */
function initializeManager() {
  if (manager) {
    console.log('⚠️ Twitter数据显示管理器已存在，跳过初始化')
    return
  }
  
  try {
    manager = new TwitterDataDisplayManager()
    console.log('✅ Twitter数据显示管理器初始化成功')
  } catch (error) {
    console.error('❌ Twitter数据显示管理器初始化失败:', error)
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
      console.log('🧹 Twitter数据显示管理器已清理')
    } catch (error) {
      console.error('❌ 清理Twitter数据显示管理器失败:', error)
    }
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeManager)
} else {
  // 延迟初始化，确保页面完全加载
  setTimeout(initializeManager, 100)
}

// 页面卸载时清理
window.addEventListener('beforeunload', cleanupManager)

// 导出管理器实例（用于调试）
export { manager }
