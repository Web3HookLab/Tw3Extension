/**
 * 获取Twitter备注列表的Background消息处理器
 */

import type { PlasmoMessaging } from "@plasmohq/messaging"
import { TokenManager } from '~src/services/token.service'
import { API_CONFIG } from '~src/config/config'

export interface TwitterNotesFetchRequest {
  forceRefresh?: boolean
}

export interface TwitterNotesFetchResponse {
  success: boolean
  data?: any[]
  error?: string
}

const handler: PlasmoMessaging.MessageHandler<TwitterNotesFetchRequest, TwitterNotesFetchResponse> = async (req, res) => {
  console.log('🔄 后台：处理获取Twitter备注列表请求:', req.body)

  try {
    const { forceRefresh = false } = req.body || {}

    // 获取认证token
    const token = await TokenManager.getToken()
    if (!token) {
      res.send({
        success: false,
        error: '用户未登录，请先登录后重试'
      })
      return
    }

    // 分页获取所有备注数据
    let allNotes: any[] = []
    let offset = 0
    const limit = 5000
    const maxPages = 50 // 最多获取50页，防止无限循环

    for (let page = 0; page < maxPages; page++) {
      const apiUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_NOTES_LIST}`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Tw3Track-Extension/1.0'
        },
        body: JSON.stringify({
          limit,
          offset
        }),
        signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
      })

      const data = await response.json()

      if (data.code === 200) {
        const pageData = data.data?.data || []
        allNotes.push(...pageData)
        
        // 检查是否还有更多数据
        if (!data.data?.has_more || pageData.length < limit) {
          break
        }
        
        offset += limit
      } else {
        console.error('❌ Twitter备注列表获取失败:', data.msg)
        res.send({
          success: false,
          error: data.msg || '获取备注列表失败'
        })
        return
      }
    }

    console.log('✅ Twitter备注列表获取成功:', allNotes.length, '条')
    res.send({
      success: true,
      data: allNotes
    })

  } catch (error) {
    console.error('❌ 获取Twitter备注列表时出错:', error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
}

export default handler
