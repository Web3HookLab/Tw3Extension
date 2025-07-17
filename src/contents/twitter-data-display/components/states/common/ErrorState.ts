/**
 * 错误状态组件
 * 显示错误信息和重试选项
 */

import { getContentI18n } from '~src/utils/i18n-content'

export class ErrorState {
  /**
   * 创建错误状态元素
   */
  static async create(
    container: HTMLElement,
    error: string,
    title: string,
    isDarkMode: boolean,
    onRetry?: () => void
  ): Promise<void> {
    // 获取国际化文本
    const i18n = await getContentI18n()
    const t = i18n.t.bind(i18n)

    // 处理特殊错误类型
    let displayError = error
    let errorTitle = title

    // 检测404用户不存在错误
    if (error.includes('404') || error.includes('Twitter user not found') || error.includes('User not found')) {
      displayError = t('twitterDisplay.noData')
      errorTitle = t('twitterDisplay.dataLoadFailed')
    }

    console.log('🔍 显示错误状态:', { originalError: error, displayError, errorTitle })

    // 移除 retry 按钮，简化错误显示
    const retryButton = ''

    container.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="color: rgb(239, 68, 68); font-size: 14px; margin-bottom: 8px;">${errorTitle}</div>
        <div style="color: ${isDarkMode ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'}; font-size: 12px;">${displayError}</div>
      </div>
    `

    // 移除重试事件绑定逻辑，简化错误处理
  }

  /**
   * 创建简单错误状态
   */
  static createSimple(container: HTMLElement, message: string, isDarkMode: boolean): void {
    container.innerHTML = `
      <div style="text-align: center; padding: 15px; color: rgb(239, 68, 68); font-size: 12px;">
        ${message}
      </div>
    `
  }

  /**
   * 创建网络错误状态
   */
  static async createNetworkError(container: HTMLElement, isDarkMode: boolean, onRetry?: () => void): Promise<void> {
    const i18n = await getContentI18n()
    const t = i18n.t.bind(i18n)

    await this.create(
      container,
      t('twitterDisplay.networkError'),
      t('twitterDisplay.error'),
      isDarkMode,
      onRetry
    )
  }

  /**
   * 创建服务器错误状态
   */
  static async createServerError(container: HTMLElement, isDarkMode: boolean, onRetry?: () => void): Promise<void> {
    const i18n = await getContentI18n()
    const t = i18n.t.bind(i18n)

    await this.create(
      container,
      t('twitterDisplay.serverError'),
      t('twitterDisplay.error'),
      isDarkMode,
      onRetry
    )
  }
}
