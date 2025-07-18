/**
 * Twitter数据显示模块主入口
 * 负责初始化TwitterDataDisplayManager并管理生命周期
 */

import { TwitterDataDisplayManager } from './TwitterDataDisplayManager'

/**
 * 初始化Twitter数据显示管理器
 */
async function initializeManager() {
  try {
    console.log('🚀 开始初始化Twitter数据显示管理器')
    await TwitterDataDisplayManager.initialize()
    console.log('✅ Twitter数据显示管理器初始化成功')
  } catch (error) {
    console.error('❌ Twitter数据显示管理器初始化失败:', error)
  }
}

/**
 * 清理管理器
 */
function cleanupManager() {
  try {
    TwitterDataDisplayManager.destroy()
    console.log('🧹 Twitter数据显示管理器已清理')
  } catch (error) {
    console.error('❌ 清理Twitter数据显示管理器失败:', error)
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

// 导出管理器类（用于调试）
export { TwitterDataDisplayManager }
