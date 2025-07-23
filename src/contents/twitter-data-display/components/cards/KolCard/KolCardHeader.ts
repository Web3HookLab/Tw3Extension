/**
 * KOL卡片头部组件
 * 显示KOL卡片的标题和操作按钮
 */

import { getContentI18n } from '~src/utils/i18n-content'

export class KolCardHeader {
  /**
   * 创建KOL卡片头部
   */
  static async create(restId: string, isDarkMode: boolean): Promise<HTMLElement | null> {
    try {
      const i18n = await getContentI18n()
      const t = i18n.t.bind(i18n)
      
      const header = document.createElement('div')
      header.className = 'tw3track-kol-header'
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
    } catch (error) {
      console.error('❌ 创建KOL卡片头部失败:', error)
      return null
    }
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'}" stroke-width="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="m22 21-3-3m0 0a5.5 5.5 0 1 0-7.78-7.78 5.5 5.5 0 0 0 7.78 7.78Z"/>
      </svg>
    `
    icon.style.marginRight = '6px'

    // 标题
    const title = document.createElement('h3')
    title.textContent = t('twitterDisplay.kolCard').replace('{count}', '...')
    title.style.cssText = `
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};
    `

    titleSection.appendChild(icon)
    titleSection.appendChild(title)

    return titleSection
  }

  /**
   * 创建按钮容器
   */
  private static createButtonsContainer(t: (key: string) => string, isDarkMode: boolean): HTMLElement {
    const buttonsContainer = document.createElement('div')
    buttonsContainer.className = 'tw3track-kol-buttons-container'
    buttonsContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
    `

    // 收回/展开按钮
    const toggleBtn = this.createButton('toggle', t('twitterDisplay.collapse'), isDarkMode, `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m18 15-6-6-6 6"/>
      </svg>
    `)

    buttonsContainer.appendChild(toggleBtn)

    return buttonsContainer
  }

  /**
   * 创建按钮
   */
  private static createButton(type: string, tooltip: string, isDarkMode: boolean, iconSvg: string): HTMLElement {
    const button = document.createElement('button')
    button.className = `tw3track-kol-${type}-btn`
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

  /**
   * 更新标题中的KOL数量
   */
  static async updateKolCount(header: HTMLElement, count: number): Promise<void> {
    try {
      const title = header.querySelector('h3')
      if (title) {
        const i18n = await getContentI18n()
        const t = i18n.t.bind(i18n)
        const text = t('twitterDisplay.kolCard').replace('{count}', count.toString())
        title.textContent = text
      }
    } catch (error) {
      console.warn('⚠️ 更新KOL数量失败:', error)
      // 降级处理
      const title = header.querySelector('h3')
      if (title) {
        const language = document.documentElement.lang || 'zh'
        const text = language === 'zh' ? `KOL关注者 (${count}个)` : `KOL Followers (${count})`
        title.textContent = text
      }
    }
  }
}
