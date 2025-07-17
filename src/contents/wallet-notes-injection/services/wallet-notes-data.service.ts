/**
 * 钱包备注数据服务
 * 处理钱包备注的本地缓存、API调用和数据同步
 */

import { sendToBackground } from '@plasmohq/messaging'
import type { WalletNote } from '~src/types/wallet-notes.types'
import { DataService } from '~src/services/notes.service'

export interface OperationResult {
  success: boolean
  data?: any
  error?: string
}

export class WalletNotesDataService {
  private static instance: WalletNotesDataService | null = null
  private localNotes: WalletNote[] = []
  private isLoaded = false

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): WalletNotesDataService {
    if (!this.instance) {
      this.instance = new WalletNotesDataService()
    }
    return this.instance
  }

  /**
   * 初始化数据服务
   */
  async initialize(): Promise<void> {
    if (this.isLoaded) {
      return
    }

    try {
      await this.loadLocalNotes()
      this.isLoaded = true
      console.log('✅ 钱包备注数据服务初始化完成')
    } catch (error) {
      console.error('❌ 钱包备注数据服务初始化失败:', error)
    }
  }

  /**
   * 加载本地缓存的钱包备注
   */
  private async loadLocalNotes(): Promise<void> {
    try {
      this.localNotes = await DataService.getLocalWalletNotes()
      console.log('📦 已加载本地钱包备注:', this.localNotes.length, '条')
    } catch (error) {
      console.error('❌ 加载本地钱包备注失败:', error)
      this.localNotes = []
    }
  }

  /**
   * 获取所有钱包备注
   */
  async getWalletNotes(forceRefresh: boolean = false): Promise<WalletNote[]> {
    if (!this.isLoaded || forceRefresh) {
      await this.loadLocalNotes()
    }
    return [...this.localNotes]
  }

  /**
   * 根据钱包地址查找备注
   */
  async findNoteByAddress(walletAddress: string): Promise<WalletNote | null> {
    const notes = await this.getWalletNotes()
    return notes.find(note => 
      note.wallet_address.toLowerCase() === walletAddress.toLowerCase()
    ) || null
  }

  /**
   * 添加钱包备注
   */
  async addNote(
    walletAddress: string,
    network: string,
    note: string,
    source: string = 'Twitter'
  ): Promise<OperationResult> {
    try {
      console.log('➕ 添加钱包备注:', { walletAddress, network, note, source })

      const response = await sendToBackground({
        name: "wallet-notes-add",
        body: {
          walletAddress,
          network,
          note,
          source
        }
      })

      if (response.success) {
        console.log('✅ 钱包备注添加成功')
        
        // 添加成功后拉取全量数据
        await this.refreshNotes()
        
        return {
          success: true,
          data: response.data
        }
      } else {
        console.error('❌ 钱包备注添加失败:', response.error)
        return {
          success: false,
          error: response.error || '添加钱包备注失败'
        }
      }
    } catch (error) {
      console.error('❌ 添加钱包备注异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 更新钱包备注
   */
  async updateNote(
    walletAddress: string,
    network: string,
    note: string,
    source: string = 'Twitter'
  ): Promise<OperationResult> {
    try {
      console.log('✏️ 更新钱包备注:', { walletAddress, network, note, source })

      const response = await sendToBackground({
        name: "wallet-notes-update",
        body: {
          walletAddress,
          network,
          note,
          source
        }
      })

      if (response.success) {
        console.log('✅ 钱包备注更新成功')
        
        // 更新本地缓存中的对应项
        await this.updateLocalNote(walletAddress, network, note, source)
        
        return {
          success: true,
          data: response.data
        }
      } else {
        console.error('❌ 钱包备注更新失败:', response.error)
        return {
          success: false,
          error: response.error || '更新钱包备注失败'
        }
      }
    } catch (error) {
      console.error('❌ 更新钱包备注异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 删除钱包备注
   */
  async deleteNote(walletAddress: string): Promise<OperationResult> {
    try {
      console.log('🗑️ 删除钱包备注:', { walletAddress })

      const response = await sendToBackground({
        name: "wallet-notes-delete",
        body: {
          walletAddress
        }
      })

      if (response.success) {
        console.log('✅ 钱包备注删除成功')
        
        // 从本地缓存中移除
        await this.removeLocalNote(walletAddress)
        
        return {
          success: true
        }
      } else {
        console.error('❌ 钱包备注删除失败:', response.error)
        return {
          success: false,
          error: response.error || '删除钱包备注失败'
        }
      }
    } catch (error) {
      console.error('❌ 删除钱包备注异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 刷新钱包备注数据
   */
  async refreshNotes(): Promise<void> {
    try {
      console.log('🔄 刷新钱包备注数据...')
      await this.loadLocalNotes()
      console.log('✅ 钱包备注数据刷新完成')
    } catch (error) {
      console.error('❌ 刷新钱包备注数据失败:', error)
    }
  }

  /**
   * 更新本地缓存中的单个备注
   */
  private async updateLocalNote(
    walletAddress: string,
    network: string,
    note: string,
    source: string
  ): Promise<void> {
    const index = this.localNotes.findIndex(n => 
      n.wallet_address.toLowerCase() === walletAddress.toLowerCase()
    )

    if (index !== -1) {
      // 更新现有备注
      this.localNotes[index] = {
        ...this.localNotes[index],
        note,
        source,
        updated_at: new Date().toISOString()
      }
    } else {
      // 添加新备注
      this.localNotes.push({
        wallet_address: walletAddress,
        network,
        note,
        source,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    console.log('💾 本地缓存已更新')
  }

  /**
   * 从本地缓存中移除备注
   */
  private async removeLocalNote(walletAddress: string): Promise<void> {
    const index = this.localNotes.findIndex(n => 
      n.wallet_address.toLowerCase() === walletAddress.toLowerCase()
    )

    if (index !== -1) {
      this.localNotes.splice(index, 1)
      console.log('💾 本地缓存已移除备注')
    }
  }

  /**
   * 处理缓存更新消息
   */
  async handleCacheUpdate(newNotes: WalletNote[]): Promise<void> {
    this.localNotes = newNotes
    console.log('🔄 钱包备注缓存已更新:', newNotes.length, '条')
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalNotes: this.localNotes.length,
      isLoaded: this.isLoaded,
      networks: [...new Set(this.localNotes.map(n => n.network))],
      sources: [...new Set(this.localNotes.map(n => n.source))]
    }
  }

  /**
   * 清理数据服务
   */
  destroy(): void {
    this.localNotes = []
    this.isLoaded = false
    WalletNotesDataService.instance = null
    console.log('🗑️ 钱包备注数据服务已清理')
  }
}
