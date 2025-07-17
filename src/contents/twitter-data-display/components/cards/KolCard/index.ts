/**
 * KOL卡片主组件
 * 显示用户关注的KOL列表
 */

import { KolCardHeader } from './KolCardHeader'
import { KolCardContent } from './KolCardContent'
import { KolCardButtons } from './KolCardButtons'
import type { TwitterUserData } from '~src/types/twitter-data.types'

export interface KolCardProps {
  restId: string
  userData?: TwitterUserData
  fromCache?: boolean
}

/**
 * 创建KOL卡片
 */
export async function createKolCard(restId: string): Promise<HTMLElement | null> {
  // 检查KOL列表显示设置
  const { TwitterSettingsService } = await import('../../../services/twitter-settings.service')
  const showKolListEnabled = await TwitterSettingsService.getShowKolListEnabled()
  
  if (!showKolListEnabled) {
    console.log('⏸️ KOL列表显示已禁用')
    return null
  }

  const card = document.createElement('div')
  card.className = 'tw3track-kol-card'
  card.setAttribute('data-testid', 'tw3track-kol')
  
  // 设置基础样式
  const isDarkMode = document.documentElement.style.colorScheme === 'dark' || 
                     document.body.classList.contains('dark') ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches ||
                     document.querySelector('[data-theme="dark"]') !== null

  card.style.cssText = `
    margin: 10px 0;
    border-radius: 8px;
    border: 1px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'};
    background-color: ${isDarkMode ? 'rgb(9, 9, 11)' : 'rgb(255, 255, 255)'};
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `

  // 创建头部
  const header = await KolCardHeader.create(restId, isDarkMode)
  if (header) {
    card.appendChild(header)
  }

  // 创建内容区域
  const content = KolCardContent.create(isDarkMode)
  card.appendChild(content)

  // 绑定按钮事件
  KolCardButtons.bindEvents(card, restId, content, isDarkMode)

  // 初始化KOL数据（监听数据更新事件）
  setTimeout(() => {
    KolCardContent.initializeData(content, restId, isDarkMode)
  }, 100) // 减少延迟从200ms到100ms

  return card
}

export { KolCardHeader, KolCardContent, KolCardButtons }
