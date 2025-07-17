import React from 'react';
import { Button } from '~src/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import type { TwitterNotesPaginationProps } from '~src/types/twitter-notes.types';

/**
 * Twitter Notes 分页组件
 * 提供分页导航功能
 */
export function TwitterNotesPagination({
  page,
  pageSize,
  total,
  onPageChange
}: TwitterNotesPaginationProps) {
  const { t } = useSettings();

  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  // 如果只有一页或没有数据，不显示分页
  if (total <= pageSize) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-background">
      {/* 分页信息 */}
      <div className="text-sm text-muted-foreground">
        {t('common.showing')} {startIndex}-{endIndex} {t('common.of')} {total} {t('common.items')}
      </div>

      {/* 分页控制 */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-3"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.previous')}
        </Button>

        {/* 页码显示 */}
        <div className="flex items-center gap-1">
          {/* 显示当前页码附近的页码 */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 px-3"
        >
          {t('common.next')}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
