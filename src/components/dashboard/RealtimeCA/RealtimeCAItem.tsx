import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Badge } from '~src/components/ui/badge';
import { Button } from '~src/components/ui/button';
import { Card, CardContent } from '~src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '~src/components/ui/avatar';
import { useSettings } from '~src/contexts/SettingsContext';


import {
  formatTimestamp,
  formatNumber,
  truncateText,
  openTwitterProfile,
  openTwitterTweet,

} from './utils';
import { Storage } from '@plasmohq/storage';
import { getDexPlatformById, getDefaultDexSettings, type DexPlatformSettings } from '~src/types/dexPlatforms.types';
import type { CAEvent } from '~src/types/realtime-ca.types';

interface RealtimeCAItemProps {
  event: CAEvent;
  index: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onOpenAnalysis?: (tokenData: {
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    networkType: string;
  }) => void;
}

const RealtimeCAItemComponent = function RealtimeCAItem({
  event,
  index,
  onOpenAnalysis
}: RealtimeCAItemProps) {
  const { t } = useSettings();
  const [dexSettings, setDexSettings] = useState<DexPlatformSettings>(getDefaultDexSettings());

  const { user, tweet, ca_event, ca_stats, mentions, network } = event.data;

  // Load DEX settings
  useEffect(() => {
    const loadDexSettings = async () => {
      try {
        const storage = new Storage({ area: 'local' });
        const savedSettings = await storage.get('dex_platform_settings') as DexPlatformSettings | null;
        if (savedSettings) {
          setDexSettings(savedSettings);
        }
      } catch (error) {
        console.error('Failed to load DEX settings:', error);
      }
    };
    loadDexSettings();
  }, []);

  // Handle Chart button click - use user's DEX settings
  const handleChartClick = useCallback((tokenAddress: string, networkType: string, chain?: string) => {
    let dexPlatformId: string;

    // Get corresponding DEX platform ID based on network type
    if (networkType === 'solana') {
      dexPlatformId = dexSettings.solana;
    } else if (networkType === 'sui') {
      dexPlatformId = dexSettings.sui;
    } else {
      // EVM networks (ethereum, base, bsc, etc.)
      const evmPlatform = dexSettings.evm.platform;

      // Determine the specific chain to use
      let targetChain = 'eth'; // default to ethereum

      if (chain) {
        // Map chain names to platform suffixes
        const chainMap: Record<string, string> = {
          'ethereum': 'eth',
          'eth': 'eth',
          'base': 'base',
          'bsc': 'bsc',
          'binance': 'bsc',
          'bnb': 'bsc',
          'xlayer': 'xlayer', // XLayer has its own DEX platform
          'x-layer': 'xlayer',
          'xLayer': 'xlayer'
        };

        const normalizedChain = chain.toLowerCase();
        targetChain = chainMap[normalizedChain] || 'eth';
      }

      dexPlatformId = `${evmPlatform}_${targetChain}`;
    }

    // Get DEX platform configuration and generate URL
    const platform = getDexPlatformById(dexPlatformId);
    if (platform) {
      const url = platform.getUrl(tokenAddress);
      window.open(url, '_blank');
    } else {
      // If platform configuration not found, use default DexScreener
      const fallbackChain = chain?.toLowerCase() || networkType;
      const fallbackUrl = `https://dexscreener.com/${fallbackChain}/${tokenAddress}`;
      window.open(fallbackUrl, '_blank');
    }
  }, [dexSettings]);

  // Handle Tweet Analysis button click
  const handleTweetAnalysis = useCallback(async (tokenAddress: string, tokenSymbol: string, tokenName: string, networkType: string) => {
    try {
      console.log('🔍 开始推文分析:', { tokenAddress, tokenSymbol, tokenName, networkType });

      // 调用父组件的回调函数打开弹窗
      onOpenAnalysis?.({
        tokenAddress,
        tokenSymbol,
        tokenName,
        networkType
      });

    } catch (error) {
      console.error('❌ 推文分析失败:', error);
      const { toast } = await import('sonner');
      toast.error('推文分析失败', {
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  }, [onOpenAnalysis]);

  // Handle user avatar/name click - redirect to Twitter
  const handleUserClick = useCallback((screenName: string) => {
    openTwitterProfile(screenName);
  }, []);

  // Multi-token tab state
  const [activeTokenIndex, setActiveTokenIndex] = useState(0);



  return (
    <>
    <Card className={`ca-card transition-all duration-200 hover:shadow-md ${
      index === 0 ? 'border-primary/20 bg-primary/5' : ''
    }`}>
      <CardContent className="ca-card-content p-4">
        {/* User information row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <Avatar
              className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20"
              onClick={() => openTwitterProfile(user.screen_name)}
            >
              <AvatarImage
                src={user.profile_image_url_https}
                alt={user.name}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                🔌
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4
                  className="ca-username truncate cursor-pointer hover:text-primary"
                  onClick={() => openTwitterProfile(user.screen_name)}
                >
                  {user.name}
                </h4>
                <span className="ca-secondary-text text-xs">
                  @{user.screen_name}
                </span>

                {user.name_changes >= 0 && (
                  <Badge variant="outline" className="ca-badge text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:hover:bg-yellow-800 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    {t('realtimeCA.item.nameChanges')} {user.name_changes} {t('realtimeCA.item.times')}
                  </Badge>
                )}
                {user.screen_name_changes >= 0 && (
                  <Badge variant="outline" className="ca-badge text-xs bg-orange-50 text-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    {t('realtimeCA.item.usernameChanges')} {user.screen_name_changes} {t('realtimeCA.item.times')}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs ca-secondary-text">
                <span>{formatNumber(user.followers_count)} {t('realtimeCA.item.followers')}</span>
                <span>•</span>
                <span>{formatTimestamp(tweet.created_at)}</span>
                <span>•</span>
                <span>{network.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Poster CA History & 🔗 On-chain CA Events */}
        <div className="space-y-2 mb-3">
          {/* CA history statistics */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-medium text-muted-foreground">{t('realtimeCA.item.posterHistory')}</span>
            <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              {t('realtimeCA.item.today')} {ca_stats.today.count}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {t('realtimeCA.item.last7Days')} {ca_stats.last_7_days.count}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {t('realtimeCA.item.last30Days')} {ca_stats.last_30_days.count}
            </Badge>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              {t('realtimeCA.item.total')} {ca_stats.total.count}
            </Badge>

            {/* Deletion statistics */}
            {(ca_stats.today.deleted > 0 || ca_stats.last_7_days.deleted > 0 || ca_stats.last_30_days.deleted > 0) && (
              <>
                <span className="text-muted-foreground">|</span>
                <span className="font-medium text-muted-foreground text-red-600">{t('realtimeCA.item.deleted')}</span>
                {ca_stats.today.deleted > 0 && (
                  <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {t('realtimeCA.item.today')} {ca_stats.today.deleted}
                  </Badge>
                )}
                {ca_stats.last_7_days.deleted > 0 && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                    {t('realtimeCA.item.last7Days')} {ca_stats.last_7_days.deleted}
                  </Badge>
                )}
                {ca_stats.last_30_days.deleted > 0 && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                    {t('realtimeCA.item.last30Days')} {ca_stats.last_30_days.deleted}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
                  {t('realtimeCA.item.total')} {ca_stats.total.deleted}
                </Badge>
              </>
            )}
          </div>

          {/* On-chain CA events */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-medium text-muted-foreground">{t('realtimeCA.item.onchainCA')}</span>
            {(ca_event.pump.launch_count > 0 || ca_event.pump.migrate_count > 0) && (
              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-200">
                Pump {ca_event.pump.launch_count}{t('realtimeCA.item.launch')}/{ca_event.pump.migrate_count}{t('realtimeCA.item.migrate')}
              </Badge>
            )}
            {(ca_event.raydium.launch_count > 0 || ca_event.raydium.migrate_count > 0) && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
                Raydium {ca_event.raydium.launch_count}{t('realtimeCA.item.launch')}/{ca_event.raydium.migrate_count}{t('realtimeCA.item.migrate')}
              </Badge>
            )}
            {ca_event.pump.launch_count === 0 && ca_event.pump.migrate_count === 0 &&
             ca_event.raydium.launch_count === 0 && ca_event.raydium.migrate_count === 0 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {t('realtimeCA.item.noOnchainActivity')}
              </Badge>
            )}
          </div>
        </div>
        
        {/* 📝 Tweet content */}
        <div className="mb-3">
          <p
            className="text-readable text-sm leading-relaxed cursor-pointer hover:text-primary"
            onClick={() => openTwitterTweet(user.screen_name, tweet.tweet_id)}
          >
            {truncateText(tweet.content, 150)}
          </p>
        </div>

        {/* 📊 社交趋势分析区域 - 独立显眼区域 */}
        {mentions.length > 0 && (
          <div className="mb-4">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg border border-purple-200 dark:border-purple-800 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-lg">📊</span>
                    <span className="font-medium text-sm text-purple-800 dark:text-purple-200">
                      {t('realtimeCA.item.tweetAnalysis')}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    {t('realtimeCA.item.klineAnalysisLabel')}
                  </Badge>
                </div>
                <Button
                  onClick={() => {
                    const currentToken = mentions[activeTokenIndex];
                    // 使用 chain 字段而不是 network_type，因为 chain 包含多链信息
                    const networkType = currentToken.chain || currentToken.network_type || 'solana';
                    handleTweetAnalysis(
                      currentToken.address,
                      currentToken.symbol,
                      currentToken.name,
                      networkType
                    );
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  size="sm"
                >
                  <span className="mr-1">🚀</span>
                  {t('realtimeCA.item.tweetAnalysisButton')}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 🪙 Token information area - supports multi-token tabs */}
        {mentions.length > 0 && (
          <div className="mb-3">
            <div className="bg-muted/30 rounded-lg p-3 border border-primary/20">
              {/* Multi-token tabs */}
              {mentions.length > 1 && (
                <div className="flex items-center gap-1 mb-3 overflow-x-auto">
                  {mentions.map((token, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTokenIndex(index)}
                      className={`px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                        activeTokenIndex === index
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {token.symbol}
                    </button>
                  ))}
                </div>
              )}

              {/* Currently selected token information */}
              {(() => {
                const currentToken = mentions[activeTokenIndex];
                if (!currentToken){
                  return null;
                }
                return (
                  <>
                    {/* Token basic information */}
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={currentToken.image}
                          alt={currentToken.symbol}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          🔌
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">{currentToken.symbol}</span>
                          <span className="text-xs text-muted-foreground">-</span>
                          <span className="text-sm font-medium text-foreground">{currentToken.name}</span>

                          {/* First launch detection - if no first and last mention users, it's a first launch */}
                          {!currentToken.mention_stats.first_mention_user && !currentToken.mention_stats.last_mention_user && (
                            <Badge className="bg-red-500 text-white dark:bg-red-600 text-xs font-bold animate-pulse">
                              🚀 {t('realtimeCA.item.firstLaunch')}
                            </Badge>
                          )}

                          <Badge
                            className={`text-xs ${
                              currentToken.network_type === 'solana'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {currentToken.network_type.toUpperCase()}
                          </Badge>
                        </div>
                        {currentToken.description && (
                          <div className="text-xs text-muted-foreground mb-1 line-clamp-1">
                            {currentToken.description}
                          </div>
                        )}
                        <Badge
                          variant="secondary"
                          className="bg-blue-500 text-white dark:bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500 cursor-pointer transition-all duration-200 text-xs font-mono hover:shadow-md hover:-translate-y-0.5"
                          onClick={async (clickEvent) => {
                            try {
                              await navigator.clipboard.writeText(currentToken.address)

                              // Use toast notification
                              const { toast } = await import('sonner')
                              toast.success(t('common.copied'))

                              // Visual feedback - scale effect
                              const badge = clickEvent?.currentTarget as HTMLElement
                              if (badge) {
                                badge.style.transform = 'scale(0.95)'
                                setTimeout(() => {
                                  badge.style.transform = 'scale(1)'
                                }, 150)
                              }
                            } catch (error) {
                              console.error('Copy address failed:', error)
                              const { toast } = await import('sonner')
                              toast.error(t('common.copyFailed'))
                            }
                          }}
                          title={t('realtimeCA.item.copyTokenAddress')}
                        >
                          {currentToken.address}
                        </Badge>
                      </div>
                    </div>

                    {/* 📊 Pre-post heat statistics */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-medium text-muted-foreground">{t('realtimeCA.item.beforePostHeat')}</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                          {formatNumber(currentToken.mention_stats.total_mentions)} {t('realtimeCA.item.totalMentions')}
                        </Badge>
                        <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 hover:bg-cyan-200 dark:hover:bg-cyan-800 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                          {formatNumber(currentToken.mention_stats.unique_users)} {t('realtimeCA.item.users')}
                        </Badge>
                        <span className="text-muted-foreground">|</span>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                          {t('realtimeCA.item.minutes5')} {currentToken.mention_stats.minute_stats.last_5_min}
                        </Badge>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                          {t('realtimeCA.item.minutes20')} {currentToken.mention_stats.minute_stats.last_20_min}
                        </Badge>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                          {t('realtimeCA.item.minutes30')} {currentToken.mention_stats.minute_stats.last_30_min}
                        </Badge>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                          {t('realtimeCA.item.hour1')} {currentToken.mention_stats.minute_stats.last_1_hour}
                        </Badge>
                      </div>
                    </div>

                    {/* 🔗 Token links */}
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      {currentToken.twitter && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-200 cursor-pointer dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-800 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                          onClick={() => window.open(currentToken.twitter, '_blank')}
                        >
                          🐦 Twitter
                        </Badge>
                      )}
                      {currentToken.website && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 hover:bg-green-200 cursor-pointer dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-800 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                          onClick={() => window.open(currentToken.website, '_blank')}
                        >
                          🌐 Website
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-xs bg-orange-50 text-orange-700 hover:bg-orange-200 cursor-pointer dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-800 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                        onClick={() => handleChartClick(currentToken.address, currentToken.network_type, currentToken.chain)}
                      >
                        {t('realtimeCA.item.chart')}
                      </Badge>
                    </div>

                    {/* 👥 Mentioned users - compact display */}
                    <div className="space-y-1">
                      {/* First mention user */}
                      {currentToken.mention_stats.first_mention_user && (
                        <div className="flex items-center gap-2 text-xs">
                          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                            {t('realtimeCA.item.firstMention')}
                          </Badge>
                          <Avatar
                            className="h-4 w-4 cursor-pointer hover:ring-2 hover:ring-primary/50"
                            onClick={() => handleUserClick(currentToken.mention_stats.first_mention_user.screen_name)}
                          >
                            <AvatarImage
                              src={currentToken.mention_stats.first_mention_user.profile_image_url_https}
                              alt={currentToken.mention_stats.first_mention_user.name}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              🔌
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className="font-medium text-foreground cursor-pointer hover:text-primary truncate"
                            onClick={() => handleUserClick(currentToken.mention_stats.first_mention_user.screen_name)}
                          >
                            {currentToken.mention_stats.first_mention_user.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatNumber(currentToken.mention_stats.first_mention_user.followers_count)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(currentToken.mention_stats.first_mention_user.mention_time)}
                          </span>
                          {/* ✨ 新增：显示最早提及时间 */}
                          {currentToken.mention_stats.first_mention_user.tweet_time && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                最早: {formatTimestamp(currentToken.mention_stats.first_mention_user.tweet_time)}
                              </Badge>
                            </>
                          )}
                        </div>
                      )}

                      {/* Latest mention user */}
                      {currentToken.mention_stats.last_mention_user && (
                        <div className="flex items-center gap-2 text-xs">
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                            {t('realtimeCA.item.latestMention')}
                          </Badge>
                          <Avatar
                            className="h-4 w-4 cursor-pointer hover:ring-2 hover:ring-primary/50"
                            onClick={() => handleUserClick(currentToken.mention_stats.last_mention_user.screen_name)}
                          >
                            <AvatarImage
                              src={currentToken.mention_stats.last_mention_user.profile_image_url_https}
                              alt={currentToken.mention_stats.last_mention_user.name}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              🔌
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className="font-medium text-foreground cursor-pointer hover:text-primary truncate"
                            onClick={() => handleUserClick(currentToken.mention_stats.last_mention_user.screen_name)}
                          >
                            {currentToken.mention_stats.last_mention_user.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatNumber(currentToken.mention_stats.last_mention_user.followers_count)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(currentToken.mention_stats.last_mention_user.mention_time)}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>


  </>
  );
};

// 自定义比较函数，在用户交互时阻止不必要的重新渲染
const arePropsEqual = (prevProps: RealtimeCAItemProps, nextProps: RealtimeCAItemProps) => {
  // 如果索引变化很大，说明列表发生了重大变化，需要重新渲染
  if (Math.abs(prevProps.index - nextProps.index) > 2) {
    return false;
  }

  // 比较关键数据是否变化
  const prevData = prevProps.event.data;
  const nextData = nextProps.event.data;

  // 用户信息、推文内容、代币信息是否变化
  const userChanged = prevData.user.rest_id !== nextData.user.rest_id;
  const tweetChanged = prevData.tweet.tweet_id !== nextData.tweet.tweet_id;
  const mentionsChanged = JSON.stringify(prevData.mentions) !== JSON.stringify(nextData.mentions);

  // 如果关键数据没有变化，则不重新渲染
  return !userChanged && !tweetChanged && !mentionsChanged;
};

export const RealtimeCAItem = React.memo(RealtimeCAItemComponent, arePropsEqual);
