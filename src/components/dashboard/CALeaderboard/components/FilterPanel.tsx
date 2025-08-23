/**
 * CA热榜筛选面板组件
 */

import React, { useState } from 'react'
import { RefreshCw, Clock, TrendingUp, Calendar } from 'lucide-react'
import { Button } from '~src/components/ui/button'
import { Card, CardContent } from '~src/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~src/components/ui/select'
import { Badge } from '~src/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger } from '~src/components/ui/dialog'
import { CustomTimeRangePicker } from './CustomTimeRangePicker'
import type { FilterPanelProps } from '~src/types/leaderboard.types'
import { NETWORK_OPTIONS, getSortOptions, getTimeRangePresets } from '~src/types/leaderboard.types'
import { useLanguageManager } from '~src/hooks/useLanguageManager'

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  timeRangePreset,
  onTimeRangePresetChange,
  onRefresh,
  loading,
  lastUpdated
}) => {
  const [showCustomTimeRange, setShowCustomTimeRange] = useState(false)
  const { t } = useLanguageManager()

  // Get translated options
  const sortOptions = getSortOptions(t)
  const timeRangePresets = getTimeRangePresets(t)
  // 处理网络类型变化
  const handleNetworkChange = (value: string) => {
    onFiltersChange({
      ...filters,
      networkType: value as 'solana' | 'ethereum'
    })
  }

  // 处理排序方式变化
  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sortBy: value as 'total_mentions' | 'change_rate' | 'unique_users'
    })
  }

  // 处理时间范围变化
  const handleTimeRangeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      timeRange: value as 'hour' | 'day'
    })
  }

  // 处理显示数量变化
  const handleLimitChange = (value: string) => {
    onFiltersChange({
      ...filters,
      limit: parseInt(value, 10)
    })
  }

  // 处理自定义时间范围变化
  const handleCustomTimeRangeChange = (startTime: string, endTime: string, interval: 'hour' | 'day') => {
    onFiltersChange({
      ...filters,
      timeRange: interval,
      customTimeRange: {
        startTime,
        endTime
      }
    })
    onTimeRangePresetChange('custom')
  }

  // 格式化最后更新时间
  const formatLastUpdated = (date: Date | null) => {
    if (!date) {
      return t('caLeaderboard.justUpdated')
    }

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) {
      return t('caLeaderboard.justUpdated')
    }
    if (minutes < 60) {
      return t('caLeaderboard.minutesAgo').replace('{minutes}', minutes.toString())
    }

    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
      return t('caLeaderboard.hoursAgo').replace('{hours}', hours.toString())
    }

    return date.toLocaleDateString()
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center">
          {/* 网络选择 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground min-w-fit">{t('caLeaderboard.network')}:</span>
            <Select value={filters.networkType} onValueChange={handleNetworkChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NETWORK_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 时间范围选择 */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground min-w-fit">{t('caLeaderboard.timeRange')}:</span>
            <Select value={filters.timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hour">{t('caLeaderboard.hour')}</SelectItem>
                <SelectItem value="day">{t('caLeaderboard.day')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 排序方式 */}
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground min-w-fit">{t('caLeaderboard.sortBy')}:</span>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 显示数量 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-muted-foreground min-w-fit">{t('caLeaderboard.displayCount')}:</span>
            <Select value={filters.limit.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 刷新按钮和状态 */}
          <div className="flex items-center space-x-3 lg:ml-auto">
            {lastUpdated && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {formatLastUpdated(lastUpdated)}
                </Badge>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('caLeaderboard.refresh')}</span>
            </Button>
          </div>
        </div>

        {/* 快速筛选预设 */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground">{t('caLeaderboard.quickSelect')}:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {timeRangePresets.map(preset => (
              <Button
                key={preset.value}
                variant={timeRangePreset === preset.value ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => {
                  const timeRange = preset.getTimeRange()
                  onTimeRangePresetChange(preset.value)
                  onFiltersChange({
                    ...filters,
                    timeRange: timeRange.interval,
                    customTimeRange: undefined
                  })
                }}
              >
                {preset.label}
              </Button>
            ))}

            {/* 自定义时间范围按钮 */}
            <Dialog open={showCustomTimeRange} onOpenChange={setShowCustomTimeRange}>
              <DialogTrigger asChild>
                <Button
                  variant={timeRangePreset === 'custom' ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-3 text-xs"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {t('common.custom')}
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 w-auto">
                <CustomTimeRangePicker
                  startTime={filters.customTimeRange?.startTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}
                  endTime={filters.customTimeRange?.endTime || new Date().toISOString()}
                  interval={filters.timeRange}
                  onTimeRangeChange={handleCustomTimeRangeChange}
                  onClose={() => setShowCustomTimeRange(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
