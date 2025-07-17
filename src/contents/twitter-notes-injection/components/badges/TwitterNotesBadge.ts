/**
 * Twitter备注徽章组件 - 纯JavaScript版本
 * 用于在content script中创建和管理备注徽章
 */

import { sendToBackground } from '@plasmohq/messaging'
import type { TwitterNote } from '~src/types/twitter-notes.types'

// 标签配色方案 - 转换为CSS颜色
const TAG_COLOR_MAP: Record<string, { bg: string, text: string }> = {
  CryptoNews: { bg: '#3b82f6', text: '#ffffff' },
  Airdrop: { bg: '#10b981', text: '#ffffff' },
  Web3Dev: { bg: '#8b5cf6', text: '#ffffff' },
  VC: { bg: '#f59e0b', text: '#ffffff' },
  CryptoOG: { bg: '#ec4899', text: '#ffffff' },
  OnChainData: { bg: '#06b6d4', text: '#ffffff' },
  CryptoEducation: { bg: '#6366f1', text: '#ffffff' },
  Project: { bg: '#f97316', text: '#ffffff' },
  MemeCoin: { bg: '#ef4444', text: '#ffffff' },
  GameFi: { bg: '#14b8a6', text: '#ffffff' },
  'NFT Collector': { bg: '#d946ef', text: '#ffffff' },
  CryptoRegulation: { bg: '#475569', text: '#ffffff' },
  MEV: { bg: '#84cc16', text: '#ffffff' },
  OG: { bg: '#eab308', text: '#ffffff' },
  KOL: { bg: '#a855f7', text: '#ffffff' }
}

interface TwitterNotesBadgeOptions {
  restId: string
  screenName?: string
  existingNote: TwitterNote | null
  onUpdate: (note: TwitterNote | null) => void
}

/**
 * 显示简单的toast通知
 */
function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div')
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    color: white;
    font-size: 14px;
    font-weight: 500;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease-in-out;
  `
  toast.textContent = message
  
  document.body.appendChild(toast)
  
  // 显示动画
  setTimeout(() => {
    toast.style.transform = 'translateX(0)'
    toast.style.opacity = '1'
  }, 100)
  
  // 3秒后隐藏
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)'
    toast.style.opacity = '0'
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 300)
  }, 3000)
}

/**
 * Twitter备注徽章类
 */
export class TwitterNotesBadge {
  private container: HTMLElement
  private options: TwitterNotesBadgeOptions
  private currentNote: TwitterNote | null
  private messageListener: (message: any) => void

  constructor(container: HTMLElement, options: TwitterNotesBadgeOptions) {
    this.container = container
    this.options = options
    this.currentNote = options.existingNote

    // 设置消息监听器
    this.messageListener = this.handleMessage.bind(this)
    chrome.runtime.onMessage.addListener(this.messageListener)

    // 设置自定义事件监听器
    this.setupCustomEventListener()

    // 初始渲染
    this.render()
  }

  /**
   * 设置自定义事件监听器
   */
  private setupCustomEventListener() {
    this.container.addEventListener('tw3track-note-update', (event: any) => {
      console.log('📥 徽章收到自定义事件更新:', event.detail)
      const { restId, note } = event.detail

      if (String(restId) === String(this.options.restId)) {
        console.log('✅ 自定义事件匹配，更新徽章:', restId)
        this.currentNote = note
        this.options.onUpdate(note)
        this.render()
        this.forceRefresh()
      }
    })

    console.log('👂 徽章自定义事件监听器设置完成:', this.options.restId)
  }

  /**
   * 处理消息
   */
  private handleMessage(message: any) {
    if (message.type === 'TWITTER_NOTES_UPDATED' && message.restId === this.options.restId) {
      const updatedNote = message.note
      this.currentNote = updatedNote
      this.options.onUpdate(updatedNote)
      this.render()
    }

    // 监听缓存更新消息
    if (message.type === 'TWITTER_NOTES_CACHE_UPDATED') {
      console.log('📥 徽章收到缓存更新，检查restId:', this.options.restId)
      const notes = message.notes || []
      const updatedNote = notes.find((note: TwitterNote) =>
        String(note.twitter_rest_id) === String(this.options.restId)
      )

      if (updatedNote) {
        console.log('✅ 找到更新的备注:', updatedNote)
        this.currentNote = updatedNote
        this.options.onUpdate(updatedNote)
        this.render()
        // 强制触发重绘
        this.forceRefresh()
      } else if (this.currentNote) {
        // 如果之前有备注但现在没找到，说明被删除了
        console.log('❌ 备注已被删除:', this.options.restId)
        this.currentNote = null
        this.options.onUpdate(null)
        this.render()
        // 强制触发重绘
        this.forceRefresh()
      }
    }
  }

  /**
   * 处理点击事件
   */
  private async handleClick() {
    try {
      console.log('🔄 徽章点击，打开侧边栏:', { 
        restId: this.options.restId, 
        screenName: this.options.screenName, 
        hasNote: !!this.currentNote 
      })
      
      // 发送消息到background script打开sidePanel
      const response = await sendToBackground({
        name: "openSidePanel",
        body: {
          type: 'twitterNotes',
          title: this.currentNote ? '编辑备注' : '添加备注',
          restId: this.options.restId,
          userData: this.currentNote // 传递现有备注数据
        }
      })
      
      if (!response?.success) {
        console.error('打开侧边栏失败:', response?.error)
        showToast('打开侧边栏失败', 'error')
      } else {
        console.log('✅ 侧边栏打开成功')
      }
    } catch (error) {
      console.error('打开侧边栏失败:', error)
      showToast('扩展连接失败，请刷新页面', 'error')
    }
  }

  /**
   * 创建SVG图标
   */
  private createIcon(type: 'add' | 'edit'): string {
    if (type === 'add') {
      return `
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      `
    } else {
      return `
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" style="width: 14px; height: 14px;">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
      `
    }
  }

  // /**
  //  * 创建标签元素
  //  */
  // private createTagsElement(): string {
  //   if (!this.currentNote || !this.currentNote.tags || this.currentNote.tags.length === 0) {
  //     return ''
  //   }

  //   const visibleTags = this.currentNote.tags.slice(0, 4)
  //   const remainingCount = this.currentNote.tags.length - 4

  //   let tagsHtml = visibleTags.map(tag => {
  //     const colorClass = TAG_COLOR_MAP[tag] || 'bg-gray-500 hover:bg-gray-600 text-white'
  //     return `
  //       <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-200 cursor-default ${colorClass}" style="
  //         display: inline-flex;
  //         align-items: center;
  //         padding: 2px 8px;
  //         border-radius: 9999px;
  //         font-size: 12px;
  //         font-weight: 500;
  //         background: ${this.getTagBackgroundColor(tag)};
  //         color: white;
  //       ">
  //         ${tag}
  //       </span>
  //     `
  //   }).join('')

  //   if (remainingCount > 0) {
  //     tagsHtml += `
  //       <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-default" style="
  //         display: inline-flex;
  //         align-items: center;
  //         padding: 2px 8px;
  //         border-radius: 9999px;
  //         font-size: 12px;
  //         font-weight: 500;
  //         background: #6b7280;
  //         color: white;
  //       ">
  //         +${remainingCount}
  //       </span>
  //     `
  //   }

  //   return `
  //     <div style="
  //       display: flex;
  //       flex-wrap: wrap;
  //       gap: 4px;
  //       max-width: 200px;
  //       margin-top: 6px;
  //     ">
  //       ${tagsHtml}
  //     </div>
  //   `
  // }

  // /**
  //  * 获取标签背景色
  //  */
  // private getTagBackgroundColor(tag: string): string {
  //   const colorMap: Record<string, string> = {
  //     CryptoNews: '#3b82f6',
  //     Airdrop: '#10b981',
  //     Web3Dev: '#8b5cf6',
  //     VC: '#f59e0b',
  //     CryptoOG: '#ec4899',
  //     OnChainData: '#06b6d4',
  //     CryptoEducation: '#6366f1',
  //     Project: '#f97316',
  //     MemeCoin: '#ef4444',
  //     GameFi: '#14b8a6',
  //     'NFT Collector': '#d946ef',
  //     CryptoRegulation: '#475569',
  //     MEV: '#84cc16',
  //     OG: '#eab308',
  //     KOL: '#a855f7'
  //   }
  //   return colorMap[tag] || '#6b7280'
  // }

  /**
   * 渲染徽章
   */
  private render() {
    const hasNote = !!this.currentNote
    const noteText = this.currentNote?.note || ''
    const displayText = noteText.length > 10 ? noteText.substring(0, 10) + '...' : noteText || '编辑备注'

    // 获取上下文类型
    const context = this.container.getAttribute('data-context') || 'profile'

    if (context === 'profile-actions') {
      // 用户主页操作按钮样式（与Twitter原生按钮一致）
      this.renderProfileActionBadge(hasNote, displayText)
    } else {
      // 默认样式（用户名旁边的小徽章）
      this.renderDefaultBadge(hasNote, displayText)
    }
  }

  /**
   * 强制刷新徽章显示
   */
  private forceRefresh() {
    try {
      // 强制触发重绘
      this.container.style.display = 'none'
      this.container.offsetHeight // 触发重排
      this.container.style.display = ''

      console.log('🔄 徽章强制刷新完成:', this.options.restId)
    } catch (error) {
      console.error('❌ 强制刷新徽章时出错:', error)
    }
  }

  /**
   * 渲染用户主页操作按钮样式的徽章 - 专门为用户资料页面优化
   */
  private renderProfileActionBadge(hasNote: boolean, displayText: string) {
    // 解析备注内容
    const note = this.currentNote
    const tags = note?.tags || []
    const noteText = note?.note || ''

    // 按照用户指定的CSS样式结构创建内容
    let innerContent = '<div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;">'

    if (hasNote) {
      // 有备注时显示标签和备注
      const displayTags = tags.slice(0, 1)
      displayTags.forEach(tag => {
        const colors = TAG_COLOR_MAP[tag] || { bg: '#6b7280', text: '#ffffff' }
        innerContent += `
          <span style="
            display: inline-flex;
            align-items: center;
            padding: 2px 6px;
            border-radius: 4px;
            background-color: ${colors.bg};
            color: ${colors.text};
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: opacity 0.2s ease-in-out;
          " title="标签: ${tag}">${tag}</span>
        `
      })

      // 渲染备注文本（如果有）
      if (noteText) {
        const shortNote = noteText.length > 15 ? noteText.substring(0, 15) + '...' : noteText
        innerContent += `
          <span style="
            display: inline-flex;
            align-items: center;
            padding: 2px 6px;
            border-radius: 4px;
            background-color: rgba(83, 100, 113, 0.15);
            color: rgb(139, 152, 165);
            font-size: 11px;
            font-weight: 400;
            cursor: pointer;
            transition: background-color 0.2s ease-in-out;
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          " title="备注: ${noteText}">${shortNote}</span>
        `
      }
    } else {
      // 没有备注时显示添加按钮
      innerContent += `
        <span style="
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 4px;
          background-color: rgba(29, 155, 240, 0.1);
          color: rgb(29, 155, 240);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out;
        " title="点击添加备注">+ 添加备注</span>
      `
    }

    innerContent += '</div>'

    // 设置容器样式，按照用户指定的样式
    this.container.style.cssText = `
      border-top-width: 0px;
      margin-left: 0px;
      margin-right: 15px;
      margin-bottom: 15px;
    `

    // 创建完整的HTML结构
    const buttonTitle = hasNote ? '点击编辑备注' : '点击添加备注'
    this.container.innerHTML = `
      <div class="twitter-notes-badge-button" style="cursor: pointer; background-color: rgba(0, 0, 0, 0); border-color: rgb(83, 100, 113);" title="${buttonTitle}">
        ${innerContent}
      </div>
    `

    this.bindEvents()
  }

  /**
   * 渲染默认样式的徽章（推文中的小标签）
   */
  private renderDefaultBadge(hasNote: boolean, displayText: string) {
    if (!hasNote) {
      // 如果没有备注，不显示任何内容
      this.container.innerHTML = ''
      return
    }

    // 解析备注内容
    const note = this.currentNote
    const tags = note?.tags || []
    const noteText = note?.note || ''

    // 创建容器
    let content = '<div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 8px;">'

    // 渲染标签（最多2个）
    const displayTags = tags.slice(0, 2)
    displayTags.forEach(tag => {
      const colors = TAG_COLOR_MAP[tag] || { bg: '#6b7280', text: '#ffffff' }
      content += `
        <span style="
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 4px;
          background-color: ${colors.bg};
          color: ${colors.text};
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease-in-out;
        " title="标签: ${tag}">${tag}</span>
      `
    })

    // 渲染备注文本（如果有）
    if (noteText) {
      const shortNote = noteText.length > 15 ? noteText.substring(0, 15) + '...' : noteText
      content += `
        <span style="
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 4px;
          background-color: rgba(83, 100, 113, 0.15);
          color: rgb(139, 152, 165);
          font-size: 11px;
          font-weight: 400;
          cursor: pointer;
          transition: background-color 0.2s ease-in-out;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        " title="备注: ${noteText}">${shortNote}</span>
      `
    }

    content += '</div>'

    this.container.innerHTML = `
      <div class="twitter-notes-badge-button" style="cursor: pointer;" title="点击编辑备注">
        ${content}
      </div>
    `

    this.bindEvents()
  }

  /**
   * 绑定事件
   */
  private bindEvents() {
    // 绑定点击事件
    const button = this.container.querySelector('.twitter-notes-badge-button') as HTMLElement
    if (button) {
      button.addEventListener('click', this.handleClick.bind(this))

      // 获取上下文类型来判断悬停效果
      const context = this.container.getAttribute('data-context') || 'default'
      const isProfileActions = context === 'profile-actions'

      // 添加悬停效果 - 符合Twitter原生样式
      button.addEventListener('mouseenter', () => {
        if (isProfileActions) {
          // 用户主页按钮悬停效果
          button.style.backgroundColor = 'rgba(231, 233, 234, 0.1)'
          button.style.borderColor = 'rgb(231, 233, 234)'
        } else {
          // 推文中标签悬停效果
          button.style.backgroundColor = 'rgba(83, 100, 113, 0.2)'
        }
      })

      button.addEventListener('mouseleave', () => {
        if (isProfileActions) {
          // 用户主页按钮恢复
          button.style.backgroundColor = 'rgba(0, 0, 0, 0)'
          button.style.borderColor = 'rgb(83, 100, 113)'
        } else {
          // 推文中标签恢复
          button.style.backgroundColor = 'rgba(83, 100, 113, 0.1)'
        }
      })
    }
  }

  /**
   * 更新备注
   */
  public updateNote(note: TwitterNote | null) {
    this.currentNote = note
    this.render()
  }

  /**
   * 销毁徽章
   */
  public destroy() {
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener)
    }
    this.container.innerHTML = ''
  }
}
