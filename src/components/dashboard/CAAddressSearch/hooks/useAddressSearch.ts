/**
 * 地址搜索Hook
 */

import { useState, useCallback, useRef } from 'react';
import type { 
  UseAddressSearchReturn, 
  SearchState, 
  AddressSearchData 
} from '~src/types/addressSearch.types';
import { AddressSearchService } from '../services/addressSearch.service';
import { validateAddress, createSearchRequest } from '../utils/addressValidation';

export const useAddressSearch = (): UseAddressSearchReturn => {
  const [searchState, setSearchState] = useState<SearchState>({
    status: 'idle',
    data: null,
    error: null,
    lastSearchAddress: null,
    lastSearchType: null
  });

  // 用于取消请求的引用
  const abortControllerRef = useRef<AbortController | null>(null);

  // 搜索地址
  const searchAddress = useCallback(async (address: string, isRefresh: boolean = false): Promise<void> => {
    try {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 验证地址
      const validation = validateAddress(address);
      if (!validation.isValid) {
        setSearchState({
          status: 'error',
          data: null,
          error: validation.error || '地址格式不正确',
          lastSearchAddress: address,
          lastSearchType: validation.type
        });
        return;
      }

      // 创建请求参数
      const requestParams = createSearchRequest(address);
      if (!requestParams) {
        setSearchState({
          status: 'error',
          data: null,
          error: '无法创建搜索请求',
          lastSearchAddress: address,
          lastSearchType: validation.type
        });
        return;
      }

      // 设置加载状态 - 区分首次加载和刷新
      setSearchState(prevState => ({
        ...prevState,
        status: isRefresh ? 'refreshing' : 'loading',
        error: null,
        lastSearchAddress: address,
        lastSearchType: validation.type
      }));

      // 创建新的AbortController
      abortControllerRef.current = new AbortController();

      console.log('🔍 开始搜索地址:', { address, type: validation.type, requestParams });

      // 调用API
      const data: AddressSearchData = await AddressSearchService.searchAddressTweets(requestParams);

      // 检查请求是否被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.log('✅ 搜索成功:', {
        totalTweets: data.stats.total_tweets,
        activeTweets: data.stats.active_tweets,
        tweetsCount: data.tweets.length
      });

      // 设置成功状态
      setSearchState({
        status: 'success',
        data,
        error: null,
        lastSearchAddress: address,
        lastSearchType: validation.type
      });

    } catch (error) {
      // 检查请求是否被取消
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('❌ 搜索失败:', error);

      let errorMessage = '搜索失败，请稍后重试';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setSearchState(prevState => ({
        ...prevState,
        status: 'error',
        error: errorMessage
      }));
    }
  }, []);

  // 重试搜索
  const retry = useCallback(() => {
    if (searchState.lastSearchAddress) {
      searchAddress(searchState.lastSearchAddress);
    }
  }, [searchState.lastSearchAddress, searchAddress]);

  // 清空结果
  const clearResults = useCallback(() => {
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSearchState({
      status: 'idle',
      data: null,
      error: null,
      lastSearchAddress: null,
      lastSearchType: null
    });
  }, []);

  // 检查是否正在搜索
  const isSearching = searchState.status === 'loading';

  // 检查是否有结果
  const hasResults = searchState.status === 'success' && searchState.data !== null;

  // 检查是否有错误
  const hasError = searchState.status === 'error' && searchState.error !== null;

  // 获取搜索统计
  const getSearchStats = useCallback(() => {
    if (!searchState.data) {
      return null;
    }

    return {
      totalTweets: searchState.data.stats.total_tweets,
      activeTweets: searchState.data.stats.active_tweets,
      deletedTweets: searchState.data.stats.deleted_tweets,
      topUsersCount: searchState.data.stats.top_users.length,
      tweetsCount: searchState.data.tweets.length
    };
  }, [searchState.data]);

  return {
    searchState,
    searchAddress,
    clearResults,
    retry
  };
};
