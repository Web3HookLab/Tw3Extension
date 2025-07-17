import type { TwitterTrendItem, TwitterFollower } from '~src/types/twitter-trends.types';

/**
 * 生成数据哈希用于比较
 * 用于判断数据是否发生变化，避免不必要的重新渲染
 */
export const generateDataHash = (data: TwitterTrendItem[]): string => {
  if (!Array.isArray(data)) return 'invalid';
  if (data.length === 0) return 'empty';
  
  // 比较用户列表、顺序和关注者数量的显著变化
  const hashData = data.map((item, index) => ({
    screen_name: item.screen_name,
    name: item.name,
    position: index,
    // 将关注者数量按3的倍数分组，允许更频繁的更新
    follower_tier: Math.floor((item.follower_count || 0) / 3) * 3,
    // 记录关注者数量范围，而不是精确数量
    followers_range: Math.floor((item.followers?.length || 0) / 2) * 2
  }));
  
  return JSON.stringify(hashData);
};

/**
 * 获取最早关注者
 * 从关注者列表中找出最早关注的用户
 */
export const getEarliestFollower = (followers: TwitterFollower[]): TwitterFollower | null => {
  if (!followers || followers.length === 0) return null;
  return followers.reduce((earliest, current) => {
    return new Date(current.event_time) < new Date(earliest.event_time) ? current : earliest;
  });
};

/**
 * 跳转到 Twitter 用户页面
 */
export const openTwitterProfile = (screenName: string): void => {
  window.open(`https://x.com/${screenName}`, '_blank');
};
