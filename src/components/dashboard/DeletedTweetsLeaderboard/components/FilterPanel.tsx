/**
 * 删帖榜单筛选面板组件
 */

import React, { useState, useCallback } from 'react';
import { RefreshCw, Download, Search, X } from 'lucide-react';

import { Button } from '~src/components/ui/button';
import { Card, CardContent } from '~src/components/ui/card';
import { Input } from '~src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~src/components/ui/select';
import { useSettings } from '~src/contexts/SettingsContext';

import type { FilterPanelProps } from '~src/types/deleted-tweets-leaderboard.types';
import {
  TIME_RANGE_OPTIONS,
  SORT_BY_OPTIONS,
  SORT_ORDER_OPTIONS,
  PAGE_SIZE_OPTIONS
} from '~src/types/deleted-tweets-leaderboard.types';

/**
 * 筛选面板组件
 */
export function FilterPanel({
  filters,
  loading,
  onFiltersChange,
  onRefresh,
  onExport
}: FilterPanelProps) {
  const { t } = useSettings();
  const [searchQuery, setSearchQuery] = useState(filters.search_query || '');

  // 防抖搜索
  const handleSearchChange = useCallback((value: string) => {
    const timer = setTimeout(() => {
      onFiltersChange({ search_query: value, offset: 0 }); // 搜索时重置分页
    }, 500); // 500ms 防抖

    return () => clearTimeout(timer);
  }, [onFiltersChange]);

  const handleQueryChange = (value: string) => {
    setSearchQuery(value);
    handleSearchChange(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onFiltersChange({ search_query: '', offset: 0 });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 搜索区域 */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex flex-col space-y-2 flex-1">
              <label className="text-sm font-medium text-muted-foreground">
                {t('deletedTweetsLeaderboard.filters.search')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('deletedTweetsLeaderboard.filters.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  disabled={loading}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('deletedTweetsLeaderboard.filters.searchHint')}
              </div>
            </div>

            {searchQuery && (
              <div className="flex items-end pb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSearch}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>{t('deletedTweetsLeaderboard.filters.clearSearch')}</span>
                </Button>
              </div>
            )}
          </div>

          {/* 筛选选项 */}
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 flex-1">
            {/* 时间范围 */}
            <div className="flex flex-col space-y-2 min-w-[140px]">
              <label className="text-sm font-medium text-muted-foreground">
                {t('deletedTweetsLeaderboard.filters.timeRange')}
              </label>
              <Select
                value={filters.time_range}
                onValueChange={(value) => onFiltersChange({ time_range: value as any })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 排序方式 */}
            <div className="flex flex-col space-y-2 min-w-[140px]">
              <label className="text-sm font-medium text-muted-foreground">
                {t('deletedTweetsLeaderboard.filters.sortBy')}
              </label>
              <Select
                value={filters.sort_by}
                onValueChange={(value) => onFiltersChange({ sort_by: value as any })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_BY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 排序顺序 */}
            <div className="flex flex-col space-y-2 min-w-[120px]">
              <label className="text-sm font-medium text-muted-foreground">
                {t('deletedTweetsLeaderboard.filters.order')}
              </label>
              <Select
                value={filters.order}
                onValueChange={(value) => onFiltersChange({ order: value as any })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_ORDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 每页显示 */}
            <div className="flex flex-col space-y-2 min-w-[100px]">
              <label className="text-sm font-medium text-muted-foreground">
                {t('deletedTweetsLeaderboard.filters.pageSize')}
              </label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => onFiltersChange({ limit: parseInt(value), offset: 0 })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('deletedTweetsLeaderboard.actions.refresh')}</span>
            </Button>

            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>{t('deletedTweetsLeaderboard.actions.export')}</span>
              </Button>
            )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
