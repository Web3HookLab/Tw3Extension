import React from 'react';
import { Card } from '~src/components/ui/card';
import { Button } from '~src/components/ui/button';
import { Badge } from '~src/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '~src/components/ui/avatar';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { Skeleton } from '~src/components/ui/skeleton';
import { Eye } from 'lucide-react';
import { useSettings } from '~src/contexts/SettingsContext';
import { getEarliestFollower } from './utils';
import type { TwitterTrendsListProps } from '~src/types/twitter-trends.types';

/**
 * Twitter 趋势列表组件
 * 显示趋势项目列表，包括加载状态和错误处理
 */
export function TwitterTrendsList({
  trends,
  loading,
  error,
  showAll,
  trendsCount,
  onShowAllToggle,
  onOpenTwitterProfile,
  onShowAllFollowers
}: TwitterTrendsListProps) {
  const { t } = useSettings();

  return (
    <div className="p-2 flex flex-col gap-1 pb-2">
      {/* 错误显示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 趋势列表 */}
      {(Array.isArray(trends) && trends.length > 0) && (
        <>
          {(showAll ? trends : trends.slice(0, trendsCount)).map((trend, index) => {
            const earliestFollower = getEarliestFollower(trend.followers);
            return (
              <Card key={`${trend.screen_name}-${index}`} className="p-2 text-xs w-full hover:bg-muted/50 transition">
                <div className="flex w-full h-12 items-center">
                  {/* 左侧：Badge+头像严格对齐 */}
                  <div className="flex items-center mr-2">
                    <Badge className="text-[11px] px-2 py-0.5 mr-2">
                      {trend.follower_count} {t('dashboard.newFollowers')}
                    </Badge>
                    <span
                      role="button"
                      tabIndex={0}
                      title={t('dashboard.gotoProfile')}
                      className="outline-none focus:ring-2 focus:ring-ring rounded-full cursor-pointer"
                      onClick={() => onOpenTwitterProfile(trend.screen_name)}
                      onKeyDown={e => { 
                        if (e.key === 'Enter' || e.key === ' ') {
                          onOpenTwitterProfile(trend.screen_name);
                        }
                      }}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={trend.profile_image} />
                        <AvatarFallback>{trend.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                    </span>
                  </div>

                  {/* 昵称/简介 */}
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1">
                      <span
                        role="button"
                        tabIndex={0}
                        title={t('dashboard.gotoProfile')}
                        className="font-medium truncate max-w-[120px] outline-none focus:ring-2 focus:ring-ring rounded cursor-pointer hover:underline"
                        onClick={() => onOpenTwitterProfile(trend.screen_name)}
                        onKeyDown={e => { 
                          if (e.key === 'Enter' || e.key === ' ') {
                            onOpenTwitterProfile(trend.screen_name);
                          }
                        }}
                      >
                        {trend.name}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        title={t('dashboard.gotoProfile')}
                        className="text-muted-foreground truncate max-w-[80px] outline-none focus:ring-2 focus:ring-ring rounded cursor-pointer hover:underline"
                        onClick={() => onOpenTwitterProfile(trend.screen_name)}
                        onKeyDown={e => { 
                          if (e.key === 'Enter' || e.key === ' ') {
                            onOpenTwitterProfile(trend.screen_name);
                          }
                        }}
                      >
                        @{trend.screen_name}
                      </span>
                    </div>
                    <span className="block text-[11px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap truncate max-w-[160px] min-h-[16px]">
                      {trend.description || '\u00A0'}
                    </span>
                  </div>

                  {/* 右侧内容整体推到最右 */}
                  <div className="flex items-center gap-2 ml-auto">
                    {earliestFollower && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">{t('dashboard.earliestFollower')}:</span>
                        <span
                          role="button"
                          tabIndex={0}
                          title={t('dashboard.gotoProfile')}
                          className="outline-none focus:ring-2 focus:ring-ring rounded-full cursor-pointer"
                          onClick={() => onOpenTwitterProfile(earliestFollower.screen_name)}
                          onKeyDown={e => { 
                            if (e.key === 'Enter' || e.key === ' ') {
                              onOpenTwitterProfile(earliestFollower.screen_name);
                            }
                          }}
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={earliestFollower.profile_image_url_https} />
                            <AvatarFallback>{earliestFollower.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          title={t('dashboard.gotoProfile')}
                          className="font-medium outline-none focus:ring-2 focus:ring-ring rounded cursor-pointer hover:underline"
                          onClick={() => onOpenTwitterProfile(earliestFollower.screen_name)}
                          onKeyDown={e => { 
                            if (e.key === 'Enter' || e.key === ' ') {
                              onOpenTwitterProfile(earliestFollower.screen_name);
                            }
                          }}
                        >
                          {earliestFollower.name}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          title={t('dashboard.gotoProfile')}
                          className="text-[10px] text-muted-foreground outline-none focus:ring-2 focus:ring-ring rounded cursor-pointer hover:underline"
                          onClick={() => onOpenTwitterProfile(earliestFollower.screen_name)}
                          onKeyDown={e => { 
                            if (e.key === 'Enter' || e.key === ' ') {
                              onOpenTwitterProfile(earliestFollower.screen_name);
                            }
                          }}
                        >
                          @{earliestFollower.screen_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(earliestFollower.event_time).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-5 text-[11px] px-2 py-0.5"
                      onClick={() => onShowAllFollowers(trend.followers, trend.name)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {t('dashboard.showAllFollowers') + ` (${trend.follower_count})`}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          
          {/* 展开/收起更多按钮 */}
          {trends.length > trendsCount && (
            <div className="flex justify-center mt-2">
              <Button variant="outline" size="sm" onClick={onShowAllToggle}>
                {showAll ? '收起' : `查看更多（${trends.length - trendsCount}）`}
              </Button>
            </div>
          )}
        </>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-2 text-xs w-full">
              <div className="flex items-center w-full min-h-[40px]">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1 ml-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2 w-16" />
                </div>
                <Skeleton className="h-5 w-12 ml-2" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 无数据 */}
      {!loading && (!Array.isArray(trends) || trends.length === 0) && !error && (
        <div className="text-center text-muted-foreground py-8">
          {t('dashboard.noTrendsData')}
        </div>
      )}
    </div>
  );
}
