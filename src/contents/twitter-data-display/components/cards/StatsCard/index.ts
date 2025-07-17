/**
 * 统计卡片主组件
 * 显示Twitter用户的统计数据
 */

import { StatsCardHeader } from './StatsCardHeader'
import { StatsCardContent } from './StatsCardContent'
import { StatsCardButtons } from './StatsCardButtons'
import type { TwitterUserData } from '~src/types/twitter-data.types'

export interface StatsCardProps {
  restId: string
  userData?: TwitterUserData
  fromCache?: boolean
  onRefresh?: () => void
  onToggle?: (expanded: boolean) => void
  onHistoryClick?: () => void
}

/**
 * 创建统计卡片
 */
export async function createStatsCard(restId: string): Promise<HTMLElement> {
  const card = document.createElement('div')
  card.className = 'tw3track-stats-card'
  card.setAttribute('data-testid', 'tw3track-stats')
  
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
  const header = await StatsCardHeader.create(restId, isDarkMode)
  card.appendChild(header)

  // 创建内容区域
  const content = StatsCardContent.create(isDarkMode)
  card.appendChild(content)

  // 绑定按钮事件
  StatsCardButtons.bindEvents(card, restId, content, isDarkMode)

  return card
}

export { StatsCardHeader, StatsCardContent, StatsCardButtons }
