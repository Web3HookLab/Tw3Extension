/**
 * 链接生成工具函数
 */

import { getDexPlatformById, type DexPlatformSettings } from '~src/types/dexPlatforms.types'

// Twitter用户链接
export const getTwitterUserUrl = (screenName: string) => {
  return `https://twitter.com/${screenName}`
}

// Twitter搜索链接（搜索代币相关推文）
export const getTwitterSearchUrl = (symbol: string, address: string) => {
  const query = encodeURIComponent(`${symbol} OR ${address}`)
  return `https://twitter.com/search?q=${query}&src=typed_query&f=live`
}

// Get DEX link based on user settings and chain
export const getDexUrlWithSettings = (
  address: string,
  networkType: 'solana' | 'ethereum',
  dexSettings: DexPlatformSettings,
  chain?: string | null
): string | null => {
  let dexPlatformId: string

  // Get corresponding DEX platform ID based on network type
  if (networkType === 'solana') {
    dexPlatformId = dexSettings.solana
  } else {
    // EVM networks (ethereum, base, bsc, etc.)
    const evmPlatform = dexSettings.evm.platform

    // Determine the specific chain to use
    let targetChain = 'eth' // default to ethereum

    if (chain) {
      // Map chain names to platform suffixes
      const chainMap: Record<string, string> = {
        'ethereum': 'eth',
        'eth': 'eth',
        'base': 'base',
        'bsc': 'bsc',
        'binance': 'bsc',
        'bnb': 'bsc',
        'xlayer': 'xlayer', // XLayer has its own DEX platform
        'x-layer': 'xlayer',
        'xLayer': 'xlayer'
      }

      const normalizedChain = chain.toLowerCase()
      targetChain = chainMap[normalizedChain] || 'eth'
    }

    dexPlatformId = `${evmPlatform}_${targetChain}`
  }

  // Get DEX platform configuration and generate URL
  const platform = getDexPlatformById(dexPlatformId)
  if (platform) {
    return platform.getUrl(address)
  } else {
    // If platform configuration not found, use default DexScreener
    const fallbackChain = chain?.toLowerCase() || networkType
    return `https://dexscreener.com/${fallbackChain}/${address}`
  }
}

// Blockchain explorer links (supports multiple chains)
export const getExplorerUrl = (address: string, networkType: 'solana' | 'ethereum', chain?: string | null) => {
  if (networkType === 'solana') {
    return `https://solscan.io/token/${address}` // Use token for tokens, account for wallets
  }

  // For EVM networks, determine the specific chain
  if (chain) {
    const chainLower = chain.toLowerCase()
    switch (chainLower) {
      case 'ethereum':
      case 'eth':
        return `https://etherscan.io/token/${address}`
      case 'base':
        return `https://basescan.org/token/${address}`
      case 'bsc':
      case 'binance':
      case 'bnb':
        return `https://bscscan.com/address/${address}`
      case 'x-layer':
      case 'xlayer':
      case 'xLayer':
        return `https://web3.okx.com/zh-hans/explorer/x-layer/address/${address}`
      case 'polygon':
      case 'matic':
        return `https://polygonscan.com/token/${address}`
      case 'arbitrum':
      case 'arb':
        return `https://arbiscan.io/token/${address}`
      case 'optimism':
      case 'op':
        return `https://optimistic.etherscan.io/token/${address}`
      case 'avalanche':
      case 'avax':
        return `https://snowtrace.io/token/${address}`
      default:
        return `https://etherscan.io/token/${address}` // Default to Ethereum
    }
  }

  // Default to Ethereum if no chain specified
  return `https://etherscan.io/token/${address}`
}

// CoinGecko链接（如果有的话）
export const getCoinGeckoUrl = (symbol: string) => {
  return `https://www.coingecko.com/en/search?query=${encodeURIComponent(symbol)}`
}

// 获取网络显示名称
export const getNetworkDisplayName = (networkType: string) => {
  switch (networkType.toLowerCase()) {
    case 'solana':
      return 'Solana'
    case 'ethereum':
      return 'Ethereum'
    case 'bsc':
      return 'BSC'
    case 'polygon':
      return 'Polygon'
    default:
      return networkType.charAt(0).toUpperCase() + networkType.slice(1)
  }
}

// 获取网络颜色（修复hover变暗问题）
export const getNetworkColor = (networkType: string) => {
  switch (networkType.toLowerCase()) {
    case 'solana':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900'
    case 'ethereum':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900'
    case 'bsc':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900'
    case 'polygon':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900'
  }
}

// 获取链的显示信息
export const getChainDisplayInfo = (chain: string | null) => {
  if (!chain) {
    return null
  }

  const chainLower = chain.toLowerCase()

  switch (chainLower) {
    case 'ethereum':
    case 'eth':
      return {
        name: 'ETH',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900'
      }
    case 'polygon':
    case 'matic':
      return {
        name: 'Polygon',
        color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-900'
      }
    case 'bsc':
    case 'binance':
    case 'bnb':
      return {
        name: 'BSC',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900'
      }
    case 'arbitrum':
    case 'arb':
      return {
        name: 'Arbitrum',
        color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-900'
      }
    case 'optimism':
    case 'op':
      return {
        name: 'Optimism',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900'
      }
    case 'avalanche':
    case 'avax':
      return {
        name: 'Avalanche',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900'
      }
    case 'base':
      return {
        name: 'Base',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900'
      }
    default:
      return {
        name: chain.charAt(0).toUpperCase() + chain.slice(1),
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900'
      }
  }
}

// 获取排名颜色和样式
export const getRankingStyle = (rank: number) => {
  if (rank === 1) {
    return {
      variant: 'default' as const,
      className: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold'
    }
  }
  if (rank === 2) {
    return {
      variant: 'default' as const,
      className: 'bg-gradient-to-r from-gray-300 to-gray-500 text-white font-bold'
    }
  }
  if (rank === 3) {
    return {
      variant: 'default' as const,
      className: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white font-bold'
    }
  }
  if (rank <= 10) {
    return {
      variant: 'secondary' as const,
      className: 'font-semibold'
    }
  }
  return {
    variant: 'outline' as const,
    className: ''
  }
}
