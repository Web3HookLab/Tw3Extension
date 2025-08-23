/**
 * Token Card Component
 */

import React, { useState, useEffect } from 'react'
import { Copy, TrendingUp, TrendingDown, Users, MessageCircle, Clock, ExternalLink, Search, BarChart3 } from 'lucide-react'
import { Card, CardContent } from '~src/components/ui/card'
import { Badge } from '~src/components/ui/badge'
import { Button } from '~src/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~src/components/ui/tooltip'
import type { TokenCardProps } from '~src/types/leaderboard.types'
import type { DexPlatformSettings } from '~src/types/dexPlatforms.types'
import { getDefaultDexSettings } from '~src/types/dexPlatforms.types'
import { Storage } from '@plasmohq/storage'
import { useLanguageManager } from '~src/hooks/useLanguageManager'
import {
  getTwitterUserUrl,
  getTwitterSearchUrl,
  getDexUrlWithSettings,
  getExplorerUrl,
  getNetworkDisplayName,
  getNetworkColor,
  getChainDisplayInfo,
  getRankingStyle
} from '../utils/links'

const storage = new Storage({ area: 'local' })

export const TokenCard: React.FC<TokenCardProps> = ({ token, index, networkType: propNetworkType }) => {
  const [copied, setCopied] = useState(false)
  const [dexSettings, setDexSettings] = useState<DexPlatformSettings>(getDefaultDexSettings())
  const { t } = useLanguageManager()

  // Copy address to clipboard
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(token.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  // Format address display
  const formatAddress = (address: string) => {
    if (address.length <= 12) {
      return address
    }
    return `${address.slice(0, 6)}...${address.slice(-6)}`
  }

  // Format number display
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Format change rate
  const formatChangeRate = (rate: number) => {
    const percentage = (rate * 100).toFixed(2)
    return rate >= 0 ? `+${percentage}%` : `${percentage}%`
  }

  // Get change rate color
  const getChangeRateColor = (rate: number) => {
    if (rate > 0) {
      return 'text-green-600 dark:text-green-400'
    }
    if (rate < 0) {
      return 'text-red-600 dark:text-red-400'
    }
    return 'text-muted-foreground'
  }

  // Get change rate icon
  const getChangeRateIcon = (rate: number) => {
    if (rate > 0) return <TrendingUp className="w-3 h-3" />
    if (rate < 0) return <TrendingDown className="w-3 h-3" />
    return null
  }

  // Use passed network type (from filters), this is the correct network type
  const networkType: 'solana' | 'ethereum' = propNetworkType || 'solana'
  const rankingStyle = getRankingStyle(token.rank)

  // Get chain info (only display for Ethereum network)
  const chainInfo = networkType === 'ethereum' ? getChainDisplayInfo(token.chain) : null

  // Analyze average mentions per user metric
  const getMentionsPerUserAnalysis = (value: number) => {
    if (value <= 1.2) {
      return {
        level: 'healthy',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        label: t('caLeaderboard.healthyHeat'),
        description: t('caLeaderboard.healthyHeatDesc'),
        icon: '🟢'
      }
    } else if (value <= 2.5) {
      return {
        level: 'moderate',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        label: t('caLeaderboard.moderateHeat'),
        description: t('caLeaderboard.moderateHeatDesc'),
        icon: '🟡'
      }
    } else {
      return {
        level: 'suspicious',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        label: t('caLeaderboard.suspiciousHeat'),
        description: t('caLeaderboard.suspiciousHeatDesc'),
        icon: '🔴'
      }
    }
  }

  const mentionsAnalysis = getMentionsPerUserAnalysis(token.mentions_per_user)

  // Load DEX settings
  useEffect(() => {
    const loadDexSettings = async () => {
      try {
        const savedSettings = await storage.get('dex_platform_settings') as DexPlatformSettings | null
        if (savedSettings) {
          setDexSettings(savedSettings)
        }
      } catch (error) {
        console.error('Failed to load DEX settings:', error)
      }
    }
    loadDexSettings()
  }, [])

  // Format time
  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } catch {
      return '--:--'
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-3">
          {/* Ranking and token info */}
          <div className="flex items-start space-x-3 flex-1">
            <Badge
              variant={rankingStyle.variant}
              className={`min-w-[2rem] justify-center ${rankingStyle.className}`}
            >
              #{token.rank}
            </Badge>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {token.image && (
                  <img
                    src={token.image}
                    alt={token.name || token.symbol}
                    className="w-6 h-6 rounded-full"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <h3 className="font-semibold text-lg truncate">
                  {token.name || token.symbol || 'Unknown'}
                </h3>
                {token.symbol && (
                  <Badge variant="outline" className="text-xs">
                    ${token.symbol}
                  </Badge>
                )}
                {/* Network type display */}
                <Badge className={`text-xs ${getNetworkColor(networkType)}`}>
                  {getNetworkDisplayName(networkType)}
                </Badge>

                {/* Chain badge display (only for Ethereum network with chain field) */}
                {chainInfo && (
                  <Badge className={`text-xs ${chainInfo.color}`}>
                    {chainInfo.name}
                  </Badge>
                )}
              </div>

              {/* Token address */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                <span className="font-mono text-xs">{formatAddress(token.address)}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={copyAddress}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? t('caLeaderboard.addressCopied') : t('caLeaderboard.copyAddress')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Description */}
              {token.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                  {token.description}
                </p>
              )}

              {/* Action buttons */}
              <div className="flex items-center space-x-1 mt-2">
                {/* DEX trading button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          const dexUrl = getDexUrlWithSettings(token.address, networkType, dexSettings, token.chain)
                          if (dexUrl) {
                            window.open(dexUrl, '_blank')
                          }
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        DEX
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('caLeaderboard.dex')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Tweet search button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          const searchUrl = getTwitterSearchUrl(token.symbol, token.address)
                          window.open(searchUrl, '_blank')
                        }}
                      >
                        <Search className="w-3 h-3 mr-1" />
                        {t('caLeaderboard.tweets')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('caLeaderboard.tweets')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Blockchain explorer button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => {
                          const explorerUrl = getExplorerUrl(token.address, networkType, token.chain)
                          if (explorerUrl) {
                            window.open(explorerUrl, '_blank')
                          }
                        }}
                      >
                        <BarChart3 className="w-3 h-3 mr-1" />
                        {t('caLeaderboard.explorer')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('caLeaderboard.explorer')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Change rate */}
          <div className={`flex items-center space-x-1 ${getChangeRateColor(token.change_rate)} ml-2`}>
            {getChangeRateIcon(token.change_rate)}
            <span className="font-semibold text-sm">
              {formatChangeRate(token.change_rate)}
            </span>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="flex items-center space-x-1">
            <MessageCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">{t('caLeaderboard.totalMentions')}</p>
              <p className="font-semibold text-xs">{formatNumber(token.total_mentions)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">{t('caLeaderboard.activeUsers')}</p>
              <p className="font-semibold text-xs">{formatNumber(token.unique_users)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-purple-500 flex-shrink-0" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`cursor-help p-1 rounded border ${mentionsAnalysis.bgColor} ${mentionsAnalysis.borderColor}`}>
                    <div className="flex items-center space-x-1">
                      <span className="text-[8px]">{mentionsAnalysis.icon}</span>
                      <p className="text-[10px] text-muted-foreground">{t('caLeaderboard.avgMentionsPerUser')}</p>
                    </div>
                    <p className={`font-semibold text-xs ${mentionsAnalysis.color}`}>
                      {token.mentions_per_user.toFixed(1)}
                    </p>
                    <p className={`text-[8px] ${mentionsAnalysis.color} font-medium`}>
                      {mentionsAnalysis.label}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-medium">{mentionsAnalysis.label}</p>
                    <p className="text-sm">{mentionsAnalysis.description}</p>
                    <div className="text-xs text-muted-foreground">
                      <p>• {t('caLeaderboard.lowValue')}: {t('caLeaderboard.healthyHeat')}，{t('caLeaderboard.genuineDiscussion')}</p>
                      <p>• {t('caLeaderboard.mediumValue')}: {t('caLeaderboard.moderateHeat')}，{t('caLeaderboard.needsAttention')}</p>
                      <p>• {t('caLeaderboard.highValue')}: {t('caLeaderboard.suspiciousHeat')}，{t('caLeaderboard.possibleBotActivity')}</p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Minute statistics */}
        <div className="mb-2">
          <div className="flex items-center space-x-1 mb-1">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{t('caLeaderboard.minuteStats')}</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <div className="text-center">
              <p className="text-muted-foreground">5{t('common.minute')}</p>
              <p className="font-medium">{token.minute_stats.last_5_min}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">20{t('common.minute')}</p>
              <p className="font-medium">{token.minute_stats.last_20_min}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">30{t('common.minute')}</p>
              <p className="font-medium">{token.minute_stats.last_30_min}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">1{t('common.hour')}</p>
              <p className="font-medium">{token.minute_stats.last_1_hour}</p>
            </div>
          </div>
        </div>

        {/* User information */}
        <div className="mb-2 p-2 bg-muted/20 rounded-md">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground mb-1 text-[10px]">{t('caLeaderboard.firstMentioned')}</p>
              <button
                className="flex items-center space-x-1 hover:bg-muted/50 rounded p-1 transition-colors w-full text-left"
                onClick={() => window.open(getTwitterUserUrl(token.first_mention_user.screen_name), '_blank')}
              >
                <img
                  src={token.first_mention_user.profile_image_url_https}
                  alt={token.first_mention_user.name}
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <span className="font-medium truncate text-[10px]">@{token.first_mention_user.screen_name}</span>
              </button>
              <p className="text-muted-foreground text-[9px] ml-4">{formatNumber(token.first_mention_user.followers_count)} {t('userInfo.followers')}</p>
            </div>

            <div>
              <p className="text-muted-foreground mb-1 text-[10px]">{t('caLeaderboard.lastMentioned')}</p>
              <button
                className="flex items-center space-x-1 hover:bg-muted/50 rounded p-1 transition-colors w-full text-left"
                onClick={() => window.open(getTwitterUserUrl(token.last_mention_user.screen_name), '_blank')}
              >
                <img
                  src={token.last_mention_user.profile_image_url_https}
                  alt={token.last_mention_user.name}
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <span className="font-medium truncate text-[10px]">@{token.last_mention_user.screen_name}</span>
              </button>
              <p className="text-muted-foreground text-[9px] ml-4">{formatNumber(token.last_mention_user.followers_count)} {t('userInfo.followers')}</p>
            </div>
          </div>
        </div>

        {/* Time information */}
        <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 border-t">
          <span>{t('caLeaderboard.firstMentioned')}: {formatTime(token.first_mentioned)}</span>
          <span>{t('caLeaderboard.lastMentioned')}: {formatTime(token.last_mentioned)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
