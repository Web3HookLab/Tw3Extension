/**
 * K线图组件
 * 基于 token-kline-viewer 的 KlineChart 组件简化版
 */

import React, { useState, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceDot, ResponsiveContainer } from 'recharts'
import { Avatar, AvatarFallback, AvatarImage } from '~src/components/ui/avatar'
import type { KlineChartProps, TweetEvent, KlineDataWithType } from './types'

// 价格格式化函数
const formatPrice = (price: number): string => {
  if (isNaN(price) || price === 0) return '0.0000'
  
  if (price >= 1) {
    return price.toFixed(4)
  } else if (price >= 0.001) {
    return price.toFixed(6)
  } else if (price >= 0.00001) {
    return price.toFixed(10)
  } else {
    return price.toFixed(15)
  }
}

// 时间格式化函数
const formatXAxisTick = (timestamp: string | number): string => {
  const date = new Date(Number(timestamp) * 1000)
  if (isNaN(date.getTime())) return ''
  
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 头像标记组件
const AvatarMarker = ({ cx, cy, ev }: { cx: number; cy: number; ev: TweetEvent }) => {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={14}
        fill="white"
        stroke="#e5e7eb"
        strokeWidth={2}
      />
      <foreignObject
        x={cx - 12}
        y={cy - 12}
        width={24}
        height={24}
      >
        <Avatar className="h-6 w-6">
          <AvatarImage
            src={ev.profile_image_url_https}
            alt={ev.name}
          />
          <AvatarFallback className="text-xs">
            {ev.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </foreignObject>
    </g>
  )
}

// 自定义工具提示组件
const CustomTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload
  
  return (
    <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
      <div className="text-sm font-medium mb-2">
        {formatXAxisTick(label)}
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">开盘:</span>
          <span className="font-mono">${formatPrice(data.open)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">最高:</span>
          <span className="font-mono">${formatPrice(data.high)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">最低:</span>
          <span className="font-mono">${formatPrice(data.low)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">收盘:</span>
          <span className="font-mono">${formatPrice(data.close)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">成交量:</span>
          <span className="font-mono">{data.volume?.toLocaleString() || '0'}</span>
        </div>
      </div>
    </div>
  )
}

export const KlineChart: React.FC<KlineChartProps> = ({
  data,
  priceType,
  tweetEvents = [],
  onEventClick,
  className = ''
}) => {
  const [selectedEvent, setSelectedEvent] = useState<TweetEvent | null>(null)

  // 处理数据排序和格式化
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => Number(a.time) - Number(b.time))
    
    return sorted.map((d) => ({
      time: d.time,
      price: d[priceType],
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }))
  }, [data, priceType])

  // 计算推文影响倍数并筛选前10个
  const topEventPoints = useMemo(() => {
    if (!tweetEvents.length || !chartData.length) return []



    // 1. 计算每个推文的影响倍数
    const eventAnalysis: Array<{
      ev: TweetEvent
      basePrice: number
      maxPrice: number
      multiple: number
      x: string | number
      y: number
    }> = []

    for (const ev of tweetEvents) {
      const eventTime = typeof ev.tweet_time === 'string'
        ? parseInt(ev.tweet_time)
        : ev.tweet_time

      // 找到事件时间对应的K线数据
      const sortedData = [...chartData].sort((a, b) => Number(a.time) - Number(b.time))
      let baseIndex = sortedData.findIndex((d) => Number(d.time) >= eventTime)
      if (baseIndex === -1) baseIndex = sortedData.length - 1

      const baseData = sortedData[baseIndex]
      if (!baseData) continue

      // 使用当前选择的价格类型
      const basePrice = Number(baseData[priceType])
      if (!isFinite(basePrice) || basePrice <= 0) continue

      // 查找事件后24小时内的最高价
      const endTime = eventTime + 24 * 3600
      const futureData = sortedData.slice(baseIndex).filter(d => Number(d.time) <= endTime)

      if (futureData.length === 0) continue

      const maxPrice = Math.max(...futureData.map(d => Number(d[priceType])))
      const multiple = maxPrice / basePrice

      eventAnalysis.push({
        ev,
        basePrice,
        maxPrice,
        multiple,
        x: baseData.time,
        y: basePrice
      })
    }

    // 2. 按影响倍数排序，取前10个
    const topEvents = eventAnalysis
      .sort((a, b) => b.multiple - a.multiple)
      .slice(0, 10)



    return topEvents
  }, [tweetEvents, chartData, priceType])

  const priceLabels = {
    high: "最高价",
    close: "收盘价",
    low: "最低价"
  }

  return (
    <div className={`relative ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            left: 80,
            right: 20,
            top: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatXAxisTick}
          />
          <YAxis
            domain={[(dataMin: number) => Math.max(0, dataMin * 0.95), (dataMax: number) => dataMax * 1.05]}
            tickLine={false}
            axisLine={false}
            tickMargin={20}
            width={60}
            tickFormatter={(value) => formatPrice(parseFloat(value))}
          />
          
          {/* 推文事件标记 - 只显示影响最大的前10个 */}
          {topEventPoints.map((pt, index) => (
            <ReferenceDot
              key={pt.ev.tweet_id || index}
              x={pt.x}
              y={pt.y}
              isFront
              r={12}
              stroke="none"
              shape={(props: any) => <AvatarMarker {...props} ev={pt.ev} />}
              onClick={() => {
                setSelectedEvent(pt.ev)
                onEventClick?.(pt.ev)
              }}
            />
          ))}

          <Area
            dataKey="price"
            type="natural"
            fill="hsl(var(--primary))"
            fillOpacity={0.4}
            stroke="hsl(var(--primary))"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
