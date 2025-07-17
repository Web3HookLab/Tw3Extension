import React from 'react';
import { Button } from '~src/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~src/components/ui/select';
import { RefreshCw, Pause, Play } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import type { TwitterTrendsControlsProps } from '~src/types/twitter-trends.types';

/**
 * Twitter 趋势控制栏组件
 * 包含时间设置、刷新控制等功能
 */
export function TwitterTrendsControls({
  preferences,
  loading,
  isPaused,
  onTimeUnitChange,
  onTimeValueChange,
  onTogglePause,
  onRefresh,
  onForceRefresh
}: TwitterTrendsControlsProps) {
  const { t } = useSettings();

  return (
    <div className="flex items-center gap-2 ml-auto flex-wrap">
      {/* 时间单位选择器 */}
      <Select
        value={preferences.timeUnit}
        onValueChange={(value: 'minute' | 'hour') => onTimeUnitChange(value)}
      >
        <SelectTrigger className="w-28 h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="minute">{t('common.minute')}</SelectItem>
          <SelectItem value="hour">{t('common.hour')}</SelectItem>
        </SelectContent>
      </Select>

      {/* 时间值选择器 */}
      <Select
        value={preferences.timeValue.toString()}
        onValueChange={onTimeValueChange}
      >
        <SelectTrigger className="w-28 h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {preferences.timeUnit === 'minute' 
            ? Array.from({ length: 60 }, (_, i) => i + 1).map(num => (
                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
              ))
            : Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
              ))
          }
        </SelectContent>
      </Select>

      {/* 时间单位说明 */}
      <span className="text-muted-foreground text-sm">
        {preferences.timeUnit === 'minute' ? t('dashboard.withinMinutes') : t('dashboard.withinHours')}
      </span>

      {/* 暂停/恢复按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onTogglePause}
        title={isPaused ? t('dashboard.resumeAutoRefresh') : t('dashboard.pauseAutoRefresh')}
        className="h-9 w-9"
      >
        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
      </Button>

      {/* 刷新按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        title={t('common.refresh')}
        className="h-9 w-9"
      >
        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
      </Button>

      {/* 强制刷新按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onForceRefresh}
        disabled={loading}
        title={t('dashboard.forceRefresh')}
        className="h-9 w-9"
      >
        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        <span className="text-xs">!</span>
      </Button>

      {/* 状态指示器 */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {isPaused ? (
          <span className="flex items-center gap-1">
            <Pause className="h-3 w-3" />
            {t('dashboard.paused')}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            {t('dashboard.autoRefresh')}
          </span>
        )}
      </div>
    </div>
  );
}
