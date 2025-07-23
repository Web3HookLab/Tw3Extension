/**
 * KOL卡片内容组件
 * 显示KOL列表数据
 */

import { LoadingState } from '../../states/common/LoadingState'
import { ErrorState } from '../../states/common/ErrorState'
import { EmptyState } from '../../states/common/EmptyState'
import { TwitterDataService } from '../../../services/twitter-data.service'
import { KolCardHeader } from './KolCardHeader'
import { getContentI18n } from '~src/utils/i18n-content'
import type { TwitterUserData } from '~src/types/twitter-data.types'

export class KolCardContent {
  /**
   * 创建内容区域
   */
  static create(_isDarkMode: boolean): HTMLElement {
    const content = document.createElement('div')
    content.className = 'tw3track-kol-content'
    content.style.cssText = `padding: 14px;`

    return content
  }

  /**
   * 初始化KOL数据加载（监听数据更新事件）
   */
  static async initializeData(container: HTMLElement, restId: string, isDarkMode: boolean): Promise<void> {
    try {
      // 检查用户登录状态
      const { TokenManager } = await import('~src/services/token.service')
      const isLoggedIn = await TokenManager.isLoggedIn()

      if (!isLoggedIn) {
        console.log('⏸️ 用户未登录，显示登录提示')
        await this.showLoginRequired(container, isDarkMode)
        return
      }

      const i18n = await getContentI18n()
      const t = i18n.t.bind(i18n)

      // 显示加载状态
      LoadingState.create(container, t('twitterDisplay.loadingAnalysis'), isDarkMode)

      // 监听数据更新事件
      const handleDataUpdate = (event: CustomEvent) => {
        const { restId: eventRestId, data, fromCache, error } = event.detail
        if (eventRestId === restId) {
          console.log('📦 KOL卡片接收到数据更新事件:', { restId, fromCache, hasData: !!data, hasError: !!error })

          if (error) {
            // 如果有错误，显示空状态
            console.log('❌ KOL卡片数据更新失败:', error)
            EmptyState.createKolEmpty(container, isDarkMode).catch(console.error)
          } else if (data) {
            // 如果有数据，更新显示
            this.updateWithData(container, data, isDarkMode, fromCache)
          } else {
            // 如果没有数据也没有错误，显示空状态
            console.log('📭 KOL卡片没有数据')
            EmptyState.createKolEmpty(container, isDarkMode).catch(console.error)
          }
        }
      }

      // 添加事件监听器
      document.addEventListener('tw3track-data-updated', handleDataUpdate as EventListener)

      // 存储清理函数到容器上，以便后续清理
      ;(container as any)._tw3trackCleanup = () => {
        document.removeEventListener('tw3track-data-updated', handleDataUpdate as EventListener)
      }

      // 尝试从缓存获取初始数据
      const result = await TwitterDataService.getTwitterData(restId, false)
      if (result.success && result.data) {
        await this.updateWithData(container, result.data, isDarkMode, result.fromCache || false)
      } else {
        // 如果没有缓存数据，等待StatsCard的数据更新事件
        console.log('⏳ 等待StatsCard数据更新...')

        // 设置超时，如果10秒内没有收到数据更新事件，显示空状态
        setTimeout(() => {
          // 检查容器是否仍然显示加载状态
          if (container.querySelector('.tw3track-loading')) {
            console.log('⏰ KOL数据加载超时，显示空状态')
            EmptyState.createKolEmpty(container, isDarkMode).catch(console.error)
          }
        }, 10000)
      }
    } catch (error) {
      console.error('❌ 初始化KOL数据失败:', error)

      const i18n = await getContentI18n()
      const t = i18n.t.bind(i18n)

      await ErrorState.create(
        container,
        error instanceof Error ? error.message : t('twitterDisplay.error'),
        t('twitterDisplay.dataLoadFailed'),
        isDarkMode,
        () => this.initializeData(container, restId, isDarkMode)
      )
    }
  }

  /**
   * 使用数据更新KOL列表
   */
  static async updateWithData(
    container: HTMLElement,
    data: TwitterUserData,
    isDarkMode: boolean,
    fromCache: boolean
  ): Promise<void> {
    try {
      await this.showKolList(container, data, isDarkMode, fromCache)

      // 更新头部的KOL数量
      const card = container.closest('.tw3track-kol-card')
      const header = card?.querySelector('.tw3track-kol-header')
      if (header) {
        await KolCardHeader.updateKolCount(header as HTMLElement, data.kol_count || 0)
      }
    } catch (error) {
      console.error('❌ 更新KOL数据失败:', error)
    }
  }

  /**
   * 清理资源
   */
  static cleanup(container: HTMLElement): void {
    if ((container as any)._tw3trackCleanup) {
      ;(container as any)._tw3trackCleanup()
      delete (container as any)._tw3trackCleanup
    }
  }

  /**
   * 显示KOL列表
   */
  private static async showKolList(
    container: HTMLElement,
    data: TwitterUserData,
    isDarkMode: boolean,
    fromCache: boolean
  ): Promise<void> {
    const i18n = await getContentI18n()
    const t = i18n.t.bind(i18n)

    // 检查是否有KOL数据
    if (!data.kol_list || data.kol_list.length === 0) {
      await EmptyState.createKolEmpty(container, isDarkMode)
      return
    }

    // 按粉丝数量排序KOL列表（从高到低）
    const kolList = [...data.kol_list].sort((a, b) => {
      const followersA = a.followers_count || 0
      const followersB = b.followers_count || 0
      return followersB - followersA // 降序排列
    })

    container.innerHTML = `
      <div style="space-y: 6px;">
        <!-- KOL列表容器 - 支持滚动 -->
        <div style="
          max-height: 300px;
          overflow-y: auto;
          space-y: 4px;
          scrollbar-width: thin;
          scrollbar-color: ${isDarkMode ? 'rgb(113, 113, 122) rgb(39, 39, 42)' : 'rgb(161, 161, 170) rgb(228, 228, 231)'};
        ">
          ${kolList.map((kol) => `
            <div class="tw3track-kol-item" data-username="${kol.screen_name}" style="
              display: flex;
              align-items: center;
              padding: 6px 8px;
              background-color: ${isDarkMode ? 'rgb(24, 24, 27)' : 'rgb(249, 250, 251)'};
              border-radius: 6px;
              cursor: pointer;
              transition: all 0.2s;
              border: 1px solid transparent;
            ">
              <!-- 头像 -->
              <img src="${kol.profile_image_url_https || '/assets/default-avatar.png'}" 
                   alt="${kol.name}" 
                   style="
                     width: 24px; 
                     height: 24px; 
                     border-radius: 50%; 
                     margin-right: 8px;
                     object-fit: cover;
                   " 
                   onerror="this.src='/assets/default-avatar.png'" />
              
              <!-- 用户信息 -->
              <div style="flex: 1; min-width: 0;">
                <div style="
                  font-size: 12px; 
                  font-weight: 600; 
                  color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">
                  ${kol.name}
                </div>
                <div style="
                  font-size: 10px; 
                  color: ${isDarkMode ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'};
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                ">
                  @${kol.screen_name}
                </div>
              </div>
              
              <!-- 粉丝数 -->
              <div style="
                font-size: 10px; 
                color: ${isDarkMode ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'};
                text-align: right;
                white-space: nowrap;
              ">
                ${this.formatFollowerCount(kol.followers_count || 0)}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- KOL总数信息 -->
        ${data.kol_list.length > 0 ? `
          <div style="
            text-align: center;
            padding: 8px;
            font-size: 10px;
            color: ${isDarkMode ? 'rgb(113, 113, 122)' : 'rgb(161, 161, 170)'};
          ">
            ${t('twitterDisplay.kolCount').replace('{count}', data.kol_list.length.toString())} ${data.kol_list.length > 10 ? t('twitterDisplay.scrollable') : ''}
          </div>
        ` : ''}

        <!-- 底部信息 -->
        <div style="
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding-top: 6px; 
          border-top: 1px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'};
        ">
          <div style="font-size: 9px; color: ${isDarkMode ? 'rgb(113, 113, 122)' : 'rgb(161, 161, 170)'};">
            ${t('twitterDisplay.lastUpdated').replace('{time}', new Date().toLocaleTimeString())}
          </div>
          ${fromCache ? `
            <div style="font-size: 8px; color: rgb(34, 197, 94);">
              ${t('twitterDisplay.fromCache')}
            </div>
          ` : ''}
        </div>
      </div>
    `

    // 绑定点击事件
    setTimeout(() => {
      this.bindKolItemEvents(container, isDarkMode)
    }, 100)
  }

  /**
   * 绑定KOL项点击事件
   */
  private static bindKolItemEvents(container: HTMLElement, isDarkMode: boolean): void {
    const kolItems = container.querySelectorAll('.tw3track-kol-item')
    
    kolItems.forEach(item => {
      const username = item.getAttribute('data-username')
      
      if (username) {
        // 点击事件
        item.addEventListener('click', () => {
          console.log('🔄 KOL项点击:', username)
          // 打开Twitter用户页面
          window.open(`https://x.com/${username}`, '_blank')
        })
        
        // 悬停效果
        item.addEventListener('mouseenter', () => {
          ;(item as HTMLElement).style.borderColor = 'rgb(59, 130, 246)'
          ;(item as HTMLElement).style.backgroundColor = isDarkMode ? 'rgb(30, 41, 59)' : 'rgb(239, 246, 255)'
          ;(item as HTMLElement).style.transform = 'translateY(-1px)'
        })
        
        item.addEventListener('mouseleave', () => {
          ;(item as HTMLElement).style.borderColor = 'transparent'
          ;(item as HTMLElement).style.backgroundColor = isDarkMode ? 'rgb(24, 24, 27)' : 'rgb(249, 250, 251)'
          ;(item as HTMLElement).style.transform = 'translateY(0)'
        })
      }
    })
  }

  /**
   * 格式化粉丝数
   */
  private static formatFollowerCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toLocaleString()
  }

  /**
   * 显示登录提示
   */
  static async showLoginRequired(container: HTMLElement, isDarkMode: boolean): Promise<void> {
    try {
      const i18n = await getContentI18n()
      const t = i18n.t.bind(i18n)

      container.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          text-align: center;
          color: ${isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)'};
        ">
          <div style="
            font-size: 14px;
            margin-bottom: 8px;
            font-weight: 500;
          ">
            ${t('twitterDisplay.loginRequired') || '请先登录'}
          </div>
          <div style="
            font-size: 12px;
            opacity: 0.8;
          ">
            ${t('twitterDisplay.loginRequiredDesc') || '登录后即可查看KOL分析数据'}
          </div>
        </div>
      `
    } catch (error) {
      console.error('❌ 显示登录提示失败:', error)
      // 降级显示简单提示
      container.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          text-align: center;
          color: ${isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)'};
          font-size: 14px;
        ">
          请先登录
        </div>
      `
    }
  }
}
