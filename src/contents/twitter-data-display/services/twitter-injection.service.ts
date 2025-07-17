/**
 * Twitter注入服务
 * 负责将卡片注入到Twitter页面的合适位置
 */

import type { InjectionTarget, InjectionResult } from '~src/types/twitter-display.types'
import { createStatsCard } from '../components/cards/StatsCard'
import { createKolCard } from '../components/cards/KolCard'

export class TwitterInjectionService {
  /**
   * 注入卡片到页面
   */
  static async injectCards(
    restId: string, 
    targets: InjectionTarget[], 
    showKolList: boolean
  ): Promise<boolean> {
    try {
      console.log('🚀 开始注入卡片:', restId, { showKolList })

      // 查找合适的注入点
      const injectionResult = this.findInjectionContainer(targets)
      
      if (!injectionResult.success || !injectionResult.container) {
        console.log('❌ 未找到合适的注入容器:', injectionResult.error)
        return false
      }

      console.log(`🎯 找到注入点: ${injectionResult.targetName}`)

      // 创建统计卡片
      const statsCard = await createStatsCard(restId)
      
      // 注入统计卡片
      this.insertCard(injectionResult.container, statsCard, injectionResult.targetName!)
      console.log('✅ 统计卡片注入成功')

      // 创建并注入KOL卡片（如果启用）
      if (showKolList) {
        const kolCard = await createKolCard(restId)
        if (kolCard) {
          statsCard.parentNode?.insertBefore(kolCard, statsCard.nextSibling)
          console.log('✅ KOL卡片注入成功')
        } else {
          console.log('⏸️ KOL卡片创建被跳过（设置已禁用）')
        }
      } else {
        console.log('⏸️ KOL列表显示已禁用，跳过KOL卡片注入')
      }

      return true
    } catch (error) {
      console.error('❌ 卡片注入失败:', error)
      return false
    }
  }

  /**
   * 查找注入容器
   */
  private static findInjectionContainer(targets: InjectionTarget[]): InjectionResult {
    console.log('🔍 开始查找注入容器，目标数量:', targets.length)

    // 按优先级尝试每个注入点
    const sortedTargets = targets.sort((a, b) => a.priority - b.priority)

    for (const target of sortedTargets) {
      try {
        console.log(`🎯 尝试注入点: ${target.name} (优先级: ${target.priority})`)
        console.log(`   选择器: ${target.selector}`)

        const element = document.querySelector(target.selector)
        if (!element) {
          console.log(`   ❌ 元素不存在`)
          continue
        }

        console.log(`   ✅ 找到目标元素:`, element)

        const container = target.findContainer(element)
        if (!container) {
          console.log(`   ❌ 容器查找失败`)
          continue
        }

        console.log(`   ✅ 找到容器:`, container)

        // 验证容器是否可见和有效
        if (!this.validateContainer(container)) {
          console.log(`   ❌ 容器验证失败`)
          continue
        }

        console.log(`🎯 成功找到注入点: ${target.name}`)
        return {
          success: true,
          container,
          targetName: target.name
        }
      } catch (error) {
        console.warn(`⚠️ 检查注入点失败: ${target.name}`, error)
        continue
      }
    }

    console.log('❌ 未找到任何可用的注入点')
    return {
      success: false,
      error: '未找到任何可用的注入点'
    }
  }

  /**
   * 验证容器是否有效
   */
  private static validateContainer(container: Element): boolean {
    try {
      // 检查容器是否在DOM中
      if (!document.contains(container)) {
        console.log('   ⚠️ 容器不在DOM中')
        return false
      }

      // 检查容器是否可见
      const rect = container.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        console.log('   ⚠️ 容器不可见')
        return false
      }

      // 检查是否已经包含我们的卡片
      if (container.querySelector('.tw3track-stats-card') ||
          container.querySelector('.tw3track-kol-card')) {
        console.log('   ⚠️ 容器已包含卡片')
        return false
      }

      return true
    } catch (error) {
      console.warn('   ⚠️ 容器验证出错:', error)
      return false
    }
  }

  /**
   * 插入卡片到容器
   */
  private static insertCard(container: Element, card: HTMLElement, targetName: string): void {
    try {
      // 根据目标类型调整插入位置
      if (targetName === 'UserDescription' || targetName === 'UserProfileHeader_Items') {
        // 对于用户描述和资料头部，插入到后面
        container.parentNode?.insertBefore(card, container.nextSibling)
      } else {
        // 对于其他元素，插入到容器后面
        const parentContainer = container.parentElement
        if (parentContainer) {
          parentContainer.insertBefore(card, container.nextSibling)
        } else {
          container.parentNode?.insertBefore(card, container.nextSibling)
        }
      }
      
      console.log(`📍 卡片已插入到 ${targetName} 后面`)
    } catch (error) {
      console.error('❌ 插入卡片失败:', error)
      throw error
    }
  }

  /**
   * 验证注入环境
   */
  static validateInjectionEnvironment(): { isValid: boolean; reason?: string } {
    // 检查是否在Twitter域名
    if (!location.hostname.includes('x.com') && !location.hostname.includes('twitter.com')) {
      return { isValid: false, reason: '不在Twitter域名' }
    }

    // 检查是否有基本的DOM结构
    if (!document.body) {
      return { isValid: false, reason: 'DOM未完全加载' }
    }

    // 检查是否已经注入过
    if (document.querySelector('.tw3track-stats-card')) {
      return { isValid: false, reason: '已存在注入的卡片' }
    }

    return { isValid: true }
  }

  /**
   * 清理注入的元素
   */
  static cleanupInjectedElements(): number {
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
        element.remove()
        cleanedCount++
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
  static getInjectionStats(): {
    hasStatsCard: boolean
    hasKolCard: boolean
    totalCards: number
  } {
    const statsCards = document.querySelectorAll('.tw3track-stats-card')
    const kolCards = document.querySelectorAll('.tw3track-kol-card')
    
    return {
      hasStatsCard: statsCards.length > 0,
      hasKolCard: kolCards.length > 0,
      totalCards: statsCards.length + kolCards.length
    }
  }
}
