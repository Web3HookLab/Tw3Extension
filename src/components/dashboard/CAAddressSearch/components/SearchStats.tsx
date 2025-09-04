/**
 * 搜索统计信息组件
 */

import React from 'react';
import { BarChart3, MessageCircle, Calendar, TrendingUp, Users, Crown, Award, Medal, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Badge } from '~src/components/ui/badge';
import { Button } from '~src/components/ui/button';
import { Skeleton } from '~src/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '~src/components/ui/avatar';
import { useSettings } from '~src/contexts/SettingsContext';
import type { SearchStatsProps, TwitterUser } from '~src/types/addressSearch.types';
import { RefreshIndicator } from './RefreshIndicator';

export const SearchStats: React.FC<SearchStatsProps> = ({
  stats,
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
            <BarChart3 className="h-5 w-5" />
            <Skeleton className="h-5 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
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

  // 获取排名图标
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Award className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-gray-500">#{index + 1}</span>;
    }
  };

  // 打开Twitter用户页面
  const openTwitterProfile = (screenName: string) => {
    const url = `https://twitter.com/${screenName}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 格式化日期
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  // 计算活跃率
  const getActiveRate = (): number => {
    if (stats.total_tweets === 0) {
      return 0;
    }
    return Math.round((stats.active_tweets / stats.total_tweets) * 100);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            {t('addressSearch.stats.title')}
          </div>
          <RefreshIndicator refreshing={refreshing} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 总推文数 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageCircle className="h-4 w-4" />
              {t('addressSearch.stats.totalTweets')}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(stats.total_tweets)}
            </div>
          </div>

          {/* 活跃推文数 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              {t('addressSearch.stats.activeTweets')}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(stats.active_tweets)}
              </div>
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                {getActiveRate()}%
              </Badge>
            </div>
          </div>

          {/* 已删除推文数 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageCircle className="h-4 w-4" />
              {t('addressSearch.stats.deletedTweets')}
            </div>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(stats.deleted_tweets)}
            </div>
          </div>

          {/* 最活跃日期 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              {t('addressSearch.stats.mostActiveDate')}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">
                {formatDate(stats.most_active_date)}
              </div>
              <div className="text-xs text-gray-500">
                {formatNumber(stats.most_active_date_count)} {t('addressSearch.stats.tweets')}
              </div>
            </div>
          </div>
        </div>

        {/* 活跃度指示器 */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{t('addressSearch.stats.activityLevel')}</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index < Math.ceil(getActiveRate() / 20)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">
                {getActiveRate() >= 80 ? t('addressSearch.stats.veryActive') :
                 getActiveRate() >= 60 ? t('addressSearch.stats.active') :
                 getActiveRate() >= 40 ? t('addressSearch.stats.moderate') :
                 getActiveRate() >= 20 ? t('addressSearch.stats.low') :
                 t('addressSearch.stats.veryLow')}
              </span>
            </div>
          </div>
        </div>

        {/* 热门用户 */}
        {stats.top_users && stats.top_users.length > 0 && (
          <div className="mt-6 pt-4 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">
                {t('addressSearch.topUsers.title')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.top_users.slice(0, 3).map((user, index) => (
                <div
                  key={user.screen_name}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => openTwitterProfile(user.screen_name)}
                >
                  {/* 排名图标 */}
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>

                  {/* 用户头像 */}
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage
                      src={user.profile_image_url_https}
                      alt={user.name}
                      className="cursor-pointer"
                    />
                    <AvatarFallback className="cursor-pointer">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600">
                        @{user.screen_name}
                      </span>
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>{user.tweet_count} {t('addressSearch.topUsers.tweets')}</div>
                      <div>{formatNumber(user.followers_count)} {t('addressSearch.topUsers.followers')}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
