/**
 * 钱包地址检测工具函数
 * 复用现有的钱包检测逻辑，专门用于钱包备注注入
 */

// 钱包地址正则表达式
const WALLET_PATTERNS = {
  // EVM地址 (以0x开头的40位十六进制)
  evm: /\b0x[a-fA-F0-9]{40}\b/g,
  // Solana地址 (32-44位Base58字符)
  solana: /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g,
  // Sui地址 (以0x开头的64位十六进制)
  sui: /\b0x[a-fA-F0-9]{64}\b/g
}

/**
 * 钱包地址信息接口
 */
export interface WalletAddressInfo {
  address: string
  networkType: 'evm' | 'solana' | 'sui'
  startIndex: number
  endIndex: number
}

/**
 * 从文本中提取钱包地址
 * @param text 要检测的文本
 * @returns 检测到的钱包地址列表
 */
export function extractWalletAddresses(text: string): WalletAddressInfo[] {
  const addresses: WalletAddressInfo[] = []
  
  // 检测各种网络类型的钱包地址
  Object.entries(WALLET_PATTERNS).forEach(([networkType, pattern]) => {
    const matches = Array.from(text.matchAll(pattern))
    
    matches.forEach(match => {
      if (match.index !== undefined) {
        const address = match[0]
        
        // 额外验证确保地址格式正确
        if (isValidWalletAddress(address, networkType as keyof typeof WALLET_PATTERNS)) {
          addresses.push({
            address,
            networkType: networkType as 'evm' | 'solana' | 'sui',
            startIndex: match.index,
            endIndex: match.index + address.length
          })
        }
      }
    })
  })
  
  // 按出现位置排序
  return addresses.sort((a, b) => a.startIndex - b.startIndex)
}

/**
 * 验证钱包地址格式是否正确
 * @param address 钱包地址
 * @param networkType 网络类型
 * @returns 是否为有效地址
 */
export function isValidWalletAddress(address: string, networkType: string): boolean {
  switch (networkType) {
    case 'evm':
      return /^0x[a-fA-F0-9]{40}$/.test(address)
    case 'solana':
      // Solana地址长度通常在32-44之间，且不包含某些字符
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && 
             !address.includes('0') && 
             !address.includes('O') && 
             !address.includes('I') && 
             !address.includes('l')
    case 'sui':
      return /^0x[a-fA-F0-9]{64}$/.test(address)
    default:
      return false
  }
}

/**
 * 获取网络类型的显示名称
 * @param networkType 网络类型
 * @returns 显示名称
 */
export function getNetworkDisplayName(networkType: string): string {
  const networkNames = {
    evm: 'EVM',
    solana: 'Solana', 
    sui: 'Sui'
  }
  return networkNames[networkType as keyof typeof networkNames] || networkType
}

/**
 * 获取网络类型的颜色配置
 * @param networkType 网络类型
 * @returns 颜色配置对象
 */
export function getNetworkColors(networkType: string) {
  const networkColors = {
    evm: { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
    solana: { bg: '#f3e8ff', color: '#7c3aed', border: '#c4b5fd' },
    sui: { bg: '#cffafe', color: '#0891b2', border: '#a5f3fc' }
  }
  return networkColors[networkType as keyof typeof networkColors] || 
         { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' }
}

/**
 * 获取区块浏览器URL
 * @param address 钱包地址
 * @param networkType 网络类型
 * @returns 浏览器URL
 */
export function getExplorerUrl(address: string, networkType: string): string {
  const explorerUrls = {
    evm: `https://etherscan.io/address/${address}`,
    solana: `https://solscan.io/account/${address}`,
    sui: `https://suivision.xyz/account/${address}`
  }
  return explorerUrls[networkType as keyof typeof explorerUrls] || ''
}

/**
 * 获取DEX平台URL（使用默认平台）
 * @param address 钱包地址
 * @param networkType 网络类型
 * @returns DEX平台URL
 */
export function getDefaultDexUrl(address: string, networkType: string): string {
  const defaultDexUrls = {
    evm: `https://www.dexscreener.com/ethereum/${address}`,
    solana: `https://www.dexscreener.com/solana/${address}`,
    sui: `https://www.geckoterminal.com/sui-network/tokens/${address}`
  }
  return defaultDexUrls[networkType as keyof typeof defaultDexUrls] || ''
}

/**
 * 缩短钱包地址显示
 * @param address 完整地址
 * @param startLength 开头保留长度
 * @param endLength 结尾保留长度
 * @returns 缩短后的地址
 */
export function shortenAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (address.length <= startLength + endLength) {
    return address
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

/**
 * 检查是否为推文详情页面
 * @returns 是否为推文详情页面
 */
export function isTweetDetailPage(): boolean {
  // 匹配 https://x.com/username/status/tweetId 格式
  const tweetDetailPattern = /^https:\/\/x\.com\/[^\/]+\/status\/\d+/
  const urlMatches = tweetDetailPattern.test(window.location.href)

  if (!urlMatches) {
    return false
  }

  // 更宽松的内容检查 - 检查是否有基本的推文结构
  const hasTweetContent = document.querySelector('[data-testid="tweet"]') !== null ||
                         document.querySelector('[data-testid="tweetText"]') !== null ||
                         document.querySelector('article[role="article"]') !== null ||
                         document.querySelector('[data-testid="primaryColumn"]') !== null ||
                         document.querySelector('main[role="main"]') !== null

  // 如果URL匹配但内容还没加载，给一些时间让页面加载
  if (urlMatches && !hasTweetContent) {
    // 检查页面是否还在加载中
    const isLoading = document.readyState !== 'complete'
    if (isLoading) {
      console.log('🔍 推文详情页面检测: 页面还在加载中，稍后重试')
      return false
    }
  }

  console.log('🔍 推文详情页面检测:', {
    url: window.location.href,
    urlMatches,
    hasTweetContent,
    readyState: document.readyState,
    result: urlMatches && hasTweetContent
  })

  return urlMatches && hasTweetContent
}

/**
 * 从推文元素中提取文本内容
 * @param tweetElement 推文DOM元素
 * @returns 推文文本内容
 */
export function extractTweetText(tweetElement: Element): string {
  // 查找推文文本容器
  const textSelectors = [
    '[data-testid="tweetText"]',
    '[lang]', // 推文文本通常有lang属性
    '.css-901oao' // Twitter的文本样式类
  ]
  
  for (const selector of textSelectors) {
    const textElement = tweetElement.querySelector(selector)
    if (textElement) {
      return textElement.textContent || ''
    }
  }
  
  // 如果找不到特定选择器，返回整个元素的文本内容
  return tweetElement.textContent || ''
}
