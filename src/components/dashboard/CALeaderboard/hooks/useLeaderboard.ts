/**
 * CA热榜数据获取Hook
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { LeaderboardService } from '~src/services/leaderboard.service'
import type {
  UseLeaderboardReturn,
  FilterOptions,
  TokenRanking
} from '~src/types/leaderboard.types'
import { LeaderboardError } from '~src/types/leaderboard.types'

interface UseLeaderboardOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  timeRangePreset?: string
}

export const useLeaderboard = (
  filters: FilterOptions,
  options: UseLeaderboardOptions = {}
): UseLeaderboardReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 60000, // 1分钟
    timeRangePreset = 'last_hour'
  } = options

  const [data, setData] = useState<TokenRanking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 获取数据的核心函数
  const fetchData = useCallback(async (showLoading = true) => {
    try {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      abortControllerRef.current = new AbortController()

      if (showLoading) {
        setLoading(true)
      }
      setError(null)

      const rankings = await LeaderboardService.getLeaderboard(filters, timeRangePreset)
      
      // 检查请求是否被取消
      if (abortControllerRef.current?.signal.aborted) {
        return
      }

      setData(rankings)
      setLastUpdated(new Date())

    } catch (err) {
      // 忽略被取消的请求
      if (err instanceof DOMException && err.name === 'AbortError') {
        return
      }


      
      let errorMessage = '获取数据失败'
      
      if (err instanceof LeaderboardError) {
        switch (err.code) {
          case 'AUTH_REQUIRED':
            errorMessage = '请先登录后重试'
            break
          case 'NETWORK_ERROR':
            errorMessage = '网络连接失败，请检查网络设置'
            break
          case 'TIMEOUT_ERROR':
            errorMessage = '请求超时，请稍后重试'
            break
          case 'API_ERROR':
            errorMessage = err.message || '服务器错误'
            break
          default:
            errorMessage = err.message
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [filters, timeRangePreset])

  // 手动刷新函数
  const refetch = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  // 清理定时器
  const clearRefreshInterval = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }, [])

  // 设置自动刷新
  const setupAutoRefresh = useCallback(() => {
    clearRefreshInterval()
    
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData(false) // 自动刷新时不显示loading状态
      }, refreshInterval)
    }
  }, [autoRefresh, refreshInterval, fetchData, clearRefreshInterval])

  // 初始化数据获取
  useEffect(() => {
    fetchData(true)
  }, [fetchData])

  // 设置自动刷新
  useEffect(() => {
    setupAutoRefresh()
    return clearRefreshInterval
  }, [setupAutoRefresh, clearRefreshInterval])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearRefreshInterval()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [clearRefreshInterval])

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated
  }
}

/**
 * 简化版Hook，用于快速获取特定类型的排行榜
 */
export const useQuickLeaderboard = (
  type: 'today' | 'hourly' | 'gainers' | 'active',
  networkType: 'solana' | 'ethereum' = 'solana',
  limit: number = 20
) => {
  const [data, setData] = useState<TokenRanking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      let rankings: TokenRanking[]
      
      switch (type) {
        case 'today':
          rankings = await LeaderboardService.getTodayRanking(networkType, limit)
          break
        case 'hourly':
          rankings = await LeaderboardService.getHourlyHot(networkType, limit)
          break
        case 'gainers':
          rankings = await LeaderboardService.getTopGainers(networkType, limit)
          break
        case 'active':
          rankings = await LeaderboardService.getMostActiveUsers(networkType, limit)
          break
        default:
          throw new Error('无效的排行榜类型')
      }
      
      setData(rankings)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [type, networkType, limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}
