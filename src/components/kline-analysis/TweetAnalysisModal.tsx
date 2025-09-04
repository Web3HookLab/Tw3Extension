/**
 * 推文分析模态框组件
 * 展示K线图和推文事件分析结果
 */

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '~src/components/ui/dialog'
import { Button } from '~src/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~src/components/ui/card'
import { Badge } from '~src/components/ui/badge'
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react'

import { LightweightKlineChart } from './LightweightKlineChart'
import { TimelineCard } from './TimelineCard'
import { AddressTweetsService } from '~src/services/addressTweets.service'
import { transformAddressTweetsToEvents, fetchKlineData, parseChainString, sortChainsByPriority, getChainDisplayInfo, detectNetworkFromAddress } from './dataTransform'
import { ChainSelector, type ChainInfo, type ChainStatus } from './ChainSelector'
import { toast } from 'sonner'
import type { TweetAnalysisModalProps, TweetEvent, KlineDataWithType, PriceType } from './types'
import { useSettings } from '~src/contexts/SettingsContext'

export const TweetAnalysisModal: React.FC<TweetAnalysisModalProps> = ({
  isOpen,
  onClose,
  tokenAddress,
  tokenSymbol,
  tokenName,
  networkType
}) => {
  const { t } = useSettings()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tweetEvents, setTweetEvents] = useState<TweetEvent[]>([])
  const [klineData, setKlineData] = useState<KlineDataWithType[]>([])
  const [dataSource, setDataSource] = useState<string>('')

  const [selectedEvent, setSelectedEvent] = useState<TweetEvent | null>(null)

  // 多链状态管理
  const [supportedChains, setSupportedChains] = useState<string[]>([])
  const [currentChain, setCurrentChain] = useState<string>('')
  const [chainInfos, setChainInfos] = useState<Record<string, ChainInfo>>({})
  const [chainDataCache, setChainDataCache] = useState<Record<string, {
    data: KlineDataWithType[];
    source: string;
    timestamp: number;
  }>>({})
  const [isChainSwitching, setIsChainSwitching] = useState(false)

  const [stats, setStats] = useState<{
    totalTweets: number
    activeTweets: number
    deletedTweets: number
    topUsers: Array<{
      rest_id: string
      name: string
      screen_name: string
      followers_count: number
      profile_image_url_https: string
      tweet_count: number
      description_zh: string
      description_en: string
    }>
    mostActiveDate: string
    mostActiveDateCount: number
    firstMentionUser: {
      rest_id: string
      name: string
      screen_name: string
      followers_count: number
      profile_image_url_https: string
      description_zh: string
      description_en: string
      tweet_time: string  // ✨ 新增的最早提及时间
    } | null
  } | null>(null)

  // 初始化链信息
  const initializeChainInfos = (chains: string[]) => {
    const infos: Record<string, ChainInfo> = {};
    chains.forEach(chain => {
      infos[chain] = {
        networkId: chain,
        status: 'idle'
      };
    });
    setChainInfos(infos);
  };

  // 更新链状态
  const updateChainStatus = (networkId: string, status: ChainStatus, dataPoints?: number, error?: string) => {
    setChainInfos(prev => ({
      ...prev,
      [networkId]: {
        ...prev[networkId],
        status,
        dataPoints,
        error
      }
    }));
  };

  // 获取指定链的 K 线数据
  const fetchChainKlineData = async (networkId: string, address?: string): Promise<{
    data: KlineDataWithType[];
    source: string;
  } | null> => {
    const targetAddress = address || tokenAddress;
    if (!targetAddress) return null;

    // 检查缓存（5分钟内有效）
    const cached = chainDataCache[networkId];
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      console.log(`📦 Using cached data for ${networkId}`);
      return {
        data: cached.data,
        source: cached.source
      };
    }

    try {
      updateChainStatus(networkId, 'loading');

      const result = await fetchKlineData(targetAddress, [networkId]);

      if (result && result.data.length > 0) {
        // 缓存数据
        setChainDataCache(prev => ({
          ...prev,
          [networkId]: {
            data: result.data,
            source: result.source,
            timestamp: Date.now()
          }
        }));

        updateChainStatus(networkId, 'success', result.data.length);
        return result;
      } else {
        updateChainStatus(networkId, 'error', 0, t('klineAnalysis.chainSelector.noDataOnChain'));
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateChainStatus(networkId, 'error', 0, errorMessage);
      return null;
    }
  };

  // 切换链
  const handleChainChange = async (networkId: string) => {
    if (isChainSwitching || networkId === currentChain) return;

    setIsChainSwitching(true);
    const chainInfo = getChainDisplayInfo(networkId);
    console.log(`🔄 Switching to chain: ${networkId}`);

    try {
      // 智能地址标准化（只对ETH地址转小写）
      const detectedNetwork = detectNetworkFromAddress(tokenAddress);
      const normalizedAddress = detectedNetwork === 'ethereum' ? tokenAddress.toLowerCase() : tokenAddress;
      const result = await fetchChainKlineData(networkId, normalizedAddress);

      if (result) {
        setCurrentChain(networkId);
        setKlineData(result.data);
        setDataSource(result.source);

        console.log(`✅ Switched to ${chainInfo.icon} ${chainInfo.name}: ${result.data.length} data points`);

        // 成功提示
        toast.success(
          `${t('klineAnalysis.chainSelector.switchingChain')} ${chainInfo.icon} ${chainInfo.name}`,
          {
            description: `${result.data.length} ${t('klineAnalysis.chainSelector.dataPoints')}`
          }
        );
      } else {
        console.log(`❌ Failed to switch to ${networkId}: no data available`);

        // 失败提示
        toast.error(
          `${t('klineAnalysis.chainSelector.switchChainError')}`,
          {
            description: `${chainInfo.icon} ${chainInfo.name} - ${t('klineAnalysis.chainSelector.noDataOnChain')}`
          }
        );
      }
    } catch (error) {
      console.error(`❌ Error switching to ${networkId}:`, error);

      // 错误提示
      toast.error(
        `${t('klineAnalysis.chainSelector.switchChainError')}`,
        {
          description: `${chainInfo.icon} ${chainInfo.name} - ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      );
    } finally {
      setIsChainSwitching(false);
    }
  };

  // 获取推文分析数据
  const fetchAnalysisData = async () => {
    if (!tokenAddress) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. 智能地址标准化（只对ETH地址转小写，保持Solana地址不变）
      console.log(`🔍 Original tokenAddress: "${tokenAddress}" (length: ${tokenAddress.length})`);
      const detectedNetwork = detectNetworkFromAddress(tokenAddress);
      console.log(`🔍 Detected network: ${detectedNetwork}`);

      const normalizedAddress = detectedNetwork === 'ethereum' ? tokenAddress.toLowerCase() : tokenAddress;
      console.log(`🔍 Starting analysis for token: ${tokenSymbol} (${normalizedAddress})`);
      console.log(`📍 Address format: ${detectedNetwork}, normalized: ${normalizedAddress !== tokenAddress ? 'YES' : 'NO'}`);

      // 2. 检查权限
      const hasPermission = await AddressTweetsService.checkPermission()
      if (!hasPermission) {
        throw new Error(t('klineAnalysis.permissionError'))
      }

      // 3. 确定网络类型并准备API参数
      // 优先使用地址格式检测，而不是依赖可能不准确的networkType参数
      const addressBasedNetwork = detectedNetwork;
      const isEthereumAddress = addressBasedNetwork === 'ethereum';
      const isSolanaAddress = addressBasedNetwork === 'solana';

      console.log(`🔍 Network determination:`, {
        networkType,
        detectedNetwork,
        isEthereumAddress,
        isSolanaAddress
      });

      // 准备API参数（基于地址格式，使用标准化地址）
      const apiParams = isEthereumAddress
        ? { eth_address: normalizedAddress }
        : { solana_address: normalizedAddress }

      // 3. 获取推文数据
      const tweetsResponse = await AddressTweetsService.getAddressTweets(apiParams);

      // 4. 从推文响应中提取链信息
      const chainString = tweetsResponse.data?.token?.chain;
      let chains: string[] = [];

      console.log(`🔗 Raw chain data:`, {
        chainString,
        chainType: typeof chainString,
        networkType,
        tokenAddress
      });

      if (chainString && typeof chainString === 'string' && chainString.trim()) {
        chains = parseChainString(chainString);
        console.log(`🔗 Token supports chains: "${chainString}" -> [${chains.join(', ')}]`);

        // 检查地址格式与chain字段是否匹配
        const detectedNetwork = detectNetworkFromAddress(tokenAddress);
        const isEthAddress = detectedNetwork === 'ethereum';
        const chainIndicatesSolana = chainString.toLowerCase().includes('solana');

        if (isEthAddress && chainIndicatesSolana) {
          console.log(`⚠️ Address format mismatch: ETH address (${tokenAddress}) but chain indicates Solana`);
          console.log(`🔄 Falling back to networkType: ${networkType}`);

          if (networkType && networkType !== 'solana') {
            chains = parseChainString(networkType);
            console.log(`📝 Using networkType chains: [${chains.join(', ')}]`);
          } else {
            // 如果没有有效的networkType，使用检测到的网络
            chains = [detectedNetwork];
            console.log(`📝 Using detected network: ${detectedNetwork}`);
          }
        }
      } else {
        // 如果没有链信息，根据地址格式和网络类型判断
        console.log(`⚠️ No chain info from API, detecting from address and networkType`);

        const detectedNetwork = detectNetworkFromAddress(tokenAddress);
        console.log(`🔍 Detected network from address: ${detectedNetwork}`);

        if (networkType && networkType !== detectedNetwork) {
          // 如果networkType包含多链信息，优先使用它
          chains = parseChainString(networkType);
          console.log(`📝 Using provided networkType: ${networkType} -> [${chains.join(', ')}]`);
        } else if (detectedNetwork) {
          chains = [detectedNetwork];
          console.log(`📝 Using detected network: ${detectedNetwork}`);
        }
      }

      console.log(`🎯 Final chains array: [${chains.join(', ')}]`);

      // 5. 处理K线数据获取
      if (chains.length > 0) {
        const sortedChains = sortChainsByPriority(chains);
        console.log(`🔗 Processing chains: [${sortedChains.join(', ')}]`);

        // 始终设置支持的链（即使只有一个链，也可能需要显示网络信息）
        console.log(`📝 Setting supportedChains state:`, sortedChains);
        setSupportedChains(sortedChains);
        initializeChainInfos(sortedChains);

        console.log(`🎯 Chain selector will ${sortedChains.length > 1 || (sortedChains.length === 1 && sortedChains[0] !== 'solana') ? 'SHOW' : 'HIDE'}`);
        console.log(`📊 Display conditions:`, {
          chainsLength: sortedChains.length,
          isMultiChain: sortedChains.length > 1,
          isSingleNonSolana: sortedChains.length === 1 && sortedChains[0] !== 'solana',
          firstChain: sortedChains[0]
        });

        // 检查是否应该使用多链获取模式
        const shouldUseMultiChainMode = sortedChains.length > 1 ||
          (sortedChains.length === 1 && sortedChains[0] !== 'solana');

        if (shouldUseMultiChainMode) {
          console.log(`🔗 Using multi-chain mode for ${sortedChains.length} chains`);

          // 获取第一个链的 K 线数据
          const firstChain = sortedChains[0];
          const klineResult = await fetchChainKlineData(firstChain, normalizedAddress);

          if (klineResult) {
            setCurrentChain(firstChain);
            setKlineData(klineResult.data);
            setDataSource(klineResult.source);
          }
        } else {
          // Solana单链模式
          console.log(`🔗 Using single-chain mode for Solana`);

          const klineResult = await fetchKlineData(normalizedAddress, sortedChains[0]);
          if (klineResult) {
            setKlineData(klineResult.data);
            setDataSource(klineResult.source);

            // 设置当前链信息
            if (klineResult.actualNetwork) {
              setCurrentChain(klineResult.actualNetwork);
              updateChainStatus(klineResult.actualNetwork, 'success', klineResult.data.length);
            } else {
              setCurrentChain(sortedChains[0]);
              updateChainStatus(sortedChains[0], 'success', klineResult.data.length);
            }
          }
        }
      } else {
        // 完全没有网络信息的情况
        console.log(`❌ No network information available`);

        // 最后尝试：使用地址格式检测
        const detectedNetwork = detectNetworkFromAddress(normalizedAddress);
        if (detectedNetwork) {
          console.log(`🔄 Last attempt with detected network: ${detectedNetwork}`);
          const klineResult = await fetchKlineData(normalizedAddress, detectedNetwork);
          if (klineResult) {
            setKlineData(klineResult.data);
            setDataSource(klineResult.source);
          }
        }
      }

      // 6. 处理推文数据
      const events = transformAddressTweetsToEvents(tweetsResponse)
      setTweetEvents(events)
      setStats({
        totalTweets: tweetsResponse.data.stats.total_tweets,
        activeTweets: tweetsResponse.data.stats.active_tweets,
        deletedTweets: tweetsResponse.data.stats.deleted_tweets,
        topUsers: tweetsResponse.data.stats.top_users,
        mostActiveDate: tweetsResponse.data.stats.most_active_date,
        mostActiveDateCount: tweetsResponse.data.stats.most_active_date_count,
        firstMentionUser: tweetsResponse.data.stats.first_mention_user
      })



    } catch (error) {
      console.error('❌ 推文分析数据获取失败:', error)
      setError(error instanceof Error ? error.message : t('klineAnalysis.dataFetchError'))
    } finally {
      setLoading(false)
    }
  }

  // 当模态框打开时获取数据
  useEffect(() => {
    if (isOpen && tokenAddress) {
      fetchAnalysisData()
    }
  }, [isOpen, tokenAddress, networkType])

  // 重置状态当模态框关闭时
  useEffect(() => {
    if (!isOpen) {
      setTweetEvents([])
      setKlineData([])
      setDataSource('')
      setError(null)
      setSelectedEvent(null)
      setStats(null)

      // 重置多链状态
      setSupportedChains([])
      setCurrentChain('')
      setChainInfos({})
      setChainDataCache({})
      setIsChainSwitching(false)
    }
  }, [isOpen])

  const handleEventClick = (event: TweetEvent) => {
    setSelectedEvent(event)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('klineAnalysis.title')} - {tokenSymbol || tokenName || t('common.unknownToken')}
          </DialogTitle>
          <DialogDescription>
            {t('klineAnalysis.description')} • {t('common.address')}: {tokenAddress}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{t('klineAnalysis.loading')}</span>
            </div>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{t('klineAnalysis.error')}</span>
              </div>
              <p className="text-sm text-red-600 mt-2">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalysisData}
                className="mt-3"
              >
                {t('klineAnalysis.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {/* Statistics */}
            {stats && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{stats.totalTweets}</div>
                      <p className="text-xs text-muted-foreground">{t('klineAnalysis.totalTweets')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{stats.activeTweets}</div>
                      <p className="text-xs text-muted-foreground">{t('klineAnalysis.activeTweets')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{stats.deletedTweets}</div>
                      <p className="text-xs text-muted-foreground">{t('klineAnalysis.deletedTweets')}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{tweetEvents.length}</div>
                      <p className="text-xs text-muted-foreground">{t('klineAnalysis.analysisEvents')}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm font-medium">{t('klineAnalysis.mostActiveDate')}</div>
                      <div className="text-lg font-bold">{stats.mostActiveDate}</div>
                      <p className="text-xs text-muted-foreground">{stats.mostActiveDateCount} {t('klineAnalysis.tweetsCount')}</p>
                    </CardContent>
                  </Card>
                  {stats.firstMentionUser && (
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-sm font-medium">{t('klineAnalysis.firstMentionUser')}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <img
                            src={stats.firstMentionUser.profile_image_url_https}
                            alt={stats.firstMentionUser.name}
                            className="w-6 h-6 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all duration-200"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(`https://twitter.com/${stats.firstMentionUser.screen_name}`, '_blank', 'noopener,noreferrer');
                            }}
                            title={`查看 @${stats.firstMentionUser.screen_name} 的Twitter主页`}
                          />
                          <div className="flex-1">
                            <div
                              className="font-bold text-sm cursor-pointer hover:text-blue-600 hover:underline transition-colors duration-200"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(`https://twitter.com/${stats.firstMentionUser.screen_name}`, '_blank', 'noopener,noreferrer');
                              }}
                              title={`查看 @${stats.firstMentionUser.screen_name} 的Twitter主页`}
                            >
                              {stats.firstMentionUser.name}
                            </div>
                            <div
                              className="text-xs text-muted-foreground cursor-pointer hover:text-blue-600 hover:underline transition-colors duration-200"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(`https://twitter.com/${stats.firstMentionUser.screen_name}`, '_blank', 'noopener,noreferrer');
                              }}
                              title={`查看 @${stats.firstMentionUser.screen_name} 的Twitter主页`}
                            >
                              @{stats.firstMentionUser.screen_name}
                            </div>
                            {stats.firstMentionUser.tweet_time && (
                              <div className="text-xs text-blue-600 mt-1">
                                {t('addressSearch.firstMention.earliestMention')}: {new Date(stats.firstMentionUser.tweet_time).toLocaleString('zh-CN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Top Users Display */}
                {stats.topUsers && stats.topUsers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{t('klineAnalysis.topUsers')} ({t('klineAnalysis.topUsersCount')}{Math.min(stats.topUsers.length, 5)}{t('klineAnalysis.usersUnit')})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.topUsers.slice(0, 5).map((user, index) => (
                          <div key={user.rest_id} className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">
                              {index + 1}
                            </div>
                            <img
                              src={user.profile_image_url_https}
                              alt={user.name}
                              className="w-8 h-8 rounded-full cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all duration-200"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(`https://twitter.com/${user.screen_name}`, '_blank', 'noopener,noreferrer');
                              }}
                              title={`查看 @${user.screen_name} 的Twitter主页`}
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className="font-medium text-sm truncate cursor-pointer hover:text-blue-600 hover:underline transition-colors duration-200"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(`https://twitter.com/${user.screen_name}`, '_blank', 'noopener,noreferrer');
                                }}
                                title={`查看 @${user.screen_name} 的Twitter主页`}
                              >
                                {user.name}
                              </div>
                              <div
                                className="text-xs text-muted-foreground cursor-pointer hover:text-blue-600 hover:underline transition-colors duration-200"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  window.open(`https://twitter.com/${user.screen_name}`, '_blank', 'noopener,noreferrer');
                                }}
                                title={`查看 @${user.screen_name} 的Twitter主页`}
                              >
                                @{user.screen_name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold">{user.tweet_count}{t('klineAnalysis.tweets')}</div>
                              <div className="text-xs text-muted-foreground">{user.followers_count.toLocaleString()}{t('klineAnalysis.followers')}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Chain Selector */}
            {(supportedChains.length > 1 ||
              (supportedChains.length === 1 && supportedChains[0] !== 'solana')) && (
              <ChainSelector
                supportedChains={supportedChains}
                currentChain={currentChain}
                chainInfos={chainInfos}
                onChainChange={handleChainChange}
                disabled={loading || isChainSwitching}
                className="mb-6"
              />
            )}

            {/* K-line Chart Area */}
            {klineData.length > 0 ? (
              <div className={`w-full max-w-full overflow-hidden transition-all duration-500 ${isChainSwitching ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {t('klineAnalysis.priceChart')}
                          {currentChain && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                              <span
                                className="text-sm"
                                style={{ color: getChainDisplayInfo(currentChain).color }}
                              >
                                {getChainDisplayInfo(currentChain).icon}
                              </span>
                              <span className="text-xs font-medium">
                                {getChainDisplayInfo(currentChain).shortName}
                              </span>
                            </div>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {t('klineAnalysis.dataSource')}: {dataSource}
                          {currentChain && ` • ${getChainDisplayInfo(currentChain).name}`}
                          {' • '}{t('klineAnalysis.tweetEvents')}: {tweetEvents.length}
                          {' • '}{t('klineAnalysis.chartDescription')}
                        </CardDescription>
                      </div>

                      {/* 加载状态指示器 */}
                      {isChainSwitching && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t('klineAnalysis.chainSelector.switchingChain')}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full max-w-full overflow-hidden">
                      <LightweightKlineChart
                        data={klineData}
                        tweetEvents={tweetEvents}
                        onEventClick={handleEventClick}
                        className="w-full h-full"
                        height={400}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">{t('klineAnalysis.noKlineData')}</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-2">
                    {t('klineAnalysis.noKlineDataDescription')}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Event Impact Analysis */}
            {tweetEvents.length > 0 && klineData.length > 0 && (
              <TimelineCard
                klineData={klineData}
                tweetEvents={tweetEvents}
                className="w-full"
              />
            )}

            {/* 无数据提示 */}
            {!loading && !error && tweetEvents.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t('klineAnalysis.noTweetData')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('klineAnalysis.noTweetDataDescription')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
