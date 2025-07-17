import React from 'react';
import { Button } from '~src/components/ui/button';
import { Badge } from '~src/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '~src/components/ui/avatar';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { Skeleton } from '~src/components/ui/skeleton';
import { Edit, Trash2, ExternalLink } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import { TAG_COLOR_MAP } from './constants';
import type { TwitterNotesListProps } from '~src/types/twitter-notes.types';

/**
 * Twitter Notes 列表组件
 * 显示备注列表，包括加载状态和错误处理
 */
export function TwitterNotesList({
  notes,
  loading,
  error,
  onEdit,
  onDelete
}: TwitterNotesListProps) {
  const { t } = useSettings();

  // 打开 Twitter 用户页面
  const openTwitterProfile = (screenName: string) => {
    window.open(`https://x.com/${screenName}`, '_blank');
  };

  // 加载状态
  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="px-3 py-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // 空状态
  if (notes.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>{t('twitterNotes.noData')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {notes.map((note) => (
        <div key={note.twitter_rest_id} className="hover:bg-muted/30 transition-colors px-3 py-2">
          <div className="flex items-center gap-2">
            {/* 头像 */}
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage
                src={note.profile_image_url_https}
                alt={note.name}
              />
              <AvatarFallback className="text-xs">
                {note.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            {/* 内容区域 */}
            <div className="flex-1 min-w-0">
              {/* 用户信息和备注内容在同一行 */}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-xs truncate max-w-[80px]">
                  {note.name}
                </span>
                <span className="text-muted-foreground text-xs">
                  @{note.screen_name}
                </span>
                <span className="text-xs text-foreground truncate flex-1">
                  {note.note}
                </span>
              </div>

              {/* 标签和操作在第二行 */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className={`text-xs px-1.5 py-0 ${TAG_COLOR_MAP[tag] || 'bg-gray-500 text-white'}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {note.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      +{note.tags.length - 2}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => openTwitterProfile(note.screen_name)}
                    title={t('twitterNotes.viewProfile')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(note)}
                    className="h-5 px-1 text-xs"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(note)}
                    className="h-5 px-1 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
