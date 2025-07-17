/**
 * KOL卡片按钮组件
 * 处理KOL卡片的按钮事件
 */

import { getContentI18n } from '~src/utils/i18n-content'
import { KolCardHeader } from './KolCardHeader'

export class KolCardButtons {
  /**
   * 绑定按钮事件
   */
  static bindEvents(
    card: HTMLElement,
    restId: string,
    content: HTMLElement,
    isDarkMode: boolean
  ): void {
    // 绑定切换按钮
    const toggleButton = card.querySelector('.tw3track-kol-toggle-btn') as HTMLElement
    if (toggleButton) {
      this.bindToggleButton(toggleButton, content, isDarkMode)
    }
  }

  /**
   * 绑定切换按钮
   */
  private static bindToggleButton(
    button: HTMLElement, 
    content: HTMLElement, 
    isDarkMode: boolean
  ): void {
    let isExpanded = true // 默认展开状态
    
    button.addEventListener('click', async () => {
      console.log('🔄 KOL卡片切换按钮点击，当前状态:', isExpanded)
      
      isExpanded = !isExpanded
      
      // 更新按钮图标
      const i18n = await getContentI18n()
      const t = i18n.t.bind(i18n)
      KolCardHeader.updateToggleButton(button, isExpanded, t)
      
      // 切换内容显示/隐藏
      if (isExpanded) {
        content.style.display = 'block'
        content.style.animation = 'tw3track-slideDown 0.2s ease-out'
      } else {
        content.style.animation = 'tw3track-slideUp 0.2s ease-out'
        setTimeout(() => {
          content.style.display = 'none'
        }, 200)
      }
    })
  }
}
