/**
 * 删帖榜单数据获取 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { Storage } from '@plasmohq/storage';
import { toast } from 'sonner';

import { API_CONFIG } from '~src/config/config';
import { TokenManager } from '~src/services/token.service';
import type {
  FilterOptions,
  LeaderboardResponse,
  LeaderboardState,
  PaginationInfo,
  StatsInfo,
  UseDeletedTweetsLeaderboard,
  UserRanking,
  ApiError
} from '~src/types/deleted-tweets-leaderboard.types';

import {
  DEFAULT_FILTERS,
  DEFAULT_PAGINATION,
  CACHE_CONFIG
} from '~src/types/deleted-tweets-leaderboard.types';



// 初始状态
const initialState: LeaderboardState = {
  rawRankings: [],
  filteredRankings: [],
  displayedRankings: [],
  loading: false,
  loadingMore: false,
  error: null,
  filters: DEFAULT_FILTERS,
  hasMore: true,
  currentOffset: 0,
  displayCount: 0,
  stats: {
    totalUsers: 0,
    currentPage: 1,
    totalPages: 1,
    showing: '',
    cacheTime: ''
  },
  lastUpdated: null,
  cacheExpiry: null,
};

/**
 * 删帖榜单 Hook
 */
export function useDeletedTweetsLeaderboard(): UseDeletedTweetsLeaderboard {
  const [state, setState] = useState<LeaderboardState>(initialState);
  const storage = new Storage();

  // 格式化时间显示
  const formatTimeAgo = useCallback((date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    return date.toLocaleDateString();
  }, []);

  // 本地搜索筛选
  const filterRankings = useCallback((rankings: UserRanking[], filters: FilterOptions): UserRanking[] => {
    let filtered = [...rankings];

    // 统一搜索（同时搜索用户名和显示名称）
    if (filters.search_query) {
      const searchTerm = filters.search_query.toLowerCase().trim();
      filtered = filtered.filter(ranking =>
        ranking.screen_name.toLowerCase().includes(searchTerm) ||
        ranking.name.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, []);



  // 更新统计信息
  const updateStats = useCallback((
    filteredTotal: number,
    currentPage: number,
    pageSize: number,
    currentPageRankings: UserRanking[],
    lastUpdated: Date | null
  ): StatsInfo => {
    const totalPages = Math.ceil(filteredTotal / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(startIndex + currentPageRankings.length - 1, filteredTotal);

    return {
      totalUsers: filteredTotal,
      currentPage,
      totalPages,
      showing: `${startIndex}-${endIndex}`,
      cacheTime: lastUpdated ? formatTimeAgo(lastUpdated) : ''
    };
  }, [formatTimeAgo]);

  // 检查缓存是否有效
  const isCacheValid = useCallback((cacheExpiry: Date | null): boolean => {
    if (!cacheExpiry) return false;
    return new Date() < cacheExpiry;
  }, []);

  // 应用本地筛选和显示逻辑
  const applyFiltersAndDisplay = useCallback((rawRankings: UserRanking[], filters: FilterOptions, displayCount: number): {
    filteredRankings: UserRanking[];
    displayedRankings: UserRanking[];
    stats: StatsInfo;
  } => {
    // 1. 应用本地搜索筛选
    const filteredRankings = filterRankings(rawRankings, filters);

    // 2. 获取要显示的数据（前 displayCount 条）
    const displayedRankings = filteredRankings.slice(0, displayCount);

    // 3. 更新统计信息
    const stats = updateStats(filteredRankings.length, 1, displayCount, displayedRankings, state.lastUpdated);

    return {
      filteredRankings,
      displayedRankings,
      stats
    };
  }, [filterRankings, updateStats, state.lastUpdated]);

  // 获取缓存键（只基于 API 参数）
  const getCacheKey = useCallback((filters: FilterOptions): string => {
    return `${CACHE_CONFIG.STORAGE_KEY}_${filters.time_range}_${filters.sort_by}_${filters.order}`;
  }, []);

  // 从缓存加载数据
  const loadFromCache = useCallback(async (filters: FilterOptions): Promise<boolean> => {
    try {
      const cacheKey = getCacheKey(filters);
      const cached = await storage.get(cacheKey);

      if (cached && cached.data && cached.expiry) {
        const cacheExpiry = new Date(cached.expiry);
        if (isCacheValid(cacheExpiry)) {
          const { rankings, lastUpdated } = cached.data;
          const initialDisplayCount = Math.min(50, rankings.length);

          // 应用本地筛选和显示
          const result = applyFiltersAndDisplay(rankings, filters, initialDisplayCount);

          setState(prev => ({
            ...prev,
            rawRankings: rankings,
            filteredRankings: result.filteredRankings,
            displayedRankings: result.displayedRankings,
            filters,
            currentOffset: rankings.length,
            displayCount: initialDisplayCount,
            hasMore: result.displayedRankings.length < result.filteredRankings.length,
            stats: result.stats,
            lastUpdated: new Date(lastUpdated),
            cacheExpiry,
            error: null
          }));

          return true;
        }
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }

    return false;
  }, [storage, getCacheKey, isCacheValid, applyFiltersAndDisplay]);

  // 保存到缓存
  const saveToCache = useCallback(async (
    filters: FilterOptions,
    rankings: UserRanking[],
    totalUsers: number
  ): Promise<void> => {
    try {
      const cacheKey = getCacheKey(filters);
      const now = new Date();
      const cacheDuration = CACHE_CONFIG.CACHE_DURATION[filters.time_range];
      const expiry = new Date(now.getTime() + cacheDuration);
      
      await storage.set(cacheKey, {
        data: {
          rankings,
          totalUsers,
          lastUpdated: now.toISOString()
        },
        expiry: expiry.toISOString()
      });
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }, [storage, getCacheKey]);

  // API 调用（只传递 API 相关参数）
  const callApi = useCallback(async (filters: FilterOptions): Promise<LeaderboardResponse> => {
    const token = await TokenManager.getToken();
    if (!token) {
      throw new Error('未找到认证令牌，请重新登录');
    }

    const url = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.DELETED_TWEETS_LEADERBOARD}`;

    // 只传递 API 支持的参数
    const apiParams = {
      time_range: filters.time_range,
      sort_by: filters.sort_by,
      order: filters.order,
      limit: 100,  // API 最大限制
      offset: 0    // 从第一条开始获取
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apiParams),
        signal: AbortSignal.timeout(API_CONFIG.REQUEST_TIMEOUT)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          code: response.status,
          message: errorData.msg || `HTTP ${response.status}`,
          details: errorData
        };
        throw apiError;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch deleted tweets leaderboard:', error);
      throw error;
    }
  }, []);

  // 获取初始数据
  const fetchData = useCallback(async (newFilters?: Partial<FilterOptions>): Promise<void> => {
    const filters = { ...state.filters, ...newFilters };

    // 检查是否只是本地搜索变化
    const isSearchChange = newFilters && ('search_query' in newFilters);

    // 如果只是搜索变化且有原始数据，直接应用筛选
    if (isSearchChange && state.rawRankings.length > 0) {
      const result = applyFiltersAndDisplay(state.rawRankings, filters, state.displayCount || 50);

      setState(prev => ({
        ...prev,
        filters,
        filteredRankings: result.filteredRankings,
        displayedRankings: result.displayedRankings,
        stats: result.stats
      }));
      return;
    }

    // 需要从 API 获取数据
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      rawRankings: [],
      filteredRankings: [],
      displayedRankings: [],
      currentOffset: 0,
      displayCount: 0,
      hasMore: true
    }));

    try {
      // 先尝试从缓存加载
      const cacheLoaded = await loadFromCache(filters);
      if (cacheLoaded) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      // 从 API 获取第一批数据
      const response = await callApi(filters);

      if (response.code !== 200) {
        throw new Error(response.msg || '获取数据失败');
      }

      const { rankings, has_more } = response.data;
      const now = new Date();
      const initialDisplayCount = Math.min(50, rankings.length); // 初始显示 50 条

      // 保存到缓存
      await saveToCache(filters, rankings, rankings.length);

      // 应用本地筛选和显示
      const result = applyFiltersAndDisplay(rankings, filters, initialDisplayCount);

      setState(prev => ({
        ...prev,
        rawRankings: rankings,
        filteredRankings: result.filteredRankings,
        displayedRankings: result.displayedRankings,
        filters,
        currentOffset: rankings.length,
        displayCount: initialDisplayCount,
        hasMore: has_more && result.displayedRankings.length < result.filteredRankings.length,
        stats: result.stats,
        lastUpdated: now,
        cacheExpiry: new Date(now.getTime() + CACHE_CONFIG.CACHE_DURATION[filters.time_range]),
        loading: false,
        error: null
      }));

    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);

      let errorMessage = '获取数据失败';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '请求超时，请稍后重试';
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          errorMessage = '网络连接失败，请检查网络设置或稍后重试';
        } else if (error.message.includes('401')) {
          errorMessage = '认证失败，请重新登录';
        } else if (error.message.includes('403')) {
          errorMessage = '访问被拒绝，请联系管理员';
        } else if (error.message.includes('500')) {
          errorMessage = '服务器错误，请稍后重试';
        } else {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      // 只在非网络连接问题时显示 toast，避免重复提示
      if (!errorMessage.includes('网络连接失败')) {
        toast.error(errorMessage);
      }
    }
  }, [state.filters, state.rawRankings, state.displayCount, loadFromCache, callApi, saveToCache, applyFiltersAndDisplay]);

  // 加载更多数据
  const loadMore = useCallback(async (): Promise<void> => {
    if (!state.hasMore || state.loadingMore) return;

    // 首先检查是否可以从已筛选的数据中显示更多
    const canShowMoreFromFiltered = state.displayCount < state.filteredRankings.length;

    if (canShowMoreFromFiltered) {
      // 从已筛选的数据中显示更多
      const newDisplayCount = Math.min(
        state.displayCount + 50,
        state.filteredRankings.length
      );

      const result = applyFiltersAndDisplay(state.rawRankings, state.filters, newDisplayCount);

      setState(prev => ({
        ...prev,
        displayedRankings: result.displayedRankings,
        displayCount: newDisplayCount,
        hasMore: newDisplayCount < prev.filteredRankings.length || prev.currentOffset < 1000, // API 可能还有更多数据
        stats: result.stats
      }));
      return;
    }

    // 需要从 API 获取更多数据
    setState(prev => ({ ...prev, loadingMore: true }));

    try {
      const loadMoreFilters = {
        ...state.filters,
        offset: state.currentOffset
      };

      const response = await callApi(loadMoreFilters);

      if (response.code !== 200) {
        throw new Error(response.msg || '加载更多数据失败');
      }

      const { rankings: newRankings, has_more } = response.data;

      if (newRankings.length === 0) {
        setState(prev => ({ ...prev, hasMore: false, loadingMore: false }));
        return;
      }

      // 合并新数据到原始数据
      const updatedRawRankings = [...state.rawRankings, ...newRankings];
      const newDisplayCount = state.displayCount + 50;

      // 应用筛选和显示
      const result = applyFiltersAndDisplay(updatedRawRankings, state.filters, newDisplayCount);

      setState(prev => ({
        ...prev,
        rawRankings: updatedRawRankings,
        filteredRankings: result.filteredRankings,
        displayedRankings: result.displayedRankings,
        currentOffset: prev.currentOffset + newRankings.length,
        displayCount: newDisplayCount,
        hasMore: has_more && result.displayedRankings.length < result.filteredRankings.length,
        stats: result.stats,
        loadingMore: false
      }));

    } catch (error) {
      console.error('Failed to load more data:', error);
      setState(prev => ({ ...prev, loadingMore: false }));
      toast.error('加载更多数据失败'); // 这里可以考虑传入 t 函数，但由于 Hook 的限制，暂时保持硬编码
    }
  }, [state.hasMore, state.loadingMore, state.displayCount, state.filteredRankings.length, state.rawRankings, state.filters, state.currentOffset, applyFiltersAndDisplay, callApi]);

  // 刷新数据
  const refreshData = useCallback(async (): Promise<void> => {
    // 清除缓存
    const cacheKey = getCacheKey(state.filters);
    await storage.remove(cacheKey);

    // 重新获取数据
    await fetchData();

    toast.success('数据已刷新'); // 这里可以考虑传入 t 函数，但由于 Hook 的限制，暂时保持硬编码
  }, [state.filters, getCacheKey, storage, fetchData]);

  // 更新筛选条件
  const updateFilters = useCallback((newFilters: Partial<FilterOptions>): void => {
    const updatedFilters = { ...state.filters, ...newFilters };

    // 如果改变了 API 相关筛选条件，重置分页
    if (newFilters.time_range || newFilters.sort_by || newFilters.order) {
      updatedFilters.offset = 0;
    }

    // 如果改变了搜索条件，重置分页
    if (newFilters.search_query !== undefined) {
      if (newFilters.offset === undefined) {
        updatedFilters.offset = 0;
      }
    }

    fetchData(updatedFilters);
  }, [state.filters, fetchData]);



  // 重置状态
  const reset = useCallback((): void => {
    setState(initialState);
  }, []);

  // 初始化时加载数据（延迟执行，避免立即显示错误）
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 100); // 延迟 100ms 执行，让组件先渲染

    return () => clearTimeout(timer);
  }, []); // 只在组件挂载时执行一次

  return {
    state,
    actions: {
      fetchData,
      loadMore,
      refreshData,
      updateFilters,
      reset
    }
  };
}
