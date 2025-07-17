import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~src/components/ui/dialog';
import { Button } from '~src/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '~src/components/ui/avatar';
import { ScrollArea } from '~src/components/ui/scroll-area';
import { ExternalLink } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import type { TwitterFollowersDialogProps } from '~src/types/twitter-trends.types';

/**
 * Twitter 关注者详情对话框组件
 * 显示某个趋势项目的所有关注者列表
 */
export function TwitterFollowersDialog({
  open,
  onOpenChange,
  followers,
  trendName,
  onOpenTwitterProfile
}: TwitterFollowersDialogProps) {
  const { t } = useSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {t('dashboard.allFollowersOf') + ` (${followers.length})`}
          </DialogTitle>
        </DialogHeader>
        
        {/* 提示信息 */}
        <span className="flex items-center gap-1">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          {t('dashboard.someAccountsHidden')}
        </span>

        {/* 关注者列表 */}
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 p-1">
            {followers.map((follower, index) => (
              <div 
                key={`${follower.user_id}-${index}`} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
              >
                {/* 头像 */}
                <span
                  role="button"
                  tabIndex={0}
                  title={t('dashboard.gotoProfile')}
                  className="outline-none focus:ring-2 focus:ring-ring rounded-full cursor-pointer"
                  onClick={() => onOpenTwitterProfile(follower.screen_name)}
                  onKeyDown={e => { 
                    if (e.key === 'Enter' || e.key === ' ') {
                      onOpenTwitterProfile(follower.screen_name);
                    }
                  }}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={follower.profile_image_url_https} />
                    <AvatarFallback>{follower.name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                </span>

                {/* 用户信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* 用户名 */}
                    <span
                      role="button"
                      tabIndex={0}
                      title={t('dashboard.gotoProfile')}
                      className="font-medium truncate outline-none focus:ring-2 focus:ring-ring rounded cursor-pointer hover:underline"
                      onClick={() => onOpenTwitterProfile(follower.screen_name)}
                      onKeyDown={e => { 
                        if (e.key === 'Enter' || e.key === ' ') {
                          onOpenTwitterProfile(follower.screen_name);
                        }
                      }}
                    >
                      {follower.name}
                    </span>

                    {/* 用户名@handle */}
                    <span
                      role="button"
                      tabIndex={0}
                      title={t('dashboard.gotoProfile')}
                      className="text-sm text-muted-foreground outline-none focus:ring-2 focus:ring-ring rounded cursor-pointer hover:underline"
                      onClick={() => onOpenTwitterProfile(follower.screen_name)}
                      onKeyDown={e => { 
                        if (e.key === 'Enter' || e.key === ' ') {
                          onOpenTwitterProfile(follower.screen_name);
                        }
                      }}
                    >
                      @{follower.screen_name}
                    </span>

                    {/* 外部链接按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => onOpenTwitterProfile(follower.screen_name)}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* 关注时间 */}
                <span className="text-xs text-muted-foreground">
                  {new Date(follower.event_time).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
