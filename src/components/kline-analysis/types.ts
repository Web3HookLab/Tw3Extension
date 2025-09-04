/**
 * K线分析相关类型定义
 * 基于 token-kline-viewer 的类型定义
 */

// 推文事件类型
export interface TweetEvent {
  tweet_id: string
  name: string
  screen_name: string
  followers_count: number
  profile_image_url_https: string
  tweet_time: string | number
  status: string
  description_zh?: string
  description_en?: string
}

// K线数据类型
export interface KlineData {
  time: string | number
  open: number
  high: number
  low: number
  close: number
  volume: number
  price?: number
}

// 带类型的K线数据
export interface KlineDataWithType extends KlineData {
  source?: 'GeckoTerminal' | 'Pump.fun' | 'Raydium'
}

// 价格类型
export type PriceType = 'high' | 'close' | 'low'

// K线图组件属性
export interface KlineChartProps {
  data: KlineDataWithType[]
  priceType: PriceType
  tweetEvents?: TweetEvent[]
  onEventClick?: (event: TweetEvent) => void
  expandAll?: boolean
  onExpandAllChange?: (expanded: boolean) => void
  className?: string
}

// 时间线卡片组件属性
export interface TimelineCardProps {
  klineData: KlineDataWithType[]
  tweetEvents: TweetEvent[]
  className?: string
}

// 推文分析结果
export interface TweetAnalysisResult {
  event: TweetEvent
  basePrice: number | null
  maxPrice: number | null
  multiple: number | null
  error?: string
}

// 推文分析模态框属性
export interface TweetAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  tokenAddress: string
  tokenSymbol?: string
  tokenName?: string
  networkType: string
}

// GeckoTerminal API 响应类型
export interface GeckoTerminalPoolResponse {
  data: Array<{
    id: string
    type: string
    attributes: {
      name: string
      address: string
    }
  }>
}

// Pump.fun API 响应类型
export interface PumpFunCoinResponse {
  created_timestamp: number
  name: string
  symbol: string
  description: string
  image_uri: string
}

export interface PumpFunCandleData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Raydium API 响应类型
export interface RaydiumMintResponse {
  success: boolean
  data: Array<{
    id: string
    mint: string
  }>
}

export interface RaydiumKlineResponse {
  success: boolean
  data: Array<{
    time: number
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
}
