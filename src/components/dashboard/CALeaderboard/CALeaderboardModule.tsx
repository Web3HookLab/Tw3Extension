/**
 * CA热榜主模块组件
 */

import React, { useState, useCallback } from 'react'
import { FilterPanel } from './components/FilterPanel'
import { TokenList } from './components/TokenList'
import { useLeaderboard } from './hooks/useLeaderboard'
import type { FilterOptions } from '~src/types/leaderboard.types'
import { DEFAULT_FILTERS } from '~src/types/leaderboard.types'

export const CALeaderboardModule: React.FC = () => {
  // 筛选条件状态
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS)
  const [timeRangePreset, setTimeRangePreset] = useState('today')


  // 使用自定义Hook获取数据
  const {
    data: tokens,
    loading,
    error,
    refetch,
    lastUpdated
  } = useLeaderboard(filters, {
    autoRefresh: true,
    refreshInterval: 60000, // 1分钟自动刷新
    timeRangePreset
  })

  // 处理筛选条件变化
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters)
  }, [])

  // 处理时间预设变化
  const handleTimeRangePresetChange = useCallback((preset: string) => {
    setTimeRangePreset(preset)
  }, [])

  // 处理手动刷新
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  // 处理重试
  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <div className="space-y-6">
      {/* 筛选面板 */}
      <FilterPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        timeRangePreset={timeRangePreset}
        onTimeRangePresetChange={handleTimeRangePresetChange}
        onRefresh={handleRefresh}
        loading={loading}
        lastUpdated={lastUpdated}
      />

      {/* 代币列表 */}
      <TokenList
        tokens={tokens}
        loading={loading}
        error={error}
        onRetry={handleRetry}
        networkType={filters.networkType}
      />
    </div>
  )
}
