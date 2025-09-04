import { useState, useCallback, useEffect } from 'react';
import { Storage } from '@plasmohq/storage';
import { STORAGE_KEYS } from '../constants';
import { searchCAEvents, cleanExpiredCache, limitCacheSize } from '../utils';
import type { CAEvent, CachedCAData, SearchResult } from '~src/types/realtime-ca.types';

const storage = new Storage({ area: 'local' });

interface UseCACache {
  cachedEvents: CAEvent[];
  addEvent: (event: CAEvent) => void;
  addEvents: (events: CAEvent[]) => void;
  searchEvents: (query: string, field?: string) => SearchResult;
  clearCache: () => void;
  loadCache: () => Promise<void>;
  saveCache: () => Promise<void>;
  getCacheStats: () => {
    count: number;
    oldestEvent: CAEvent | null;
    newestEvent: CAEvent | null;
    sizeInMB: number;
  };
}

export function useCACache(maxCacheSize: number = 5000, expiryDays: number = 7): UseCACache {
  const [cachedEvents, setCachedEvents] = useState<CAEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 加载缓存数据
  const loadCache = useCallback(async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const cached = await storage.get(STORAGE_KEYS.CACHE) as CachedCAData;
      
      if (cached && Array.isArray(cached.events)) {
        // 清理过期数据
        let events = cleanExpiredCache(cached.events, expiryDays);

        // 限制缓存大小
        events = limitCacheSize(events, maxCacheSize);

        setCachedEvents(events);

        // 如果数据被清理，保存更新后的缓存
        if (events.length !== cached.events.length) {
          await saveCache();
        }
      } else {
        setCachedEvents([]);
      }
    } catch (error) {
      console.error('❌ Failed to load cache:', error);
      setCachedEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [maxCacheSize, expiryDays]);
  
  // 保存缓存数据
  const saveCache = useCallback(async () => {
    try {
      const cacheData: CachedCAData = {
        events: cachedEvents,
        lastUpdated: Date.now(),
        totalCount: cachedEvents.length
      };
      
      await storage.set(STORAGE_KEYS.CACHE, cacheData);
    } catch (error) {
      console.error('❌ Failed to save cache:', error);
    }
  }, [cachedEvents]);
  
  // 添加单个事件
  const addEvent = useCallback((event: CAEvent) => {
    setCachedEvents(prev => {
      // 直接添加新事件到开头（服务器保证数据不重复）
      let newEvents = [event, ...prev];

      // 限制缓存大小
      newEvents = limitCacheSize(newEvents, maxCacheSize);

      // 立即保存到存储（异步，使用新计算的数据）
      const saveToStorage = async () => {
        try {
          const cacheData: CachedCAData = {
            events: newEvents,
            lastUpdated: Date.now(),
            totalCount: newEvents.length
          };
          await storage.set(STORAGE_KEYS.CACHE, cacheData);
        } catch (error) {
          console.error('❌ Failed to auto-save cache (single):', error);
        }
      };
      saveToStorage();

      return newEvents;
    });
  }, [maxCacheSize]);
  
  // 批量添加事件
  const addEvents = useCallback((events: CAEvent[]) => {
    if (events.length === 0) return;

    setCachedEvents(prev => {
      // 直接使用所有事件（服务器保证数据不重复）
      const newEvents = events;

      // 合并并排序（按时间戳降序）
      let combined = [...newEvents, ...prev].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // 限制缓存大小
      combined = limitCacheSize(combined, maxCacheSize);

      // 立即保存到存储（异步，使用新计算的数据）
      const saveToStorage = async () => {
        try {
          const cacheData: CachedCAData = {
            events: combined,
            lastUpdated: Date.now(),
            totalCount: combined.length
          };
          await storage.set(STORAGE_KEYS.CACHE, cacheData);
        } catch (error) {
          console.error('❌ Failed to auto-save cache (batch):', error);
        }
      };
      saveToStorage();

      return combined;
    });
  }, [maxCacheSize]);
  
  // 搜索事件
  const searchEvents = useCallback((query: string, field?: string): SearchResult => {
    return searchCAEvents(cachedEvents, query, field);
  }, [cachedEvents]);
  
  // 清空缓存
  const clearCache = useCallback(async () => {
    try {
      setCachedEvents([]);
      await storage.remove(STORAGE_KEYS.CACHE);
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }, []);
  
  // 获取缓存统计信息
  const getCacheStats = useCallback(() => {
    const count = cachedEvents.length;
    const oldestEvent = count > 0 ? cachedEvents[count - 1] : null;
    const newestEvent = count > 0 ? cachedEvents[0] : null;
    
    // 估算缓存大小（MB）
    const sizeInMB = count > 0 ? 
      (JSON.stringify(cachedEvents).length * 2) / (1024 * 1024) : 0;
    
    return {
      count,
      oldestEvent,
      newestEvent,
      sizeInMB: Math.round(sizeInMB * 100) / 100
    };
  }, [cachedEvents]);
  
  // 注意：自动保存已经在addEvent和addEvents中实现，这里不需要额外的防抖保存
  
  // 定期清理过期数据
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setCachedEvents(prev => {
        const cleaned = cleanExpiredCache(prev, expiryDays);
        if (cleaned.length !== prev.length) {
          return cleaned;
        }
        return prev;
      });
    }, 60000); // 每分钟检查一次
    
    return () => clearInterval(cleanupInterval);
  }, [expiryDays]);
  
  return {
    cachedEvents,
    addEvent,
    addEvents,
    searchEvents,
    clearCache,
    loadCache,
    saveCache,
    getCacheStats
  };
}
