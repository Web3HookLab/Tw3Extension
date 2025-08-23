/**
 * 用户历史面板组件
 */

import React, { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card'
import { Badge } from '~src/components/ui/badge'
import { ScrollArea } from '~src/components/ui/scroll-area'
import { Button } from '~src/components/ui/button'
import { Clock, RefreshCw, User, MapPin, Calendar } from 'lucide-react'
import { useSettings } from '~src/contexts/SettingsContext'
import { RefreshButton } from '../components/common/RefreshButton'
import { ApiService } from '../services/apiService'
import type { TwitterUserHistoryItem, TwitterUserHistoryResponse } from '~src/types/twitter-data.types'

interface UserHistoryPanelProps {
  restId: string
}

export function UserHistoryPanel({ restId }: UserHistoryPanelProps) {
  const [history, setHistory] = useState<TwitterUserHistoryItem[]>([])
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
      const response = await ApiService.getUserHistory(restId, offset, 200, forceRefresh)
      
      if (!response.success) {
        throw new Error(response.error || '获取用户历史失败')
      }

      const data = response.data as TwitterUserHistoryResponse
      const newHistory = data.data.data || []

      if (append) {
        setHistory(prev => [...prev, ...newHistory])
      } else {
        setHistory(newHistory)
      }

      setHasMore(data.data.has_more || false)
      setNextOffset(data.data.next_offset || 0)
      setFromCache(response.fromCache || false)

      console.log('📋 用户历史数据加载完成:', {
        restId,
        offset,
        count: newHistory.length,
        hasMore: data.data.has_more,
        fromCache: response.fromCache
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加载用户历史失败'
      setError(errorMsg)
      console.error('❌ 加载用户历史失败:', err)
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
  const formatTime = (timestamp: number) => {
    try {
      return new Date(timestamp * 1000).toLocaleString()
    } catch {
      return '未知时间'
    }
  }

  // 检测变更内容
  const getChanges = (current: TwitterUserHistoryItem, previous?: TwitterUserHistoryItem) => {
    if (!previous) return []
    
    const changes: string[] = []
    if (current.name !== previous.name) {
      changes.push(`昵称: ${previous.name} → ${current.name}`)
    }
    if (current.screen_name !== previous.screen_name) {
      changes.push(`用户名: @${previous.screen_name} → @${current.screen_name}`)
    }
    if (current.description !== previous.description) {
      changes.push('简介已更新')
    }
    if (current.location !== previous.location) {
      changes.push(`位置: ${previous.location || '无'} → ${current.location || '无'}`)
    }
    if (current.profile_image_url_https !== previous.profile_image_url_https) {
      changes.push('头像已更新')
    }
    if (current.profile_banner_url !== previous.profile_banner_url) {
      changes.push('横幅已更新')
    }
    
    return changes
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {t('sidePanel.userHistoryTitle')}
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
            <div className="space-y-4">
              {history.map((item, index) => {
                const changes = getChanges(item, history[index + 1])
                
                return (
                  <div
                    key={`${item.rest_id}-${item.scraped_at}-${index}`}
                    className="p-2 rounded-lg border bg-card hover:bg-muted/50"
                  >
                    {/* 用户信息头部 */}
                    <div className="flex items-start gap-2 mb-2">
                      <img
                        src={item.profile_image_url_https}
                        alt={item.name}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = chrome.runtime.getURL("assets/icon.png")
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1 min-w-0">
                          <span className="font-medium text-xs truncate">{item.name}</span>
                          <span className="text-muted-foreground text-xs truncate">@{item.screen_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{formatTime(item.scraped_at)}</span>
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 简介 */}
                    {item.description && (
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    )}

                    {/* 变更内容 */}
                    {changes.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          {t('sidePanel.changes')}:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {changes.map((change, changeIndex) => (
                            <Badge
                              key={changeIndex}
                              variant="outline"
                              className="text-xs px-1.5 py-0.5"
                            >
                              {change}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 首次记录标识 */}
                    {index === history.length - 1 && (
                      <Badge variant="secondary" className="text-xs mt-2">
                        {t('sidePanel.firstRecord')}
                      </Badge>
                    )}
                  </div>
                )
              })}

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
              {history.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('sidePanel.noUserHistory')}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
