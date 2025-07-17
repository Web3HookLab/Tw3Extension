/**
 * 统计卡片头部组件
 * 包含标题、图标和操作按钮
 */

import { getContentI18n } from '~src/utils/i18n-content'

export class StatsCardHeader {
  /**
   * 创建卡片头部
   */
  static async create(restId: string, isDarkMode: boolean): Promise<HTMLElement> {
    const i18n = await getContentI18n()
    const t = i18n.t.bind(i18n)
    
    const header = document.createElement('div')
    header.className = 'tw3track-stats-header'
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'};
    `

    // 标题区域
    const titleSection = this.createTitleSection(t, isDarkMode)
    
    // 按钮区域
    const buttonsContainer = this.createButtonsContainer(t, isDarkMode)

    header.appendChild(titleSection)
    header.appendChild(buttonsContainer)

    return header
  }

  /**
   * 创建标题区域
   */
  private static createTitleSection(t: (key: string) => string, isDarkMode: boolean): HTMLElement {
    const titleSection = document.createElement('div')
    titleSection.style.cssText = `display: flex; align-items: center;`
    
    // 图标
    const icon = document.createElement('div')
    icon.innerHTML = `
      <img src="${chrome.runtime.getURL("assets/icon.png")}" alt="Tw3Track" style="
        width: 16px; 
        height: 16px; 
        border-radius: 50%; 
        margin-right: 6px;
        object-fit: cover;
      " />
    `

    // 标题
    const title = document.createElement('h3')
    title.textContent = t('twitterDisplay.title')
    title.style.cssText = `
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};
    `

    // 徽章
    const poweredByBadge = document.createElement('span')
    poweredByBadge.textContent = t('twitterDisplay.poweredByBadge')
    poweredByBadge.style.cssText = `
      margin-left: 6px;
      padding: 2px 6px;
      background: ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
      color: rgb(59, 130, 246);
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      line-height: 1.2;
    `

    titleSection.appendChild(icon)
    titleSection.appendChild(title)
    titleSection.appendChild(poweredByBadge)

    return titleSection
  }

  /**
   * 创建按钮容器
   */
  private static createButtonsContainer(t: (key: string) => string, isDarkMode: boolean): HTMLElement {
    const buttonsContainer = document.createElement('div')
    buttonsContainer.className = 'tw3track-buttons-container'
    buttonsContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
    `

    // 用户历史按钮（会员功能）
    const historyBtn = this.createButton('history', t('twitterDisplay.userHistoryTooltip'), isDarkMode, `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
    `)

    // 收回/展开按钮
    const toggleBtn = this.createButton('toggle', t('twitterDisplay.collapse'), isDarkMode, `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    `)

    // 刷新按钮
    const refreshBtn = this.createButton('refresh', t('twitterDisplay.refresh'), isDarkMode, `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M3 21v-5h5"/>
      </svg>
    `)

    buttonsContainer.appendChild(historyBtn)
    buttonsContainer.appendChild(toggleBtn)
    buttonsContainer.appendChild(refreshBtn)

    return buttonsContainer
  }

  /**
   * 创建按钮
   */
  private static createButton(type: string, tooltip: string, isDarkMode: boolean, iconSvg: string): HTMLElement {
    const button = document.createElement('button')
    button.className = `tw3track-${type}-btn`
    button.innerHTML = iconSvg
    button.title = tooltip
    button.style.cssText = `
      width: 28px;
      height: 28px;
      border: 1px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'};
      background: transparent;
      color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    `

    // 悬停效果
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)'
    })
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'transparent'
    })

    return button
  }

  /**
   * 更新切换按钮状态
   */
  static updateToggleButton(button: HTMLElement, isExpanded: boolean, t: (key: string) => string): void {
    const iconSvg = isExpanded ? `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    ` : `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    `
    
    button.innerHTML = iconSvg
    button.title = isExpanded ? t('twitterDisplay.collapse') : t('twitterDisplay.expand')
  }
}
