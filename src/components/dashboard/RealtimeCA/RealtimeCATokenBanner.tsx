import React, { useEffect, useState } from 'react';
import { Badge } from '~src/components/ui/badge';
import { Button } from '~src/components/ui/button';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { Storage } from '@plasmohq/storage';
import { getDexPlatformById, getDefaultDexSettings, type DexPlatformSettings } from '~src/types/dexPlatforms.types';
import { useSettings } from '~src/contexts/SettingsContext';

import type { CAEvent } from '~src/types/realtime-ca.types';

const storage = new Storage({ area: 'local' });

interface TokenStats {
  symbol: string;
  name: string;
  address: string;
  network: string;

  // 真实统计数据
  totalMentions: number;        // 来自 mention_stats.total_mentions
  uniqueUsers: number;          // 来自 mention_stats.unique_users

  // 时间相关统计
  last5Min: number;             // 最近5分钟提及
  last20Min: number;            // 最近20分钟提及
  last30Min: number;            // 最近30分钟提及
  last1Hour: number;            // 最近1小时提及

  // 计算得出的指标
  hotScore: number;             // 综合热度分数
  trendScore: number;           // 趋势分数
  lastMentionTime: string;      // 最后提及时间

  // 附加信息
  image?: string;
  twitter?: string;
  website?: string;
  description?: string;
}

type SortBy = 'hotScore' | 'totalMentions' | 'uniqueUsers' | 'trendScore' | 'recent';

interface RealtimeCATokenBannerProps {
  events: CAEvent[];
  onTokenClick?: (token: TokenStats) => void;
}

export function RealtimeCATokenBanner({ events, onTokenClick }: RealtimeCATokenBannerProps) {
  const { t } = useSettings();
  const [dexSettings, setDexSettings] = useState<DexPlatformSettings>(getDefaultDexSettings());
  const [sortBy, setSortBy] = useState<SortBy>('hotScore');

  // 加载DEX设置
  useEffect(() => {
    const loadDexSettings = async () => {
      try {
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
  // 计算综合热度分数
  const calculateHotScore = (token: Omit<TokenStats, 'hotScore' | 'trendScore'>): number => {
    try {
      const now = Date.now();
      const lastMention = new Date(token.lastMentionTime || new Date()).getTime();
      const timeDiff = Math.max(0, now - lastMention);

      // 时间衰减因子 (越新越高分，1小时半衰期)
      const timeDecay = Math.exp(-timeDiff / (60 * 60 * 1000));

      // 基础分数：总提及数 + 独特用户数权重
      const baseScore = (token.totalMentions || 0) + ((token.uniqueUsers || 0) * 2);

      // 最近活跃度加权 (越近期的活动权重越高)
      const recentActivity =
        (token.last5Min || 0) * 20 +      // 5分钟内权重最高
        (token.last20Min || 0) * 8 +      // 20分钟内权重较高
        (token.last30Min || 0) * 5 +      // 30分钟内权重中等
        (token.last1Hour || 0) * 2;       // 1小时内权重较低

      // 综合分数
      const score = (baseScore + recentActivity) * timeDecay;
      return isNaN(score) ? 0 : score;
    } catch (error) {
      console.warn('Error calculating hot score:', error, token);
      return 0;
    }
  };

  // 计算趋势分数 (基于短期vs长期活跃度比较)
  const calculateTrendScore = (token: Omit<TokenStats, 'hotScore' | 'trendScore'>): number => {
    try {
      // 短期活跃度 (5-20分钟)
      const shortTerm = (token.last5Min || 0) + (token.last20Min || 0);
      // 长期活跃度 (30分钟-1小时)
      const longTerm = (token.last30Min || 0) + (token.last1Hour || 0);

      // 避免除零，如果长期为0，短期有活动则趋势很高
      if (longTerm === 0) {
        return shortTerm > 0 ? 100 : 0;
      }

      // 趋势分数：短期/长期的比值
      const score = (shortTerm / longTerm) * 100;
      return isNaN(score) ? 0 : Math.min(score, 200); // 限制最大值为200
    } catch (error) {
      console.warn('Error calculating trend score:', error, token);
      return 0;
    }
  };

  // 计算热门代币统计 - 基于真实数据
  const getTopTokens = (): TokenStats[] => {
    try {
      const tokenMap = new Map<string, Omit<TokenStats, 'hotScore' | 'trendScore'>>();

      // 安全地处理events数组
      if (!Array.isArray(events)) {
        console.warn('Events is not an array:', events);
        return [];
      }

      events.forEach(event => {
        // 安全地检查event结构
        if (!event?.data?.mentions || !Array.isArray(event.data.mentions)) {
          return;
        }

        event.data.mentions.forEach(mention => {
          // 基本验证
          if (!mention?.symbol || !mention?.address) {
            return;
          }
        const key = `${mention.symbol}-${mention.address}`;

        // 安全地获取数据，处理可能的null值
        const mentionStats = mention.mention_stats;
        const lastMentionUser = mentionStats?.last_mention_user;
        const minuteStats = mentionStats?.minute_stats;

        // 使用真实的统计数据，而不是简单计数
        const tokenData: Omit<TokenStats, 'hotScore' | 'trendScore'> = {
          symbol: mention.symbol || 'UNKNOWN',
          name: mention.name || 'Unknown Token',
          address: mention.address || '',
          network: mention.network_type || 'solana',

          // 使用mention_stats中的真实数据，提供默认值
          totalMentions: mentionStats?.total_mentions || 0,
          uniqueUsers: mentionStats?.unique_users || 0,

          // 时间相关统计，提供默认值
          last5Min: minuteStats?.last_5_min || 0,
          last20Min: minuteStats?.last_20_min || 0,
          last30Min: minuteStats?.last_30_min || 0,
          last1Hour: minuteStats?.last_1_hour || 0,

          // 最后提及时间 (使用最新提及用户的时间，如果没有则使用当前时间)
          lastMentionTime: lastMentionUser?.mention_time || new Date().toISOString(),

          // 附加信息
          image: mention.image || undefined,
          twitter: mention.twitter || undefined,
          website: mention.website || undefined,
          description: mention.description || undefined
        };

        // 如果已存在，选择数据更新的那个 (基于最后提及时间)
        if (tokenMap.has(key)) {
          const existing = tokenMap.get(key)!;
          const existingTime = new Date(existing.lastMentionTime).getTime();
          const newTime = new Date(tokenData.lastMentionTime).getTime();

          // 如果新数据更新，则替换；否则合并统计数据
          if (newTime > existingTime) {
            tokenMap.set(key, tokenData);
          } else {
            // 合并统计数据，取最大值
            existing.totalMentions = Math.max(existing.totalMentions, tokenData.totalMentions);
            existing.uniqueUsers = Math.max(existing.uniqueUsers, tokenData.uniqueUsers);
            existing.last5Min = Math.max(existing.last5Min, tokenData.last5Min);
            existing.last20Min = Math.max(existing.last20Min, tokenData.last20Min);
            existing.last30Min = Math.max(existing.last30Min, tokenData.last30Min);
            existing.last1Hour = Math.max(existing.last1Hour, tokenData.last1Hour);
          }
        } else {
          tokenMap.set(key, tokenData);
        }
      });
    });

    // 计算热度和趋势分数
    const tokensWithScores = Array.from(tokenMap.values())
      .map(token => ({
        ...token,
        hotScore: calculateHotScore(token),
        trendScore: calculateTrendScore(token)
      }));

    // 根据选择的排序方式排序
    const sortedTokens = tokensWithScores.sort((a, b) => {
      switch (sortBy) {
        case 'totalMentions':
          return b.totalMentions - a.totalMentions;
        case 'uniqueUsers':
          return b.uniqueUsers - a.uniqueUsers;
        case 'trendScore':
          return b.trendScore - a.trendScore;
        case 'recent':
          return new Date(b.lastMentionTime).getTime() - new Date(a.lastMentionTime).getTime();
        case 'hotScore':
        default:
          return b.hotScore - a.hotScore;
      }
    });

    return sortedTokens.slice(0, 8); // 显示前8个热门代币
    } catch (error) {
      console.error('Error in getTopTokens:', error);
      return [];
    }
  };

  const topTokens = getTopTokens();

  const handleTokenClick = (token: TokenStats) => {
    if (onTokenClick) {
      onTokenClick(token);
    } else {
      // 根据用户的DEX设置生成跳转链接
      let dexPlatformId: string;

      // 根据网络类型获取对应的DEX平台ID
      if (token.network === 'solana') {
        dexPlatformId = dexSettings.solana;
      } else if (token.network === 'sui') {
        dexPlatformId = dexSettings.sui;
      } else {
        // EVM网络（ethereum, base, bsc等）
        const evmPlatform = dexSettings.evm.platform;
        const evmChain = dexSettings.evm.defaultChain;

        // 构建EVM平台的完整ID
        if (token.network === 'ethereum') {
          dexPlatformId = `${evmPlatform}_eth`;
        } else if (token.network === 'base') {
          dexPlatformId = `${evmPlatform}_base`;
        } else if (token.network === 'bsc') {
          dexPlatformId = `${evmPlatform}_bsc`;
        } else {
          // 默认使用用户设置的默认链
          dexPlatformId = `${evmPlatform}_${evmChain}`;
        }
      }

      // 获取DEX平台配置并生成URL
      const platform = getDexPlatformById(dexPlatformId);
      if (platform) {
        const url = platform.getUrl(token.address);
        window.open(url, '_blank');
        console.log(`🔗 Opening ${platform.name}: ${url}`);
      } else {
        // 如果找不到平台配置，使用默认的DexScreener
        const fallbackUrl = `https://dexscreener.com/${token.network}/${token.address}`;
        window.open(fallbackUrl, '_blank');
        console.warn(`⚠️ Platform not found: ${dexPlatformId}, using fallback: ${fallbackUrl}`);
      }
    }
  };

  // 始终显示横幅，无数据时显示占位符

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg px-4 py-3 border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-3">
        {/* 标题部分 - 紧凑显示 */}
        <div className="flex items-center gap-2 shrink-0">
          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {t('realtimeCA.tokenBanner.hotTokens')}
          </span>
        </div>

        {/* 代币列表 - 水平滚动 */}
        <div className="flex-1 min-w-0">
          {topTokens.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              {topTokens.map((token, index) => (
                <Button
                  key={`${token.symbol}-${token.address}-${index}`}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 shrink-0 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                  onClick={() => handleTokenClick(token)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    <span className="font-medium text-xs">{token.symbol}</span>
                    <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                      {token.totalMentions}
                    </Badge>
                    {token.trendScore > 50 && (
                      <Badge variant="outline" className="text-xs px-1 py-0 h-4 bg-red-50 text-red-600 border-red-200">
                        🔥
                      </Badge>
                    )}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-pulse flex space-x-1">
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <span className="text-xs">{t('realtimeCA.tokenBanner.waitingData')}</span>
            </div>
          )}
        </div>

        {/* 状态指示 */}
        <div className="shrink-0">
          <Badge variant="secondary" className="text-xs h-5">
            {topTokens.length > 0 ? `${events.length}${t('realtimeCA.tokenBanner.dataCount').replace('{count}', '')}` : t('realtimeCA.tokenBanner.realtime')}
          </Badge>
        </div>
      </div>
    </div>
  );
}
