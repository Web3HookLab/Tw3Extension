/**
 * 删帖榜单主模块组件
 */

import React, { useCallback } from 'react';
import { toast } from 'sonner';

import { useSettings } from '~src/contexts/SettingsContext';

// 导入子组件
import { FilterPanel } from './components/FilterPanel';
import { StatsPanel } from './components/StatsPanel';
import { LeaderboardTable } from './components/LeaderboardTable';
import { LoadMoreControls } from './components/PaginationControls';


// 导入 Hook 和类型
import { useDeletedTweetsLeaderboard } from './hooks/useDeletedTweetsLeaderboard';
import type { FilterOptions, ExportData } from '~src/types/deleted-tweets-leaderboard.types';

/**
 * 导出数据为 CSV 格式
 */
function exportToCSV(data: ExportData[], filename: string): void {
  try {
    // CSV 头部
    const headers = [
      '排名',
      '用户名',
      '显示名称',
      '删帖数量',
      '总推文数',
      '删帖率',
      '最后删帖时间'
    ];

    // 转换数据
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.rank,
        `"${row.username}"`,
        `"${row.displayName}"`,
        row.deletedCount,
        row.totalTweets,
        row.deleteRate,
        `"${row.latestDelete}"`
      ].join(','))
    ].join('\n');

    // 创建并下载文件
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

/**
 * 删帖榜单主模块组件
 */
export function DeletedTweetsLeaderboardModule() {
  const { t } = useSettings();
  const { state, actions } = useDeletedTweetsLeaderboard();

  const {
    displayedRankings,
    filteredRankings,
    loading,
    loadingMore,
    error,
    filters,
    hasMore,
    displayCount,
    stats
  } = state;

  const {
    updateFilters,
    refreshData,
    loadMore
  } = actions;

  // 处理筛选条件变更
  const handleFiltersChange = useCallback((newFilters: Partial<FilterOptions>) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  // 处理刷新
  const handleRefresh = useCallback(async () => {
    try {
      await refreshData();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, [refreshData]);

  // 处理导出
  const handleExport = useCallback(async () => {
    try {
      if (state.filteredRankings.length === 0) {
        toast.error(t('deletedTweetsLeaderboard.messages.noData'));
        return;
      }

      // 转换数据格式（导出所有筛选后的数据，不只是当前页）
      const exportData: ExportData[] = state.filteredRankings.map(ranking => ({
        rank: ranking.rank,
        username: ranking.screen_name,
        displayName: ranking.name,
        deletedCount: ranking.deleted_count,
        totalTweets: ranking.total_tweets,
        deleteRate: `${(ranking.delete_rate * 100).toFixed(1)}%`,
        latestDelete: new Date(ranking.latest_delete_time).toLocaleString()
      }));

      // 生成文件名
      const timeRange = t(`deletedTweetsLeaderboard.timeRange.${filters.time_range}`);
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `删帖榜单_${timeRange}_${timestamp}.csv`;

      // 导出文件
      exportToCSV(exportData, filename);

      toast.success(t('deletedTweetsLeaderboard.messages.exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('deletedTweetsLeaderboard.messages.loadFailed'));
    }
  }, [state.filteredRankings, filters.time_range, t]);

  // 处理加载更多
  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t('deletedTweetsLeaderboard.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('deletedTweetsLeaderboard.description')}
          </p>
        </div>
      </div>

      {/* 筛选面板 */}
      <FilterPanel
        filters={filters}
        loading={loading}
        onFiltersChange={handleFiltersChange}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* 统计信息面板 */}
      <StatsPanel
        stats={stats}
        loading={loading}
        filters={filters}
      />

      {/* 榜单表格 */}
      <LeaderboardTable
        rankings={displayedRankings}
        loading={loading}
        error={error}
      />

      {/* 加载更多控制 */}
      <LoadMoreControls
        hasMore={hasMore}
        loading={loading}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
        displayCount={displayCount}
        totalCount={filteredRankings.length}
      />
    </div>
  );
}
