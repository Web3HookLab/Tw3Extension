import type { CAEvent, CAEventData, FilterState, SearchResult } from '~src/types/realtime-ca.types';
import { SEARCH_FIELDS } from './constants';

// 生成唯一ID
export const generateEventId = (): string => {
  return `ca_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// 格式化时间 - 支持多语言
export const formatTimestamp = (timestamp: string | number, locale?: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于1分钟
  if (diff < 60000) {
    return locale === 'zh' ? '刚刚' : 'Just now';
  }

  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return locale === 'zh' ? `${minutes}分钟前` : `${minutes}m ago`;
  }

  // 小于24小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return locale === 'zh' ? `${hours}小时前` : `${hours}h ago`;
  }

  // 大于24小时
  const days = Math.floor(diff / 86400000);
  if (days < 7) {
    return locale === 'zh' ? `${days}天前` : `${days}d ago`;
  }

  // 显示具体日期
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US');
};

// 格式化数字
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// 截断文本
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

// 截断地址
export const truncateAddress = (address: string, startLength = 6, endLength = 4): string => {
  if (address.length <= startLength + endLength) {
    return address;
  }
  return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
};

// 验证CA事件数据
export const validateCAEvent = (data: any): data is CAEvent => {
  return (
    data &&
    typeof data === 'object' &&
    data.type === 'realtime_ca' &&
    data.client_id &&
    data.timestamp &&
    data.data &&
    validateCAEventData(data.data)
  );
};

// 验证CA事件数据结构
export const validateCAEventData = (data: any): data is CAEventData => {
  return (
    data &&
    typeof data === 'object' &&
    data.user &&
    data.tweet &&
    data.ca_event &&
    data.ca_stats &&
    Array.isArray(data.mentions) &&
    Array.isArray(data.network)
  );
};

// 搜索CA事件
export const searchCAEvents = (
  events: CAEvent[],
  query: string,
  field: string = SEARCH_FIELDS.ALL
): SearchResult => {
  if (!query.trim()) {
    return {
      events,
      total: events.length,
      query: '',
    };
  }
  
  const lowerQuery = query.toLowerCase().trim();
  
  const filteredEvents = events.filter(event => {
    const { user, tweet, mentions } = event.data;
    
    switch (field) {
      case SEARCH_FIELDS.USER:
        return (
          user.name.toLowerCase().includes(lowerQuery) ||
          user.screen_name.toLowerCase().includes(lowerQuery)
        );
        
      case SEARCH_FIELDS.CONTENT:
        return tweet.content.toLowerCase().includes(lowerQuery);
        
      case SEARCH_FIELDS.SYMBOL:
        return mentions.some(mention => 
          mention.symbol.toLowerCase().includes(lowerQuery) ||
          mention.name.toLowerCase().includes(lowerQuery)
        );
        
      case SEARCH_FIELDS.ADDRESS:
        return mentions.some(mention => 
          mention.address.toLowerCase().includes(lowerQuery)
        );
        
      case SEARCH_FIELDS.ALL:
      default:
        return (
          user.name.toLowerCase().includes(lowerQuery) ||
          user.screen_name.toLowerCase().includes(lowerQuery) ||
          tweet.content.toLowerCase().includes(lowerQuery) ||
          mentions.some(mention => 
            mention.symbol.toLowerCase().includes(lowerQuery) ||
            mention.name.toLowerCase().includes(lowerQuery) ||
            mention.address.toLowerCase().includes(lowerQuery)
          )
        );
    }
  });
  
  return {
    events: filteredEvents,
    total: filteredEvents.length,
    query,
  };
};

// 过滤CA事件
export const filterCAEvents = (events: CAEvent[], filters: FilterState): CAEvent[] => {
  return events.filter(event => {
    const { user, mentions } = event.data;

    // 粉丝数过滤
    if (filters.minFollowers > 0 && user.followers_count < filters.minFollowers) {
      return false;
    }
    
    // 关键词过滤
    if (filters.keywords.length > 0) {
      const hasKeyword = filters.keywords.some(keyword => 
        event.data.tweet.content.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasKeyword) {
        return false;
      }
    }
    
    // 用户搜索过滤
    if (filters.userSearch.trim()) {
      const userQuery = filters.userSearch.toLowerCase();
      const matchUser = (
        user.name.toLowerCase().includes(userQuery) ||
        user.screen_name.toLowerCase().includes(userQuery)
      );
      if (!matchUser) {
        return false;
      }
    }
    
    // 代币符号搜索过滤
    if (filters.symbolSearch.trim()) {
      const symbolQuery = filters.symbolSearch.toLowerCase();
      const matchSymbol = mentions.some(mention => 
        mention.symbol.toLowerCase().includes(symbolQuery) ||
        mention.name.toLowerCase().includes(symbolQuery)
      );
      if (!matchSymbol) {
        return false;
      }
    }
    
    // 合约地址搜索过滤
    if (filters.addressSearch.trim()) {
      const addressQuery = filters.addressSearch.toLowerCase();
      const matchAddress = mentions.some(mention => 
        mention.address.toLowerCase().includes(addressQuery)
      );
      if (!matchAddress) {
        return false;
      }
    }
    
    // 日期范围过滤
    if (filters.dateRange.start || filters.dateRange.end) {
      const eventDate = new Date(event.timestamp);
      
      if (filters.dateRange.start && eventDate < filters.dateRange.start) {
        return false;
      }
      
      if (filters.dateRange.end && eventDate > filters.dateRange.end) {
        return false;
      }
    }
    
    return true;
  });
};

// 排序CA事件
export const sortCAEvents = (events: CAEvent[], sortBy: string): CAEvent[] => {
  const sortedEvents = [...events];
  
  switch (sortBy) {
    case 'timestamp_desc':
      return sortedEvents.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
    case 'timestamp_asc':
      return sortedEvents.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
    case 'followers_desc':
      return sortedEvents.sort((a, b) => 
        b.data.user.followers_count - a.data.user.followers_count
      );
      
    case 'followers_asc':
      return sortedEvents.sort((a, b) => 
        a.data.user.followers_count - b.data.user.followers_count
      );
      
    case 'mentions_desc':
      return sortedEvents.sort((a, b) => {
        const aMentions = a.data.mentions.reduce((sum, m) => sum + m.mention_stats.total_mentions, 0);
        const bMentions = b.data.mentions.reduce((sum, m) => sum + m.mention_stats.total_mentions, 0);
        return bMentions - aMentions;
      });
      
    case 'mentions_asc':
      return sortedEvents.sort((a, b) => {
        const aMentions = a.data.mentions.reduce((sum, m) => sum + m.mention_stats.total_mentions, 0);
        const bMentions = b.data.mentions.reduce((sum, m) => sum + m.mention_stats.total_mentions, 0);
        return aMentions - bMentions;
      });
      
    default:
      return sortedEvents;
  }
};

// 清理过期缓存
export const cleanExpiredCache = (events: CAEvent[], expiryDays: number): CAEvent[] => {
  const expiryTime = Date.now() - (expiryDays * 24 * 60 * 60 * 1000);
  return events.filter(event => event.received_at > expiryTime);
};

// 限制缓存大小
export const limitCacheSize = (events: CAEvent[], maxSize: number): CAEvent[] => {
  if (events.length <= maxSize) {
    return events;
  }

  // 按接收时间排序，保留最新的
  const sorted = events.sort((a, b) => b.received_at - a.received_at);
  return sorted.slice(0, maxSize);
};

// 打开Twitter链接
export const openTwitterProfile = (screenName: string): void => {
  const url = `https://twitter.com/${screenName}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

// 打开Twitter推文链接
export const openTwitterTweet = (screenName: string, tweetId: string): void => {
  const url = `https://twitter.com/${screenName}/status/${tweetId}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

// 复制到剪贴板
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// 生成数据哈希（用于检测数据变化）
export const generateDataHash = (data: any): string => {
  return btoa(JSON.stringify(data)).substring(0, 32);
};
