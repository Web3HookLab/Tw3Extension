/**
 * 推文列表组件
 */

import React, { useState } from 'react';
import { MessageCircle, ExternalLink, Calendar, Network, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '~src/components/ui/avatar';
import { Badge } from '~src/components/ui/badge';
import { Button } from '~src/components/ui/button';
import { Skeleton } from '~src/components/ui/skeleton';
import { ScrollArea } from '~src/components/ui/scroll-area';
import { useSettings } from '~src/contexts/SettingsContext';
import type { TweetsListProps, AddressTweet } from '~src/types/addressSearch.types';
import { RefreshIndicator } from './RefreshIndicator';

export const TweetsList: React.FC<TweetsListProps> = ({
  tweets,
  loading = false,
  refreshing = false,
  className = '',
  onLoadMore,
  hasMore = false
}) => {
  const { t } = useSettings();
  const [displayCount, setDisplayCount] = useState(20);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <Skeleton className="h-5 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tweets || tweets.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              {t('addressSearch.tweets.title')}
            </div>
            <RefreshIndicator refreshing={refreshing} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>{t('addressSearch.tweets.noData')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 格式化时间
  const formatTime = (timeStr: string): string => {
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 7) {
        return date.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric'
        });
      } else if (diffDays > 0) {
        return `${diffDays}${t('addressSearch.tweets.daysAgo')}`;
      } else if (diffHours > 0) {
        return `${diffHours}${t('addressSearch.tweets.hoursAgo')}`;
      } else {
        return t('addressSearch.tweets.justNow');
      }
    } catch (error) {
      return timeStr;
    }
  };

  // 格式化粉丝数
  const formatFollowers = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // 获取网络类型样式
  const getNetworkBadgeStyle = (network: string): string => {
    switch (network) {
      case 'solana':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'ethereum':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 获取状态样式
  const getStatusBadgeStyle = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'deleted':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 打开推文链接
  const openTweet = (tweetId: string) => {
    const url = `https://twitter.com/i/status/${tweetId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 打开用户主页
  const openUserProfile = (screenName: string) => {
    const url = `https://twitter.com/${screenName}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // 加载更多
  const handleLoadMore = () => {
    if (onLoadMore) {
      onLoadMore();
    } else {
      setDisplayCount(prev => prev + 20);
    }
  };

  const displayTweets = tweets.slice(0, displayCount);
  const canLoadMore = hasMore || displayCount < tweets.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          {t('addressSearch.tweets.title')}
          <Badge variant="outline" className="ml-auto">
            {tweets.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {displayTweets.map((tweet: AddressTweet) => (
              <div
                key={tweet.tweet_id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => openTweet(tweet.tweet_id)}
              >
                {/* 用户头像 */}
                <Avatar 
                  className="h-10 w-10 shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    openUserProfile(tweet.screen_name);
                  }}
                >
                  <AvatarImage 
                    src={tweet.profile_image_url_https} 
                    alt={tweet.name}
                  />
                  <AvatarFallback>
                    {tweet.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* 推文内容 */}
                <div className="flex-1 min-w-0">
                  {/* 用户信息行 */}
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="font-medium text-gray-900 hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUserProfile(tweet.screen_name);
                      }}
                    >
                      {tweet.name}
                    </span>
                    <span className="text-gray-500 text-sm">
                      @{tweet.screen_name}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-sm">
                      {formatFollowers(tweet.followers_count)} {t('addressSearch.tweets.followers')}
                    </span>
                  </div>

                  {/* 时间和网络信息 */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatTime(tweet.tweet_time)}</span>
                    <Network className="h-3 w-3 ml-2" />
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getNetworkBadgeStyle(tweet.network)}`}
                    >
                      {tweet.network.charAt(0).toUpperCase() + tweet.network.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* 右侧信息 */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* 状态徽章 */}
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusBadgeStyle(tweet.status)}`}
                  >
                    {t(`addressSearch.tweets.status.${tweet.status}`)}
                  </Badge>

                  {/* 外部链接图标 */}
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* 加载更多按钮 */}
        {canLoadMore && (
          <div className="flex justify-center pt-4 border-t mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              className="flex items-center gap-2"
            >
              <MoreHorizontal className="h-4 w-4" />
              {t('addressSearch.tweets.loadMore')} 
              {!hasMore && `(${tweets.length - displayCount} ${t('addressSearch.tweets.remaining')})`}
            </Button>
          </div>
        )}

        {/* 说明文本 */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          {t('addressSearch.tweets.description')}
        </div>
      </CardContent>
    </Card>
  );
};
