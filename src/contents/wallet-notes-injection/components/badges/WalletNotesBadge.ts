/**
 * 钱包备注徽章组件 - 重构版本
 * 参考 twitter-wallet-detection.tsx 的完整实现
 * 在推文中显示钱包地址信息卡片，支持备注编辑和外部链接跳转
 */

import type { WalletNote } from '~src/types/wallet-notes.types'
import { sendToBackground } from '@plasmohq/messaging'
import { Storage } from '@plasmohq/storage'
import {
  getDexPlatformsForNetwork,
  getDefaultDexSettings,
  getDexPlatformById,
  type DexPlatformSettings,
  type DexPlatform
} from '~src/types/dexPlatforms.types'

export interface WalletNotesBadgeOptions {
  walletAddress: string
  networkType: 'evm' | 'solana' | 'sui'
  existingNote?: WalletNote | null
}

// 网络颜色配置
const NETWORK_COLORS = {
  evm: { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  solana: { bg: '#f3e8ff', color: '#7c3aed', border: '#c4b5fd' },
  sui: { bg: '#cffafe', color: '#0891b2', border: '#a5f3fc' }
}

const NETWORK_NAMES = {
  evm: 'EVM',
  solana: 'Solana',
  sui: 'Sui'
}

export class WalletNotesBadge {
  private options: WalletNotesBadgeOptions
  private element: HTMLElement | null = null
  private currentNote: WalletNote | null = null
  private storage: Storage
  private messageListener: (message: any) => void
  private dexSettings: DexPlatformSettings | null = null

  constructor(options: WalletNotesBadgeOptions) {
    this.options = options
    this.currentNote = options.existingNote || null
    this.storage = new Storage({ area: 'local' })

    // 设置消息监听器
    this.messageListener = this.handleMessage.bind(this)
    chrome.runtime.onMessage.addListener(this.messageListener)
  }

  /**
   * 处理来自background的消息
   */
  private handleMessage(message: any): void {
    if (message.type === 'WALLET_NOTES_CACHE_UPDATED' && message.notes) {
      console.log('🔄 钱包备注徽章收到缓存更新消息:', message.notes.length, '条')
      this.updateFromCache(message.notes)
    }
  }

  /**
   * 从缓存更新中更新当前备注
   */
  private updateFromCache(notes: WalletNote[]): void {
    const updatedNote = notes.find(note =>
      note.wallet_address.toLowerCase() === this.options.walletAddress.toLowerCase()
    )

    if (updatedNote !== this.currentNote) {
      this.currentNote = updatedNote || null
      console.log('📝 钱包备注已更新:', this.options.walletAddress, this.currentNote ? '有备注' : '无备注')

      // 重新渲染卡片
      if (this.element) {
        this.render()
      }
    }
  }

  /**
   * 获取用户语言设置
   */
  private async getUserLanguage(): Promise<'en' | 'zh'> {
    try {
      const language = await this.storage.get('language') || 'en'
      return language === 'zh' ? 'zh' : 'en'
    } catch (error) {
      console.warn('Failed to get user language:', error)
      return 'en'
    }
  }

  /**
   * 获取翻译文本
   */
  private async getTranslations(language: 'en' | 'zh') {
    const translations = language === 'zh' ? {
      walletAnalysis: '钱包地址/CA地址分析',
      addressFound: '个地址',
      copy: '复制',
      explorer: '浏览器',
      addNote: '添加备注',
      editNote: '编辑备注',
      hasNote: '有备注',
      note: '备注',
      source: '来源',
      poweredBy: '由 Tw3Track 提供支持',
      copySuccess: '已复制到剪贴板',
      copyFailed: '复制失败',
      explorerOpened: '已打开区块浏览器',
      noteEditorFailed: '打开备注编辑器失败'
    } : {
      walletAnalysis: 'Wallet Address/CA Address Analysis',
      addressFound: 'addresses',
      copy: 'Copy',
      explorer: 'Explorer',
      addNote: 'Add Note',
      editNote: 'Edit Note',
      hasNote: 'Has Note',
      note: 'Note',
      source: 'Source',
      poweredBy: 'Powered by Tw3Track',
      copySuccess: 'Copied to clipboard',
      copyFailed: 'Copy failed',
      explorerOpened: 'Explorer opened',
      noteEditorFailed: 'Failed to open note editor'
    }

    return translations
  }

  /**
   * 加载DEX设置
   */
  private async loadDexSettings(): Promise<void> {
    try {
      const savedSettings = await this.storage.get('dex_platform_settings') as DexPlatformSettings | null
      this.dexSettings = savedSettings || getDefaultDexSettings()
      console.log('⚙️ DEX设置已加载:', this.dexSettings)
    } catch (error) {
      console.warn('⚠️ 加载DEX设置失败:', error)
      this.dexSettings = getDefaultDexSettings()
    }
  }

  /**
   * 获取网络的DEX平台列表
   */
  private getDexPlatformsForNetwork(networkType: string): DexPlatform[] {
    return getDexPlatformsForNetwork(networkType)
  }

  /**
   * 获取默认DEX平台
   */
  private getDefaultDexPlatform(networkType: string): DexPlatform | null {
    if (!this.dexSettings) return null

    if (networkType === 'evm') {
      // EVM网络需要特殊处理
      const evmSettings = this.dexSettings.evm
      const platformId = `${evmSettings.platform}_${evmSettings.defaultChain}`
      return getDexPlatformById(platformId)
    } else {
      // Solana和Sui网络
      const platformId = this.dexSettings[networkType as 'solana' | 'sui']
      return getDexPlatformById(platformId)
    }
  }

  /**
   * 获取区块浏览器URL
   */
  private getExplorerUrl(address: string, networkType: string): string {
    const explorerUrls = {
      evm: `https://etherscan.io/address/${address}`,
      solana: `https://solscan.io/account/${address}`,
      sui: `https://suivision.xyz/account/${address}`
    }
    return explorerUrls[networkType as keyof typeof explorerUrls] || ''
  }

  /**
   * 缩短地址显示
   */
  private shortenAddress(address: string): string {
    if (address.length <= 16) return address
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  /**
   * 检测暗色模式
   */
  private isDarkMode(): boolean {
    return document.documentElement.style.colorScheme === 'dark' ||
           document.body.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches ||
           document.querySelector('[data-theme="dark"]') !== null
  }

  /**
   * 显示Toast通知
   */
  private showToast(message: string, type: 'success' | 'error' = 'success'): void {
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
   * 渲染徽章元素
   */
  async render(): Promise<HTMLElement> {
    // 加载DEX设置
    await this.loadDexSettings()

    // 获取翻译
    const language = await this.getUserLanguage()
    const t = await this.getTranslations(language)

    // 检测暗色模式
    const isDarkMode = this.isDarkMode()

    // 获取网络配置
    const { networkType } = this.options
    const networkColor = NETWORK_COLORS[networkType] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' }
    const networkName = NETWORK_NAMES[networkType] || networkType

    // 获取DEX平台
    const dexPlatforms = this.getDexPlatformsForNetwork(networkType)
    const defaultDex = this.getDefaultDexPlatform(networkType)

    // 创建卡片元素
    const card = document.createElement('div')
    card.className = 'tw3track-wallet-card'
    card.style.cssText = `
      margin: 16px 0;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'};
      background-color: ${isDarkMode ? 'rgb(9, 9, 11)' : 'rgb(255, 255, 255)'};
      color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `

    this.element = card
    this.renderCardContent(card, t, isDarkMode, networkColor, networkName, dexPlatforms, defaultDex)
    this.setupEventListeners(card, language, t)

    return card
  }

  /**
   * 渲染卡片内容
   */
  private renderCardContent(
    card: HTMLElement,
    t: any,
    isDarkMode: boolean,
    networkColor: any,
    networkName: string,
    dexPlatforms: DexPlatform[],
    defaultDex: DexPlatform | null
  ): void {
    const { walletAddress } = this.options
    const shortAddress = this.shortenAddress(walletAddress)

    let cardHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'};">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg style="width: 20px; height: 20px; color: rgb(59, 130, 246);" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z"/>
          </svg>
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'};">${t.walletAnalysis}</h3>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="padding: 4px 8px; font-size: 12px; font-weight: 500; border-radius: 6px; background-color: ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(243, 244, 246)'}; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(75, 85, 99)'}; border: 1px solid ${isDarkMode ? 'rgb(63, 63, 70)' : 'rgb(209, 213, 219)'};">
            1 ${t.addressFound}
          </span>
        </div>
      </div>

      <div style="padding: 12px; border-radius: 8px; border: 1px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'}; background-color: ${isDarkMode ? 'rgb(24, 24, 27)' : 'rgb(249, 250, 251)'};">
        <!-- 地址和网络标签 -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="padding: 4px 8px; font-size: 12px; font-weight: 500; border-radius: 9999px; border: 1px solid; background-color: ${networkColor.bg}; color: ${networkColor.color}; border-color: ${networkColor.border};">
              ${networkName}
            </span>
            <code style="font-size: 12px; padding: 4px 8px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; background-color: ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(229, 231, 235)'}; color: ${isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(55, 65, 81)'};">
              ${shortAddress}
            </code>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${this.currentNote ? `
              <span style="padding: 4px 8px; font-size: 12px; font-weight: 500; border-radius: 4px; background-color: ${isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgb(220, 252, 231)'}; color: ${isDarkMode ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)'}; border: 1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgb(187, 247, 208)'};">
                ${t.hasNote}
              </span>
            ` : ''}
          </div>
        </div>

        <!-- 钱包备注 -->
        ${this.currentNote ? `
          <div style="margin-bottom: 12px; padding: 12px; border-radius: 8px; border: 1px solid ${isDarkMode ? 'rgb(63, 63, 70)' : 'rgb(209, 213, 219)'}; background-color: ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(243, 244, 246)'};">
            <div style="font-size: 12px; color: ${isDarkMode ? 'rgb(209, 213, 219)' : 'rgb(75, 85, 99)'}; margin-bottom: 4px; font-weight: 500;">
              ${t.note}:
            </div>
            <div style="font-size: 14px; color: ${isDarkMode ? 'rgb(229, 231, 235)' : 'rgb(31, 41, 55)'}; word-break: break-words; margin-bottom: 8px;">
              ${this.currentNote.note}
            </div>
            ${this.currentNote.source ? `
              <div style="font-size: 12px; color: ${isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)'};">
                ${t.source}: ${this.currentNote.source}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- 操作按钮 -->
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <!-- 第一行：基础操作按钮 -->
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <!-- 复制地址 -->
            <button class="copy-btn" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: 500; transition: all 0.2s; border: 1px solid; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); cursor: pointer; background-color: ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(255, 255, 255)'}; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'}; border-color: ${isDarkMode ? 'rgb(63, 63, 70)' : 'rgb(209, 213, 219)'};"
                    data-address="${walletAddress}"
                    onmouseover="this.style.backgroundColor='${isDarkMode ? 'rgb(63, 63, 70)' : 'rgb(249, 250, 251)'}'"
                    onmouseout="this.style.backgroundColor='${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(255, 255, 255)'}'">
              <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              <span>${t.copy}</span>
            </button>

            <!-- 区块浏览器 -->
            <button class="explorer-btn" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: 500; transition: all 0.2s; border: 1px solid; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); cursor: pointer; background-color: ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(255, 255, 255)'}; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'}; border-color: ${isDarkMode ? 'rgb(63, 63, 70)' : 'rgb(209, 213, 219)'};"
                    data-address="${walletAddress}" data-network="${this.options.networkType}"
                    onmouseover="this.style.backgroundColor='${isDarkMode ? 'rgb(63, 63, 70)' : 'rgb(249, 250, 251)'}'"
                    onmouseout="this.style.backgroundColor='${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(255, 255, 255)'}'">
              <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
              <span>${t.explorer}</span>
            </button>

            <!-- 添加/编辑备注 -->
            <button class="note-btn" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: 500; transition: all 0.2s; border: 1px solid; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); cursor: pointer; ${this.currentNote ? 'background-color: rgb(59, 130, 246); color: rgb(255, 255, 255); border-color: rgb(59, 130, 246);' : `background-color: ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(255, 255, 255)'}; color: ${isDarkMode ? 'rgb(250, 250, 250)' : 'rgb(9, 9, 11)'}; border-color: ${isDarkMode ? 'rgb(63, 63, 70)' : 'rgb(209, 213, 219)'};`}"
                    data-address="${walletAddress}" data-network="${this.options.networkType}"
                    ${this.currentNote ? 'onmouseover="this.style.backgroundColor=\'rgb(37, 99, 235)\'" onmouseout="this.style.backgroundColor=\'rgb(59, 130, 246)\'"' : `onmouseover="this.style.backgroundColor='${isDarkMode ? 'rgb(63, 63, 70)' : 'rgb(249, 250, 251)'}'" onmouseout="this.style.backgroundColor='${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(255, 255, 255)'}'"`}>
              ${this.currentNote ? `
                <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
                <span>${t.editNote}</span>
              ` : `
                <svg style="width: 14px; height: 14px;" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <span>${t.addNote}</span>
              `}
            </button>
          </div>

          <!-- 第二行：DEX平台按钮 -->
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
    `

    // 添加DEX按钮
    cardHTML += this.renderDexButtons(dexPlatforms, defaultDex, isDarkMode)

    cardHTML += `
          </div>
        </div>
      </div>

      <!-- 品牌标识 -->
      <div style="display: flex; align-items: center; justify-content: center; padding-top: 12px; border-top: 1px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'};">
        <div style="font-size: 12px; color: ${isDarkMode ? 'rgb(156, 163, 175)' : 'rgb(107, 114, 128)'};">
          ${t.poweredBy}
        </div>
      </div>
    `

    card.innerHTML = cardHTML
  }

  /**
   * 渲染DEX按钮
   */
  private renderDexButtons(_dexPlatforms: DexPlatform[], defaultDex: DexPlatform | null, _isDarkMode: boolean): string {
    let dexHTML = ''

    // 只显示默认DEX按钮，根据用户设置
    if (defaultDex) {
      const iconUrl = chrome.runtime.getURL(defaultDex.icon)
      dexHTML += `
        <button class="dex-btn" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: 500; transition: all 0.2s; border: 1px solid; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); cursor: pointer; background-color: rgb(34, 197, 94); color: rgb(255, 255, 255); border-color: rgb(34, 197, 94);"
                data-dex-id="${defaultDex.id}" data-address="${this.options.walletAddress}"
                onmouseover="this.style.backgroundColor='rgb(22, 163, 74)'"
                onmouseout="this.style.backgroundColor='rgb(34, 197, 94)'">
          <img src="${iconUrl}" style="width: 14px; height: 14px; border-radius: 2px;" onerror="this.style.display='none'">
          <span>${defaultDex.name}</span>
        </button>
      `
    }

    return dexHTML
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(card: HTMLElement, _language: string, t: any): void {
    // 复制地址按钮
    const copyBtn = card.querySelector('.copy-btn') as HTMLButtonElement
    if (copyBtn) {
      copyBtn.addEventListener('click', async (e) => {
        e.preventDefault()
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(this.options.walletAddress)
          this.showToast(t.copySuccess)
        } catch (error) {
          this.showToast(t.copyFailed, 'error')
        }
      })
    }

    // 区块浏览器按钮
    const explorerBtn = card.querySelector('.explorer-btn') as HTMLButtonElement
    if (explorerBtn) {
      explorerBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const url = this.getExplorerUrl(this.options.walletAddress, this.options.networkType)
        if (url) {
          window.open(url, '_blank')
          this.showToast(t.explorerOpened)
        }
      })
    }

    // 备注按钮
    const noteBtn = card.querySelector('.note-btn') as HTMLButtonElement
    if (noteBtn) {
      noteBtn.addEventListener('click', async (e) => {
        e.preventDefault()
        e.stopPropagation()
        await this.handleNoteClick(t)
      })
    }

    // DEX按钮
    const dexBtns = card.querySelectorAll('.dex-btn') as NodeListOf<HTMLButtonElement>
    dexBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const dexId = btn.getAttribute('data-dex-id')
        const address = btn.getAttribute('data-address')
        if (dexId && address) {
          this.handleDexClick(dexId, address)
        }
      })
    })
  }

  /**
   * 处理DEX按钮点击
   */
  private handleDexClick(dexId: string, address: string): void {
    const platform = getDexPlatformById(dexId)

    if (platform) {
      const url = platform.getUrl(address)
      window.open(url, '_blank')
      this.showToast(`已打开 ${platform.name}`)
    }
  }

  /**
   * 处理备注按钮点击
   */
  private async handleNoteClick(t: any): Promise<void> {
    try {
      console.log('🔄 钱包备注徽章点击，打开侧边栏:', {
        walletAddress: this.options.walletAddress,
        networkType: this.options.networkType,
        hasNote: !!this.currentNote
      })

      const response = await sendToBackground({
        name: "openSidePanel",
        body: {
          type: 'walletNotes',
          title: this.currentNote ? t.editNote : t.addNote,
          walletAddress: this.options.walletAddress,
          userData: {
            walletAddress: this.options.walletAddress,
            networkType: this.options.networkType,
            existingNote: this.currentNote
          }
        }
      })

      if (!response?.success) {
        console.error('打开侧边栏失败:', response?.error)
        this.showToast(t.noteEditorFailed, 'error')
      } else {
        console.log('✅ 侧边栏打开成功')
      }
    } catch (error) {
      console.error('打开侧边栏失败:', error)
      this.showToast(t.noteEditorFailed, 'error')
    }
  }

  /**
   * 更新备注内容
   */
  updateNote(note: WalletNote | null): void {
    this.currentNote = note

    if (this.element) {
      // 重新渲染卡片
      this.render()
    }
  }

  /**
   * 销毁徽章
   */
  destroy(): void {
    // 移除消息监听器
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener)
    }

    // 移除DOM元素
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }

    this.element = null
    this.currentNote = null
    this.dexSettings = null
  }
}