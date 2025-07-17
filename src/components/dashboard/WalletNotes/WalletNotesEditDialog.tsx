import React from 'react';
import { Button } from '~src/components/ui/button';
import { Input } from '~src/components/ui/input';
import { Label } from '~src/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogFooter 
} from '~src/components/ui/dialog';
import { useSettings } from '~src/contexts/SettingsContext';
import type { WalletNotesEditDialogProps } from '~src/types/wallet-notes.types';

/**
 * 编辑钱包笔记对话框组件
 */
export function WalletNotesEditDialog({
  editTarget,
  onEditTargetChange,
  form,
  onFormChange,
  error,
  loading,
  onSave
}: WalletNotesEditDialogProps) {
  const { t } = useSettings();

  return (
    <Dialog open={!!editTarget} onOpenChange={() => onEditTargetChange(null)}>
      <DialogContent>
        <DialogHeader>{t('walletNotes.editNote')}</DialogHeader>
        <DialogDescription>{t('walletNotes.editNoteDesc')}</DialogDescription>
        
        <div className="space-y-3">
          <div>
            <Label>{t('walletNotes.address')}</Label>
            <Input value={editTarget?.wallet_address || ''} readOnly disabled />
          </div>
          
          <div>
            <Label>{t('walletNotes.network')}</Label>
            <Input value={editTarget?.network || ''} readOnly disabled />
          </div>
          
          <div>
            <Label>{t('walletNotes.note')}</Label>
            <Input 
              value={form.note} 
              onChange={e => onFormChange({ ...form, note: e.target.value })} 
              maxLength={100} 
            />
          </div>
          
          <div>
            <Label>{t('walletNotes.source')}</Label>
            <Input 
              value={form.source} 
              onChange={e => onFormChange({ ...form, source: e.target.value })} 
              maxLength={100} 
            />
          </div>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onEditTargetChange(null)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSave} disabled={loading}>
            {loading ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
