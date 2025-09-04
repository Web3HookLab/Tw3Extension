/**
 * 数据转换工具
 * 将 address_tweets API 返回的数据转换为 K线分析组件需要的格式
 */

import type { AddressTweet, AddressTweetsResponse } from '~src/services/addressTweets.service'
import type { TweetEvent, KlineDataWithType, PumpFunCoinResponse, PumpFunCandleData, RaydiumMintResponse, RaydiumKlineResponse } from './types'

/**
 * API chain 名称到 GeckoTerminal 网络标识符的映射表
 */
export const CHAIN_MAPPING: Record<string, string> = {
  // 首字母大写版本（API标准格式）
  'Ethereum': 'ethereum',
  'BSC': 'bsc',
  'Base': 'base',
  'xLayer': 'x-layer',
  'Arbitrum': 'arbitrum',
  'Polygon': 'polygon',
  'Optimism': 'optimism',
  'Avalanche': 'avalanche',
  'Solana': 'solana',

  // 小写版本（normalizedNetwork格式）
  'ethereum': 'ethereum',
  'bsc': 'bsc',
  'base': 'base',
  'xlayer': 'x-layer',
  'arbitrum': 'arbitrum',
  'polygon': 'polygon',
  'optimism': 'optimism',
  'avalanche': 'avalanche',
  'solana': 'solana'
};

/**
 * 网络优先级配置（数字越小优先级越高）
 * 用于在多个支持的链中选择优先尝试的顺序
 */
export const NETWORK_PRIORITY: Record<string, number> = {
  'ethereum': 1,    // 以太坊主网 - 最高优先级
  'bsc': 2,         // 币安智能链 - 流动性通常较好
  'base': 3,        // Base 链 - 新兴但活跃
  'arbitrum': 4,    // Arbitrum - L2 解决方案
  'polygon': 5,     // Polygon - 低费用
  'optimism': 6,    // Optimism - L2 解决方案
  'avalanche': 7,   // Avalanche - 高性能
  'x-layer': 8,     // xLayer - 较新的链
  'solana': 9       // Solana - 单独的生态系统
};

/**
 * 链的显示信息配置
 */
export const CHAIN_DISPLAY_INFO: Record<string, {
  name: string;
  shortName: string;
  color: string;
  icon?: string;
}> = {
  'ethereum': {
    name: 'Ethereum',
    shortName: 'ETH',
    color: '#627EEA',
    icon: '⟠'
  },
  'bsc': {
    name: 'BNB Chain',
    shortName: 'BSC',
    color: '#F3BA2F',
    icon: '🟡'
  },
  'base': {
    name: 'Base',
    shortName: 'BASE',
    color: '#0052FF',
    icon: '🔵'
  },
  'arbitrum': {
    name: 'Arbitrum',
    shortName: 'ARB',
    color: '#28A0F0',
    icon: '🔷'
  },
  'polygon': {
    name: 'Polygon',
    shortName: 'MATIC',
    color: '#8247E5',
    icon: '🟣'
  },
  'optimism': {
    name: 'Optimism',
    shortName: 'OP',
    color: '#FF0420',
    icon: '🔴'
  },
  'avalanche': {
    name: 'Avalanche',
    shortName: 'AVAX',
    color: '#E84142',
    icon: '🔺'
  },
  'x-layer': {
    name: 'X Layer',
    shortName: 'OKB',
    color: '#000000',
    icon: '⚫'
  },
  'solana': {
    name: 'Solana',
    shortName: 'SOL',
    color: '#9945FF',
    icon: '◎'
  }
};

/**
 * 将 address_tweets API 返回的推文数据转换为 TweetEvent 格式
 */
export function transformAddressTweetsToEvents(response: AddressTweetsResponse): TweetEvent[] {
  if (!response.data?.tweets) return []

  return response.data.tweets.map((tweet: AddressTweet): TweetEvent => ({
    tweet_id: tweet.tweet_id,
    name: tweet.name,
    screen_name: tweet.screen_name,
    followers_count: tweet.followers_count,
    profile_image_url_https: tweet.profile_image_url_https,
    tweet_time: tweet.tweet_time,
    status: tweet.status,
    description_zh: tweet.description_zh || '',
    description_en: tweet.description_en || ''
  }))
}

/**
 * 解析时间为Unix秒时间戳
 */
export function parseToUnixSeconds(timeInput: string | number): number | null {
  if (typeof timeInput === 'number') {
    // 如果是毫秒时间戳，转换为秒
    return timeInput > 1e10 ? Math.floor(timeInput / 1000) : timeInput
  }

  if (typeof timeInput === 'string') {
    // 如果是ISO格式或其他日期字符串
    if (timeInput.includes('T') || timeInput.includes('/') || timeInput.includes('-')) {
      const date = new Date(timeInput)
      return isNaN(date.getTime()) ? null : Math.floor(date.getTime() / 1000)
    } else {
      // 如果是纯数字字符串
      const num = parseInt(timeInput)
      return isNaN(num) ? null : (num > 1e10 ? Math.floor(num / 1000) : num)
    }
  }

  return null
}

/**
 * 验证和清理K线数据
 */
export function validateAndCleanKlineData(data: KlineDataWithType[]): KlineDataWithType[] {
  return data.filter(item => {
    // 检查必需字段
    if (!item.time || !item.open || !item.high || !item.low || !item.close) {
      return false
    }

    // 检查数值有效性
    const prices = [item.open, item.high, item.low, item.close]
    if (prices.some(price => !isFinite(price) || price <= 0)) {
      return false
    }

    // 检查价格逻辑关系
    if (item.high < Math.max(item.open, item.close) ||
        item.low > Math.min(item.open, item.close)) {
      return false
    }

    // 检查时间戳
    const timestamp = Number(item.time)
    if (!isFinite(timestamp) || timestamp <= 0) {
      return false
    }

    return true
  }).sort((a, b) => Number(a.time) - Number(b.time)) // 按时间排序
}

/**
 * 解析 API 返回的 chain 字符串为支持的链数组
 * @param chainString API 返回的 chain 字符串，如 "BSC,Arbitrum,Optimism,Base,Avalanche,xLayer"
 * @returns 支持的 GeckoTerminal 网络标识符数组
 */
export function parseChainString(chainString: string): string[] {
  if (!chainString || typeof chainString !== 'string') {
    return [];
  }

  return chainString
    .split(',')
    .map(chain => chain.trim())
    .map(chain => CHAIN_MAPPING[chain])
    .filter(Boolean); // 过滤掉未映射的链
}

/**
 * 根据优先级排序支持的链
 * @param supportedChains 支持的链数组
 * @returns 按优先级排序的链数组
 */
export function sortChainsByPriority(supportedChains: string[]): string[] {
  return supportedChains
    .filter(chain => NETWORK_PRIORITY[chain] !== undefined)
    .sort((a, b) => NETWORK_PRIORITY[a] - NETWORK_PRIORITY[b]);
}

/**
 * 获取链的显示信息
 * @param networkId GeckoTerminal 网络标识符
 * @returns 链的显示信息
 */
export function getChainDisplayInfo(networkId: string) {
  return CHAIN_DISPLAY_INFO[networkId] || {
    name: networkId,
    shortName: networkId.toUpperCase(),
    color: '#666666',
    icon: '🔗'
  };
}

/**
 * 检查是否为 EVM 链
 * @param networkId GeckoTerminal 网络标识符
 * @returns 是否为 EVM 链
 */
export function isEvmChain(networkId: string): boolean {
  const evmChains = ['ethereum', 'bsc', 'base', 'arbitrum', 'polygon', 'optimism', 'avalanche', 'x-layer'];
  return evmChains.includes(networkId);
}

/**
 * 根据地址格式识别网络类型
 */
export function detectNetworkFromAddress(address: string): string {
  console.log(`🔍 detectNetworkFromAddress called with: "${address}" (length: ${address.length})`);

  // ETH/EVM 地址格式：0x + 40个十六进制字符
  const isEthFormat = /^0x[a-fA-F0-9]{40}$/.test(address);
  console.log(`🔍 ETH format test: ${isEthFormat}`);
  if (isEthFormat) {
    console.log(`🔍 Detected as ethereum`);
    return 'ethereum'; // 默认使用 ethereum，GeckoTerminal 会自动处理多个 EVM 链
  }

  // Solana 地址格式检测：
  // 1. 长度在32-44个字符之间
  // 2. 不以0x开头
  // 3. 包含字母和数字的组合
  const lengthCheck = address.length >= 32 && address.length <= 44;
  const notEthPrefix = !address.startsWith('0x');
  const hasAlphaNumeric = /^[A-Za-z0-9]+$/.test(address);

  console.log(`🔍 Solana format checks:`, {
    lengthCheck,
    notEthPrefix,
    hasAlphaNumeric,
    length: address.length
  });

  if (lengthCheck && notEthPrefix && hasAlphaNumeric) {
    console.log(`🔍 Detected as solana (relaxed check)`);
    return 'solana';
  }

  // 默认返回 solana（向后兼容）
  console.log(`🔍 No format matched, defaulting to solana`);
  return 'solana';
}

/**
 * 尝试多个 EVM 网络获取代币信息
 */
export async function tryMultipleEvmNetworks(address: string): Promise<{
  networkIdentifier: string;
  poolData: any;
} | null> {
  // 常见的 EVM 网络，按优先级排序
  const evmNetworks = [
    'ethereum',
    'bsc',
    'base',
    'x-layer',
    'arbitrum',
    'polygon',
    'optimism',
    'avalanche'
  ];

  for (const network of evmNetworks) {
    try {
      console.log(`🔍 Trying ${network} network for address: ${address}`);

      const poolResponse = await fetch(`https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${address}/pools`);

      if (poolResponse.ok) {
        const poolData = await poolResponse.json();
        if (poolData.data && poolData.data.length > 0) {
          console.log(`✅ Found token on ${network} network`);
          return {
            networkIdentifier: network,
            poolData: poolData
          };
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to check ${network} network:`, error);
      continue;
    }
  }

  return null;
}

/**
 * 根据支持的链列表获取 GeckoTerminal K线数据
 * @param address 代币地址
 * @param supportedChains 支持的链数组（GeckoTerminal 网络标识符）
 * @returns K线数据和实际使用的网络信息
 */
export async function fetchGeckoTerminalDataWithChains(
  address: string,
  supportedChains: string[]
): Promise<{
  data: KlineDataWithType[];
  actualNetwork: string;
} | null> {
  console.log(`🔍 fetchGeckoTerminalDataWithChains called:`, {
    address,
    supportedChains,
    chainsCount: supportedChains?.length || 0
  });

  if (!supportedChains || supportedChains.length === 0) {
    console.warn('⚠️ No supported chains provided to fetchGeckoTerminalDataWithChains');
    return null;
  }

  // 按优先级排序支持的链
  const prioritizedChains = sortChainsByPriority(supportedChains);
  console.log(`🔍 Trying chains in priority order: [${prioritizedChains.join(', ')}]`);

  // 依次尝试每个支持的链
  for (const networkId of prioritizedChains) {
    try {
      console.log(`🔍 Trying ${networkId} network for address: ${address}`);

      // 获取池信息
      const poolResponse = await fetch(`https://api.geckoterminal.com/api/v2/networks/${networkId}/tokens/${address}/pools`);

      if (!poolResponse.ok) {
        console.warn(`⚠️ ${networkId} pool API failed: ${poolResponse.status}`);
        continue;
      }

      const poolData = await poolResponse.json();
      if (!poolData.data || poolData.data.length === 0) {
        console.warn(`⚠️ No pools found on ${networkId}`);
        continue;
      }

      const poolId = poolData.data[0].id?.replace(`${networkId}_`, "");

      // 获取K线数据
      const candleResponse = await fetch(`https://api.geckoterminal.com/api/v2/networks/${networkId}/pools/${poolId}/ohlcv/minute?aggregate=15&limit=1000&include_empty_intervals=true`);

      if (!candleResponse.ok) {
        console.warn(`⚠️ ${networkId} candle API failed: ${candleResponse.status}`);
        continue;
      }

      const candleData = await candleResponse.json();
      if (!candleData.data?.attributes?.ohlcv_list) {
        console.warn(`⚠️ No candle data found on ${networkId}`);
        continue;
      }

      const rawData = candleData.data.attributes.ohlcv_list.map((item: number[]): KlineDataWithType => ({
        time: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5],
        source: 'GeckoTerminal'
      }));

      const validatedData = validateAndCleanKlineData(rawData);

      if (validatedData.length > 0) {
        console.log(`✅ Successfully fetched data from ${networkId}: ${validatedData.length} data points`);
        return {
          data: validatedData,
          actualNetwork: networkId
        };
      }

    } catch (error) {
      console.warn(`⚠️ Error fetching data from ${networkId}:`, error);
      continue;
    }
  }

  console.log(`❌ Failed to fetch data from all supported chains: [${prioritizedChains.join(', ')}]`);
  console.log(`📊 Chain attempt summary:`, {
    totalChains: prioritizedChains.length,
    attemptedChains: prioritizedChains,
    address: address
  });
  return null;
}

/**
 * 获取 GeckoTerminal K线数据（支持多链）- 保持向后兼容
 */
export async function fetchGeckoTerminalData(address: string): Promise<KlineDataWithType[] | null> {
  try {
    // 1. 根据地址格式检测网络类型
    const detectedNetwork = detectNetworkFromAddress(address);
    console.log(`🔍 Detected network: ${detectedNetwork} for address: ${address}`);

    let networkId = detectedNetwork;
    let poolData: any = null;

    // 2. 如果是 EVM 地址，尝试多个网络
    if (detectedNetwork === 'ethereum') {
      const evmResult = await tryMultipleEvmNetworks(address);
      if (evmResult) {
        networkId = evmResult.networkIdentifier;
        poolData = evmResult.poolData;
        console.log(`✅ Found token on ${networkId} network`);
      } else {
        console.log(`❌ Token not found on any EVM network`);
        return null;
      }
    } else {
      // 3. 对于 Solana，直接获取池信息
      const poolResponse = await fetch(`https://api.geckoterminal.com/api/v2/networks/${networkId}/tokens/${address}/pools`)
      if (!poolResponse.ok) {
        throw new Error(`GeckoTerminal pool API failed: ${poolResponse.status}`)
      }

      poolData = await poolResponse.json()
    }

    // 4. 检查池数据
    if (!poolData?.data || poolData.data.length === 0) {
      return null
    }

    const poolId = poolData.data[0].id?.replace(`${networkId}_`, "")

    // 5. 获取K线数据
    const candleResponse = await fetch(`https://api.geckoterminal.com/api/v2/networks/${networkId}/pools/${poolId}/ohlcv/minute?aggregate=15&limit=1000&include_empty_intervals=true`)
    if (!candleResponse.ok) {
      throw new Error(`GeckoTerminal candle API failed: ${candleResponse.status}`)
    }

    const candleData = await candleResponse.json()
    if (!candleData.data?.attributes?.ohlcv_list) {
      return null
    }

    const rawData = candleData.data.attributes.ohlcv_list.map((item: number[]): KlineDataWithType => ({
      time: item[0],
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
      volume: item[5],
      source: 'GeckoTerminal'
    }))

    return validateAndCleanKlineData(rawData)

  } catch (error) {
    console.error('❌ GeckoTerminal data fetch failed:', error)
    return null
  }
}

/**
 * 获取 Pump.fun K线数据
 */
export async function fetchPumpFunData(address: string): Promise<KlineDataWithType[] | null> {
  try {
    // 获取代币信息
    const coinResponse = await fetch(`https://frontend-api-v3.pump.fun/coins/${address}`)
    if (!coinResponse.ok) {
      throw new Error(`Pump.fun coin API failed: ${coinResponse.status}`)
    }
    
    const coinData: PumpFunCoinResponse = await coinResponse.json()
    const createdTs = coinData.created_timestamp
    
    // 获取K线数据
    const candleResponse = await fetch(
      `https://swap-api.pump.fun/v2/coins/${address}/candles?interval=15m&limit=1000&currency=USD&createdTs=${createdTs}`
    )
    if (!candleResponse.ok) {
      throw new Error(`Pump.fun candle API failed: ${candleResponse.status}`)
    }

    const candleData: PumpFunCandleData[] = await candleResponse.json()
    
    const rawData = candleData.map((item): KlineDataWithType => ({
      time: item.timestamp,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      source: 'Pump.fun'
    }))

    return validateAndCleanKlineData(rawData)

  } catch (error) {
    console.error('❌ Pump.fun data fetch failed:', error)
    return null
  }
}

/**
 * 获取 Raydium K线数据
 */
export async function fetchRaydiumData(address: string): Promise<KlineDataWithType[] | null> {
  try {
    // 获取 poolId
    const mintResponse = await fetch(`https://launch-mint-v1.raydium.io/get/by/mints?ids=${address}`)
    if (!mintResponse.ok) {
      throw new Error(`Raydium mint API failed: ${mintResponse.status}`)
    }
    
    const mintData: RaydiumMintResponse = await mintResponse.json()
    if (!mintData.success || !mintData.data || mintData.data.length === 0) {
      return null
    }
    
    const poolId = mintData.data[0].id
    
    // 获取K线数据
    const klineResponse = await fetch(
      `https://launch-history-v1.raydium.io/kline?poolId=${poolId}&interval=15m&limit=300`
    )
    if (!klineResponse.ok) {
      throw new Error(`Raydium kline API failed: ${klineResponse.status}`)
    }

    const klineData: RaydiumKlineResponse = await klineResponse.json()
    if (!klineData.success || !klineData.data) {
      return null
    }

    const rawData = klineData.data.map((item): KlineDataWithType => ({
      time: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      source: 'Raydium'
    }))

    return validateAndCleanKlineData(rawData)

  } catch (error) {
    console.error('❌ Raydium data fetch failed:', error)
    return null
  }
}

/**
 * 按优先级获取K线数据（支持多链）
 * @param address 代币地址
 * @param supportedChainsOrNetworkType 支持的链数组或网络类型字符串（向后兼容）
 * @returns K线数据、数据源和实际网络信息
 */
export async function fetchKlineData(
  address: string,
  supportedChainsOrNetworkType?: string[] | string
): Promise<{
  data: KlineDataWithType[];
  source: string;
  actualNetwork?: string;
} | null> {

  // 处理参数：支持新的数组格式和旧的字符串格式
  let supportedChains: string[] = [];
  let networkType: string | undefined;

  if (Array.isArray(supportedChainsOrNetworkType)) {
    // 新格式：支持的链数组
    supportedChains = supportedChainsOrNetworkType;
    console.log(`🔍 Using supported chains: ${supportedChains.join(', ')}`);
  } else if (typeof supportedChainsOrNetworkType === 'string') {
    // 旧格式：网络类型字符串（向后兼容）
    networkType = supportedChainsOrNetworkType;
    console.log(`🔍 Using legacy network type: ${networkType}`);
  }

  // 1. 如果有支持的链列表，使用新的多链获取方法
  if (supportedChains.length > 0) {
    const result = await fetchGeckoTerminalDataWithChains(address, supportedChains);
    if (result) {
      return {
        data: result.data,
        source: 'GeckoTerminal',
        actualNetwork: result.actualNetwork
      };
    }
    // 如果多链获取失败，不再尝试其他数据源（因为已经尝试了所有支持的链）
    return null;
  }

  // 2. 向后兼容：使用旧的逻辑
  // 首先尝试 GeckoTerminal（支持多链）
  let data = await fetchGeckoTerminalData(address)
  if (data && data.length > 0) {
    return { data, source: 'GeckoTerminal' }
  }

  // 3. 如果是非 Solana 网络，只使用 GeckoTerminal
  if (networkType && networkType.toLowerCase() !== 'solana') {
    console.log(`⚠️ Non-Solana network (${networkType}), only GeckoTerminal supported`);
    return null;
  }

  // 4. 对于 Solana 网络，继续尝试其他数据源
  // 尝试 Pump.fun
  data = await fetchPumpFunData(address)
  if (data && data.length > 0) {
    return { data, source: 'Pump.fun' }
  }

  // 5. 最后尝试 Raydium
  data = await fetchRaydiumData(address)
  if (data && data.length > 0) {
    return { data, source: 'Raydium' }
  }

  return null
}

/**
 * 测试函数：验证 ETH 地址的网络识别和 K 线数据获取
 * 使用示例：testEthAddressKlineData('0x9212cf1f9f4a9c69bb010146ba5b0725169d4444')
 */
export async function testEthAddressKlineData(ethAddress: string): Promise<void> {
  console.log(`🧪 Testing ETH address K-line data fetch: ${ethAddress}`);

  try {
    // 1. 测试网络检测
    console.log('1️⃣ Testing network detection...');
    const detectedNetwork = detectNetworkFromAddress(ethAddress);
    console.log('✅ Network detected:', detectedNetwork);

    // 2. 测试多网络搜索
    console.log('2️⃣ Testing multi-network search...');
    const evmResult = await tryMultipleEvmNetworks(ethAddress);

    if (evmResult) {
      console.log('✅ EVM search successful:', {
        networkIdentifier: evmResult.networkIdentifier,
        poolsFound: evmResult.poolData.data.length
      });
    } else {
      console.log('❌ EVM search failed');
      return;
    }

    // 3. 测试 K 线数据获取
    console.log('3️⃣ Testing K-line data fetch...');
    const klineResult = await fetchKlineData(ethAddress, evmResult.networkIdentifier);

    if (klineResult) {
      console.log('✅ K-line data fetch successful:', {
        source: klineResult.source,
        dataPoints: klineResult.data.length,
        firstPoint: klineResult.data[0],
        lastPoint: klineResult.data[klineResult.data.length - 1]
      });
    } else {
      console.log('❌ K-line data fetch failed');
    }

  } catch (error) {
    console.error('🚫 Test failed:', error);
  }
}

/**
 * 测试链映射和解析功能
 * 使用示例：testChainMapping("BSC,Arbitrum,Optimism,Base,Avalanche,xLayer")
 */
export function testChainMapping(chainString: string): void {
  console.log(`🧪 Testing chain mapping for: "${chainString}"`);

  try {
    // 1. 解析链字符串
    const supportedChains = parseChainString(chainString);
    console.log('✅ Parsed chains:', supportedChains);

    // 2. 按优先级排序
    const sortedChains = sortChainsByPriority(supportedChains);
    console.log('✅ Sorted by priority:', sortedChains);

    // 3. 显示每个链的信息
    sortedChains.forEach((chain, index) => {
      const displayInfo = getChainDisplayInfo(chain);
      const priority = NETWORK_PRIORITY[chain];
      console.log(`${index + 1}. ${displayInfo.icon} ${displayInfo.name} (${displayInfo.shortName}) - Priority: ${priority}`);
    });

    // 4. 检查 EVM 链
    const evmChains = sortedChains.filter(isEvmChain);
    console.log('✅ EVM chains:', evmChains);

  } catch (error) {
    console.error('🚫 Chain mapping test failed:', error);
  }
}

/**
 * 测试多链 K 线数据获取功能
 * 使用示例：testMultiChainKlineData('0x9212cf1f9f4a9c69bb010146ba5b0725169d4444', 'BSC,Base,Arbitrum')
 */
export async function testMultiChainKlineData(address: string, chainString: string): Promise<void> {
  console.log(`🧪 Testing multi-chain K-line data fetch for: ${address}`);
  console.log(`🔗 Chains: ${chainString}`);

  try {
    // 1. 解析和排序链
    const supportedChains = parseChainString(chainString);
    const sortedChains = sortChainsByPriority(supportedChains);
    console.log('✅ Supported chains:', sortedChains);

    // 2. 测试新的多链获取方法
    console.log('2️⃣ Testing multi-chain fetch...');
    const result = await fetchKlineData(address, supportedChains);

    if (result) {
      console.log('✅ Multi-chain fetch successful:', {
        source: result.source,
        actualNetwork: result.actualNetwork,
        dataPoints: result.data.length,
        firstPoint: result.data[0],
        lastPoint: result.data[result.data.length - 1]
      });

      // 显示使用的网络信息
      if (result.actualNetwork) {
        const displayInfo = getChainDisplayInfo(result.actualNetwork);
        console.log(`🎯 Used network: ${displayInfo.icon} ${displayInfo.name} (${displayInfo.shortName})`);
      }
    } else {
      console.log('❌ Multi-chain fetch failed');
    }

  } catch (error) {
    console.error('🚫 Multi-chain test failed:', error);
  }
}

/**
 * 综合测试多链切换功能
 * 使用示例：testMultiChainSwitching('0x9212cf1f9f4a9c69bb010146ba5b0725169d4444', 'BSC,Arbitrum,Optimism,Base,Avalanche,xLayer')
 */
export async function testMultiChainSwitching(address: string, chainString: string): Promise<void> {
  console.log(`🧪 Comprehensive multi-chain switching test for: ${address}`);
  console.log(`🔗 Chain string: ${chainString}`);

  try {
    // 1. 测试链映射和解析
    console.log('\n1️⃣ Testing chain mapping and parsing...');
    testChainMapping(chainString);

    // 2. 解析支持的链
    const supportedChains = parseChainString(chainString);
    const sortedChains = sortChainsByPriority(supportedChains);

    if (sortedChains.length === 0) {
      console.log('❌ No valid chains found');
      return;
    }

    console.log(`\n2️⃣ Testing individual chain data fetch...`);
    const chainResults: Record<string, any> = {};

    // 3. 逐个测试每个链
    for (const chainId of sortedChains) {
      const displayInfo = getChainDisplayInfo(chainId);
      console.log(`\n🔍 Testing ${displayInfo.icon} ${displayInfo.name} (${displayInfo.shortName})...`);

      try {
        const result = await fetchGeckoTerminalDataWithChains(address, [chainId]);

        if (result) {
          chainResults[chainId] = {
            success: true,
            dataPoints: result.data.length,
            actualNetwork: result.actualNetwork,
            firstPrice: result.data[0]?.close,
            lastPrice: result.data[result.data.length - 1]?.close
          };
          console.log(`  ✅ Success: ${result.data.length} data points`);
        } else {
          chainResults[chainId] = {
            success: false,
            error: 'No data available'
          };
          console.log(`  ❌ Failed: No data available`);
        }
      } catch (error) {
        chainResults[chainId] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // 添加延迟避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. 测试优先级选择
    console.log(`\n3️⃣ Testing priority-based selection...`);
    const priorityResult = await fetchKlineData(address, supportedChains);

    if (priorityResult) {
      console.log('✅ Priority selection successful:', {
        selectedNetwork: priorityResult.actualNetwork,
        source: priorityResult.source,
        dataPoints: priorityResult.data.length
      });

      if (priorityResult.actualNetwork) {
        const displayInfo = getChainDisplayInfo(priorityResult.actualNetwork);
        console.log(`🎯 Selected: ${displayInfo.icon} ${displayInfo.name} (Priority: ${NETWORK_PRIORITY[priorityResult.actualNetwork]})`);
      }
    } else {
      console.log('❌ Priority selection failed');
    }

    // 5. 生成测试报告
    console.log(`\n📊 Test Summary:`);
    console.log(`Total chains tested: ${sortedChains.length}`);

    const successfulChains = Object.entries(chainResults).filter(([_, result]) => result.success);
    const failedChains = Object.entries(chainResults).filter(([_, result]) => !result.success);

    console.log(`Successful chains: ${successfulChains.length}`);
    successfulChains.forEach(([chainId, result]) => {
      const displayInfo = getChainDisplayInfo(chainId);
      console.log(`  ✅ ${displayInfo.icon} ${displayInfo.name}: ${result.dataPoints} data points`);
    });

    console.log(`Failed chains: ${failedChains.length}`);
    failedChains.forEach(([chainId, result]) => {
      const displayInfo = getChainDisplayInfo(chainId);
      console.log(`  ❌ ${displayInfo.icon} ${displayInfo.name}: ${result.error}`);
    });

    // 6. 建议
    if (successfulChains.length > 0) {
      console.log(`\n💡 Recommendations:`);
      console.log(`- Multi-chain switching should work with ${successfulChains.length} chains`);
      console.log(`- Priority order: ${sortedChains.map(id => getChainDisplayInfo(id).shortName).join(' > ')}`);

      if (priorityResult?.actualNetwork) {
        const displayInfo = getChainDisplayInfo(priorityResult.actualNetwork);
        console.log(`- Default selection: ${displayInfo.icon} ${displayInfo.name}`);
      }
    } else {
      console.log(`\n⚠️ Warning: No chains have available data for this token`);
    }

  } catch (error) {
    console.error('🚫 Comprehensive test failed:', error);
  }
}

// 导出测试函数到全局，方便在控制台测试
if (typeof window !== 'undefined') {
  (window as any).testEthAddressKlineData = testEthAddressKlineData;
  (window as any).detectNetworkFromAddress = detectNetworkFromAddress;
  (window as any).tryMultipleEvmNetworks = tryMultipleEvmNetworks;
  (window as any).testChainMapping = testChainMapping;
  (window as any).testMultiChainKlineData = testMultiChainKlineData;
  (window as any).testMultiChainSwitching = testMultiChainSwitching;
  (window as any).parseChainString = parseChainString;
  (window as any).sortChainsByPriority = sortChainsByPriority;
  (window as any).getChainDisplayInfo = getChainDisplayInfo;
  (window as any).fetchGeckoTerminalDataWithChains = fetchGeckoTerminalDataWithChains;

  // 添加快捷测试命令
  (window as any).quickTestMultiChain = () => {
    testMultiChainSwitching('0x9212cf1f9f4a9c69bb010146ba5b0725169d4444', 'BSC,Arbitrum,Optimism,Base,Avalanche,xLayer');
  };
}
