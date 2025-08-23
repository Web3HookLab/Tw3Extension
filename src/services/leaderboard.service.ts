/**
 * CA热榜API服务
 * 处理排行榜数据的API请求
 */

import { API_CONFIG } from '~src/config/config'
import { TokenManager } from '~src/services/token.service'
import type {
  LeaderboardParams,
  LeaderboardResponse,
  TokenRanking,
  FilterOptions
} from '~src/types/leaderboard.types'
import { TIME_RANGE_PRESETS, LeaderboardError } from '~src/types/leaderboard.types'

export class LeaderboardService {
  /**
   * 发送排行榜API请求
   */
  private static async makeRequest(params: LeaderboardParams): Promise<LeaderboardResponse> {
    try {
      // 获取认证token
      const token = await TokenManager.getToken()
      if (!token) {
        throw new LeaderboardError('用户未登录，请先登录后重试', 'AUTH_REQUIRED')
      }

      const apiUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.LEADERBOARD}`
      
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

      if (!response.ok) {
        throw new LeaderboardError(
          `API请求失败: ${response.status} ${response.statusText}`,
          'HTTP_ERROR',
          { status: response.status, statusText: response.statusText }
        )
      }

      const data: LeaderboardResponse = await response.json()
      return data
    } catch (error) {
      if (error instanceof LeaderboardError) {
        throw error
      }
      
      // 处理网络错误
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new LeaderboardError('网络连接失败，请检查网络设置', 'NETWORK_ERROR')
      }
      
      // 处理超时错误
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new LeaderboardError('请求超时，请稍后重试', 'TIMEOUT_ERROR')
      }
      
      throw new LeaderboardError(
        error instanceof Error ? error.message : '未知错误',
        'UNKNOWN_ERROR'
      )
    }
  }

  /**
   * 查询排行榜数据
   */
  static async query(params: LeaderboardParams): Promise<TokenRanking[]> {
    const response = await this.makeRequest(params)

    if (response.code !== 200) {
      throw new LeaderboardError(
        response.msg || '获取排行榜数据失败',
        'API_ERROR',
        { code: response.code, message: response.msg }
      )
    }

    // 适配实际的API响应格式
    // 实际格式: response.data.data[0].rankings
    const rankings = response.data?.data?.[0]?.rankings || []

    return rankings
  }

  /**
   * 根据筛选条件获取排行榜
   */
  static async getLeaderboard(
    filters: FilterOptions,
    timeRangePreset: string = 'today'
  ): Promise<TokenRanking[]> {
    let startTime: string
    let endTime: string
    let interval: 'hour' | 'day'

    // 如果使用自定义时间范围
    if (timeRangePreset === 'custom' && filters.customTimeRange) {
      startTime = filters.customTimeRange.startTime
      endTime = filters.customTimeRange.endTime
      interval = filters.timeRange
    } else {
      // 使用预设时间范围
      const preset = TIME_RANGE_PRESETS.find(p => p.value === timeRangePreset)
      if (!preset) {

        // 使用默认的今日预设
        const defaultPreset = TIME_RANGE_PRESETS.find(p => p.value === 'today')
        if (!defaultPreset) {
          throw new LeaderboardError('无法找到默认时间范围预设', 'INVALID_TIME_RANGE')
        }
        const timeRange = defaultPreset.getTimeRange()
        startTime = timeRange.start_time
        endTime = timeRange.end_time
        interval = timeRange.interval
      } else {
        const timeRange = preset.getTimeRange()
        startTime = timeRange.start_time
        endTime = timeRange.end_time
        interval = timeRange.interval
      }
    }

    const params: LeaderboardParams = {
      start_time: startTime,
      end_time: endTime,
      interval: interval,
      limit: filters.limit,
      network_type: filters.networkType,
      sort_by: filters.sortBy,
      order: 'desc'
    }



    return this.query(params)
  }

  /**
   * 获取今日排行榜
   */
  static async getTodayRanking(
    networkType: 'solana' | 'ethereum' = 'solana',
    limit: number = 50
  ): Promise<TokenRanking[]> {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    const params: LeaderboardParams = {
      start_time: startOfDay.toISOString(),
      end_time: today.toISOString(),
      interval: 'day',
      limit,
      network_type: networkType,
      sort_by: 'total_mentions',
      order: 'desc'
    }

    return this.query(params)
  }

  /**
   * 获取最近1小时热门代币
   */
  static async getHourlyHot(
    networkType: 'solana' | 'ethereum' = 'solana',
    limit: number = 20
  ): Promise<TokenRanking[]> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const params: LeaderboardParams = {
      start_time: oneHourAgo.toISOString(),
      end_time: now.toISOString(),
      interval: 'hour',
      limit,
      network_type: networkType,
      sort_by: 'change_rate',
      order: 'desc'
    }

    return this.query(params)
  }

  /**
   * 获取涨幅最大的代币
   */
  static async getTopGainers(
    networkType: 'solana' | 'ethereum' = 'solana',
    limit: number = 10
  ): Promise<TokenRanking[]> {
    const now = new Date()
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)
    
    const params: LeaderboardParams = {
      start_time: sixHoursAgo.toISOString(),
      end_time: now.toISOString(),
      interval: 'hour',
      limit,
      network_type: networkType,
      sort_by: 'change_rate',
      order: 'desc'
    }

    return this.query(params)
  }

  /**
   * 获取最活跃用户的代币
   */
  static async getMostActiveUsers(
    networkType: 'solana' | 'ethereum' = 'solana',
    limit: number = 30
  ): Promise<TokenRanking[]> {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const params: LeaderboardParams = {
      start_time: twentyFourHoursAgo.toISOString(),
      end_time: now.toISOString(),
      interval: 'day',
      limit,
      network_type: networkType,
      sort_by: 'unique_users',
      order: 'desc'
    }

    return this.query(params)
  }
}
