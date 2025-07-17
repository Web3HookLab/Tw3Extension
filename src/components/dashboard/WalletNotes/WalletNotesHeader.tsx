import React from 'react';
import { Button } from '~src/components/ui/button';
import { Plus } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import type { WalletNotesHeaderProps } from '~src/types/wallet-notes.types';

/**
 * 钱包笔记页面标题组件
 * 包含页面标题、描述和添加按钮
 */
export function WalletNotesHeader({ onAddClick }: WalletNotesHeaderProps) {
  const { t } = useSettings();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">{t('dashboard.walletNotes')}</h2>
        <p className="text-muted-foreground">{t('dashboard.walletNotesDesc')}</p>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={onAddClick}>
          <Plus className="w-4 h-4 mr-2" />
          {t('walletNotes.add')}
        </Button>
      </div>
    </div>
  );
}
