/**
 * 时间线卡片组件
 * 基于 token-kline-viewer 的 TimelineCard 组件简化版
 */

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '~src/components/ui/avatar'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { TimelineCardProps, TweetAnalysisResult } from './types'
import { useSettings } from '~src/contexts/SettingsContext'

// 价格格式化函数
const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  
  if (isNaN(numPrice) || numPrice === 0) {
    return '0.0000'
  }
  
  if (numPrice >= 1) {
    return numPrice.toFixed(4)
  } else if (numPrice >= 0.001) {
    return numPrice.toFixed(6)
  } else if (numPrice >= 0.00001) {
    return numPrice.toFixed(10)
  } else {
    return numPrice.toFixed(15)
  }
}

// 倍数格式化函数
const formatMultiple = (multiple: number): string => {
  if (multiple >= 1) {
    return `${multiple.toFixed(2)}x`
  } else {
    const percentage = ((1 - multiple) * 100).toFixed(1)
    return `-${percentage}%`
  }
}

// 时间格式化函数
const formatTime = (timestamp: string | number) => {
  let date: Date
  
  if (typeof timestamp === 'string') {
    if (timestamp.includes('/') || timestamp.includes('-')) {
      date = new Date(timestamp)
    } else {
      const timestampNum = parseInt(timestamp)
      date = new Date(timestampNum * 1000)
    }
  } else {
    date = new Date(timestamp * 1000)
  }
  
  if (isNaN(date.getTime())) {
    return `解析失败: ${timestamp}`
  }
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 解析时间为Unix秒
const parseToUnixSeconds = (timeInput: string | number): number | null => {
  if (typeof timeInput === 'number') {
    return timeInput > 1e10 ? Math.floor(timeInput / 1000) : timeInput
  }
  
  if (typeof timeInput === 'string') {
    if (timeInput.includes('/') || timeInput.includes('-')) {
      const date = new Date(timeInput)
      return isNaN(date.getTime()) ? null : Math.floor(date.getTime() / 1000)
    } else {
      const num = parseInt(timeInput)
      return isNaN(num) ? null : (num > 1e10 ? Math.floor(num / 1000) : num)
    }
  }
  
  return null
}

export const TimelineCard: React.FC<TimelineCardProps> = ({
  klineData,
  tweetEvents,
  className = ''
}) => {
  const { t } = useSettings()
  const [isExpanded, setIsExpanded] = useState(false)

  // 分析推文事件影响
  const eventAnalysis = useMemo((): TweetAnalysisResult[] => {
    if (!klineData.length || !tweetEvents.length) return []

    const sortedKlineData = [...klineData].sort((a, b) => Number(a.time) - Number(b.time))

    return tweetEvents.map((event) => {
      const eventTimeSec = parseToUnixSeconds(event.tweet_time)
      if (eventTimeSec == null) {
        return {
          event,
          basePrice: null,
          maxPrice: null,
          multiple: null,
          error: t('klineAnalysis.timeParseError')
        }
      }

      // 找到事件时间点对应的K线数据
      let baseIndex = sortedKlineData.findIndex((d) => Number(d.time) >= eventTimeSec)
      if (baseIndex === -1) {
        baseIndex = sortedKlineData.length - 1
      }

      const baseData = sortedKlineData[baseIndex]
      if (!baseData) {
        return {
          event,
          basePrice: null,
          maxPrice: null,
          multiple: null,
          error: '未找到对应K线数据'
        }
      }

      const basePrice = Number(baseData.close)
      if (!isFinite(basePrice) || basePrice <= 0) {
        return {
          event,
          basePrice: null,
          maxPrice: null,
          multiple: null,
          error: t('klineAnalysis.invalidBasePrice')
        }
      }

      // 查找事件后24小时内的最高价
      const endTime = eventTimeSec + 24 * 3600
      const futureData = sortedKlineData.slice(baseIndex).filter(d => Number(d.time) <= endTime)
      
      if (futureData.length === 0) {
        return {
          event,
          basePrice,
          maxPrice: basePrice,
          multiple: 1,
          error: '无后续数据'
        }
      }

      const maxPrice = Math.max(...futureData.map(d => Number(d.high)))
      const multiple = maxPrice / basePrice

      return {
        event,
        basePrice,
        maxPrice,
        multiple,
        error: undefined
      }
    })
  }, [klineData, tweetEvents])

  // 按影响倍数排序，取前10个
  const topEvents = useMemo(() => {
    return eventAnalysis
      .filter(analysis => !analysis.error && analysis.multiple !== null)
      .sort((a, b) => (b.multiple || 0) - (a.multiple || 0))
      .slice(0, isExpanded ? eventAnalysis.length : 10)
  }, [eventAnalysis, isExpanded])

  if (eventAnalysis.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{t('klineAnalysis.eventImpactAnalysis')} (0)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('klineAnalysis.noEventData')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('klineAnalysis.eventImpactAnalysis')} ({topEvents.length})</CardTitle>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded hover:bg-accent hover:text-accent-foreground"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isExpanded ? t('klineAnalysis.collapse') : t('klineAnalysis.expand')}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topEvents.map((analysis, index) => {
            // 构建Twitter链接
            const twitterUserUrl = `https://twitter.com/${analysis.event.screen_name}`;
            const twitterTweetUrl = `https://twitter.com/${analysis.event.screen_name}/status/${analysis.event.tweet_id}`;

            // 打开Twitter用户主页的函数
            const openTwitterProfile = (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(twitterUserUrl, '_blank', 'noopener,noreferrer');
            };

            // 打开具体推文的函数
            const openTweet = (e: React.MouseEvent) => {
              e.preventDefault();
              // 如果点击的是用户头像或用户名，不要打开推文
              if ((e.target as HTMLElement).closest('[data-user-click]')) {
                return;
              }
              window.open(twitterTweetUrl, '_blank', 'noopener,noreferrer');
            };

            return (
              <div
                key={analysis.event.tweet_id || index}
                className="flex items-center gap-3 p-2 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors duration-200"
                onClick={openTweet}
                title={`查看推文详情`}
              >
                {/* 可点击的头像 */}
                <Avatar
                  className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all duration-200"
                  onClick={openTwitterProfile}
                  title={`查看 @${analysis.event.screen_name} 的Twitter主页`}
                  data-user-click="true"
                >
                  <AvatarImage
                    src={analysis.event.profile_image_url_https}
                    alt={analysis.event.name}
                  />
                  <AvatarFallback className="text-xs">
                    {analysis.event.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {/* 可点击的用户名 */}
                    <span
                      className="font-medium text-sm truncate cursor-pointer hover:text-blue-600 hover:underline transition-colors duration-200"
                      onClick={openTwitterProfile}
                      title={`查看 @${analysis.event.screen_name} 的Twitter主页`}
                      data-user-click="true"
                    >
                      {analysis.event.name}
                    </span>
                    {/* 可点击的用户名 */}
                    <span
                      className="text-xs text-muted-foreground cursor-pointer hover:text-blue-600 hover:underline transition-colors duration-200"
                      onClick={openTwitterProfile}
                      title={`查看 @${analysis.event.screen_name} 的Twitter主页`}
                      data-user-click="true"
                    >
                      @{analysis.event.screen_name}
                    </span>
                  {!analysis.error && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      analysis.multiple! > 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {formatMultiple(analysis.multiple!)}
                    </span>
                  )}
                </div>
                {isExpanded && (
                  <div className="text-xs text-muted-foreground mt-1">
                    <span
                      className="cursor-pointer hover:text-blue-600 hover:underline transition-colors duration-200"
                      onClick={openTweet}
                      title={t('klineAnalysis.clickToViewTweet')}
                    >
                      {formatTime(analysis.event.tweet_time)} • {analysis.event.followers_count?.toLocaleString()} {t('klineAnalysis.followers')}
                    </span>
                    {!analysis.error && (
                      <span className="ml-2">
                        {t('klineAnalysis.baseline')}: ${formatPrice(analysis.basePrice!)} → {t('klineAnalysis.peak')}: ${formatPrice(analysis.maxPrice!)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  )
}
