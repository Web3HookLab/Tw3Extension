/**
 * 删帖榜单加载更多控制组件
 */

import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

import { Button } from '~src/components/ui/button';
import { Card, CardContent } from '~src/components/ui/card';
import { Progress } from '~src/components/ui/progress';
import { useSettings } from '~src/contexts/SettingsContext';

import type { LoadMoreControlsProps } from '~src/types/deleted-tweets-leaderboard.types';

/**
 * 加载更多控制组件
 */
export function LoadMoreControls({
  hasMore,
  loading,
  loadingMore,
  onLoadMore,
  displayCount,
  totalCount
}: LoadMoreControlsProps) {
  const { t } = useSettings();

  // 计算进度百分比
  const progressPercentage = totalCount > 0 ? Math.min((displayCount / totalCount) * 100, 100) : 0;

  // 如果没有数据，不显示控件
  if (totalCount === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 进度信息 */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t('deletedTweetsLeaderboard.loadMore.showing')} {displayCount.toLocaleString()}{t('deletedTweetsLeaderboard.loadMore.of')}{totalCount.toLocaleString()}{t('deletedTweetsLeaderboard.loadMore.items')}
            </span>
            <span>
              {progressPercentage.toFixed(1)}%
            </span>
          </div>

          {/* 进度条 */}
          <Progress value={progressPercentage} className="h-2" />

          {/* 加载更多按钮 */}
          <div className="flex justify-center">
            {hasMore ? (
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loading || loadingMore}
                className="flex items-center space-x-2 px-6"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('deletedTweetsLeaderboard.loadMore.loading')}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>{t('deletedTweetsLeaderboard.loadMore.loadMore')}</span>
                  </>
                )}
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-2">
                {displayCount === totalCount ? t('deletedTweetsLeaderboard.loadMore.allDataShown') : t('deletedTweetsLeaderboard.loadMore.noMoreData')}
              </div>
            )}
          </div>

          {/* 提示信息 */}
          {hasMore && !loadingMore && (
            <div className="text-xs text-muted-foreground text-center">
              {t('deletedTweetsLeaderboard.loadMore.scrollHint')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
