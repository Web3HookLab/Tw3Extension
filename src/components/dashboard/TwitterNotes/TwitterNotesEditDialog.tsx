import React from 'react';
import { Button } from '~src/components/ui/button';
import { Badge } from '~src/components/ui/badge';
import { Label } from '~src/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle } from '~src/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '~src/components/ui/avatar';
import { Checkbox } from '~src/components/ui/checkbox';
import { Textarea } from '~src/components/ui/textarea';
import { useSettings } from '~src/contexts/SettingsContext';
import { TAG_OPTIONS, TAG_COLOR_MAP } from './constants';
import type { TwitterNotesEditDialogProps } from '~src/types/twitter-notes.types';

/**
 * Twitter Notes 编辑对话框组件
 * 用于编辑备注内容和标签
 */
export function TwitterNotesEditDialog({
  open,
  onOpenChange,
  editTarget,
  editForm,
  onFormChange,
  onSave,
  loading
}: TwitterNotesEditDialogProps) {
  const { t } = useSettings();

  const handleTagToggle = (tag: string, checked: boolean) => {
    const newTags = checked 
      ? [...editForm.tags, tag]
      : editForm.tags.filter(t => t !== tag);
    
    onFormChange({
      ...editForm,
      tags: newTags
    });
  };

  const handleNoteChange = (note: string) => {
    onFormChange({
      ...editForm,
      note
    });
  };

  if (!editTarget) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('twitterNotes.editNote')}</DialogTitle>
          <DialogDescription>
            {t('twitterNotes.editNoteDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 用户信息 */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage 
                src={editTarget.profile_image_url_https} 
                alt={editTarget.name}
              />
              <AvatarFallback>
                {editTarget.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{editTarget.name}</div>
              <div className="text-muted-foreground text-xs">@{editTarget.screen_name}</div>
            </div>
          </div>

          {/* 备注编辑 */}
          <div className="space-y-2">
            <Label htmlFor="note">{t('twitterNotes.note')}</Label>
            <Textarea
              id="note"
              placeholder={t('twitterNotes.notePlaceholder')}
              value={editForm.note}
              onChange={(e) => handleNoteChange(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* 标签选择 */}
          <div className="space-y-2">
            <Label>{t('twitterNotes.tags')}</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {TAG_OPTIONS.map(tag => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-tag-${tag}`}
                    checked={editForm.tags.includes(tag)}
                    onCheckedChange={(checked) => handleTagToggle(tag, checked as boolean)}
                  />
                  <Label
                    htmlFor={`edit-tag-${tag}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {tag}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 已选标签预览 */}
          {editForm.tags.length > 0 && (
            <div className="space-y-2">
              <Label>{t('twitterNotes.selectedTags')}</Label>
              <div className="flex flex-wrap gap-1">
                {editForm.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    className={`text-xs ${TAG_COLOR_MAP[tag] || 'bg-gray-500 text-white'}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
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
            onClick={onSave}
            disabled={loading || !editForm.note.trim()}
          >
            {loading ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
