/**
 * 删除推文面板组件
 * 显示用户删除的推文列表
 */

import React, { useState, useEffect } from 'react'
import { sendToBackground } from '@plasmohq/messaging'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  RefreshCw,
  Calendar,
  MessageSquare,
  AlertTriangle,
  Trash2,
  Copy
} from 'lucide-react'
import { useLanguageManager } from '~src/hooks/useLanguageManager'
import { toast } from 'sonner'
import { extractWalletAddresses } from '~src/contents/wallet-notes-injection/utils/wallet-detection.utils'

interface DeletedTweet {
  tweet_id: string
  rest_id: string
  content: string
  created_at: string
  deleted_at: string
}

interface DeletedTweetsData {
  data: DeletedTweet[]
  next_offset: number
  has_more: boolean
}

interface DeletedTweetsPanelProps {
  restId: string
  deletedCount?: number
}

export function DeletedTweetsPanel({ restId, deletedCount }: DeletedTweetsPanelProps) {
  const { t } = useLanguageManager()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletedTweets, setDeletedTweets] = useState<DeletedTweet[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  /**
   * 获取删除推文数据
   */
  const fetchDeletedTweets = async (offset = 0, append = false) => {
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      console.log('🔄 [删除推文面板] 开始获取删除推文数据:', { restId, offset, append })

      const response = await sendToBackground({
        name: "twitter-deleted-tweets",
        body: {
          restId,
          pagination: {
            limit: 20,
            offset
          }
        }
      })

      console.log('📥 [删除推文面板] API响应:', response)

      if (response.success && response.data) {
        const data: DeletedTweetsData = response.data
        
        if (append) {
          setDeletedTweets(prev => [...prev, ...data.data])
        } else {
          setDeletedTweets(data.data)
        }
        
        setHasMore(data.has_more)
        setNextOffset(data.next_offset)
        
        console.log('✅ [删除推文面板] 数据加载成功:', {
          newTweets: data.data.length,
          totalTweets: append ? deletedTweets.length + data.data.length : data.data.length,
          hasMore: data.has_more,
          nextOffset: data.next_offset
        })
      } else {
        const errorMsg = response.error || t('deletedTweets.fetchError')
        setError(errorMsg)
        console.error('❌ [删除推文面板] 数据加载失败:', errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('deletedTweets.fetchError')
      setError(errorMsg)
      console.error('❌ [删除推文面板] 数据加载异常:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  /**
   * 加载更多数据
   */
  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchDeletedTweets(nextOffset, true)
    }
  }

  /**
   * 刷新数据
   */
  const refresh = () => {
    fetchDeletedTweets(0, false)
  }

  /**
   * 格式化时间
   */
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleString()
    } catch {
      return timeString
    }
  }

  /**
   * 截断文本
   */
  const truncateText = (text: string, maxLength = 200) => {
    if (text.length <= maxLength) {
      return text
    }
    return text.substring(0, maxLength) + '...'
  }

  /**
   * 检测并高亮钱包地址，同时处理长文本换行
   */
  const renderContentWithCopyableAddresses = (content: string) => {
    // 使用项目中的钱包地址检测工具
    const walletAddresses = extractWalletAddresses(content)

    if (walletAddresses.length === 0) {
      // 如果没有钱包地址，直接返回带换行样式的文本
      return <span style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{content}</span>
    }

    // 按位置分割文本并插入可复制的地址组件
    let lastIndex = 0
    const elements: React.ReactNode[] = []

    walletAddresses.forEach((walletInfo, index) => {
      // 添加地址前的文本
      if (walletInfo.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${index}`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {content.slice(lastIndex, walletInfo.startIndex)}
          </span>
        )
      }

      // 添加可复制的地址
      elements.push(
        <span key={`wallet-${index}`} className="inline-flex items-start gap-1 flex-wrap">
          <code
            className="bg-muted px-1 py-0.5 rounded text-xs font-mono break-all max-w-full"
            style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}
          >
            {walletInfo.address}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={async (e) => {
              e.stopPropagation()
              const button = e.currentTarget
              const icon = button.querySelector('svg')

              try {
                // 添加点击动画
                if (icon) {
                  icon.style.transform = 'scale(0.8)'
                  icon.style.transition = 'transform 0.1s ease'
                }

                await navigator.clipboard.writeText(walletInfo.address)
                toast.success(t('common.copied'))

                // 成功动画
                if (icon) {
                  setTimeout(() => {
                    icon.style.transform = 'scale(1.1)'
                    setTimeout(() => {
                      icon.style.transform = 'scale(1)'
                    }, 100)
                  }, 100)
                }
              } catch (error) {
                toast.error(t('common.copyFailed'))
                // 错误时恢复原状
                if (icon) {
                  icon.style.transform = 'scale(1)'
                }
              }
            }}
            className="h-4 w-4 p-0 hover:bg-muted flex-shrink-0 transition-all duration-200 hover:scale-110"
            title={t('deletedTweets.copyAddress')
              .replace('{network}', walletInfo.networkType.toUpperCase())
              .replace('{address}', walletInfo.address)}
          >
            <Copy className="h-3 w-3 transition-transform duration-200" />
          </Button>
        </span>
      )

      lastIndex = walletInfo.endIndex
    })

    // 添加最后剩余的文本
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
          {content.slice(lastIndex)}
        </span>
      )
    }

    return <>{elements}</>
  }

  // 初始加载
  useEffect(() => {
    fetchDeletedTweets()
  }, [restId])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={refresh} 
            className="mt-4 w-full"
            variant="outline"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('common.retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {t('twitterDisplay.deletedTweets')}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>
              {t('deletedTweets.total')}: <Badge variant="secondary">{deletedTweets.length}</Badge>
            </div>
            {deletedCount && (
              <div>
                {t('deletedTweets.expected')}: <Badge variant="outline">{deletedCount}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 推文列表 */}
      {deletedTweets.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-2 space-y-2">
                {deletedTweets.map((tweet) => (
                  <div
                    key={tweet.tweet_id}
                    className="p-2 rounded-lg border bg-card hover:bg-muted/50"
                  >
                    {/* 推文内容 */}
                    <div className="mb-2">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                        <div className="text-xs leading-relaxed min-w-0 flex-1 overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                          {renderContentWithCopyableAddresses(truncateText(tweet.content, 300))}
                        </div>
                      </div>
                    </div>

                    {/* 时间信息 */}
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{t('deletedTweets.published')}: {formatTime(tweet.created_at)}</span>
                      </div>
                      {tweet.deleted_at && (
                        <div className="flex items-center gap-1">
                          <Trash2 className="h-3 w-3" />
                          <span>{t('deletedTweets.deleted')}: {formatTime(tweet.deleted_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* 加载更多按钮 */}
                {hasMore && (
                  <div className="pt-4">
                    <Button
                      onClick={loadMore}
                      disabled={loadingMore}
                      variant="outline"
                      className="w-full"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('common.loading')}
                        </>
                      ) : (
                        t('common.loadMore')
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground text-center">
              {t('deletedTweets.noData')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
