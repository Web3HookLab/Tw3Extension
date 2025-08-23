/**
 * 自定义时间范围选择器组件
 */

import React, { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { Button } from '~src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card'
import { Input } from '~src/components/ui/input'
import { Label } from '~src/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~src/components/ui/select'
import { useLanguageManager } from '~src/hooks/useLanguageManager'

interface CustomTimeRangePickerProps {
  startTime: string
  endTime: string
  interval: 'hour' | 'day'
  onTimeRangeChange: (startTime: string, endTime: string, interval: 'hour' | 'day') => void
  onClose: () => void
}

export const CustomTimeRangePicker: React.FC<CustomTimeRangePickerProps> = ({
  startTime,
  endTime,
  interval,
  onTimeRangeChange,
  onClose
}) => {
  const [localStartTime, setLocalStartTime] = useState('')
  const [localEndTime, setLocalEndTime] = useState('')
  const [localInterval, setLocalInterval] = useState<'hour' | 'day'>(interval)
  const { t } = useLanguageManager()

  // 格式化日期时间为本地输入格式
  const formatDateTimeLocal = (isoString: string) => {
    if (!isoString) {
      return ''
    }
    const date = new Date(isoString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // 将本地时间格式转换为ISO字符串
  const formatToISO = (localDateTime: string) => {
    if (!localDateTime) {
      return ''
    }
    return new Date(localDateTime).toISOString()
  }

  // 初始化本地时间
  useEffect(() => {
    setLocalStartTime(formatDateTimeLocal(startTime))
    setLocalEndTime(formatDateTimeLocal(endTime))
    setLocalInterval(interval)
  }, [startTime, endTime, interval])

  // 处理应用更改
  const handleApply = () => {
    const newStartTime = formatToISO(localStartTime)
    const newEndTime = formatToISO(localEndTime)
    
    if (newStartTime && newEndTime) {
      onTimeRangeChange(newStartTime, newEndTime, localInterval)
      onClose()
    }
  }

  // 快速设置预设时间
  const setQuickRange = (days: number) => {
    const now = new Date()
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    setLocalStartTime(formatDateTimeLocal(start.toISOString()))
    setLocalEndTime(formatDateTimeLocal(now.toISOString()))
  }

  // 验证时间范围
  const isValidRange = () => {
    if (!localStartTime || !localEndTime) {
      return false
    }
    const start = new Date(localStartTime)
    const end = new Date(localEndTime)
    return start < end
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Calendar className="w-5 h-5" />
          <span>{t('caLeaderboard.customTimeRange')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 快速选择按钮 */}
        <div>
          <Label className="text-sm font-medium">{t('caLeaderboard.quickSelect')}</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(1)}
            >
              {t('caLeaderboard.last1Day')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(3)}
            >
              {t('caLeaderboard.last3Days')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(7)}
            >
              {t('caLeaderboard.last7Days')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(30)}
            >
              {t('caLeaderboard.last30Days')}
            </Button>
          </div>
        </div>

        {/* 开始时间 */}
        <div>
          <Label htmlFor="start-time" className="text-sm font-medium">
            {t('caLeaderboard.startTime')}
          </Label>
          <Input
            id="start-time"
            type="datetime-local"
            value={localStartTime}
            onChange={(e) => setLocalStartTime(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* 结束时间 */}
        <div>
          <Label htmlFor="end-time" className="text-sm font-medium">
            {t('caLeaderboard.endTime')}
          </Label>
          <Input
            id="end-time"
            type="datetime-local"
            value={localEndTime}
            onChange={(e) => setLocalEndTime(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* 时间间隔 */}
        <div>
          <Label className="text-sm font-medium">{t('caLeaderboard.timeInterval')}</Label>
          <Select value={localInterval} onValueChange={(value: 'hour' | 'day') => setLocalInterval(value)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">{t('caLeaderboard.hour')}</SelectItem>
              <SelectItem value="day">{t('caLeaderboard.day')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 时间范围提示 */}
        {localStartTime && localEndTime && (
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>
                {t('caLeaderboard.timeSpan')}: {Math.ceil((new Date(localEndTime).getTime() - new Date(localStartTime).getTime()) / (24 * 60 * 60 * 1000))} {t('caLeaderboard.day')}
              </span>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex space-x-2 pt-2">
          <Button
            onClick={handleApply}
            disabled={!isValidRange()}
            className="flex-1"
          >
            {t('common.confirm')}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t('common.cancel')}
          </Button>
        </div>

        {!isValidRange() && localStartTime && localEndTime && (
          <div className="text-xs text-red-500">
            {t('caLeaderboard.timeRangeError')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
