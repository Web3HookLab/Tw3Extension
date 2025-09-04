/**
 * 首次提及用户组件
 */

import React from 'react';
import { Trophy, ExternalLink, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '~src/components/ui/avatar';
import { Badge } from '~src/components/ui/badge';
import { Skeleton } from '~src/components/ui/skeleton';
import { useSettings } from '~src/contexts/SettingsContext';
import type { TwitterUser } from '~src/types/addressSearch.types';
import { RefreshIndicator } from './RefreshIndicator';

interface FirstMentionUserProps {
  user: TwitterUser | null;
  loading?: boolean;
  refreshing?: boolean;
  className?: string;
}

export const FirstMentionUser: React.FC<FirstMentionUserProps> = ({
  user,
  loading = false,
  refreshing = false,
  className = ''
}) => {
  const { t } = useSettings();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            {t('addressSearch.firstMention.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">{t('addressSearch.firstMention.noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // 打开Twitter用户页面
  const openTwitterProfile = () => {
    const url = `https://twitter.com/${user.screen_name}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            {t('addressSearch.firstMention.title')}
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
              {t('addressSearch.firstMention.pioneer')}
            </Badge>
          </div>
          <RefreshIndicator refreshing={refreshing} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
          onClick={openTwitterProfile}
        >
          {/* 先驱者图标 */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={user.profile_image_url_https}
                  alt={user.name}
                  className="cursor-pointer"
                />
                <AvatarFallback className="cursor-pointer bg-amber-100 text-amber-800">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* 先驱者徽章 */}
              <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1">
                <Trophy className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          {/* 用户信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <span className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600">
                {user.name}
              </span>
              <ExternalLink className="h-3 w-3 text-gray-400 flex-shrink-0" />
            </div>
            <div className="text-sm text-gray-600 mb-1">
              @{user.screen_name}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{formatNumber(user.followers_count)} {t('addressSearch.firstMention.followers')}</span>
              </div>
              {user.tweet_count && (
                <div>
                  {user.tweet_count} {t('addressSearch.firstMention.tweets')}
                </div>
              )}
            </div>
            {/* ✨ 新增：显示最早提及时间 */}
            {user.tweet_time && (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {t('addressSearch.firstMention.earliestMention')}: {new Date(user.tweet_time).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>

          {/* 先驱者标识 */}
          <div className="flex-shrink-0">
            <Badge className="bg-amber-500 text-white text-xs">
              🏆 {t('addressSearch.firstMention.first')}
            </Badge>
          </div>
        </div>

        {/* 说明文字 */}
        <div className="mt-3 text-xs text-gray-500 text-center">
          {t('addressSearch.firstMention.description')}
        </div>
      </CardContent>
    </Card>
  );
};
