import React from 'react';
import { Button } from '~src/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle } from '~src/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '~src/components/ui/avatar';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import type { TwitterNotesDeleteDialogProps } from '~src/types/twitter-notes.types';

/**
 * Twitter Notes 删除对话框组件
 * 用于确认删除备注
 */
export function TwitterNotesDeleteDialog({
  open,
  onOpenChange,
  deleteTarget,
  onConfirm,
  loading
}: TwitterNotesDeleteDialogProps) {
  const { t } = useSettings();

  if (!deleteTarget) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('twitterNotes.deleteNote')}
          </DialogTitle>
          <DialogDescription>
            {t('twitterNotes.deleteConfirmation')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 警告提示 */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('twitterNotes.deleteWarning')}
            </AlertDescription>
          </Alert>

          {/* 用户信息 */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={deleteTarget.profile_image_url_https} 
                alt={deleteTarget.name}
              />
              <AvatarFallback>
                {deleteTarget.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{deleteTarget.name}</div>
              <div className="text-muted-foreground text-xs">@{deleteTarget.screen_name}</div>
            </div>
          </div>

          {/* 备注内容预览 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">{t('twitterNotes.noteToDelete')}</div>
            <div className="p-3 bg-muted/30 rounded-lg text-sm break-words">
              {deleteTarget.note}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
