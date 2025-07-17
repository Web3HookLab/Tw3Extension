// Twitter Notes 常量定义

/**
 * 分页大小
 */
export const PAGE_SIZE = 20;

/**
 * 标签选项
 */
export const TAG_OPTIONS = [
  'CryptoNews', 'Airdrop', 'Web3Dev', 'VC', 'CryptoOG', 'OnChainData',
  'CryptoEducation', 'Project', 'MemeCoin', 'GameFi', 'NFT Collector',
  'CryptoRegulation', 'MEV', 'OG', 'KOL'
];

/**
 * 标签颜色映射
 */
export const TAG_COLOR_MAP: Record<string, string> = {
  CryptoNews: 'bg-blue-500 text-white',
  Airdrop: 'bg-green-500 text-white',
  Web3Dev: 'bg-purple-500 text-white',
  VC: 'bg-yellow-500 text-black',
  CryptoOG: 'bg-pink-500 text-white',
  OnChainData: 'bg-cyan-500 text-black',
  CryptoEducation: 'bg-indigo-500 text-white',
  Project: 'bg-orange-500 text-white',
  MemeCoin: 'bg-red-500 text-white',
  GameFi: 'bg-teal-500 text-white',
  'NFT Collector': 'bg-fuchsia-500 text-white',
  CryptoRegulation: 'bg-gray-700 text-white',
  MEV: 'bg-lime-500 text-black',
  OG: 'bg-amber-500 text-black',
  KOL: 'bg-purple-500 text-white'
};

/**
 * 最大标签数量限制
 */
export const MAX_TAGS_LIMIT = TAG_OPTIONS.length;

/**
 * API 请求限制
 */
export const API_LIMITS = {
  MAX_PAGES: 25,
  PAGE_LIMIT: 5000,
  MAX_RETRIES: 3
} as const;

/**
 * 缓存配置
 */
export const CACHE_CONFIG = {
  SYNC_CHECK_INTERVAL: 15000, // 15秒
  FALLBACK_ENABLED: true
} as const;
