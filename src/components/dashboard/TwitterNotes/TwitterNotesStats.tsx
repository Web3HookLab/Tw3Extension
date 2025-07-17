import React from 'react';
import { Badge } from '~src/components/ui/badge';
import { Skeleton } from '~src/components/ui/skeleton';
import { useSettings } from '~src/contexts/SettingsContext';
import type { TwitterNotesStatsProps } from '~src/types/twitter-notes.types';

/**
 * Twitter Notes 统计组件
 * 显示总数和筛选后的数量
 */
export function TwitterNotesStats({
  total,
  filtered,
  loading
}: TwitterNotesStatsProps) {
  const { t } = useSettings();

  if (loading) {
    return (
      <div className="flex gap-2 px-4 py-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
    );
  }

  return (
    <div className="flex gap-2 px-4 py-2 bg-muted/30">
      <Badge variant="secondary" className="text-xs">
        {t('twitterNotes.total')}: {total}
      </Badge>
      {filtered !== total && (
        <Badge variant="outline" className="text-xs">
          {t('twitterNotes.filtered')}: {filtered}
        </Badge>
      )}
    </div>
  );
}
