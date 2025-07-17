/**
 * 更新钱包备注的Background消息处理器
 */

import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from '@plasmohq/storage'
import { TokenManager } from '~src/services/token.service'
import { API_CONFIG } from '~src/config/config'

const storage = new Storage({ area: 'local' })

export interface WalletNotesUpdateRequest {
  walletAddress: string
  network: string
  note: string
  source: string
}

export interface WalletNotesUpdateResponse {
  success: boolean
  data?: any
  error?: string
}

/**
 * 获取最新的钱包备注数据
 */
async function fetchAllWalletNotesData(token: string) {
  try {
    console.log('🔄 后台：获取最新钱包备注数据...')
    
    const apiUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.WALLET_NOTES_LIST}`
    let allNotes: any[] = []
    let offset = 0
    const limit = 5000
    let hasMore = true

    while (hasMore && allNotes.length < 5000) {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offset,
          limit
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.code === 200 && data.data?.notes) {
        allNotes = allNotes.concat(data.data.notes)
        hasMore = data.data.has_more || false
        offset += limit
        
        console.log(`📦 后台：已获取 ${allNotes.length} 条钱包备注数据`)
      } else {
        console.warn('⚠️ 后台：API返回异常:', data)
        break
      }
    }

    console.log(`✅ 后台：钱包备注数据获取完成，总计 ${allNotes.length} 条`)
    return allNotes
  } catch (error) {
    console.error('❌ 后台：获取钱包备注数据失败:', error)
    return null
  }
}

const handler: PlasmoMessaging.MessageHandler<WalletNotesUpdateRequest, WalletNotesUpdateResponse> = async (req, res) => {
  console.log('🔄 后台：处理更新钱包备注请求:', req.body)

  try {
    const { walletAddress, network, note, source } = req.body

    // 验证参数
    if (!walletAddress || !network || !note) {
      console.error('❌ 更新钱包备注参数验证失败:', { 
        walletAddress: !!walletAddress, 
        network: !!network, 
        note: !!note 
      })
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
      console.error('❌ 更新钱包备注失败: 未找到认证token')
      res.send({
        success: false,
        error: '用户未登录，请先登录后重试'
      })
      return
    }

    // 调用API更新钱包备注
    const apiUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.WALLET_NOTES_UPDATE}`
    console.log('🌐 发送更新请求到:', apiUrl)

    const requestData = {
      wallet_address: walletAddress,
      network,
      note,
      source: source || 'Twitter'
    }

    console.log('📤 请求数据:', requestData)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📥 API响应:', data)

    if (data.code === 200) {
      console.log('✅ 钱包备注更新成功:', walletAddress, '备注内容:', note)

      // 立即发送成功响应给侧边栏
      res.send({
        success: true,
        data: data.data
      })

      // 异步更新缓存和发送消息（不阻塞响应）
      setTimeout(async () => {
        try {
          console.log('🔄 后台：更新成功后全量更新本地缓存...')

          // 直接获取最新的钱包备注数据
          const allNotes = await fetchAllWalletNotesData(token)

          if (allNotes) {
            // 直接更新本地缓存存储
            await storage.set('wallet_notes', allNotes)
            console.log('💾 后台：本地缓存已更新，数据条数:', allNotes.length)

            // 直接发送消息给所有Twitter标签页的content script
            try {
              const tabs = await chrome.tabs.query({ url: ['*://x.com/*', '*://twitter.com/*'] });
              console.log('🔍 后台：找到Twitter标签页数量:', tabs.length);

              const message = {
                type: 'WALLET_NOTES_CACHE_UPDATED',
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
      }, 100) // 100ms延迟，确保响应先发送

    } else {
      console.error('❌ 钱包备注更新失败:', data.msg || '未知错误')
      res.send({
        success: false,
        error: data.msg || '更新钱包备注失败'
      })
    }

  } catch (error) {
    console.error('❌ 更新钱包备注异常:', error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : '网络错误，请重试'
    })
  }
}

export default handler
