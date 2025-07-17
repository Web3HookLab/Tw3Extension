import React from 'react';
import { Button } from '~src/components/ui/button';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogFooter 
} from '~src/components/ui/dialog';
import { useSettings } from '~src/contexts/SettingsContext';
import type { WalletNotesDeleteDialogProps } from '~src/types/wallet-notes.types';

/**
 * 删除钱包笔记确认对话框组件
 */
export function WalletNotesDeleteDialog({
  open,
  onOpenChange,
  deleteTarget,
  error,
  deleting,
  onConfirm
}: WalletNotesDeleteDialogProps) {
  const { t } = useSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>{t('walletNotes.deleteConfirmTitle')}</DialogHeader>
        <DialogDescription>{t('walletNotes.deleteConfirmDesc')}</DialogDescription>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={deleting}>
            {deleting ? t('common.loading') : t('common.confirm')}
          </Button>
        </DialogFooter>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
