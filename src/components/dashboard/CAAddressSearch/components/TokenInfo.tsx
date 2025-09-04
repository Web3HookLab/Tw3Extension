/**
 * 代币信息组件
 */

import React from 'react';
import { Coins, ExternalLink, Copy, Globe, Twitter, Search, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Badge } from '~src/components/ui/badge';
import { Button } from '~src/components/ui/button';
import { Skeleton } from '~src/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~src/components/ui/tooltip';
import { useSettings } from '~src/contexts/SettingsContext';
import type { TokenInfoProps } from '~src/types/addressSearch.types';
import { RefreshIndicator } from './RefreshIndicator';
import { checkTokenSupportForKlineAnalysis } from '../utils/dataConverter';

export const TokenInfo: React.FC<TokenInfoProps> = ({
  token,
  loading = false,
  refreshing = false,
  className = '',
  onOpenKlineAnalysis
}) => {
  const { t } = useSettings();

  if (loading || !token) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 复制地址到剪贴板
  const handleCopyAddress = async () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(token.address);
        // 这里可以添加复制成功的提示
      } catch (error) {
        console.warn('复制失败:', error);
      }
    }
  };

  // 打开外部链接
  const openExternalLink = (url: string) => {
    if (url && url.trim()) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // 在Twitter上搜索代币地址
  const searchOnTwitter = () => {
    const searchUrl = `https://twitter.com/search?q=${encodeURIComponent(token.address)}`;
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  // 打开K线分析
  const handleOpenKlineAnalysis = () => {
    if (onOpenKlineAnalysis) {
      onOpenKlineAnalysis({
        tokenAddress: token.address,
        tokenSymbol: token.symbol,
        tokenName: token.name,
        networkType: token.chain
      });
    }
  };

  // 获取链类型的显示名称和颜色
  const getChainInfo = () => {
    console.log(`🔗 TokenInfo getChainInfo:`, {
      address: token.address,
      chain: token.chain,
      chainType: typeof token.chain,
      chainLength: token.chain?.length
    });

    // 如果没有chain信息，根据地址格式推断
    if (!token.chain || token.chain.trim() === '') {
      const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(token.address);
      const isSolanaAddress = token.address.length >= 32 && token.address.length <= 44 && !token.address.startsWith('0x');

      if (isEthAddress) {
        console.log(`🔍 Inferred as Ethereum from address format`);
        return { name: 'Ethereum', color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' };
      } else if (isSolanaAddress) {
        console.log(`🔍 Inferred as Solana from address format`);
        return { name: 'Solana', color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' };
      } else {
        console.log(`⚠️ Could not infer network from address format, using default`);
        return { name: 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' };
      }
    }

    // 处理多链字符串（如 "BSC,Arbitrum,Optimism"）
    if (token.chain && token.chain.includes(',')) {
      const chains = token.chain.split(',').map(c => c.trim());
      console.log(`🔗 Multi-chain detected: ${chains.join(', ')}`);
      return { name: `${chains.length} Chains`, color: 'bg-gradient-to-r from-blue-100 to-purple-100 text-gray-800 border-gray-200 hover:from-blue-200 hover:to-purple-200' };
    }

    // 单链处理
    switch (token.chain?.toLowerCase()) {
      case 'solana':
        return { name: 'Solana', color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' };
      case 'ethereum':
        return { name: 'Ethereum', color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' };
      case 'bsc':
        return { name: 'BSC', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' };
      case 'base':
        return { name: 'Base', color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' };
      case 'arbitrum':
        return { name: 'Arbitrum', color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' };
      case 'optimism':
        return { name: 'Optimism', color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' };
      case 'polygon':
        return { name: 'Polygon', color: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200' };
      case 'avalanche':
        return { name: 'Avalanche', color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' };
      default:
        console.log(`⚠️ Unknown chain: "${token.chain}", using default gray style`);
        return { name: token.chain || 'Unknown', color: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200' };
    }
  };

  const chainInfo = getChainInfo();

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-orange-600" />
              {t('addressSearch.tokenInfo.title')}
            </div>
            <RefreshIndicator refreshing={refreshing} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 代币基本信息 */}
            <div className="flex items-start gap-4">
              {/* 代币图片 */}
              <div className="flex-shrink-0">
                {token.image ? (
                  <img
                    src={token.image}
                    alt={token.name || token.symbol}
                    className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Coins className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* 代币名称和符号 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {token.name || token.symbol || 'Unknown Token'}
                  </h3>
                  {token.symbol && (
                    <Badge variant="outline" className="text-xs">
                      {token.symbol}
                    </Badge>
                  )}
                </div>
                <Badge className={`text-xs ${chainInfo.color}`}>
                  {chainInfo.name}
                </Badge>
              </div>
            </div>

            {/* 代币地址 */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">
                {t('addressSearch.tokenInfo.address')}
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <code className="flex-1 text-xs text-gray-800 font-mono truncate">
                  {token.address}
                </code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('addressSearch.tokenInfo.copyAddress')}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* 地址操作按钮 */}
              <div className="flex gap-2 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Copy className="h-3 w-3" />
                      {t('addressSearch.tokenInfo.copyAddress')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('addressSearch.tokenInfo.copyAddressTooltip')}</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={searchOnTwitter}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Search className="h-3 w-3" />
                      {t('addressSearch.tokenInfo.searchOnTwitter')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('addressSearch.tokenInfo.searchOnTwitterTooltip')}</p>
                  </TooltipContent>
                </Tooltip>

                {/* K线分析按钮 */}
                {onOpenKlineAnalysis && checkTokenSupportForKlineAnalysis(token).isSupported && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenKlineAnalysis}
                        className="flex items-center gap-2 text-xs text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                      >
                        <TrendingUp className="h-3 w-3" />
                        {t('addressSearch.tokenInfo.klineAnalysis')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('addressSearch.tokenInfo.klineAnalysisTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* 代币描述 */}
            {token.description && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">
                  {t('addressSearch.tokenInfo.description')}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {token.description}
                </p>
              </div>
            )}

            {/* 外部链接 */}
            {(token.website || token.twitter) && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600">
                  {t('addressSearch.tokenInfo.externalLinks')}
                </div>
                <div className="flex gap-2">
              {token.website && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openExternalLink(token.website)}
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-3 w-3" />
                      {t('addressSearch.tokenInfo.website')}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{token.website}</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {token.twitter && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openExternalLink(token.twitter)}
                      className="flex items-center gap-2"
                    >
                      <Twitter className="h-3 w-3" />
                      {t('addressSearch.tokenInfo.twitter')}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{token.twitter}</p>
                  </TooltipContent>
                </Tooltip>
              )}
                </div>
              </div>
            )}

            {/* 代币社交趋势K线 */}
            {onOpenKlineAnalysis && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t('addressSearch.tokenInfo.klineAnalysis')}
                </div>
                <Button
                  onClick={handleOpenKlineAnalysis}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                  size="sm"
                >
                  <span className="mr-2">🚀</span>
                  {t('realtimeCA.item.tweetAnalysisButton')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
