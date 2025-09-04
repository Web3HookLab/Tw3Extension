/**
 * 删帖榜单统计信息面板组件
 */

import React from 'react';
import { Users, Eye, Clock, Search } from 'lucide-react';

import { Card, CardContent } from '~src/components/ui/card';
import { Skeleton } from '~src/components/ui/skeleton';
import { Badge } from '~src/components/ui/badge';
import { useSettings } from '~src/contexts/SettingsContext';

import type { StatsPanelProps } from '~src/types/deleted-tweets-leaderboard.types';

/**
 * 统计信息面板组件
 */
export function StatsPanel({ stats, loading, filters }: StatsPanelProps) {
  const { t } = useSettings();

  // 检查是否有搜索条件
  const hasSearch = filters && filters.search_query;
  const searchTerm = filters?.search_query || '';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-8">
            <div className="flex items-center space-x-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="w-24 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="w-32 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="w-20 h-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-8">
          {/* 总用户数 */}
          <div className="flex items-center space-x-2 text-sm">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-muted-foreground">
              {t('deletedTweetsLeaderboard.stats.totalUsers')}:
            </span>
            <span className="font-medium">
              {stats.totalUsers.toLocaleString()}
            </span>
          </div>

          {/* 当前显示 */}
          <div className="flex items-center space-x-2 text-sm">
            <Eye className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">
              {t('deletedTweetsLeaderboard.stats.showing')}:
            </span>
            <span className="font-medium">
              {stats.showing} / {stats.totalUsers.toLocaleString()}
            </span>
          </div>

          {/* 缓存时间 */}
          {stats.cacheTime && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-muted-foreground">
                {t('deletedTweetsLeaderboard.stats.cacheTime')}:
              </span>
              <span className="font-medium">
                {stats.cacheTime}
              </span>
            </div>
          )}

          {/* 搜索状态 */}
          {hasSearch && (
            <div className="flex items-center space-x-2 text-sm">
              <Search className="w-4 h-4 text-purple-500" />
              <span className="text-muted-foreground">{t('deletedTweetsLeaderboard.search.searchLabel')}</span>
              <Badge variant="secondary" className="text-xs">
                "{searchTerm}"
              </Badge>
            </div>
          )}

          {/* 页码信息 */}
          {stats.totalPages > 1 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>
                {t('common.page')} {stats.currentPage} / {stats.totalPages}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
