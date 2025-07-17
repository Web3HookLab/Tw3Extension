/**
 * 统计卡片按钮组件
 * 处理刷新、切换、历史等按钮的事件绑定
 */

import { sendToBackground } from "@plasmohq/messaging"
import { TwitterDataService } from '../../../services/twitter-data.service'
import { StatsCardContent } from './StatsCardContent'
import { StatsCardHeader } from './StatsCardHeader'

import { getContentI18n } from '~src/utils/i18n-content'

export class StatsCardButtons {
  /**
   * 绑定按钮事件
   */
  static bindEvents(
    card: HTMLElement, 
    restId: string, 
    content: HTMLElement, 
    isDarkMode: boolean
  ): void {
    // 获取按钮元素
    const refreshBtn = card.querySelector('.tw3track-refresh-btn') as HTMLElement
    const toggleBtn = card.querySelector('.tw3track-toggle-btn') as HTMLElement
    const historyBtn = card.querySelector('.tw3track-history-btn') as HTMLElement

    if (refreshBtn) {
      this.bindRefreshButton(refreshBtn, restId, content, isDarkMode)
    }

    if (toggleBtn) {
      this.bindToggleButton(toggleBtn, content, isDarkMode)
    }

    if (historyBtn) {
      this.bindHistoryButton(historyBtn, restId)
    }

    // 初始加载数据
    setTimeout(() => {
      this.loadCardData(restId, content, isDarkMode)
    }, 100)
  }

  /**
   * 绑定刷新按钮
   */
  private static bindRefreshButton(
    button: HTMLElement, 
    restId: string, 
    content: HTMLElement, 
    isDarkMode: boolean
  ): void {
    button.addEventListener('click', async () => {
      console.log('🔄 刷新按钮点击')
      
      // 添加旋转动画
      button.style.animation = 'tw3track-spin 1s linear infinite'
      
      try {
        await this.loadCardData(restId, content, isDarkMode, true)
      } finally {
        // 移除动画
        button.style.animation = ''
      }
    })
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
      console.log('🔄 切换按钮点击，当前状态:', isExpanded)
      
      isExpanded = !isExpanded
      
      // 更新按钮图标
      const i18n = await getContentI18n()
      const t = i18n.t.bind(i18n)
      StatsCardHeader.updateToggleButton(button, isExpanded, t)
      
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

  /**
   * 绑定历史按钮
   */
  private static bindHistoryButton(button: HTMLElement, restId: string): void {
    button.addEventListener('click', async (event) => {
      // 阻止事件冒泡
      event.preventDefault()
      event.stopPropagation()
      
      console.log('🔄 历史按钮点击')
      
      try {
        // 获取当前用户数据
        const userData = await this.getCurrentUserData(restId)

        // 获取国际化文本
        const i18n = await getContentI18n()
        const t = i18n.t.bind(i18n)

        // 直接打开历史侧边栏，权限检查在侧边栏中进行
        await this.openHistorySidePanel(
          'userHistory',
          t('twitterDisplay.historyTimeline'),
          restId,
          userData
        )
      } catch (error) {
        console.error('❌ 处理历史按钮点击失败:', error)
        alert('打开历史记录失败，请重试')
      }
    })
  }

  /**
   * 打开历史侧边栏 - 使用 PlasmoMessaging 在用户手势上下文中调用
   */
  private static async openHistorySidePanel(
    type: string,
    title: string,
    restId: string,
    userData?: any
  ): Promise<void> {
    try {
      console.log('🔄 准备通过 PlasmoMessaging 打开历史侧边栏:', { type, title, restId, hasUserData: !!userData })

      // 使用 PlasmoMessaging 发送消息到 background script
      const response = await sendToBackground({
        name: "openSidePanel",
        body: {
          type,
          title,
          restId,
          userData: userData || null
        }
      })

      if (response?.success) {
        console.log('✅ 历史侧边栏打开请求已发送')
      } else {
        console.error('❌ 历史侧边栏打开失败:', response?.error)
        alert('打开历史记录失败：' + (response?.error || '未知错误'))
      }
    } catch (error) {
      console.error('❌ 打开历史侧边栏失败:', error)
      alert('打开历史记录失败，请重试')
    }
  }

  /**
   * 获取当前用户数据
   */
  private static async getCurrentUserData(restId: string): Promise<any> {
    try {
      // 使用项目正确的缓存键格式
      const cacheKey = `twitter_data_cache_${restId}`
      const cachedData = await chrome.storage.local.get(cacheKey)

      if (cachedData[cacheKey]) {
        console.log('📊 从缓存获取用户数据:', restId)
        const cached = cachedData[cacheKey]
        // 检查缓存数据格式 {data: {...}, timestamp: number}
        if (cached.data) {
          return cached.data
        } else {
          // 兼容旧格式
          return cached
        }
      }

      console.warn('⚠️ 未找到缓存的用户数据:', restId)
      return null
    } catch (error) {
      console.error('❌ 获取用户数据失败:', error)
      return null
    }
  }

  /**
   * 加载卡片数据
   */
  private static async loadCardData(
    restId: string, 
    content: HTMLElement, 
    isDarkMode: boolean, 
    forceRefresh: boolean = false
  ): Promise<void> {
    try {
      // 显示加载状态
      await StatsCardContent.showLoading(content, isDarkMode)
      
      // 获取数据
      const result = await TwitterDataService.getTwitterData(restId, forceRefresh)
      
      if (result.success && result.data) {
        // 显示成功状态
        await StatsCardContent.showSuccess(
          content,
          result.data,
          isDarkMode,
          result.fromCache || false,
          restId
        )
        
        console.log('✅ 卡片数据加载成功:', {
          restId,
          fromCache: result.fromCache,
          kolCount: result.data.kol_count || 0
        })

        // 发送数据更新事件，通知KOL卡片同步更新
        const dataUpdateEvent = new CustomEvent('tw3track-data-updated', {
          detail: {
            restId,
            data: result.data,
            fromCache: result.fromCache || false
          }
        })
        document.dispatchEvent(dataUpdateEvent)
        console.log('📡 已发送数据更新事件给KOL卡片')
      } else {
        // 显示错误状态（移除 retry 回调）
        await StatsCardContent.showError(
          content,
          result.error || '数据加载失败',
          isDarkMode
        )
        
        console.error('❌ 卡片数据加载失败:', result.error)
      }
    } catch (error) {
      console.error('❌ 加载卡片数据异常:', error)
      
      await StatsCardContent.showError(
        content,
        error instanceof Error ? error.message : '未知错误',
        isDarkMode
      )
    }
  }


}
