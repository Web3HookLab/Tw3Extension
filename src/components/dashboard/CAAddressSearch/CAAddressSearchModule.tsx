/**
 * CA地址搜索主模块组件
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Search, History, Info, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '~src/components/ui/card';
import { Button } from '~src/components/ui/button';
import { Badge } from '~src/components/ui/badge';
import { Separator } from '~src/components/ui/separator';
import { Alert, AlertDescription } from '~src/components/ui/alert';
import { useSettings } from '~src/contexts/SettingsContext';
import { useAuth } from '~src/services/auth.service';
import type { CAAddressSearchModuleProps } from '~src/types/addressSearch.types';

// 导入子组件
import { AddressInput } from './components/AddressInput';
import { SearchResults } from './components/SearchResults';
import { TweetAnalysisModal } from '~src/components/kline-analysis/TweetAnalysisModal';

// 导入Hooks
import { useAddressSearch } from './hooks/useAddressSearch';
import { useAddressValidation } from './hooks/useAddressValidation';
import { useSearchHistory } from './hooks/useSearchHistory';

export const CAAddressSearchModule: React.FC<CAAddressSearchModuleProps> = ({
  className = ''
}) => {
  const { t, caSearchAutoUpdateInterval } = useSettings();
  const { userInfo } = useAuth();

  // 状态管理
  const [inputAddress, setInputAddress] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [autoUpdateCountdown, setAutoUpdateCountdown] = useState(0);

  // K线分析模态框状态
  const [showKlineAnalysis, setShowKlineAnalysis] = useState(false);
  const [klineAnalysisData, setKlineAnalysisData] = useState<{
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    networkType: string;
  } | null>(null);

  // 自定义Hooks
  const { searchState, searchAddress, clearResults, retry } = useAddressSearch();
  const { validateAddress } = useAddressValidation();
  const {
    history,
    addToHistory,
    clearHistory
  } = useSearchHistory();

  // 权限检查
  const canAccess = userInfo && userInfo.plan !== 'Free';

  // 处理地址输入变化
  const handleAddressChange = useCallback((address: string) => {
    setInputAddress(address);
  }, []);

  // 处理K线分析模态框
  const handleOpenKlineAnalysis = useCallback((tokenData: {
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    networkType: string;
  }) => {
    setKlineAnalysisData(tokenData);
    setShowKlineAnalysis(true);
  }, []);

  const handleCloseKlineAnalysis = useCallback(() => {
    setShowKlineAnalysis(false);
    setKlineAnalysisData(null);
  }, []);

  // 自动搜索逻辑
  useEffect(() => {
    if (!canAccess) {
      return;
    }

    const currentValidation = validateAddress(inputAddress);
    if (currentValidation.isValid && inputAddress.trim()) {
      // 500ms防抖延迟
      const timer = setTimeout(async () => {
        try {
          await searchAddress(inputAddress.trim());

          // 添加到搜索历史
          addToHistory({
            address: currentValidation.formatted,
            type: currentValidation.type
          });
        } catch (error) {
          console.error('自动搜索失败:', error);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [inputAddress, validateAddress, searchAddress, addToHistory, canAccess]);

  // 自动更新逻辑
  useEffect(() => {
    if (searchState.status === 'success' &&
        caSearchAutoUpdateInterval > 0 &&
        searchState.lastSearchAddress) {

      setAutoUpdateCountdown(caSearchAutoUpdateInterval);

      const timer = setInterval(() => {
        setAutoUpdateCountdown(prev => {
          if (prev <= 1) {
            // 触发自动更新 - 标记为刷新
            searchAddress(searchState.lastSearchAddress!, true);
            return caSearchAutoUpdateInterval;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setAutoUpdateCountdown(0);
    }
  }, [searchState.status, searchState.lastSearchAddress, caSearchAutoUpdateInterval, searchAddress]);

  // 手动刷新
  const handleManualRefresh = useCallback(() => {
    if (searchState.lastSearchAddress) {
      searchAddress(searchState.lastSearchAddress, true);
    }
  }, [searchState.lastSearchAddress, searchAddress]);

  // 处理历史记录点击
  const handleHistoryClick = useCallback((address: string) => {
    setInputAddress(address);
    setShowHistory(false);
  }, []);

  // 处理清空结果
  const handleClearResults = useCallback(() => {
    clearResults();
    setInputAddress('');
  }, [clearResults]);



  // 渲染权限提示
  const renderPermissionAlert = () => (
    <Alert className="mb-6">
      <Info className="h-4 w-4" />
      <AlertDescription>
        {t('addressSearch.permissionRequired')}
        <Button variant="link" className="p-0 h-auto ml-2">
          {t('addressSearch.upgrade')}
        </Button>
      </AlertDescription>
    </Alert>
  );

  // 渲染搜索历史
  const renderSearchHistory = () => {
    const recentAddresses = history.slice(0, 5);

    if (recentAddresses.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 text-sm">
          {t('addressSearch.history.empty')}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {t('addressSearch.history.recent')}
            </span>
            <Badge variant="outline" className="text-xs">
              {history.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-xs text-gray-500 hover:text-red-600"
          >
            {t('addressSearch.history.clear')}
          </Button>
        </div>

        <div className="space-y-2">
          {recentAddresses.map((item, index) => (
            <div
              key={`${item.address}-${index}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleHistoryClick(item.address)}
            >
              <Badge
                variant="outline"
                className={`text-xs ${
                  item.type === 'solana'
                    ? 'text-purple-600 border-purple-200'
                    : 'text-blue-600 border-blue-200'
                }`}
              >
                {item.type === 'solana' ? 'SOL' : 'ETH'}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono text-gray-900 truncate">
                  {item.address}
                </div>
                {item.label && (
                  <div className="text-xs text-gray-500">
                    {item.label}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(item.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 权限检查 */}
      {!canAccess && renderPermissionAlert()}

      {/* 搜索区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            {t('addressSearch.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 地址输入 */}
          <AddressInput
            value={inputAddress}
            onChange={handleAddressChange}
            onSearch={() => {}} // 不再需要手动搜索
            validation={validateAddress(inputAddress)}
            loading={searchState.status === 'loading'}
            disabled={!canAccess}
          />

          {/* 自动更新状态显示 */}
          {searchState.status === 'success' && autoUpdateCountdown > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>
                  {autoUpdateCountdown >= 60
                    ? `${Math.ceil(autoUpdateCountdown / 60)}${t('addressSearch.autoUpdateMinute')}`
                    : `${autoUpdateCountdown}${t('addressSearch.autoUpdateSeconds')}`
                  }
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleManualRefresh}
                className="h-6 px-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t('addressSearch.refreshNow')}
              </Button>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2"
              >
                <History className="h-3 w-3" />
                {t('addressSearch.history.title')}
                {history.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {history.length}
                  </Badge>
                )}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {searchState.status !== 'idle' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearResults}
                  disabled={searchState.status === 'loading'}
                >
                  {t('addressSearch.clear')}
                </Button>
              )}
            </div>
          </div>

          {/* 搜索历史 */}
          {showHistory && (
            <>
              <Separator />
              {renderSearchHistory()}
            </>
          )}
        </CardContent>
      </Card>

      {/* 搜索结果 */}
      {canAccess && (
        <SearchResults
          searchState={searchState}
          onRetry={retry}
          onOpenKlineAnalysis={handleOpenKlineAnalysis}
        />
      )}

      {/* K线分析模态框 */}
      {klineAnalysisData && (
        <TweetAnalysisModal
          isOpen={showKlineAnalysis}
          onClose={handleCloseKlineAnalysis}
          tokenAddress={klineAnalysisData.tokenAddress}
          tokenSymbol={klineAnalysisData.tokenSymbol}
          tokenName={klineAnalysisData.tokenName}
          networkType={klineAnalysisData.networkType}
        />
      )}
    </div>
  );
};
