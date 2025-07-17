/**
 * 关注事件面板组件
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card'
import { Badge } from '~src/components/ui/badge'
import { ScrollArea } from '~src/components/ui/scroll-area'
import { Button } from '~src/components/ui/button'
import { UserPlus, UserMinus, RefreshCw, Clock, Users } from 'lucide-react'
import { useSettings } from '~src/contexts/SettingsContext'
import { RefreshButton } from '../components/common/RefreshButton'
import { ApiService } from '../services/apiService'
import type { TwitterFollowEvent, TwitterFollowChangesResponse } from '~src/types/twitter-data.types'

interface FollowEventsPanelProps {
  restId: string
}

export function FollowEventsPanel({ restId }: FollowEventsPanelProps) {
  const [events, setEvents] = useState<TwitterFollowEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [fromCache, setFromCache] = useState(false)
  const { t } = useSettings()

  // 加载数据
  const loadData = useCallback(async (offset = 0, forceRefresh = false, append = false) => {
    if (!restId) return

    setLoading(true)
    setError(null)

    try {
      const response = await ApiService.getFollowEvents(restId, offset, 200, forceRefresh)
      
      if (!response.success) {
        throw new Error(response.error || '获取关注事件失败')
      }

      const data = response.data as TwitterFollowChangesResponse
      const newEvents = data.data.data || []

      if (append) {
        setEvents(prev => [...prev, ...newEvents])
      } else {
        setEvents(newEvents)
      }

      setHasMore(data.data.has_more || false)
      setNextOffset(data.data.next_offset || 0)
      setFromCache(response.fromCache || false)

      console.log('📋 关注事件数据加载完成:', {
        restId,
        offset,
        count: newEvents.length,
        hasMore: data.data.has_more,
        fromCache: response.fromCache
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载关注事件失败'
      setError(errorMsg)
      console.error('❌ 加载关注事件失败:', err)
    } finally {
      setLoading(false)
    }
  }, [restId])

  // 初始加载
  useEffect(() => {
    loadData(0, false, false)
  }, [loadData])

  // 刷新处理
  const handleRefresh = useCallback(async () => {
    await loadData(0, true, false)
  }, [loadData])

  // 加载更多
  const handleLoadMore = useCallback(async () => {
    if (hasMore && !loading) {
      await loadData(nextOffset, false, true)
    }
  }, [hasMore, loading, nextOffset, loadData])

  // 格式化时间
  const formatTime = (timeStr: string) => {
    try {
      return new Date(timeStr).toLocaleString()
    } catch {
      return timeStr
    }
  }

  // 格式化粉丝数
  const formatFollowersCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center">
            <UserPlus className="w-4 h-4 mr-2" />
            {t('sidePanel.followEventsTitle')}
            {fromCache && (
              <Badge variant="secondary" className="ml-2 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {t('common.cached')}
              </Badge>
            )}
          </div>
          <RefreshButton 
            onRefresh={handleRefresh} 
            loading={loading}
            size="sm"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-8">
            <div className="text-destructive text-sm mb-2">{error}</div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              {t('common.retry')}
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {events.map((event, index) => (
                <div
                  key={`${event.screen_name}-${event.event_time}-${index}`}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50"
                >
                  {/* 顶部：用户信息和状态标签 */}
                  <div className="flex items-start gap-3 mb-2">
                    {/* 变更类型图标 */}
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${
                      event.change_type === 'add'
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                    }`}>
                      {event.change_type === 'add' ? (
                        <UserPlus className="w-3 h-3" />
                      ) : (
                        <UserMinus className="w-3 h-3" />
                      )}
                    </div>

                    {/* 用户头像 */}
                    <img
                      src={event.profile_image_url_https}
                      alt={event.name}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-avatar.png'
                      }}
                    />

                    {/* 用户信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <span className="font-medium text-sm truncate">{event.name}</span>
                          <span className="text-muted-foreground text-xs truncate">@{event.screen_name}</span>
                        </div>
                        {/* 变更类型标签 - 移到右上角 */}
                        <Badge
                          variant={event.change_type === 'add' ? 'default' : 'destructive'}
                          className="text-xs flex-shrink-0"
                        >
                          {event.change_type === 'add' ? t('sidePanel.followed') : t('sidePanel.unfollowed')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* 底部：详细信息 */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-12">
                    <Users className="w-3 h-3" />
                    <span>{formatFollowersCount(event.followers_count)}</span>
                    <span>•</span>
                    <span className="truncate">{formatTime(event.event_time)}</span>
                  </div>
                </div>
              ))}

              {/* 加载更多按钮 */}
              {hasMore && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.loadMore')}
                  </Button>
                </div>
              )}

              {/* 空状态 */}
              {events.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('sidePanel.noFollowEvents')}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
