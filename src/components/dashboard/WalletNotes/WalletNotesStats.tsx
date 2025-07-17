import React from 'react';
import { Card } from '~src/components/ui/card';
import { Input } from '~src/components/ui/input';
import { Wallet, Hash } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import type { WalletNotesStatsProps } from '~src/types/wallet-notes.types';

/**
 * 钱包笔记统计和搜索组件
 * 显示统计信息和提供搜索功能
 */
export function WalletNotesStats({ notes, search, onSearchChange }: WalletNotesStatsProps) {
  const { t } = useSettings();

  const totalWallets = notes.length;
  const totalNetworks = new Set(notes.map(n => n.network)).size;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <div className="flex gap-2">
        <Card className="p-2 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-blue-500" />
          <span>{t('walletNotes.totalWallets')}</span>
          <span className="font-bold text-blue-500">{totalWallets}</span>
        </Card>
        <Card className="p-2 flex items-center gap-2">
          <Hash className="w-4 h-4 text-purple-500" />
          <span>{t('walletNotes.networks')}</span>
          <span className="font-bold text-purple-500">{totalNetworks}</span>
        </Card>
      </div>
      <Input
        placeholder={t('walletNotes.searchPlaceholder')}
        value={search.address}
        onChange={(e) => onSearchChange({ ...search, address: e.target.value })}
        className="w-64"
      />
    </div>
  );
}
