/**
 * 删帖榜单表格组件
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Skeleton } from '~src/components/ui/skeleton';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { useSettings } from '~src/contexts/SettingsContext';

import { UserRow } from './UserRow';
import type { LeaderboardTableProps } from '~src/types/deleted-tweets-leaderboard.types';

/**
 * 表格加载骨架屏
 */
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border-b">
          <Skeleton className="w-8 h-6 rounded" />
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
          <Skeleton className="w-12 h-4 ml-auto" />
          <Skeleton className="w-12 h-4" />
          <Skeleton className="w-12 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
      ))}
    </div>
  );
}

/**
 * 空数据状态
 */
function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        {t('deletedTweetsLeaderboard.messages.noData')}
      </h3>
      <p className="text-muted-foreground text-sm max-w-md">
        {t('deletedTweetsLeaderboard.search.noResults')}
      </p>
    </div>
  );
}

/**
 * 榜单表格组件
 */
export function LeaderboardTable({ rankings, loading, error }: LeaderboardTableProps) {
  const { t } = useSettings();

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>{t('deletedTweetsLeaderboard.title')}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : rankings.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-left font-medium text-sm">
                    {t('deletedTweetsLeaderboard.table.rank')}
                  </th>
                  <th className="p-4 text-left font-medium text-sm min-w-[200px]">
                    {t('deletedTweetsLeaderboard.table.user')}
                  </th>
                  <th className="p-4 text-center font-medium text-sm">
                    {t('deletedTweetsLeaderboard.table.deletedCount')}
                  </th>
                  <th className="p-4 text-center font-medium text-sm">
                    {t('deletedTweetsLeaderboard.table.totalTweets')}
                  </th>
                  <th className="p-4 text-center font-medium text-sm">
                    {t('deletedTweetsLeaderboard.table.deleteRate')}
                  </th>
                  <th className="p-4 text-center font-medium text-sm">
                    {t('deletedTweetsLeaderboard.table.latestDelete')}
                  </th>
                </tr>
              </thead>
              
              <tbody>
                {rankings.map((ranking, index) => (
                  <UserRow
                    key={`${ranking.rest_id}-${ranking.rank}`}
                    ranking={ranking}
                    index={index}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
