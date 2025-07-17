/**
 * 空状态组件
 * 显示无数据时的状态
 */

import { getContentI18n } from '~src/utils/i18n-content'

export class EmptyState {
  /**
   * 创建空状态元素
   */
  static create(
    container: HTMLElement, 
    message: string, 
    description?: string,
    isDarkMode: boolean = false
  ): void {
    const descriptionHtml = description ? `
      <div style="color: ${isDarkMode ? 'rgb(113, 113, 122)' : 'rgb(161, 161, 170)'}; font-size: 11px; margin-top: 4px;">
        ${description}
      </div>
    ` : ''

    container.innerHTML = `
      <div style="text-align: center; padding: 30px;">
        <div style="color: ${isDarkMode ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'}; font-size: 14px;">
          ${message}
        </div>
        ${descriptionHtml}
      </div>
    `
  }

  /**
   * 创建简单空状态
   */
  static createSimple(container: HTMLElement, message: string, isDarkMode: boolean): void {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: ${isDarkMode ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'}; font-size: 12px;">
        ${message}
      </div>
    `
  }

  /**
   * 创建KOL空状态
   */
  static async createKolEmpty(container: HTMLElement, isDarkMode: boolean): Promise<void> {
    try {
      const i18n = await getContentI18n()
      const t = i18n.t.bind(i18n)

      this.create(
        container,
        t('emptyState.noKolData'),
        t('emptyState.kolDescription'),
        isDarkMode
      )
    } catch (error) {
      console.warn('⚠️ Failed to load i18n for KOL empty state, using fallback:', error)
      // 使用回退文本
      this.create(
        container,
        '暂无KOL数据',
        '该用户可能没有任何KOL关注,或数据尚未收录',
        isDarkMode
      )
    }
  }

  /**
   * 创建历史空状态
   */
  static async createHistoryEmpty(container: HTMLElement, isDarkMode: boolean): Promise<void> {
    try {
      const i18n = await getContentI18n()
      const t = i18n.t.bind(i18n)

      this.create(
        container,
        t('emptyState.noHistoryData'),
        t('emptyState.historyDescription'),
        isDarkMode
      )
    } catch (error) {
      console.warn('⚠️ Failed to load i18n for history empty state, using fallback:', error)
      // 使用回退文本
      this.create(
        container,
        '暂无历史记录',
        '该用户可能没有相关的历史变更记录',
        isDarkMode
      )
    }
  }

  /**
   * 创建钱包空状态
   */
  static async createWalletEmpty(container: HTMLElement, isDarkMode: boolean): Promise<void> {
    try {
      const i18n = await getContentI18n()
      const t = i18n.t.bind(i18n)

      this.create(
        container,
        t('emptyState.noWalletData'),
        t('emptyState.walletDescription'),
        isDarkMode
      )
    } catch (error) {
      console.warn('⚠️ Failed to load i18n for wallet empty state, using fallback:', error)
      // 使用回退文本
      this.create(
        container,
        '暂无钱包地址',
        '未检测到与该用户相关的钱包地址',
        isDarkMode
      )
    }
  }
}
