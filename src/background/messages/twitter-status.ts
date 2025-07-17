/**
 * Background消息处理器：Twitter状态数据
 * 处理来自Content Script的Twitter状态数据请求，避免CORS问题
 */

import type { PlasmoMessaging } from "@plasmohq/messaging"
import { API_CONFIG } from "~src/config/config"
import { TokenManager } from "~src/services/token.service"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { restId, forceRefresh } = req.body
  
  try {
    console.log('🌐 Background处理Twitter状态数据请求:', { restId, forceRefresh })
    
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
    const apiUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_STATUS}`
    const requestBody = {
      rest_id: restId
    }

    console.log('📡 发送API请求:', { apiUrl, requestBody })

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

    console.log('📡 API响应状态:', response.status, response.statusText)

    if (!response.ok) {
      let errorMessage = `API请求失败: ${response.status} ${response.statusText}`
      
      // 处理特定的HTTP状态码
      switch (response.status) {
        case 401:
          errorMessage = '认证失败，请重新登录'
          break
        case 403:
          errorMessage = '权限不足，请检查账户状态'
          break
        case 404:
          errorMessage = '暂无此用户的数据记录'
          break
        case 429:
          errorMessage = '请求过于频繁，请稍后重试'
          break
        case 500:
          errorMessage = '服务器内部错误，请稍后重试'
          break
        case 503:
          errorMessage = '服务暂时不可用，请稍后重试'
          break
      }
      
      console.error('❌ API请求失败:', errorMessage)
      res.send({
        success: false,
        error: errorMessage
      })
      return
    }

    // 解析响应数据
    const data = await response.json()
    console.log('✅ API数据获取成功:', { 
      code: data.code, 
      hasData: !!data.data,
      kolCount: data.data?.kol_count || 0
    })

    // 检查API响应格式
    if (data.code !== 200) {
      const errorMessage = data.msg || '数据获取失败'
      console.error('❌ API返回错误:', errorMessage)
      res.send({
        success: false,
        error: errorMessage
      })
      return
    }

    // 验证数据完整性
    if (!data.data) {
      console.warn('⚠️ API返回空数据')
      res.send({
        success: false,
        error: '暂无数据'
      })
      return
    }

    // 返回成功结果
    res.send({
      success: true,
      data: data.data,
      timestamp: Date.now()
    })

    console.log('✅ Twitter状态数据请求处理完成')

  } catch (error) {
    console.error('❌ Background处理Twitter状态数据请求异常:', error)
    
    let errorMessage = '数据获取失败'
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = '请求超时，请检查网络连接'
      } else if (error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络状态'
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
