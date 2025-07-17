/**
 * Twitter备注数据服务
 * 负责管理备注数据的获取、缓存和同步
 */

import { Storage } from '@plasmohq/storage'
import { sendToBackground } from '@plasmohq/messaging'
import type { TwitterNote } from '~src/types/twitter-notes.types'
import type { DataLoadResult, OperationResult } from '../types/twitter-notes-injection.types'
import { APP_CONFIG } from '~src/config/config'

const storage = new Storage({ area: 'local' })

export class TwitterNotesDataService {
  private static readonly CACHE_KEY = 'twitter_notes'
  private static readonly CACHE_DURATION = APP_CONFIG.TWITTER_CACHE.EXPIRY_TIME

  /**
   * 获取本地Twitter备注数据
   */
  static async getLocalTwitterNotes(): Promise<TwitterNote[]> {
    try {
      const data = await storage.get(this.CACHE_KEY)
      if (Array.isArray(data)) {
        console.log('📦 获取本地备注数据:', data.length, '条')
        return data
      } else {
        console.log('📦 本地备注数据为空')
        return []
      }
    } catch (error) {
      console.error('❌ 获取本地备注数据失败:', error)
      return []
    }
  }

  /**
   * 设置本地Twitter备注数据
   */
  static async setLocalTwitterNotes(notes: TwitterNote[]): Promise<boolean> {
    try {
      await storage.set(this.CACHE_KEY, notes)
      console.log('💾 保存本地备注数据:', notes.length, '条')
      return true
    } catch (error) {
      console.error('❌ 保存本地备注数据失败:', error)
      return false
    }
  }

  /**
   * 通过Background获取Twitter备注数据
   */
  static async fetchTwitterNotes(forceRefresh = false): Promise<DataLoadResult<TwitterNote[]>> {
    try {
      console.log('🌐 通过Background获取备注数据:', { forceRefresh })

      // 如果不强制刷新，先检查本地缓存
      if (!forceRefresh) {
        const localNotes = await this.getLocalTwitterNotes()
        if (localNotes.length > 0) {
          return {
            success: true,
            data: localNotes,
            fromCache: true,
            timestamp: Date.now()
          }
        }
      }

      // 通过Background请求数据
      const response = await sendToBackground({
        name: "twitter-notes-fetch",
        body: { forceRefresh }
      })

      if (response.success && response.data) {
        // 缓存数据
        await this.setLocalTwitterNotes(response.data)

        console.log('✅ 备注数据获取成功:', response.data.length, '条')
        return {
          success: true,
          data: response.data,
          fromCache: false,
          timestamp: Date.now()
        }
      } else {
        console.error('❌ 备注数据请求失败:', response.error)
        return {
          success: false,
          error: response.error || '数据请求失败'
        }
      }
    } catch (error) {
      console.error('❌ 获取备注数据异常:', error)
      
      // 发生错误时尝试使用本地缓存
      const localNotes = await this.getLocalTwitterNotes()
      return {
        success: false,
        data: localNotes,
        fromCache: true,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 添加备注
   */
  static async addNote(
    restId: string,
    note: string,
    tags: string[]
  ): Promise<OperationResult> {
    try {
      console.log('➕ 添加备注:', { restId, note, tags })

      const response = await sendToBackground({
        name: "twitter-notes-add",
        body: {
          restId,
          note,
          tags
        }
      })

      if (response.success) {
        console.log('✅ 备注添加成功')
        
        // 添加成功后拉取全量数据
        await this.fetchTwitterNotes(true)
        
        return {
          success: true,
          data: response.data
        }
      } else {
        console.error('❌ 备注添加失败:', response.error)
        return {
          success: false,
          error: response.error || '添加备注失败'
        }
      }
    } catch (error) {
      console.error('❌ 添加备注异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 更新备注
   */
  static async updateNote(
    restId: string,
    note: string,
    tags: string[]
  ): Promise<OperationResult> {
    try {
      console.log('✏️ 更新备注:', { restId, note, tags })

      const response = await sendToBackground({
        name: "twitter-notes-update",
        body: {
          restId,
          note,
          tags
        }
      })

      if (response.success) {
        console.log('✅ 备注更新成功')
        
        // 更新本地缓存中的对应项
        await this.updateLocalNote(restId, note, tags)
        
        return {
          success: true,
          data: response.data
        }
      } else {
        console.error('❌ 备注更新失败:', response.error)
        return {
          success: false,
          error: response.error || '更新备注失败'
        }
      }
    } catch (error) {
      console.error('❌ 更新备注异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 删除备注
   */
  static async deleteNote(restId: string): Promise<OperationResult> {
    try {
      console.log('🗑️ 删除备注:', restId)

      const response = await sendToBackground({
        name: "twitter-notes-delete",
        body: { restId }
      })

      if (response.success) {
        console.log('✅ 备注删除成功')
        
        // 从本地缓存移除对应项
        await this.removeLocalNote(restId)
        
        return {
          success: true
        }
      } else {
        console.error('❌ 备注删除失败:', response.error)
        return {
          success: false,
          error: response.error || '删除备注失败'
        }
      }
    } catch (error) {
      console.error('❌ 删除备注异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 更新本地缓存中的备注
   */
  private static async updateLocalNote(
    restId: string,
    note: string,
    tags: string[]
  ): Promise<void> {
    try {
      const localNotes = await this.getLocalTwitterNotes()
      const index = localNotes.findIndex(n => n.twitter_rest_id === restId)
      
      if (index >= 0) {
        localNotes[index] = {
          ...localNotes[index],
          note,
          tags
        }
        
        await this.setLocalTwitterNotes(localNotes)
        console.log('🔄 本地备注缓存已更新:', restId)
      }
    } catch (error) {
      console.error('❌ 更新本地备注缓存失败:', error)
    }
  }

  /**
   * 从本地缓存移除备注
   */
  private static async removeLocalNote(restId: string): Promise<void> {
    try {
      const localNotes = await this.getLocalTwitterNotes()
      const filteredNotes = localNotes.filter(note => note.twitter_rest_id !== restId)
      
      await this.setLocalTwitterNotes(filteredNotes)
      console.log('🗑️ 本地备注缓存已移除:', restId)
    } catch (error) {
      console.error('❌ 移除本地备注缓存失败:', error)
    }
  }

  /**
   * 根据restId查找备注
   */
  static async findNoteByRestId(restId: string): Promise<TwitterNote | null> {
    try {
      const localNotes = await this.getLocalTwitterNotes()
      const note = localNotes.find(n => n.twitter_rest_id === restId)
      return note || null
    } catch (error) {
      console.error('❌ 查找备注失败:', error)
      return null
    }
  }

  /**
   * 根据screen_name查找备注
   */
  static async findNoteByScreenName(screenName: string): Promise<TwitterNote | null> {
    try {
      const localNotes = await this.getLocalTwitterNotes()
      const note = localNotes.find(n => 
        n.screen_name?.toLowerCase() === screenName.toLowerCase()
      )
      return note || null
    } catch (error) {
      console.error('❌ 查找备注失败:', error)
      return null
    }
  }

  /**
   * 清理本地缓存
   */
  static async clearLocalCache(): Promise<boolean> {
    try {
      await storage.remove(this.CACHE_KEY)
      console.log('🧹 本地备注缓存已清理')
      return true
    } catch (error) {
      console.error('❌ 清理本地缓存失败:', error)
      return false
    }
  }

  /**
   * 获取缓存统计
   */
  static async getCacheStats(): Promise<{
    count: number
    size: number
    lastUpdate: number | null
  }> {
    try {
      const localNotes = await this.getLocalTwitterNotes()
      const cacheSize = JSON.stringify(localNotes).length
      
      return {
        count: localNotes.length,
        size: cacheSize,
        lastUpdate: Date.now() // 简化实现，实际可以存储真实的更新时间
      }
    } catch (error) {
      console.error('❌ 获取缓存统计失败:', error)
      return {
        count: 0,
        size: 0,
        lastUpdate: null
      }
    }
  }

  /**
   * 广播缓存更新消息
   */
  static async broadcastCacheUpdate(notes?: TwitterNote[]): Promise<void> {
    try {
      const notesToBroadcast = notes || await this.getLocalTwitterNotes()
      
      // 发送消息给所有监听器
      chrome.runtime.sendMessage({
        type: 'TWITTER_NOTES_CACHE_UPDATED',
        notes: notesToBroadcast
      }).catch(() => {
        // 忽略发送失败，可能没有监听器
      })
      
      console.log('📡 缓存更新消息已广播:', notesToBroadcast.length, '条备注')
    } catch (error) {
      console.error('❌ 广播缓存更新失败:', error)
    }
  }
}
