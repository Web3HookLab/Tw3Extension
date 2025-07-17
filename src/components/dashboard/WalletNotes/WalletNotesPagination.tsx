import React from 'react';
import { Button } from '~src/components/ui/button';
import { useSettings } from '~src/contexts/SettingsContext';
import type { WalletNotesPaginationProps } from '~src/types/wallet-notes.types';

/**
 * 钱包笔记分页组件
 */
export function WalletNotesPagination({ pagination, onPageChange }: WalletNotesPaginationProps) {
  const { t } = useSettings();
  const { page, pageSize, total, hasMore } = pagination;
  
  const totalPages = Math.ceil(total / pageSize) || 1;
  const canGoPrevious = page > 1;
  const canGoNext = hasMore || page < totalPages;

  return (
    <div className="flex justify-between items-center px-2 py-4">
      <Button 
        variant="ghost" 
        size="sm" 
        disabled={!canGoPrevious} 
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        {t('common.previous')}
      </Button>
      
      <span>
        {t('common.page')} {page} / {totalPages}
      </span>
      
      <Button 
        variant="ghost" 
        size="sm" 
        disabled={!canGoNext} 
        onClick={() => onPageChange(page + 1)}
      >
        {t('common.next')}
      </Button>
    </div>
  );
}
