/**
 * 删除Twitter备注的Background消息处理器
 */

import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from '@plasmohq/storage'
import { TokenManager } from '~src/services/token.service'
import { API_CONFIG } from '~src/config/config'

const storage = new Storage({ area: 'local' })

export interface TwitterNotesDeleteRequest {
  restId: string
}

export interface TwitterNotesDeleteResponse {
  success: boolean
  error?: string
}

const handler: PlasmoMessaging.MessageHandler<TwitterNotesDeleteRequest, TwitterNotesDeleteResponse> = async (req, res) => {
  console.log('🔄 后台：处理删除Twitter备注请求:', req.body)

  try {
    const { restId } = req.body

    // 验证参数
    if (!restId) {
      console.error('❌ 删除备注参数验证失败: restId为空')
      res.send({
        success: false,
        error: '参数不完整'
      })
      return
    }

    // 获取认证token
    console.log('🔑 获取认证token...')
    const token = await TokenManager.getToken()
    if (!token) {
      console.error('❌ 删除备注失败: 未找到认证token')
      res.send({
        success: false,
        error: '用户未登录，请先登录后重试'
      })
      return
    }

    // 调用API删除备注
    const apiUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_NOTES_DELETE}`
    console.log('🌐 发送删除请求到:', apiUrl)
    console.log('📤 请求参数:', { twitter_rest_id: restId })

    const requestBody = JSON.stringify({
      twitter_rest_id: restId
    })

    console.log('⏱️ 开始API请求，超时时间:', API_CONFIG.REQUEST_TIMEOUT, 'ms')

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Tw3Track-Extension/1.0'
      },
      body: requestBody,
      signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
    })

    console.log('📥 API响应状态:', response.status, response.statusText)

    if (!response.ok) {
      console.error('❌ API响应错误:', response.status, response.statusText)
      res.send({
        success: false,
        error: `API请求失败: ${response.status} ${response.statusText}`
      })
      return
    }

    const data = await response.json()
    console.log('📋 API响应数据:', data)

    if (data.code === 200) {
      console.log('✅ Twitter备注删除成功:', restId)

      // 立即发送成功响应给侧边栏
      res.send({
        success: true
      })

      // 异步更新缓存和发送消息（不阻塞响应）
      setTimeout(async () => {
        try {
          console.log('🔄 后台：删除成功后全量更新本地缓存...')

          // 直接获取最新的备注数据
          const allNotes = await fetchAllNotesData(token)

          if (allNotes) {
            // 直接更新本地缓存存储
            await storage.set('twitter_notes', allNotes)
            console.log('💾 后台：本地缓存已更新，数据条数:', allNotes.length)

            // 直接发送消息给所有Twitter标签页的content script
            try {
              const tabs = await chrome.tabs.query({ url: ['*://x.com/*', '*://twitter.com/*'] });
              console.log('🔍 后台：找到Twitter标签页数量:', tabs.length);

              const message = {
                type: 'TWITTER_NOTES_CACHE_UPDATED',
                notes: allNotes
              };

              if (tabs.length > 0) {
                for (const tab of tabs) {
                  if (tab.id) {
                    try {
                      console.log('📤 后台：向标签页发送消息:', tab.id, tab.url);
                      await chrome.tabs.sendMessage(tab.id, message);
                      console.log('✅ 后台：消息发送成功到标签页:', tab.id);
                    } catch (error) {
                      console.log('❌ 后台：消息发送失败到标签页:', tab.id, error.message);
                    }
                  }
                }
              } else {
                console.log('⚠️ 后台：未找到Twitter标签页');
              }

              console.log('📤 后台：缓存更新消息已广播')
            } catch (error) {
              console.error('❌ 后台：消息广播失败:', error)
            }
          }
        } catch (error) {
          console.error('❌ 后台：更新缓存失败:', error)
        }
      }, 0)
    } else {
      console.error('❌ Twitter备注删除失败 - API返回错误:', data)
      res.send({
        success: false,
        error: data.msg || '删除备注失败'
      })
    }

  } catch (error) {
    console.error('❌ 删除Twitter备注时出错:', error)

    // 详细的错误信息
    if (error instanceof Error) {
      console.error('错误类型:', error.constructor.name)
      console.error('错误消息:', error.message)
      console.error('错误堆栈:', error.stack)
    }

    let errorMessage = '未知错误'
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        errorMessage = '请求超时，请检查网络连接后重试'
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络后重试'
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

/**
 * 获取所有备注数据的辅助函数
 */
async function fetchAllNotesData(token: string): Promise<any[] | null> {
  try {
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
        console.error('❌ 获取备注列表失败:', data.msg)
        return null
      }
    }

    console.log('✅ 获取备注列表成功:', allNotes.length, '条')
    return allNotes
  } catch (error) {
    console.error('❌ 获取备注列表异常:', error)
    return null
  }
}

export default handler
