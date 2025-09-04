/**
 * 地址推文查询API服务
 * 处理 /api/twitter/address_tweets 接口调用
 */

import { API_CONFIG } from '~src/config/config'
import { TokenManager } from './token.service'

// API响应类型定义
export interface AddressTweetsStats {
  total_tweets: number
  active_tweets: number
  deleted_tweets: number
  most_active_date: string
  most_active_date_count: number
  top_users: Array<{
    rest_id: string
    name: string
    screen_name: string
    followers_count: number
    profile_image_url_https: string
    tweet_count: number
    description_zh: string
    description_en: string
  }>
  first_mention_user: {
    rest_id: string
    name: string
    screen_name: string
    followers_count: number
    profile_image_url_https: string
    tweet_count: number
    description_zh: string
    description_en: string
    tweet_time: string  // ✨ 新增的最早提及时间
  } | null
}

export interface AddressTweet {
  network: 'solana' | 'ethereum'
  tweet_id: string
  name: string
  screen_name: string
  followers_count: number
  profile_image_url_https: string
  tweet_time: string
  status: string
  description_zh: string
  description_en: string
}

export interface TokenInfo {
  address: string
  name: string
  symbol: string
  description: string
  image: string
  twitter: string
  website: string
  chain: string // 支持多链字符串，如 "BSC,Arbitrum,Optimism,Base,Avalanche,xLayer"
}

export interface AddressTweetsResponse {
  code: number
  msg: string
  data: {
    stats: AddressTweetsStats
    tweets: AddressTweet[]
    token: TokenInfo
  }
  timestamp: string
}

export interface AddressTweetsRequest {
  solana_address?: string
  eth_address?: string
}

export class AddressTweetsService {

  /**
   * 查询地址相关推文
   */
  static async getAddressTweets(params: AddressTweetsRequest): Promise<AddressTweetsResponse> {
    try {
      // 参数验证
      if (!params.solana_address && !params.eth_address) {
        throw new Error('至少需要提供一个地址（solana_address 或 eth_address）')
      }

      // 获取认证token
      const token = await TokenManager.getToken()
      if (!token) {
        throw new Error('用户未登录，请先登录后重试')
      }

      const apiUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.TWITTER_ADDRESS_TWEETS}`
      
      console.log('🔄 发送地址推文查询请求:', { apiUrl, params })

      // 发送POST请求
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Tw3Track-Extension/1.0'
        },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
      })

      console.log('📡 API响应状态:', response.status, response.statusText)

      if (!response.ok) {
        // 处理特定错误状态
        if (response.status === 401) {
          throw new Error('认证失败，请重新登录')
        } else if (response.status === 403) {
          throw new Error('此功能仅对会员用户开放，免费计划不可用')
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.msg || '请求参数错误')
        }
        
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
      }

      const data: AddressTweetsResponse = await response.json()
      console.log('✅ 地址推文查询成功:', {
        totalTweets: data.data?.stats?.total_tweets,
        activeTweets: data.data?.stats?.active_tweets,
        tokenSymbol: data.data?.token?.symbol
      })

      return data

    } catch (error) {
      console.error('❌ 地址推文查询失败:', error)
      throw error
    }
  }

  /**
   * 检查用户是否有权限使用此功能
   */
  static async checkPermission(): Promise<boolean> {
    try {
      const userInfo = await TokenManager.getUserInfo()
      return userInfo?.plan !== 'Free'
    } catch (error) {
      console.error('❌ 检查权限失败:', error)
      return false
    }
  }
}
