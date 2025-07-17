/**
 * 注入工具函数
 * 提供安全的DOM注入和验证功能
 */

import { safeQuerySelector, safeRemoveElement, isElementVisible } from './dom.utils'
import type { InjectionTarget, InjectionResult } from '../types/twitter-notes-injection.types'

/**
 * 新的简化注入目标配置
 */
export const NEW_INJECTION_TARGETS = {
  // 用户主页操作按钮区域
  USER_ACTIONS: {
    name: 'UserActions',
    selector: '[data-testid="userActions"]',
    context: 'profile-actions',
    findContainer: (element: Element) => element,
    insertPosition: 'after' as const,
    priority: 1
  },

  // 推文的 Grok actions 区域
  GROK_ACTIONS: {
    name: 'GrokActions',
    selector: '[aria-label="Grok actions"]',
    context: 'tweet-actions',
    findContainer: (element: Element) => element.parentElement,
    insertPosition: 'before' as const,
    priority: 1
  }
} as const

/**
 * 验证注入容器
 */
export function validateInjectionContainer(container: Element): boolean {
  if (!container) {
    return false
  }
  
  // 检查容器是否可见
  if (!isElementVisible(container)) {
    console.log('⚠️ 注入容器不可见')
    return false
  }
  
  // 检查容器是否已经包含我们的徽章
  if (container.querySelector('.tw3track-note-badge')) {
    console.log('⚠️ 容器已包含徽章')
    return false
  }
  
  return true
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
        if (container && validateInjectionContainer(container)) {
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
 * 查找用户主页操作按钮注入点
 */
export function findUserActionsInjectionPoint(): InjectionResult {
  try {
    const element = safeQuerySelector(NEW_INJECTION_TARGETS.USER_ACTIONS.selector)
    if (element && validateInjectionContainer(element)) {
      console.log(`🎯 找到用户操作按钮注入点`)
      return {
        success: true,
        container: element,
        targetName: NEW_INJECTION_TARGETS.USER_ACTIONS.name
      }
    }
  } catch (error) {
    console.warn('⚠️ 检查用户操作按钮注入点失败:', error)
  }

  return {
    success: false,
    error: '未找到用户操作按钮注入点'
  }
}

/**
 * 查找推文Grok actions注入点
 */
export function findGrokActionsInjectionPoint(tweetElement: Element): InjectionResult {
  try {
    const element = tweetElement.querySelector(NEW_INJECTION_TARGETS.GROK_ACTIONS.selector)
    if (element) {
      const container = NEW_INJECTION_TARGETS.GROK_ACTIONS.findContainer(element)
      if (container && validateInjectionContainer(container)) {
        console.log(`🎯 找到Grok actions注入点`)
        return {
          success: true,
          container,
          targetName: NEW_INJECTION_TARGETS.GROK_ACTIONS.name
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ 检查Grok actions注入点失败:', error)
  }

  return {
    success: false,
    error: '未找到Grok actions注入点'
  }
}

/**
 * 智能注入徽章
 */
export function smartInjectBadge(
  container: Element,
  badgeElement: HTMLElement,
  insertPosition: 'before' | 'after' = 'after'
): boolean {
  try {
    if (!container || !badgeElement) {
      console.warn('⚠️ 注入参数无效')
      return false
    }

    // 检查是否已经注入过
    if (container.hasAttribute('data-tw3track-injected')) {
      console.log('⏭️ 容器已注入，跳过')
      return false
    }

    // 检查容器是否可见
    if (!isElementVisible(container)) {
      console.warn('⚠️ 注入容器不可见')
      return false
    }

    // 执行注入 - 不需要额外包装，徽章本身已经有正确的样式
    if (insertPosition === 'before') {
      container.parentNode?.insertBefore(badgeElement, container)
    } else {
      container.parentNode?.insertBefore(badgeElement, container.nextSibling)
    }

    // 标记已注入
    container.setAttribute('data-tw3track-injected', 'true')

    console.log('✅ 徽章注入成功')
    return true
  } catch (error) {
    console.error('❌ 徽章注入失败:', error)
    return false
  }
}

/**
 * 清理已注入的徽章
 */
export function clearInjectedBadges(selector: string = '.tw3track-note-badge'): number {
  try {
    const badges = document.querySelectorAll(selector)
    let removedCount = 0

    badges.forEach(badge => {
      if (safeRemoveElement(badge)) {
        removedCount++
      }
    })

    // 清理注入标记
    const injectedContainers = document.querySelectorAll('[data-tw3track-injected]')
    injectedContainers.forEach(container => {
      container.removeAttribute('data-tw3track-injected')
    })

    if (removedCount > 0) {
      console.log(`🧹 已清理 ${removedCount} 个徽章和注入标记`)
    }

    return removedCount
  } catch (error) {
    console.error('❌ 清理徽章时出错:', error)
    return 0
  }
}

/**
 * 检查徽章是否已存在
 */
export function hasBadgeInjected(container: Element, badgeClass: string = 'tw3track-note-badge'): boolean {
  return container.querySelector(`.${badgeClass}`) !== null
}

/**
 * 生成唯一的徽章ID
 */
export function generateBadgeId(restId: string, context: string = 'default'): string {
  const timestamp = Date.now()
  return `twitter-note-badge-${context}-${restId}-${timestamp}`
}

/**
 * 获取注入统计信息
 */
export function getInjectionStats(): {
  totalBadges: number
  userActionsBadges: number
  grokActionsBadges: number
  injectionPoints: string[]
} {
  const allBadges = document.querySelectorAll('.tw3track-note-badge')
  const userActionsBadges = document.querySelectorAll('.tw3track-note-badge[data-context="profile-actions"]')
  const grokActionsBadges = document.querySelectorAll('.tw3track-note-badge[data-context="tweet-actions"]')

  // 检测可用的注入点
  const injectionPoints: string[] = []

  if (safeQuerySelector(NEW_INJECTION_TARGETS.USER_ACTIONS.selector)) {
    injectionPoints.push('userActions')
  }

  if (safeQuerySelector(NEW_INJECTION_TARGETS.GROK_ACTIONS.selector)) {
    injectionPoints.push('grokActions')
  }

  return {
    totalBadges: allBadges.length,
    userActionsBadges: userActionsBadges.length,
    grokActionsBadges: grokActionsBadges.length,
    injectionPoints
  }
}

/**
 * 验证注入环境
 */
export function validateInjectionEnvironment(): boolean {
  // 检查是否在正确的域名
  if (!location.hostname.includes('x.com') && !location.hostname.includes('twitter.com')) {
    console.log('❌ 不在支持的域名')
    return false
  }
  
  // 检查基本的DOM结构
  if (!document.body) {
    console.log('❌ 页面DOM未准备好')
    return false
  }
  
  return true
}
