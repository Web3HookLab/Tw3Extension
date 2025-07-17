/**
 * 注入工具函数
 * 提供安全的DOM注入和验证功能
 */

import { safeQuerySelector } from './dom.utils'
// import { waitForElement, isDarkMode } from './dom.utils' // 暂时未使用
import type { InjectionTarget, InjectionResult, ValidationResult } from '~src/types/twitter-display.types'

/**
 * 验证注入环境
 */
export function validateInjectionEnvironment(): ValidationResult {
  // 检查是否在Twitter域名
  if (!location.hostname.includes('x.com') && !location.hostname.includes('twitter.com')) {
    return { 
      isValid: false, 
      reason: '不在Twitter域名',
      suggestions: ['请在Twitter/X网站上使用此功能']
    }
  }

  // 检查是否有基本的DOM结构
  if (!document.body) {
    return { 
      isValid: false, 
      reason: 'DOM未完全加载',
      suggestions: ['请等待页面完全加载后重试']
    }
  }

  // 检查是否已经注入过
  if (safeQuerySelector('.tw3track-stats-card')) {
    return { 
      isValid: false, 
      reason: '已存在注入的卡片',
      suggestions: ['刷新页面后重试']
    }
  }

  return { isValid: true }
}

/**
 * 检查是否为用户资料页面
 */
export function isUserProfilePage(): boolean {
  const pathname = location.pathname

  // 检查URL模式：/username 或 /username/ 或 /username/子页面
  // 支持子页面：with_replies, highlights, media, articles
  const isProfilePattern = /^\/[^\/]+(?:\/(with_replies|highlights|media|articles))?(?:\/)?$/.test(pathname)

  // 排除特殊页面
  const excludePatterns = [
    '/home', '/explore', '/notifications', '/messages',
    '/bookmarks', '/lists', '/profile', '/settings',
    '/i/', '/search', '/compose', '/login', '/signup'
  ]

  const isExcluded = excludePatterns.some(pattern => pathname.startsWith(pattern))

  return isProfilePattern && !isExcluded
}

/**
 * 提取用户rest_id
 */
export function extractRestId(): string | null {
  try {
    // 查找JSON-LD脚本
    const jsonLDScripts = document.querySelectorAll('script[type="application/ld+json"]')
    
    for (const script of jsonLDScripts) {
      try {
        const data = JSON.parse(script.textContent || '')
        
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
 * 查找最佳注入点
 */
export function findBestInjectionPoint(targets: InjectionTarget[]): InjectionResult {
  // 按优先级排序
  const sortedTargets = targets.sort((a, b) => a.priority - b.priority)
  
  for (const target of sortedTargets) {
    try {
      const element = safeQuerySelector(target.selector)
      if (element) {
        const container = target.findContainer(element)
        if (container) {
          console.log(`🎯 找到注入点: ${target.name}`)
          return {
            success: true,
            container,
            targetName: target.name
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ 检查注入点失败: ${target.name}`, error)
      continue
    }
  }

  return {
    success: false,
    error: '未找到任何可用的注入点'
  }
}

/**
 * 等待注入条件就绪
 */
export async function waitForInjectionReady(timeout: number = 10000): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    // 检查基本条件
    if (!isUserProfilePage()) {
      await new Promise(resolve => setTimeout(resolve, 500))
      continue
    }
    
    // 检查是否有用户资料元素
    const hasUserProfile = safeQuerySelector('[data-testid="UserName"]') || 
                          safeQuerySelector('[data-testid="UserProfileHeader_Items"]') ||
                          safeQuerySelector('[data-testid="UserJoinDate"]')
    
    if (hasUserProfile) {
      console.log('✅ 注入条件已就绪')
      return true
    }
    
    // 等待一段时间后重试
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('❌ 等待注入条件超时')
  return false
}

/**
 * 安全注入元素
 */
export function safeInjectElement(
  container: Element,
  element: HTMLElement,
  position: 'before' | 'after' = 'after'
): boolean {
  try {
    if (position === 'before') {
      container.parentNode?.insertBefore(element, container)
    } else {
      container.parentNode?.insertBefore(element, container.nextSibling)
    }
    
    console.log('✅ 元素注入成功')
    return true
  } catch (error) {
    console.error('❌ 元素注入失败:', error)
    return false
  }
}

/**
 * 清理注入的元素
 */
export function cleanupInjectedElements(): number {
  const selectors = [
    '.tw3track-stats-card',
    '.tw3track-kol-card',
    '[data-testid="tw3track-stats"]',
    '[data-testid="tw3track-kol"]'
  ]
  
  let cleanedCount = 0
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector)
    elements.forEach(element => {
      try {
        element.remove()
        cleanedCount++
      } catch (error) {
        console.warn('⚠️ 清理元素失败:', error)
      }
    })
  })
  
  if (cleanedCount > 0) {
    console.log(`🧹 已清理 ${cleanedCount} 个注入元素`)
  }
  
  return cleanedCount
}

/**
 * 获取注入统计信息
 */
export function getInjectionStats(): {
  hasStatsCard: boolean
  hasKolCard: boolean
  totalCards: number
  injectionPoints: string[]
} {
  const statsCards = document.querySelectorAll('.tw3track-stats-card')
  const kolCards = document.querySelectorAll('.tw3track-kol-card')
  
  // 检测注入点
  const injectionPoints: string[] = []
  const targets = [
    'UserDescription',
    'UserProfileHeader_Items', 
    'UserJoinDate',
    'FollowersSection',
    'UserName'
  ]
  
  targets.forEach(target => {
    if (safeQuerySelector(`[data-testid="${target}"]`)) {
      injectionPoints.push(target)
    }
  })
  
  return {
    hasStatsCard: statsCards.length > 0,
    hasKolCard: kolCards.length > 0,
    totalCards: statsCards.length + kolCards.length,
    injectionPoints
  }
}

/**
 * 创建注入样式
 */
export function injectStyles(): void {
  if (document.getElementById('tw3track-twitter-styles')) return
  
  const style = document.createElement('style')
  style.id = 'tw3track-twitter-styles'
  style.textContent = `
    .tw3track-stats-card,
    .tw3track-kol-card {
      margin: 10px 0;
      z-index: 1000;
      animation: tw3track-slideDown 0.3s ease-out;
    }
    
    .tw3track-stats-card:hover,
    .tw3track-kol-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
      transition: all 0.2s ease;
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
    
    .tw3track-stat-item {
      transition: all 0.2s ease;
    }
    
    .tw3track-stat-item:hover {
      transform: translateY(-1px);
    }
  `
  
  document.head.appendChild(style)
  console.log('✅ 注入样式已添加')
}
