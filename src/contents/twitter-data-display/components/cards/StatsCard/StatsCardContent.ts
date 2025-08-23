/**
 * 统计卡片内容组件
 * 显示用户的统计数据和代币分析
 */

import { sendToBackground } from "@plasmohq/messaging"
import { LoadingState } from '../../states/common/LoadingState'
import { ErrorState } from '../../states/common/ErrorState'
import { getContentI18n } from '~src/utils/i18n-content'
import { formatTime } from '../../../utils/format.utils'
import type { TwitterUserData } from '~src/types/twitter-data.types'

export class StatsCardContent {
  /**
   * 创建内容区域
   */
  static create(_isDarkMode: boolean): HTMLElement {
    const content = document.createElement('div')
    content.className = 'tw3track-stats-content'
    content.style.cssText = `padding: 14px;`

    return content
  }

  /**
   * 显示加载状态
   */
  static async showLoading(container: HTMLElement, isDarkMode: boolean): Promise<void> {
    const i18n = await getContentI18n()
    const message = i18n.t('twitterDisplay.loadingAnalysis')
    
    LoadingState.create(container, message, isDarkMode)
  }

  /**
   * 显示错误状态
   */
  static async showError(
    container: HTMLElement, 
    error: string, 
    isDarkMode: boolean,
    onRetry?: () => void
  ): Promise<void> {
    const i18n = await getContentI18n()
    const title = i18n.t('twitterDisplay.error')
    
    ErrorState.create(container, error, title, isDarkMode, onRetry)
  }

  /**
   * 显示成功状态
   */
  static async showSuccess(
    container: HTMLElement,
    data: TwitterUserData,
    isDarkMode: boolean,
    fromCache: boolean = false,
    restId?: string
  ): Promise<void> {
    const i18n = await getContentI18n()
    const t = i18n.t.bind(i18n)
    const language = i18n.getLanguage()

    // 第一行统计数据
    const row1Data = [
      { 
        key: 'nameChanges',  
        value: data.name_changes || 0, 
        list: data.name_list || [], 
        clickable: (data.name_changes || 0) > 0
      },
      { 
        key: 'screenNameChanges', 
        value: data.screen_name_changes || 0, 
        list: data.screen_name_list || [], 
        clickable: (data.screen_name_changes || 0) > 0
      },
      { 
        key: 'followEvents', 
        value: data.twitter_follow_event_count || 0, 
        list: [], 
        clickable: (data.twitter_follow_event_count || 0) > 0
      },
      { 
        key: 'walletAddresses', 
        value: data.wallet_address_list?.length || 0, 
        list: data.wallet_address_list || [], 
        clickable: (data.wallet_address_list?.length || 0) > 0
      }
    ]

    // 第二行代币数据
    const row2Data = [
      {
        key: 'pumpTokens',
        value: `${data.pump_token_count || 0}/${data.pump_token_success_count || 0}`,
        clickable: false
      },
      {
        key: 'raydiumTokens',
        value: `${data.raydium_token_count || 0}/${data.raydium_token_success_count || 0}`,
        clickable: false
      }
    ]

    // CA统计数据
    const caStatsData = data.ca_stats ? [
      {
        key: 'caToday',
        value: `${data.ca_stats.today.published}/${data.ca_stats.today.deleted}`,
        label: t('twitterDisplay.caToday'),
        clickable: false
      },
      {
        key: 'ca7Days',
        value: `${data.ca_stats.last_7_days.published}/${data.ca_stats.last_7_days.deleted}`,
        label: t('twitterDisplay.ca7Days'),
        clickable: false
      },
      {
        key: 'ca30Days',
        value: `${data.ca_stats.last_30_days.published}/${data.ca_stats.last_30_days.deleted}`,
        label: t('twitterDisplay.ca30Days'),
        clickable: false
      },
      {
        key: 'caTotal',
        value: `${data.ca_stats.total.published}/${data.ca_stats.total.deleted}`,
        label: t('twitterDisplay.caTotal'),
        clickable: (data.ca_stats.total.deleted || 0) > 0, // 只有有删除数量时才可点击
        deletedCount: data.ca_stats.total.deleted || 0
      }
    ] : null

    container.innerHTML = `
      <div style="space-y: 8px;">
        <!-- 社交统计 - 2x2网格布局 -->
        <div>
          <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 500; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};">${t('twitterDisplay.socialStats')}</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 4px; margin-bottom: 8px;">
            ${row1Data.map(item => `
              <div class="tw3track-stat-item" data-key="${item.key}" style="
                text-align: center; 
                padding: 6px 4px; 
                background-color: ${item.clickable ? (isDarkMode ? 'rgb(24, 24, 27)' : 'rgb(249, 250, 251)') : (isDarkMode ? 'rgb(15, 15, 15)' : 'rgb(244, 244, 245)')}; 
                border-radius: 4px;
                cursor: ${item.clickable ? 'pointer' : 'default'};
                opacity: ${item.clickable ? '1' : '0.6'};
                transition: all 0.2s;
                border: 1px solid transparent;
              ">
                <div style="font-size: 12px; font-weight: 600; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};">${item.value}</div>
                <div style="font-size: 9px; color: ${isDarkMode ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'}; margin-top: 1px; line-height: 1.1;">${t(`twitterDisplay.${item.key}`)}</div>
                ${item.clickable ? `<div style="font-size: 8px; color: rgb(59, 130, 246); margin-top: 1px;">${t('twitterDisplay.clickToView')}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        ${caStatsData ? `
        <!-- CA统计 - 2x2网格布局 -->
        <div>
          <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 500; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};">${t('twitterDisplay.caStats')}</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 4px; margin-bottom: 8px;">
            ${caStatsData.map(item => `
              <div class="tw3track-ca-stat-item" data-key="${item.key}" style="
                text-align: center;
                padding: 6px 4px;
                background-color: ${item.clickable ? (isDarkMode ? 'rgb(24, 24, 27)' : 'rgb(249, 250, 251)') : (isDarkMode ? 'rgb(15, 15, 15)' : 'rgb(244, 244, 245)')};
                border-radius: 4px;
                cursor: ${item.clickable ? 'pointer' : 'default'};
                opacity: ${item.clickable ? '1' : '0.9'};
                transition: all 0.2s;
                border: 1px solid transparent;
              ">
                <div style="font-size: 12px; font-weight: 600; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};">${item.value}</div>
                <div style="font-size: 9px; color: ${isDarkMode ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'}; margin-top: 1px; line-height: 1.1;">${item.label}</div>
                ${item.clickable ? `<div style="font-size: 8px; color: rgb(59, 130, 246); margin-top: 1px;">${t('twitterDisplay.clickToView')}</div>` : ''}
              </div>
            `).join('')}
          </div>
          <!-- CA统计说明 -->
          <div style="font-size: 8px; color: ${isDarkMode ? 'rgb(113, 113, 122)' : 'rgb(161, 161, 170)'}; margin-top: 4px; text-align: center;">
            ${t('twitterDisplay.caStatsNote')}
          </div>
        </div>
        ` : ''}

        <!-- 代币分析 - 更紧凑 -->
        <div>
          <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 500; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};">${t('twitterDisplay.tokenAnalysis')}</h4>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
            ${row2Data.map(item => `
              <div style="
                text-align: center;
                padding: 6px 4px;
                background-color: ${isDarkMode ? 'rgb(24, 24, 27)' : 'rgb(249, 250, 251)'};
                border-radius: 4px;
              ">
                <div style="font-size: 13px; font-weight: 600; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};">${item.value}</div>
                <div style="font-size: 9px; color: ${isDarkMode ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'}; margin-top: 1px;">${t(`twitterDisplay.${item.key}`)}</div>
              </div>
            `).join('')}
          </div>
          <!-- 代币分析免责声明 -->
          <div style="font-size: 8px; color: ${isDarkMode ? 'rgb(113, 113, 122)' : 'rgb(161, 161, 170)'}; margin-top: 4px; text-align: center;">
            ${t('twitterDisplay.chainDataDisclaimer')}
          </div>
        </div>

        <!-- 底部信息 - 更紧凑 -->
        <div style="display: flex; justify-content: ${fromCache ? 'space-between' : 'flex-start'}; align-items: center; padding-top: 6px; border-top: 1px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'};">
          <div style="font-size: 9px; color: ${isDarkMode ? 'rgb(113, 113, 122)' : 'rgb(161, 161, 170)'};">
            ${t('twitterDisplay.lastUpdated').replace('{time}', formatTime(new Date(), language))}
          </div>
          ${fromCache ? `
            <div style="font-size: 8px; color: rgb(34, 197, 94);">
              ${language === 'zh' ? '来自缓存' : 'From Cache'}
            </div>
          ` : ''}
        </div>
      </div>
    `

    // 绑定点击事件
    setTimeout(() => {
      this.bindStatItemEvents(container, row1Data, restId, data, isDarkMode)
      // 绑定 CA 统计点击事件
      if (caStatsData) {
        this.bindCaStatItemEvents(container, caStatsData, restId, data, isDarkMode)
      }
    }, 100)
  }

  /**
   * 绑定统计项点击事件
   */
  private static async bindStatItemEvents(
    container: HTMLElement,
    statItems: any[],
    restId: string | undefined,
    data: TwitterUserData,
    isDarkMode: boolean
  ): Promise<void> {
    const i18n = await getContentI18n()
    const t = i18n.t.bind(i18n)

    statItems.forEach(item => {
      const element = container.querySelector(`[data-key="${item.key}"]`)
      if (element && item.clickable) {
        element.addEventListener('click', async () => {
          console.log('🔄 统计项点击:', {
            key: item.key,
            value: item.value,
            listLength: item.list.length,
            clickable: item.clickable,
            title: t(`twitterDisplay.${item.key}`)
          })
          
          // 使用 PlasmoMessaging 保持用户手势上下文
          if (restId) {
            try {
              console.log('🔄 准备通过 PlasmoMessaging 打开侧边栏:', {
                type: item.key,
                title: t(`twitterDisplay.${item.key}`),
                restId,
                hasUserData: !!data
              });

              // 使用 PlasmoMessaging 发送消息到 background script
              const response = await sendToBackground({
                name: "openSidePanel",
                body: {
                  type: item.key,
                  title: t(`twitterDisplay.${item.key}`),
                  restId,
                  userData: data
                }
              });

              if (response?.success) {
                console.log('✅ 侧边栏打开成功:', response);
              } else {
                console.error('❌ 侧边栏打开失败:', response?.error);
                alert('打开侧边栏失败: ' + (response?.error || '未知错误'));
              }
            } catch (error) {
              console.error('❌ 处理点击事件失败:', error);
              alert('处理点击事件失败: ' + (error instanceof Error ? error.message : '未知错误'));
            }
          }
        })
        
        // 悬停效果
        element.addEventListener('mouseenter', () => {
          const htmlElement = element as HTMLElement
          htmlElement.style.borderColor = 'rgb(59, 130, 246)'
          htmlElement.style.backgroundColor = isDarkMode ? 'rgb(30, 41, 59)' : 'rgb(239, 246, 255)'
          htmlElement.style.transform = 'translateY(-1px)'
        })
        
        element.addEventListener('mouseleave', () => {
          const htmlElement = element as HTMLElement
          htmlElement.style.borderColor = 'transparent'
          htmlElement.style.backgroundColor = item.clickable ? (isDarkMode ? 'rgb(24, 24, 27)' : 'rgb(249, 250, 251)') : (isDarkMode ? 'rgb(15, 15, 15)' : 'rgb(244, 244, 245)')
          htmlElement.style.transform = 'translateY(0)'
        })
      }
    })
  }

  /**
   * 绑定 CA 统计项点击事件
   */
  private static async bindCaStatItemEvents(
    container: HTMLElement,
    caStatItems: any[],
    restId: string | undefined,
    data: TwitterUserData,
    isDarkMode: boolean
  ): Promise<void> {
    const i18n = await getContentI18n()
    const t = i18n.t.bind(i18n)

    caStatItems.forEach(item => {
      const element = container.querySelector(`[data-key="${item.key}"]`)
      if (element && item.clickable) {
        element.addEventListener('click', async () => {
          console.log('🔄 CA统计项点击:', {
            key: item.key,
            value: item.value,
            deletedCount: item.deletedCount,
            clickable: item.clickable,
            title: item.label
          })

          // 使用 PlasmoMessaging 保持用户手势上下文
          if (restId) {
            try {
              console.log('🔄 准备通过 PlasmoMessaging 打开删除推文侧边栏:', {
                type: 'deletedTweets',
                title: t('twitterDisplay.deletedTweets'),
                restId,
                deletedCount: item.deletedCount
              });

              // 使用 PlasmoMessaging 发送消息到 background script
              const response = await sendToBackground({
                name: "openSidePanel",
                body: {
                  type: 'deletedTweets',
                  title: t('twitterDisplay.deletedTweets'),
                  restId,
                  userData: data,
                  deletedCount: item.deletedCount
                }
              });

              if (response?.success) {
                console.log('✅ 删除推文侧边栏打开成功:', response);
              } else {
                console.error('❌ 删除推文侧边栏打开失败:', response?.error);
                alert('打开侧边栏失败: ' + (response?.error || '未知错误'));
              }
            } catch (error) {
              console.error('❌ 处理CA统计点击事件失败:', error);
              alert('处理点击事件失败: ' + (error instanceof Error ? error.message : '未知错误'));
            }
          }
        })

        // 悬停效果
        element.addEventListener('mouseenter', () => {
          const htmlElement = element as HTMLElement
          htmlElement.style.borderColor = 'rgb(59, 130, 246)'
          htmlElement.style.backgroundColor = isDarkMode ? 'rgb(30, 41, 59)' : 'rgb(239, 246, 255)'
          htmlElement.style.transform = 'translateY(-1px)'
        })

        element.addEventListener('mouseleave', () => {
          const htmlElement = element as HTMLElement
          htmlElement.style.borderColor = 'transparent'
          htmlElement.style.backgroundColor = item.clickable ? (isDarkMode ? 'rgb(24, 24, 27)' : 'rgb(249, 250, 251)') : (isDarkMode ? 'rgb(15, 15, 15)' : 'rgb(244, 244, 245)')
          htmlElement.style.transform = 'translateY(0)'
        })
      }
    })
  }
}
