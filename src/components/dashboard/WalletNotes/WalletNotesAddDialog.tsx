import React from 'react';
import { Button } from '~src/components/ui/button';
import { Input } from '~src/components/ui/input';
import { Textarea } from '~/src/components/ui/textarea';
import { Label } from '~src/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '~src/components/ui/dialog';
import { useSettings } from '~src/contexts/SettingsContext';
import { detectNetwork } from './utils';
import type { WalletNotesAddDialogProps } from '~src/types/wallet-notes.types';

/**
 * 添加钱包笔记对话框组件
 */
export function WalletNotesAddDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  error,
  loading,
  onAdd
}: WalletNotesAddDialogProps) {
  const { t } = useSettings();

  const handleAddressChange = (address: string) => {
    const network = detectNetwork(address);
    onFormChange({ ...form, wallet_address: address, network });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Wallet Note</DialogTitle>
          <DialogDescription>
            {t('walletNotes.desc')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="wallet_address">{t('walletNotes.address')}</Label>
            <Input
              id="wallet_address"
              placeholder="0x... or 1... or bc1..."
              value={form.wallet_address}
              onChange={(e) => handleAddressChange(e.target.value)}
            />
          </div>
          
          {/* 网络类型只读显示 */}
          <div>
            <Label htmlFor="network">{t('walletNotes.network')}</Label>
            <Input
              id="network"
              value={form.network}
              readOnly
              disabled
            />
          </div>
          
          <div>
            <Label htmlFor="note">{t('walletNotes.note')}</Label>
            <Textarea
              id="note"
              placeholder="Add your notes about this wallet..."
              value={form.note}
              onChange={(e) => onFormChange({ ...form, note: e.target.value })}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="source">{t('walletNotes.source')}</Label>
            <Input
              id="source"
              placeholder="Add any relevant source information"
              value={form.source}
              onChange={(e) => onFormChange({ ...form, source: e.target.value })}
            />
          </div>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={onAdd} disabled={loading}>
              {loading ? t('common.loading') : t('walletNotes.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
