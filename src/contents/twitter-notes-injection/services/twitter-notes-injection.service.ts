/**
 * Twitter备注注入服务（简化版）
 * 提供用户信息提取功能
 */

import type { TwitterNote } from '~src/types/twitter-notes.types'
import type {
  UserIdentificationResult
} from '../types/twitter-notes-injection.types'
import {
  extractRestIdFromProfile,
  extractUserInfoFromTweetElement
} from '../utils/extraction.utils'

export class TwitterNotesInjectionService {
  /**
   * 提取用户主页信息
   */
  static async extractProfileUserInfo(): Promise<UserIdentificationResult | null> {
    try {
      const restId = extractRestIdFromProfile()
      if (!restId) {
        return null
      }

      // 从URL提取screen_name
      const screenName = location.pathname.slice(1).split('/')[0]

      return {
        restId,
        screenName,
        source: 'profile'
      }
    } catch (error) {
      console.error('❌ 提取用户主页信息时出错:', error)
      return null
    }
  }

  /**
   * 提取推文用户信息
   */
  static async extractTweetUserInfo(
    userNameElement: Element,
    localNotes: TwitterNote[]
  ): Promise<UserIdentificationResult | null> {
    try {
      return await extractUserInfoFromTweetElement(userNameElement, localNotes)
    } catch (error) {
      console.error('❌ 提取推文用户信息时出错:', error)
      return null
    }
  }
}
