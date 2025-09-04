/**
 * 删帖榜单用户行组件
 */

import React from 'react';
import { ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '~src/components/ui/avatar';
import { Button } from '~src/components/ui/button';
import { Badge } from '~src/components/ui/badge';
import { useSettings } from '~src/contexts/SettingsContext';

import type { UserRowProps } from '~src/types/deleted-tweets-leaderboard.types';

/**
 * 格式化删帖率
 */
function formatDeleteRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * 格式化时间
 */
function formatTime(timeStr: string, t: (key: string) => string): string {
  try {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return t('deletedTweetsLeaderboard.time.justNow');
    if (diffMinutes < 60) return `${diffMinutes}${t('deletedTweetsLeaderboard.time.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours}${t('deletedTweetsLeaderboard.time.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays}${t('deletedTweetsLeaderboard.time.daysAgo')}`;

    return date.toLocaleDateString();
  } catch {
    return timeStr;
  }
}

/**
 * 复制到剪贴板
 */
async function copyToClipboard(text: string, successMessage: string, failMessage: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch (error) {
    console.error('Failed to copy:', error);
    toast.error(failMessage);
  }
}

/**
 * 打开 Twitter 链接
 */
function openTwitterProfile(screenName: string): void {
  const url = `https://twitter.com/${screenName}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * 获取排名徽章样式
 */
function getRankBadgeVariant(rank: number): "default" | "secondary" | "destructive" | "outline" {
  if (rank === 1) return "destructive"; // 金色/红色
  if (rank <= 3) return "secondary";    // 银色
  if (rank <= 10) return "outline";     // 铜色
  return "default";
}

/**
 * 用户行组件
 */
export function UserRow({ ranking, index }: UserRowProps) {
  const { t } = useSettings();

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      {/* 排名 */}
      <td className="p-4 text-center">
        <Badge variant={getRankBadgeVariant(ranking.rank)} className="font-bold">
          #{ranking.rank}
        </Badge>
      </td>

      {/* 用户信息 */}
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={ranking.profile_image_url_https} 
              alt={ranking.name}
            />
            <AvatarFallback>
              {ranking.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm truncate">
                {ranking.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                onClick={() => openTwitterProfile(ranking.screen_name)}
                title={t('deletedTweetsLeaderboard.userActions.visitProfile')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground truncate">
                @{ranking.screen_name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                onClick={() => copyToClipboard(
                  ranking.screen_name,
                  t('deletedTweetsLeaderboard.userActions.usernameCopied'),
                  t('deletedTweetsLeaderboard.userActions.copyFailed')
                )}
                title={t('deletedTweetsLeaderboard.userActions.copyUsername')}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </td>

      {/* 删帖数 */}
      <td className="p-4 text-center">
        <span className="font-bold text-red-600">
          {ranking.deleted_count.toLocaleString()}
        </span>
      </td>

      {/* 总推文数 */}
      <td className="p-4 text-center">
        <span className="text-muted-foreground">
          {ranking.total_tweets.toLocaleString()}
        </span>
      </td>

      {/* 删帖率 */}
      <td className="p-4 text-center">
        <Badge 
          variant={ranking.delete_rate > 0.1 ? "destructive" : ranking.delete_rate > 0.05 ? "secondary" : "outline"}
          className="font-medium"
        >
          {formatDeleteRate(ranking.delete_rate)}
        </Badge>
      </td>

      {/* 最后删帖时间 */}
      <td className="p-4 text-center">
        <span className="text-sm text-muted-foreground">
          {formatTime(ranking.latest_delete_time, t)}
        </span>
      </td>
    </tr>
  );
}
