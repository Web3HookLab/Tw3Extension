/**
 * 搜索结果组件
 */

import React from 'react';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { Button } from '~src/components/ui/button';
import { useSettings } from '~src/contexts/SettingsContext';
import type { SearchResultsProps } from '~src/types/addressSearch.types';
import { TokenInfo } from './TokenInfo';
import { SearchStats } from './SearchStats';
import { FirstMentionUser } from './FirstMentionUser';
import { TweetsList } from './TweetsList';

export const SearchResults: React.FC<SearchResultsProps> = ({
  searchState,
  onRetry,
  className = '',
  onOpenKlineAnalysis
}) => {
  const { t } = useSettings();

  // 渲染加载状态
  const renderLoadingState = () => (
    <div className={`space-y-6 ${className}`}>
      <TokenInfo loading={true} token={{} as any} />
      <SearchStats loading={true} stats={{} as any} />
      <FirstMentionUser loading={true} user={null} />
      <TweetsList loading={true} tweets={[]} />
    </div>
  );

  // 渲染错误状态
  const renderErrorState = () => (
    <div className={`space-y-4 ${className}`}>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{searchState.error}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-4"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {t('addressSearch.retry')}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );

  // 渲染空闲状态
  const renderIdleState = () => (
    <div className={`text-center py-12 ${className}`}>
      <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {t('addressSearch.results.idle.title')}
      </h3>
      <p className="text-gray-500 max-w-md mx-auto">
        {t('addressSearch.results.idle.description')}
      </p>
    </div>
  );

  // 渲染成功状态或刷新状态
  const renderSuccessState = () => {
    if (!searchState.data) {
      return renderIdleState();
    }

    const { stats, tweets, token } = searchState.data;
    const isRefreshing = searchState.status === 'refreshing';

    // 检查是否有数据
    const hasData = stats.total_tweets > 0 || tweets.length > 0;

    if (!hasData) {
      return (
        <div className={`text-center py-12 ${className}`}>
          <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('addressSearch.results.noData.title')}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            {t('addressSearch.results.noData.description')}
          </p>
          {searchState.lastSearchAddress && (
            <div className="text-sm text-gray-400">
              {t('addressSearch.results.searchedAddress')}: {searchState.lastSearchAddress}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`space-y-6 ${className}`}>
        {/* 代币信息 */}
        <TokenInfo
          token={token}
          refreshing={isRefreshing}
          onOpenKlineAnalysis={onOpenKlineAnalysis}
        />

        {/* 统计信息 */}
        <SearchStats stats={stats} refreshing={isRefreshing} />

        {/* 首次提及用户 */}
        <FirstMentionUser user={stats.first_mention_user} refreshing={isRefreshing} />

        {/* 推文列表 */}
        <TweetsList tweets={tweets} refreshing={isRefreshing} />
      </div>
    );
  };

  // 根据状态渲染对应内容
  switch (searchState.status) {
    case 'loading':
      return renderLoadingState();
    case 'refreshing':
    case 'success':
      return renderSuccessState();
    case 'error':
      return renderErrorState();
    case 'idle':
    default:
      return renderIdleState();
  }
};
