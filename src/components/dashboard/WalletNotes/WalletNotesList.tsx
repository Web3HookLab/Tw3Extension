import React from 'react';
import { Card, CardContent } from '~src/components/ui/card';
import { Button } from '~src/components/ui/button';
import { Badge } from '~src/components/ui/badge';
import { Wallet, Edit, Trash2 } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import { explorerMap, networkIconMap } from './constants';
import type { WalletNotesListProps } from '~src/types/wallet-notes.types';

/**
 * 钱包笔记列表组件
 * 显示钱包列表和相关操作
 */
export function WalletNotesList({ 
  notes, 
  loading, 
  filtered, 
  paged, 
  onEdit, 
  onDelete 
}: WalletNotesListProps) {
  const { t } = useSettings();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Wallet className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('walletNotes.empty')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* 表头 */}
      <div className="grid grid-cols-7 gap-2 px-2 py-2 text-xs font-semibold text-muted-foreground border-b border-border bg-muted/40 sticky top-0 z-10" style={{ minHeight: 36 }}>
        <div>{t('walletNotes.address')}</div>
        <div>{t('walletNotes.network')}</div>
        <div>{t('walletNotes.note')}</div>
        <div>{t('walletNotes.source')}</div>
        <div>{t('walletNotes.createdAt')}</div>
        <div>{t('walletNotes.explorer')}</div>
        <div>{t('walletNotes.actions')}</div>
      </div>
      
      {/* 列表内容 */}
      <div className="mt-2">
        {paged.map((note) => {
          const Icon = networkIconMap[note.network];
          const explorer = explorerMap[note.network];
          
          return (
            <Card key={note.wallet_address} className="mb-2 shadow-sm hover:shadow-md transition border border-border">
              <div className="grid grid-cols-7 gap-2 items-center px-2 py-1 text-sm">
                {/* 地址+图标 */}
                <div className="flex items-center gap-2 min-w-0">
                  {explorer ? (
                    <a
                      href={explorer.url(note.wallet_address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono underline text-blue-600 hover:text-blue-800 truncate max-w-[160px] transition-colors cursor-pointer"
                      title={t('walletNotes.explorer') + ': ' + note.wallet_address}
                    >
                      {note.wallet_address}
                    </a>
                  ) : (
                    <span className="font-mono truncate max-w-[160px]" title={note.wallet_address}>
                      {note.wallet_address}
                    </span>
                  )}
                </div>
                
                {/* 网络 */}
                <div className="truncate max-w-[120px]" title={note.network}>
                  <Badge
                    className={
                      (note.network === 'eth'
                        ? 'bg-[#7c3aed]/90 text-white border-none shadow-sm'
                        : note.network === 'solana'
                        ? 'bg-gradient-to-r from-[#00ffa3] to-[#dc1fff] text-white border-none shadow-sm'
                        : note.network === 'sui'
                        ? 'bg-[#1a6cff]/90 text-white border-none shadow-sm'
                        : 'bg-muted text-foreground border') +
                      ' min-w-[64px] px-2'
                    }
                  >
                    {Icon && <Icon size={14} className="inline-block mr-1 align-middle" />}
                    <span className="font-bold text-xs align-middle uppercase">{note.network}</span>
                  </Badge>
                </div>
                
                {/* 备注 */}
                <div className="truncate max-w-[120px]" title={note.note}>
                  {note.note}
                </div>
                
                {/* 来源 */}
                <div className="truncate max-w-[100px]" title={note.source}>
                  {note.source}
                </div>
                
                {/* 添加时间 */}
                <div className="truncate max-w-[80px]" title={note.created_at}>
                  {note.created_at ? new Date(note.created_at).toLocaleDateString() : '-'}
                </div>
                
                {/* 区块链浏览器 */}
                <div>
                  {explorer && (
                    <a 
                      href={explorer.url(note.wallet_address)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      title={t('walletNotes.explorer')}
                    >
                      <img src={explorer.icon} alt="explorer" className="w-5 h-5 inline-block" />
                    </a>
                  )}
                </div>
                
                {/* 操作 */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="hover:bg-muted/60" 
                    onClick={() => onEdit(note)} 
                    title={t('walletNotes.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="hover:bg-destructive/80" 
                    onClick={() => onDelete(note.wallet_address)} 
                    title={t('walletNotes.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
