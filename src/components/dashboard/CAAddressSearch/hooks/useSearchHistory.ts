/**
 * 搜索历史Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { Storage } from '@plasmohq/storage';
import type {
  UseSearchHistoryReturn,
  SearchHistoryItem
} from '~src/types/addressSearch.types';
import { ADDRESS_SEARCH_CONSTANTS } from '~src/types/addressSearch.types';

const storage = new Storage({ area: 'local' });

export const useSearchHistory = (): UseSearchHistoryReturn => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载搜索历史
  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedHistory = await storage.get(ADDRESS_SEARCH_CONSTANTS.HISTORY.STORAGE_KEY);
      if (Array.isArray(savedHistory)) {
        // 按时间倒序排列
        const sortedHistory = savedHistory.sort((a, b) => b.timestamp - a.timestamp);
        setHistory(sortedHistory);
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存搜索历史
  const saveHistory = useCallback(async (newHistory: SearchHistoryItem[]) => {
    try {
      await storage.set(ADDRESS_SEARCH_CONSTANTS.HISTORY.STORAGE_KEY, newHistory);
    } catch (error) {
      console.error('保存搜索历史失败:', error);
    }
  }, []);

  // 添加到搜索历史
  const addToHistory = useCallback(async (item: Omit<SearchHistoryItem, 'timestamp'>) => {
    const newItem: SearchHistoryItem = {
      ...item,
      timestamp: Date.now()
    };

    setHistory(prevHistory => {
      // 移除重复的地址
      const filteredHistory = prevHistory.filter(
        historyItem => historyItem.address.toLowerCase() !== item.address.toLowerCase()
      );

      // 添加新项到开头
      const newHistory = [newItem, ...filteredHistory];

      // 限制历史记录数量
      const limitedHistory = newHistory.slice(0, ADDRESS_SEARCH_CONSTANTS.HISTORY.MAX_ITEMS);

      // 异步保存
      saveHistory(limitedHistory);

      return limitedHistory;
    });
  }, [saveHistory]);

  // 从搜索历史中移除
  const removeFromHistory = useCallback(async (address: string) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.filter(
        item => item.address.toLowerCase() !== address.toLowerCase()
      );
      
      // 异步保存
      saveHistory(newHistory);
      
      return newHistory;
    });
  }, [saveHistory]);

  // 清空搜索历史
  const clearHistory = useCallback(async () => {
    setHistory([]);
    try {
      await storage.remove(ADDRESS_SEARCH_CONSTANTS.HISTORY.STORAGE_KEY);
    } catch (error) {
      console.error('清空搜索历史失败:', error);
    }
  }, []);

  // 更新历史项标签
  const updateHistoryLabel = useCallback(async (address: string, label: string) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.map(item => 
        item.address.toLowerCase() === address.toLowerCase()
          ? { ...item, label }
          : item
      );
      
      // 异步保存
      saveHistory(newHistory);
      
      return newHistory;
    });
  }, [saveHistory]);

  // 获取最近搜索的地址
  const getRecentAddresses = useCallback((limit: number = 5): SearchHistoryItem[] => {
    return history.slice(0, limit);
  }, [history]);

  // 检查地址是否在历史中
  const isInHistory = useCallback((address: string): boolean => {
    return history.some(item => item.address.toLowerCase() === address.toLowerCase());
  }, [history]);

  // 获取历史统计
  const getHistoryStats = useCallback(() => {
    const solanaCount = history.filter(item => item.type === 'solana').length;
    const ethereumCount = history.filter(item => item.type === 'ethereum').length;
    
    return {
      total: history.length,
      solana: solanaCount,
      ethereum: ethereumCount,
      withLabels: history.filter(item => item.label).length
    };
  }, [history]);

  // 初始化时加载历史
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
};
