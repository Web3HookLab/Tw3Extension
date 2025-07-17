import {
  NetworkEthereum,
  NetworkSolana,
  NetworkSui,
} from '@web3icons/react';
import type { WalletNetwork, ExplorerConfig } from '~src/types/wallet-notes.types';

/**
 * 钱包网络本地配置
 */
export const WALLET_NETWORKS: WalletNetwork[] = [
  {
    key: 'eth',
    name: 'Ethereum',
    regex: /^0x[a-fA-F0-9]{40}$/,
  },
  {
    key: 'solana',
    name: 'Solana',
    regex: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  },
  {
    key: 'sui',
    name: 'Sui',
    regex: /^0x[a-fA-F0-9]{64}$/,
  },
];

/**
 * 区块链浏览器跳转配置
 */
export const explorerMap: Record<string, ExplorerConfig> = {
  solana: {
    url: (addr: string) => `https://solscan.io/account/${addr}`,
    icon: 'https://solscan.io/_next/static/media/solana-sol-logo.ecf2bf3a.svg',
  },
  eth: {
    url: (addr: string) => `https://etherscan.io/address/${addr}`,
    icon: 'https://etherscan.io/images/brandassets/etherscan-logo-circle.svg',
  },
  sui: {
    url: (addr: string) => `https://suivision.xyz/account/${addr}`,
    icon: 'https://suivision.xyz/favicon.svg',
  },
};

/**
 * 网络类型到组件的映射
 */
export const networkIconMap: Record<string, any> = {
  eth: NetworkEthereum,
  solana: NetworkSolana,
  sui: NetworkSui,
};

/**
 * 校验备注/来源的正则表达式
 * 禁止emoji和特殊字符，仅允许中英文、数字、常用标点
 */
export const NOTE_SOURCE_REGEX = /^[\u4e00-\u9fa5a-zA-Z0-9_.,，。:：;；!！?？\-\s]{0,100}$/;

/**
 * 默认分页配置
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_NOTES_LIMIT = 5000;
export const MAX_PAGES = 25;
