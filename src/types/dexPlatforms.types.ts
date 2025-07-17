export interface NetworkConfig {
  id: string;
  name: string;
  type: 'evm' | 'solana' | 'sui'; // 网络类型
  regex: RegExp;
  defaultDex: string;
}
// 网络配置
export const NETWORK_CONFIGS: NetworkConfig[] = [
  {
    id: 'evm',
    name: 'EVM Networks',
    type: 'evm',
    regex: /0x[a-fA-F0-9]{40}/g, // EVM地址格式
    defaultDex: 'gmgn_eth'
  },
  {
    id: 'solana',
    name: 'Solana',
    type: 'solana',
    regex: /[1-9A-HJ-NP-Za-km-z]{32,44}/g, // Solana地址格式
    defaultDex: 'gmgn_sol'
  },
  {
    id: 'sui',
    name: 'Sui',
    type: 'sui',
    regex: /0x[a-fA-F0-9]{64}/g, // Sui地址格式
    defaultDex: 'okx_sui'
  }
];
// DEX平台配置
export interface DexPlatform {
  id: string;
  name: string;
  icon: string;
  getUrl: (address: string) => string;
  networks: string[]; // 支持的网络列表
}

// DEX平台配置
export const DEX_PLATFORMS: DexPlatform[] = [
  {
    id: 'gmgn_sol',
    name: 'GMGN',
    icon: '/assets/dex/gmgn.ico',
    getUrl: (address: string) => `https://gmgn.ai/sol/token/${address}`,
    networks: ['solana']
  },
  {
    id: 'dexscreener_sol',
    name: 'DexScreener',
    icon: '/assets/dex/dexscreener.ico',
    getUrl: (address: string) => `https://dexscreener.com/solana/${address}`,
    networks: ['solana']
  },
  {
    id: 'okx_sol',
    name: 'OKX DEX',
    icon: '/assets/dex/okx.webp',
    getUrl: (address: string) => `https://web3.okx.com/zh-hans/token/solana/${address}`,
    networks: ['solana']
  },
  {
    id: 'axiom_sol',
    name: 'Axiom',
    icon: '/assets/dex/axiom.ico',
    getUrl: (address: string) => `https://axiom.trade/meme/${address}`,
    networks: ['solana']
  },
  {
    id: 'photon_sol',
    name: 'Photon',
    icon: '/assets/dex/photon.svg',
    getUrl: (address: string) => `https://photon-sol.tinyastro.io/en/lp/${address}`,
    networks: ['solana']
  },
  {
    id: 'geckoterminal_sol',
    name: 'GeckoTerminal',
    icon: '/assets/dex/geckoterminal.svg',
    getUrl: (address: string) => `https://www.geckoterminal.com/solana/tokens/${address}`,
    networks: ['solana']
  },
  // EVM网络平台 - GMGN
  {
    id: 'gmgn_eth',
    name: 'GMGN (Ethereum)',
    icon: '/assets/dex/gmgn.ico',
    getUrl: (address: string) => `https://gmgn.ai/eth/token/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  {
    id: 'gmgn_base',
    name: 'GMGN (Base)',
    icon: '/assets/dex/gmgn.ico',
    getUrl: (address: string) => `https://gmgn.ai/base/token/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  {
    id: 'gmgn_bsc',
    name: 'GMGN (BSC)',
    icon: '/assets/dex/gmgn.ico',
    getUrl: (address: string) => `https://gmgn.ai/bsc/token/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  // EVM网络平台 - DexScreener
  {
    id: 'dexscreener_eth',
    name: 'DexScreener (Ethereum)',
    icon: '/assets/dex/dexscreener.ico',
    getUrl: (address: string) => `https://dexscreener.com/ethereum/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  {
    id: 'dexscreener_base',
    name: 'DexScreener (Base)',
    icon: '/assets/dex/dexscreener.ico',
    getUrl: (address: string) => `https://dexscreener.com/base/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  {
    id: 'dexscreener_bsc',
    name: 'DexScreener (BSC)',
    icon: '/assets/dex/dexscreener.ico',
    getUrl: (address: string) => `https://dexscreener.com/bsc/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  // EVM网络平台 - OKX
  {
    id: 'okx_eth',
    name: 'OKX DEX (Ethereum)',
    icon: '/assets/dex/okx.webp',
    getUrl: (address: string) => `https://web3.okx.com/zh-hans/token/ethereum/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  {
    id: 'okx_base',
    name: 'OKX DEX (Base)',
    icon: '/assets/dex/okx.webp',
    getUrl: (address: string) => `https://web3.okx.com/zh-hans/token/base/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  {
    id: 'okx_bsc',
    name: 'OKX DEX (BSC)',
    icon: '/assets/dex/okx.webp',
    getUrl: (address: string) => `https://web3.okx.com/zh-hans/token/bsc/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  // EVM网络平台 - GeckoTerminal
  {
    id: 'geckoterminal_eth',
    name: 'GeckoTerminal (Ethereum)',
    icon: '/assets/dex/geckoterminal.svg',
    getUrl: (address: string) => `https://www.geckoterminal.com/eth/tokens/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  {
    id: 'geckoterminal_base',
    name: 'GeckoTerminal (Base)',
    icon: '/assets/dex/geckoterminal.svg',
    getUrl: (address: string) => `https://www.geckoterminal.com/base/tokens/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  {
    id: 'geckoterminal_bsc',
    name: 'GeckoTerminal (BSC)',
    icon: '/assets/dex/geckoterminal.svg',
    getUrl: (address: string) => `https://www.geckoterminal.com/bsc/tokens/${address}`,
    networks: ['ethereum', 'base', 'bsc']
  },
  // Sui网络平台
  {
    id: 'okx_sui',
    name: 'OKX DEX (Sui)',
    icon: '/assets/dex/okx.webp',
    getUrl: (address: string) => `https://web3.okx.com/zh-hans/token/sui/${address}`,
    networks: ['sui']
  },
  {
    id: 'dexscreener_sui',
    name: 'DexScreener (Sui)',
    icon: '/assets/dex/dexscreener.ico',
    getUrl: (address: string) => `https://dexscreener.com/sui/${address}`,
    networks: ['sui']
  },
  {
    id: 'geckoterminal_sui',
    name: 'GeckoTerminal (Sui)',
    icon: '/assets/dex/geckoterminal.svg',
    getUrl: (address: string) => `https://www.geckoterminal.com/sui-network/tokens/${address}`,
    networks: ['sui']
  }
];
// EVM链配置
export interface EvmChain {
  id: string;
  name: string;
  displayName: string;
}
// DEX平台设置接口
export interface DexPlatformSettings {
  evm: {
    platform: string; // 平台ID: 'gmgn' | 'dexscreener' | 'okx' | 'geckoterminal'
    defaultChain: string; // 默认链: 'ethereum' | 'base' | 'bsc'
  };
  solana: string;
  sui: string; // 平台ID: 'okx' | 'dexscreener' | 'geckoterminal'
}
export const EVM_CHAINS: EvmChain[] = [
  { id: 'ethereum', name: 'eth', displayName: 'Ethereum' },
  { id: 'base', name: 'base', displayName: 'Base' },
  { id: 'bsc', name: 'bsc', displayName: 'BSC' }
];
// EVM平台配置
export interface EvmPlatformConfig {
  id: string;
  name: string;
  icon: string;
  chains: EvmChain[];
}
// EVM平台定义
export const EVM_PLATFORMS: EvmPlatformConfig[] = [
  {
    id: 'gmgn',
    name: 'GMGN',
    icon: '/assets/dex/gmgn.ico',
    chains: EVM_CHAINS
  },
  {
    id: 'dexscreener',
    name: 'DexScreener',
    icon: '/assets/dex/dexscreener.ico',
    chains: EVM_CHAINS
  },
  {
    id: 'okx',
    name: 'OKX DEX',
    icon: '/assets/dex/okx.webp',
    chains: EVM_CHAINS
  },
  {
    id: 'geckoterminal',
    name: 'GeckoTerminal',
    icon: '/assets/dex/geckoterminal.svg',
    chains: EVM_CHAINS
  }
];

// 获取EVM平台配置
export const getEvmPlatformById = (platformId: string): EvmPlatformConfig | null => {
  return EVM_PLATFORMS.find(platform => platform.id === platformId) || null;
};
// 获取默认DEX设置
export const getDefaultDexSettings = (): DexPlatformSettings => {
  return {
    evm: {
      platform: 'okx',
      defaultChain: 'ethereum'
    },
    solana: 'okx_sol',
    sui: 'okx_sui'
  };
};
// 根据ID获取DEX平台
export const getDexPlatformById = (id: string): DexPlatform | null => {
  return DEX_PLATFORMS.find(platform => platform.id === id) || null;
};
// 获取网络的默认DEX平台
export const getDefaultDexPlatform = (networkType: string): DexPlatform | null => {
  const network = NETWORK_CONFIGS.find(n => n.id === networkType);
  if (!network) return null;
  
  return getDexPlatformById(network.defaultDex);
}; 
// 获取EVM链配置
export const getEvmChainById = (chainId: string): EvmChain | null => {
  return EVM_CHAINS.find(chain => chain.id === chainId) || null;
};
export const getDexPlatformsForNetwork = (networkType: string): DexPlatform[] => {
  if (networkType === 'evm') {
    return DEX_PLATFORMS.filter(platform => 
      platform.networks.some(network => ['ethereum', 'base', 'bsc'].includes(network))
    );
  }
  
  return DEX_PLATFORMS.filter(platform => 
    platform.networks.includes(networkType)
  );
};