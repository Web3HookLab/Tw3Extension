/**
 * 基于 lightweight-charts 的专业K线图组件
 * 支持推文事件头像标记
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { createChart, type IChartApi, type ISeriesApi, type CandlestickData, type UTCTimestamp, CandlestickSeries } from 'lightweight-charts'
import { Avatar, AvatarFallback, AvatarImage } from '~src/components/ui/avatar'
import type { TweetEvent, KlineDataWithType, PriceType } from './types'
import { useSettings } from '~src/contexts/SettingsContext'

// 时间范围选项
export type TimeRange = '1D' | '7D' | '1M' | '3M' | '1Y' | 'ALL'

export interface LightweightKlineChartProps {
  data: KlineDataWithType[]
  tweetEvents?: TweetEvent[]
  onEventClick?: (event: TweetEvent) => void
  className?: string
  height?: number
}

// 推文头像覆盖层组件
const TweetAvatarOverlay: React.FC<{
  event: TweetEvent
  x: number
  y: number
  multiple: number
  onClick: () => void
  impactMultipleText: string
}> = ({ event, x, y, multiple, onClick, impactMultipleText }) => {
  const formatMultiple = (mult: number): string => {
    if (mult >= 1) {
      return `${mult.toFixed(1)}x`
    } else {
      const percentage = ((1 - mult) * 100).toFixed(0)
      return `-${percentage}%`
    }
  }

  const getMultipleColor = (mult: number): string => {
    if (mult >= 2) return 'bg-green-500'
    if (mult >= 1.5) return 'bg-lime-500'
    if (mult >= 1.1) return 'bg-yellow-500'
    if (mult >= 1) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div
      className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={onClick}
      title={`${event.name} (@${event.screen_name}) - ${impactMultipleText}: ${formatMultiple(multiple)}`}
    >
      <Avatar className="h-7 w-7 border-2 border-white shadow-lg hover:scale-110 transition-transform duration-200">
        <AvatarImage
          src={event.profile_image_url_https}
          alt={event.name}
        />
        <AvatarFallback className="text-xs bg-blue-500 text-white">
          {event.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
    </div>
  )
}

// ✨ 专业的15分钟K线数据时间范围显示组件 - 修复溢出问题
const DataTimeRange: React.FC<{ data: CandlestickData[]; t: (key: string) => string }> = ({ data, t }) => {
  if (!data.length) return null

  const startTime = new Date((data[0].time as number) * 1000)
  const endTime = new Date((data[data.length - 1].time as number) * 1000)
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)) // 小时数

  return (
    <div className="w-full max-w-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-3 mb-4 border border-blue-200/50 dark:border-blue-800/50">
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse flex-shrink-0"></div>
          <span className="text-sm font-medium text-foreground truncate">
            📊 {t('klineAnalysis.chartTitle')}
          </span>
        </div>
        <div className="text-xs text-muted-foreground flex-shrink-0 ml-2">
          {t('klineAnalysis.professionalAnalysis')}
        </div>
      </div>
      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs min-w-0">
        <span className="text-muted-foreground truncate">
          {t('klineAnalysis.timeLabel')}: {startTime.toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} - {endTime.toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
        <span className="text-muted-foreground flex-shrink-0">
          {data.length}{t('klineAnalysis.dataPoints')} • {duration}{t('klineAnalysis.hours')}
        </span>
      </div>
    </div>
  )
}

export const LightweightKlineChart: React.FC<LightweightKlineChartProps> = ({
  data,
  tweetEvents = [],
  onEventClick,
  className = '',
  height = 500 // ✨ 增加默认高度到500px
}) => {
  const { t } = useSettings()
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const [avatarOverlays, setAvatarOverlays] = useState<Array<{
    event: TweetEvent
    x: number
    y: number
    multiple: number
  }>>([])
  // ✨ 移除时间范围切换，专注于15分钟K线数据

  // ✨ 简化的15分钟K线数据转换逻辑
  const chartData = useMemo((): CandlestickData[] => {
    if (!data.length) {
      return []
    }

    const validData: CandlestickData[] = []
    let invalidCount = 0

    for (const item of data) {
      try {
        // 验证数据完整性
        if (!item || typeof item !== 'object') {
          invalidCount++
          continue
        }

        // 验证必需字段
        if (!item.time || !item.open || !item.high || !item.low || !item.close) {
          invalidCount++
          continue
        }

        // 验证价格数据
        const prices = [item.open, item.high, item.low, item.close]
        if (prices.some(price => !isFinite(price) || price <= 0)) {
          invalidCount++
          continue
        }

        // 验证价格逻辑关系
        if (item.high < Math.max(item.open, item.close) ||
            item.low > Math.min(item.open, item.close)) {
          invalidCount++
          continue
        }

        // 时间戳转换
        let timestamp: UTCTimestamp
        if (typeof item.time === 'string') {
          timestamp = parseInt(item.time) as UTCTimestamp
        } else {
          timestamp = item.time as UTCTimestamp
        }

        validData.push({
          time: timestamp,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close
        })
      } catch (error) {
        console.error('❌ 数据转换错误:', error, item)
        invalidCount++
      }
    }

    // 按时间排序
    validData.sort((a, b) => (a.time as number) - (b.time as number))



    return validData
  }, [data])

  // ✨ 分离推文事件处理：基于原始数据计算，不受时间范围限制
  const allTweetEventsWithMultiple = useMemo(() => {
    if (!tweetEvents.length || !data.length) return []



    // 使用原始数据进行计算，确保头像始终可见
    const originalChartData = data
      .map((item): CandlestickData | null => {
        if (!item.time || !item.open || !item.high || !item.low || !item.close) {
          return null
        }

        let time: UTCTimestamp
        if (typeof item.time === 'string') {
          const date = new Date(item.time)
          time = Math.floor(date.getTime() / 1000) as UTCTimestamp
        } else if (typeof item.time === 'number') {
          time = item.time as UTCTimestamp
        } else {
          return null
        }

        return {
          time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close
        }
      })
      .filter((item): item is CandlestickData => item !== null)
      .sort((a, b) => (a.time as number) - (b.time as number))



    const eventAnalysis: Array<{
      event: TweetEvent
      basePrice: number
      maxPrice: number
      multiple: number
    }> = []

    // 统计信息
    let stats = {
      total: tweetEvents.length,
      processed: 0,
      noBaseData: 0,
      invalidPrice: 0,
      noFutureData: 0,
      success: 0
    }



    for (const event of tweetEvents) {
      stats.processed++
      // 正确解析推文时间
      let eventTime: number
      if (typeof event.tweet_time === 'string') {
        // 如果是ISO 8601格式或其他日期字符串
        if (event.tweet_time.includes('T') || event.tweet_time.includes('-') || event.tweet_time.includes('/')) {
          const date = new Date(event.tweet_time)
          eventTime = Math.floor(date.getTime() / 1000)
        } else {
          // 如果是纯数字字符串
          eventTime = parseInt(event.tweet_time)
        }
      } else {
        eventTime = event.tweet_time
      }

      // ✨ 使用原始数据查找基准K线，确保头像始终可见
      let baseIndex = originalChartData.findIndex((d) => (d.time as number) >= eventTime)
      if (baseIndex === -1) baseIndex = originalChartData.length - 1

      const baseData = originalChartData[baseIndex]
      if (!baseData) {
        stats.noBaseData++
        continue
      }

      const basePrice = baseData.close
      if (!isFinite(basePrice) || basePrice <= 0) {
        stats.invalidPrice++
        continue
      }

      // ✨ 查找事件后24小时内的最高价，使用原始数据
      const endTime = eventTime + 24 * 3600
      const futureData = originalChartData.slice(baseIndex).filter(d => (d.time as number) <= endTime)

      if (futureData.length === 0) {
        stats.noFutureData++
        continue
      }

      const maxPrice = Math.max(...futureData.map(d => d.high))
      const multiple = maxPrice / basePrice

      eventAnalysis.push({
        event,
        basePrice,
        maxPrice,
        multiple
      })
      stats.success++
    }

    // 按影响倍数排序，取前10个
    const topEvents = eventAnalysis
      .sort((a, b) => b.multiple - a.multiple)
      .slice(0, 10)

    return topEvents
  }, [tweetEvents, data])

  // ✨ 15分钟K线数据中，所有推文事件都直接显示，无需时间过滤

  // 初始化图表
  useEffect(() => {
    if (!chartContainerRef.current) return

    // ✨ 创建专业的15分钟K线图表 - 修复Card溢出问题
    const containerWidth = chartContainerRef.current.clientWidth
    // 为价格轴预留更多空间，确保完全不溢出
    const chartWidth = Math.max(300, containerWidth - 120) // 预留120px给价格轴和边距
    const chart = createChart(chartContainerRef.current, {
      width: chartWidth,
      height: height,
      layout: {
        background: { color: 'transparent' },
        textColor: 'hsl(var(--foreground))',
        fontSize: 12,
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      },
      grid: {
        vertLines: {
          color: 'hsl(var(--border))',
          style: 1, // 实线
          visible: true,
        },
        horzLines: {
          color: 'hsl(var(--border))',
          style: 1, // 实线
          visible: true,
        },
      },
      crosshair: {
        mode: 1, // Normal crosshair mode
        vertLine: {
          color: 'hsl(var(--muted-foreground))',
          width: 1,
          style: 3, // 虚线
          labelBackgroundColor: 'hsl(var(--background))',
        },
        horzLine: {
          color: 'hsl(var(--muted-foreground))',
          width: 1,
          style: 3, // 虚线
          labelBackgroundColor: 'hsl(var(--background))',
        },
      },
      rightPriceScale: {
        borderColor: 'hsl(var(--border))',
        // ✨ 15分钟K线专用价格精度 - 修复溢出问题
        mode: 0, // Normal price scale mode
        autoScale: true,
        invertScale: false,
        alignLabels: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        // 🔧 限制价格轴宽度，防止溢出
        visible: true,
        entireTextOnly: true, // 只显示完整的文本，减少宽度
        ticksVisible: false, // 隐藏刻度线，减少宽度
        borderVisible: false, // 隐藏边框，减少宽度
      },
      timeScale: {
        borderColor: 'hsl(var(--border))',
        timeVisible: true,
        secondsVisible: false,
        // ✨ 15分钟K线专用时间格式
        tickMarkFormatter: (time: UTCTimestamp) => {
          const date = new Date((time as number) * 1000)
          const now = new Date()
          const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

          // 根据时间距离选择不同的显示格式
          if (diffHours < 24) {
            // 24小时内显示时:分
            return date.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
          } else if (diffHours < 168) { // 7天内
            // 7天内显示月/日 时:分
            return date.toLocaleDateString('zh-CN', {
              month: 'short',
              day: 'numeric'
            }) + ' ' + date.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
          } else {
            // 更长时间显示完整日期
            return date.toLocaleDateString('zh-CN', {
              year: '2-digit',
              month: 'short',
              day: 'numeric'
            })
          }
        },
        rightOffset: 12,
        barSpacing: 6,
        minBarSpacing: 0.5,
      },
    })

    // ✨ 创建专业的15分钟K线蜡烛图系列
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      // ✨ 专业的颜色配置 - 绿涨红跌（中国习惯）
      upColor: '#00d4aa', // 青绿色上涨
      downColor: '#fb4570', // 粉红色下跌
      borderDownColor: '#fb4570',
      borderUpColor: '#00d4aa',
      wickDownColor: '#fb4570',
      wickUpColor: '#00d4aa',
      // ✨ 15分钟K线专用视觉效果
      borderVisible: true,
      wickVisible: true,
      priceFormat: {
        type: 'price',
        precision: 8, // 加密货币通常需要更高精度
        minMove: 0.00000001,
      },
      // ✨ 优化15分钟K线的视觉效果
      priceLineVisible: true,
      lastValueVisible: true,
      title: '15分钟K线',
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries

    // 清理函数
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        candlestickSeriesRef.current = null
      }
    }
  }, [height])

  // ✨ 修复图表数据更新逻辑
  useEffect(() => {
    if (!candlestickSeriesRef.current) return



    // ✨ 更新15分钟K线图表数据
    candlestickSeriesRef.current.setData(chartData)

    // 如果有数据，自动调整视图范围
    if (chartData.length > 0 && chartRef.current) {
      try {
        chartRef.current.timeScale().fitContent()
      } catch (error) {
        console.warn('⚠️ 调整图表视图范围失败:', error)
      }
    }
  }, [chartData])

  // 计算头像覆盖层位置的函数
  const calculateAvatarPositions = useCallback(() => {
    const chart = chartRef.current
    const series = candlestickSeriesRef.current
    if (!chart || !series || !allTweetEventsWithMultiple.length) {
      setAvatarOverlays([])
      return
    }

    const overlays: Array<{
      event: TweetEvent
      x: number
      y: number
      multiple: number
    }> = []

    // 用于跟踪已使用的位置，避免重叠
    const usedPositions = new Map<string, number>() // key: "x,y", value: count

    for (const { event, multiple } of allTweetEventsWithMultiple) {
      // 重新解析推文时间（与topTweetEvents中的逻辑保持一致）
      let eventTime: number
      if (typeof event.tweet_time === 'string') {
        if (event.tweet_time.includes('T') || event.tweet_time.includes('-') || event.tweet_time.includes('/')) {
          const date = new Date(event.tweet_time)
          eventTime = Math.floor(date.getTime() / 1000)
        } else {
          eventTime = parseInt(event.tweet_time)
        }
      } else {
        eventTime = event.tweet_time
      }



      try {
        // 找到对应的价格数据
        const dataPoint = chartData.find(d => Math.abs((d.time as number) - eventTime) < 900) // 15分钟容差
        if (!dataPoint) {
          continue
        }

        // 计算屏幕坐标
        const timeCoordinate = chart.timeScale().timeToCoordinate(dataPoint.time)
        const priceCoordinate = series.priceToCoordinate(dataPoint.high)



        if (timeCoordinate !== null && priceCoordinate !== null &&
            timeCoordinate >= 0 && priceCoordinate >= 0) {

          // 计算基础位置（转换为数字）
          let finalX = Number(timeCoordinate)
          let finalY = Number(priceCoordinate) - 20 // 在K线上方20px

          // 检查位置是否已被占用，如果是则调整位置
          const baseKey = `${Math.round(finalX / 10) * 10},${Math.round(finalY / 10) * 10}` // 10px网格对齐
          const usedCount = usedPositions.get(baseKey) || 0

          if (usedCount > 0) {
            // 如果位置已被占用，则向上叠加
            const verticalOffset = usedCount * 35 // 每个头像向上偏移35px
            finalY -= verticalOffset


          }

          // 记录位置使用
          usedPositions.set(baseKey, usedCount + 1)

          overlays.push({
            event,
            x: finalX,
            y: finalY,
            multiple
          })
        }
      } catch (error) {
        console.warn('❌ 计算头像位置失败:', error, { user: event.screen_name })
      }
    }


    setAvatarOverlays(overlays)
  }, [allTweetEventsWithMultiple, chartData])

  // 初始计算头像位置
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || !allTweetEventsWithMultiple.length) {
      setAvatarOverlays([])
      return
    }

    // 延迟计算，确保图表完全初始化
    const timer = setTimeout(() => {
      calculateAvatarPositions()
    }, 500)

    return () => clearTimeout(timer)
  }, [calculateAvatarPositions])

  // 监听图表变化，实时更新头像位置
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !allTweetEventsWithMultiple.length) return

    const handleVisibleTimeRangeChange = () => {
      calculateAvatarPositions()
    }

    const handleVisibleLogicalRangeChange = () => {
      calculateAvatarPositions()
    }

    // 监听图表的时间范围和逻辑范围变化
    chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange)
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange)

    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange)
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange)
    }
  }, [calculateAvatarPositions, allTweetEventsWithMultiple.length])

  // 处理容器大小变化 - 修复Card溢出问题
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.clientWidth
        // 为价格轴预留更多空间，确保完全不溢出
        const chartWidth = Math.max(300, containerWidth - 120) // 预留120px给价格轴和边距
        chartRef.current.applyOptions({
          width: chartWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`w-full max-w-full space-y-4 ${className}`}>
      {/* ✨ 数据时间范围显示 */}
      <DataTimeRange data={chartData} t={t} />

      {/* ✨ 15分钟K线图表区域 - 修复Card溢出问题 */}
      <div className="relative w-full max-w-full overflow-hidden rounded-lg border bg-card">
        <div
          ref={chartContainerRef}
          className="w-full min-w-0 max-w-full"
          style={{
            height: `${height}px`,
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden'
          }}
        />

        {/* 推文头像覆盖层 */}
        {avatarOverlays.map((overlay, index) => {
          // 检查头像是否在可视区域内
          const containerWidth = chartContainerRef.current?.clientWidth || 0
          const containerHeight = chartContainerRef.current?.clientHeight || 0
          const isVisible = overlay.x >= 0 && overlay.y >= 0 &&
                            overlay.x <= containerWidth - 40 && // 留出头像宽度
                            overlay.y <= containerHeight - 40   // 留出头像高度

          if (!isVisible) return null

          return (
            <TweetAvatarOverlay
              key={overlay.event.tweet_id || index}
              event={overlay.event}
              x={Math.min(overlay.x, containerWidth - 50)} // 确保不超出右边界
              y={Math.min(overlay.y, containerHeight - 50)} // 确保不超出下边界
              multiple={overlay.multiple}
              onClick={() => onEventClick?.(overlay.event)}
              impactMultipleText={t('klineAnalysis.impactMultiple')}
            />
          )
        })}
      </div>

      {/* ✨ 推文事件分析区域 - 修复溢出问题 */}
      {allTweetEventsWithMultiple.length > 0 && (
        <div className="w-full max-w-full space-y-3 overflow-hidden">
          <h4 className="text-sm font-medium text-foreground truncate">
            {t('klineAnalysis.eventImpactAnalysis')} ({allTweetEventsWithMultiple.length})
          </h4>
          <div className="w-full max-w-full overflow-hidden">
            <div className="grid gap-2 max-h-32 overflow-y-auto overflow-x-hidden">
              {allTweetEventsWithMultiple.slice(0, 5).map((item, index) => (
                <div
                  key={item.event.tweet_id || index}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors min-w-0 max-w-full overflow-hidden"
                  onClick={() => onEventClick?.(item.event)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarImage src={item.event.profile_image_url_https} alt={item.event.name} />
                      <AvatarFallback className="text-xs">{item.event.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate max-w-[120px]">@{item.event.screen_name}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2 min-w-[60px]">
                    <div className={`text-sm font-bold ${
                      item.multiple >= 2 ? 'text-green-600' :
                      item.multiple >= 1.5 ? 'text-lime-600' :
                      item.multiple >= 1.1 ? 'text-yellow-600' :
                      item.multiple >= 1 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {item.multiple >= 1 ? `${item.multiple.toFixed(1)}x` : `-${((1 - item.multiple) * 100).toFixed(0)}%`}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {t('klineAnalysis.impactMultiple')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
