/**
 * 地址验证工具函数
 */

import type {
  AddressValidation,
  AddressType
} from '~src/types/addressSearch.types';
import { ADDRESS_SEARCH_CONSTANTS } from '~src/types/addressSearch.types';

/**
 * 验证Ethereum地址格式
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // 检查长度和格式
  return ADDRESS_SEARCH_CONSTANTS.ETHEREUM.HEX_REGEX.test(address);
}

/**
 * 验证Solana地址格式
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // 检查长度
  if (address.length < ADDRESS_SEARCH_CONSTANTS.SOLANA.MIN_LENGTH || 
      address.length > ADDRESS_SEARCH_CONSTANTS.SOLANA.MAX_LENGTH) {
    return false;
  }

  // 检查Base58格式
  return ADDRESS_SEARCH_CONSTANTS.SOLANA.BASE58_REGEX.test(address);
}

/**
 * 检测地址类型
 */
export function detectAddressType(address: string): AddressType {
  if (!address || typeof address !== 'string') {
    return 'unknown';
  }

  const trimmedAddress = address.trim();

  // 优先检查Ethereum地址（有明确的0x前缀）
  if (isValidEthereumAddress(trimmedAddress)) {
    return 'ethereum';
  }

  // 检查Solana地址
  if (isValidSolanaAddress(trimmedAddress)) {
    return 'solana';
  }

  return 'unknown';
}

/**
 * 格式化地址
 */
export function formatAddress(address: string, type: AddressType): string {
  if (!address || typeof address !== 'string') {
    return address;
  }

  const trimmedAddress = address.trim();

  switch (type) {
    case 'ethereum':
      // Ethereum地址转为小写（API要求）
      return trimmedAddress.toLowerCase();
    case 'solana':
      // Solana地址保持原始大小写
      return trimmedAddress;
    default:
      return trimmedAddress;
  }
}

/**
 * 获取地址验证错误信息
 */
export function getAddressValidationError(address: string, type: AddressType): string | undefined {
  if (!address || !address.trim()) {
    return 'address.error.empty';
  }

  const trimmedAddress = address.trim();

  switch (type) {
    case 'ethereum':
      if (!trimmedAddress.startsWith('0x')) {
        return 'address.error.ethereum.noPrefix';
      }
      if (trimmedAddress.length !== ADDRESS_SEARCH_CONSTANTS.ETHEREUM.LENGTH) {
        return 'address.error.ethereum.invalidLength';
      }
      if (!ADDRESS_SEARCH_CONSTANTS.ETHEREUM.HEX_REGEX.test(trimmedAddress)) {
        return 'address.error.ethereum.invalidFormat';
      }
      break;

    case 'solana':
      if (trimmedAddress.length < ADDRESS_SEARCH_CONSTANTS.SOLANA.MIN_LENGTH) {
        return 'address.error.solana.tooShort';
      }
      if (trimmedAddress.length > ADDRESS_SEARCH_CONSTANTS.SOLANA.MAX_LENGTH) {
        return 'address.error.solana.tooLong';
      }
      if (!ADDRESS_SEARCH_CONSTANTS.SOLANA.BASE58_REGEX.test(trimmedAddress)) {
        return 'address.error.solana.invalidFormat';
      }
      break;

    case 'unknown':
      return 'address.error.unknownFormat';

    default:
      return 'address.error.invalid';
  }

  return undefined;
}

/**
 * 完整的地址验证函数
 */
export function validateAddress(address: string): AddressValidation {
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      type: 'unknown',
      formatted: '',
      error: 'address.error.empty'
    };
  }

  const trimmedAddress = address.trim();
  
  if (!trimmedAddress) {
    return {
      isValid: false,
      type: 'unknown',
      formatted: '',
      error: 'address.error.empty'
    };
  }

  // 检测地址类型
  const type = detectAddressType(trimmedAddress);
  
  // 获取验证错误
  const error = getAddressValidationError(trimmedAddress, type);
  
  // 格式化地址
  const formatted = formatAddress(trimmedAddress, type);

  return {
    isValid: !error && type !== 'unknown',
    type,
    formatted,
    error
  };
}

/**
 * 批量验证地址
 */
export function validateAddresses(addresses: string[]): AddressValidation[] {
  return addresses.map(validateAddress);
}

/**
 * 检查地址是否为有效的搜索地址
 */
export function isValidSearchAddress(address: string): boolean {
  const validation = validateAddress(address);
  return validation.isValid && (validation.type === 'solana' || validation.type === 'ethereum');
}

/**
 * 从地址验证结果创建API请求参数
 */
export function createSearchRequest(address: string): { solana_address?: string; eth_address?: string } | null {
  const validation = validateAddress(address);
  
  if (!validation.isValid) {
    return null;
  }

  switch (validation.type) {
    case 'solana':
      return { solana_address: validation.formatted };
    case 'ethereum':
      return { eth_address: validation.formatted };
    default:
      return null;
  }
}

/**
 * 获取地址的显示名称
 */
export function getAddressDisplayName(type: AddressType): string {
  switch (type) {
    case 'solana':
      return 'Solana';
    case 'ethereum':
      return 'Ethereum';
    default:
      return 'Unknown';
  }
}

/**
 * 获取地址类型的颜色主题
 */
export function getAddressTypeColor(type: AddressType): string {
  switch (type) {
    case 'solana':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'ethereum':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * 缩短地址显示（用于UI展示）
 */
export function shortenAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!address || address.length <= startLength + endLength + 3) {
    return address;
  }

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * 检查两个地址是否相同（考虑格式化）
 */
export function isSameAddress(address1: string, address2: string): boolean {
  if (!address1 || !address2) {
    return false;
  }

  const validation1 = validateAddress(address1);
  const validation2 = validateAddress(address2);

  if (validation1.type !== validation2.type || !validation1.isValid || !validation2.isValid) {
    return false;
  }

  return validation1.formatted === validation2.formatted;
}

/**
 * 从URL或剪贴板文本中提取地址
 */
export function extractAddressFromText(text: string): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // 移除多余的空白字符
  const cleanText = text.trim();

  // 尝试直接验证
  if (isValidSearchAddress(cleanText)) {
    return cleanText;
  }

  // 尝试从URL中提取（如区块链浏览器链接）
  const urlPatterns = [
    // Ethereum地址模式
    /0x[a-fA-F0-9]{40}/g,
    // Solana地址模式（Base58）
    /[1-9A-HJ-NP-Za-km-z]{32,44}/g
  ];

  for (const pattern of urlPatterns) {
    const matches = cleanText.match(pattern);
    if (matches) {
      for (const match of matches) {
        if (isValidSearchAddress(match)) {
          return match;
        }
      }
    }
  }

  return null;
}
