/**
 * CA地址搜索数据转换工具
 * 将AddressTweet格式转换为K线分析所需的TweetEvent格式
 */

import type { AddressTweet, TokenInfo } from '~src/types/addressSearch.types';
import type { TweetEvent } from '~src/components/kline-analysis/types';

/**
 * 将AddressTweet转换为TweetEvent格式
 * @param tweet CA地址搜索返回的推文数据
 * @returns K线分析所需的推文事件格式
 */
export function convertAddressTweetToTweetEvent(tweet: AddressTweet): TweetEvent {
  return {
    tweet_id: tweet.tweet_id,
    name: tweet.name,
    screen_name: tweet.screen_name,
    followers_count: tweet.followers_count,
    profile_image_url_https: tweet.profile_image_url_https,
    tweet_time: tweet.tweet_time,
    status: tweet.status,
    description_zh: tweet.description_zh,
    description_en: tweet.description_en
  };
}

/**
 * 批量转换推文数据
 * @param tweets CA地址搜索返回的推文数组
 * @returns K线分析所需的推文事件数组
 */
export function convertAddressTweetsToTweetEvents(tweets: AddressTweet[]): TweetEvent[] {
  return tweets.map(convertAddressTweetToTweetEvent);
}

/**
 * 提取代币信息用于K线分析
 * @param token CA地址搜索返回的代币信息
 * @returns K线分析所需的代币数据
 */
export function extractTokenDataForKlineAnalysis(token: TokenInfo) {
  return {
    tokenAddress: token.address,
    tokenSymbol: token.symbol,
    tokenName: token.name,
    networkType: token.chain
  };
}

/**
 * 验证推文数据是否适合K线分析
 * @param tweets 推文数组
 * @returns 验证结果和过滤后的推文
 */
export function validateTweetsForKlineAnalysis(tweets: AddressTweet[]) {
  // 过滤掉无效的推文数据
  const validTweets = tweets.filter(tweet => {
    // 检查必需字段
    if (!tweet.tweet_id || !tweet.tweet_time || !tweet.screen_name) {
      return false;
    }

    // 检查时间格式
    const tweetTime = new Date(tweet.tweet_time);
    if (isNaN(tweetTime.getTime())) {
      return false;
    }

    // 只保留活跃状态的推文
    if (tweet.status !== 'active') {
      return false;
    }

    return true;
  });

  return {
    isValid: validTweets.length > 0,
    validCount: validTweets.length,
    totalCount: tweets.length,
    validTweets,
    hasEnoughData: validTweets.length >= 3 // 至少需要3条推文才有分析价值
  };
}

/**
 * 按时间排序推文事件
 * @param events 推文事件数组
 * @param order 排序方式：'asc' 升序，'desc' 降序
 * @returns 排序后的推文事件数组
 */
export function sortTweetEventsByTime(events: TweetEvent[], order: 'asc' | 'desc' = 'asc'): TweetEvent[] {
  return [...events].sort((a, b) => {
    const timeA = new Date(a.tweet_time).getTime();
    const timeB = new Date(b.tweet_time).getTime();
    
    return order === 'asc' ? timeA - timeB : timeB - timeA;
  });
}

/**
 * 过滤指定时间范围内的推文事件
 * @param events 推文事件数组
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 过滤后的推文事件数组
 */
export function filterTweetEventsByTimeRange(
  events: TweetEvent[], 
  startTime: Date, 
  endTime: Date
): TweetEvent[] {
  return events.filter(event => {
    const eventTime = new Date(event.tweet_time);
    return eventTime >= startTime && eventTime <= endTime;
  });
}

/**
 * 获取推文事件的时间统计信息
 * @param events 推文事件数组
 * @returns 时间统计信息
 */
export function getTweetEventsTimeStats(events: TweetEvent[]) {
  if (events.length === 0) {
    return {
      count: 0,
      earliestTime: null,
      latestTime: null,
      timeSpan: 0
    };
  }

  const times = events.map(event => new Date(event.tweet_time).getTime());
  const earliestTime = new Date(Math.min(...times));
  const latestTime = new Date(Math.max(...times));
  const timeSpan = latestTime.getTime() - earliestTime.getTime();

  return {
    count: events.length,
    earliestTime,
    latestTime,
    timeSpan, // 毫秒
    timeSpanDays: Math.ceil(timeSpan / (1000 * 60 * 60 * 24)) // 天数
  };
}

/**
 * 检查代币信息是否支持K线分析
 * @param token 代币信息
 * @returns 检查结果
 */
export function checkTokenSupportForKlineAnalysis(token: TokenInfo) {
  const supportedChains = ['solana', 'ethereum'];
  const isChainSupported = supportedChains.includes(token.chain);
  
  return {
    isSupported: isChainSupported && !!token.address,
    chain: token.chain,
    address: token.address,
    reason: !isChainSupported 
      ? `不支持的链类型: ${token.chain}` 
      : !token.address 
      ? '缺少代币地址' 
      : null
  };
}
