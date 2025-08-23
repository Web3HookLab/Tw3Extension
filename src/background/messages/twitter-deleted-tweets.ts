/**
 * Background消息处理器：Twitter删除推文数据
 * 处理来自Content Script的删除推文数据请求，避免CORS问题
 */

import type { PlasmoMessaging } from "@plasmohq/messaging"
import { API_CONFIG } from "~src/config/config"
import { TokenManager } from "~src/services/token.service"

export interface TwitterDeletedTweetsRequest {
  restId: string
  pagination?: {
    limit?: number
    offset?: number
  }
}

export interface TwitterDeletedTweetsResponse {
  success: boolean
  data?: {
    data: Array<{
      tweet_id: string
      rest_id: string
      content: string
      created_at: string
      deleted_at: string
    }>
    next_offset: number
    has_more: boolean
  }
  error?: string
}

const handler: PlasmoMessaging.MessageHandler<TwitterDeletedTweetsRequest, TwitterDeletedTweetsResponse> = async (req, res) => {
  const { restId, pagination = {} } = req.body

  try {
    console.log('🌐 Background处理删除推文数据请求:', { restId, pagination })

    // 获取认证token
    const token = await TokenManager.getToken()
    if (!token) {
      console.error('❌ 未找到认证token')
      res.send({
        success: false,
        error: '用户未登录，请先登录后重试'
      })
      return
    }

    // 构建API请求
    const apiUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_DELETED_TWEETS}`
    const requestBody = {
      rest_id: restId,
      pagination: {
        limit: pagination.limit || 20,
        offset: pagination.offset || 0
      }
    }

    console.log('📡 发送删除推文API请求:', { apiUrl, requestBody })

    // 发送请求到API服务器
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Tw3Track-Extension/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
    })

    console.log('📥 删除推文API响应状态:', response.status)

    if (!response.ok) {
      let errorMessage = `API请求失败: ${response.status} ${response.statusText}`
      
      // 处理特定的错误状态码
      if (response.status === 401) {
        errorMessage = '认证失败，请重新登录'
      } else if (response.status === 403) {
        errorMessage = '此功能需要会员订阅'
      } else if (response.status === 429) {
        errorMessage = 'API调用频率过高，请稍后重试'
      } else if (response.status === 503) {
        errorMessage = '服务暂时不可用，请稍后重试'
      }

      console.error('❌ 删除推文API响应错误:', response.status, response.statusText)
      res.send({
        success: false,
        error: errorMessage
      })
      return
    }

    const data = await response.json()
    console.log('📋 删除推文API响应成功:', data.data?.data?.length || 0, '条数据')

    // 检查API响应格式
    if (data.code !== 200) {
      console.error('❌ 删除推文API业务错误:', data.msg)
      res.send({
        success: false,
        error: data.msg || '获取删除推文数据失败'
      })
      return
    }

    console.log('✅ 删除推文数据获取成功')
    res.send({
      success: true,
      data: data.data
    })

  } catch (error) {
    console.error('❌ 删除推文数据请求异常:', error)
    
    let errorMessage = '获取删除推文数据失败'
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = '请求超时，请检查网络连接'
      } else {
        errorMessage = error.message
      }
    }

    res.send({
      success: false,
      error: errorMessage
    })
  }
}

export default handler
