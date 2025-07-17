/**
 * 钱包备注功能测试文件
 * 用于在开发环境中测试钱包备注注入功能
 */

import { extractWalletAddresses, isTweetDetailPage } from '../utils/wallet-detection.utils'
import { WalletNotesBadge } from '../components/badges/WalletNotesBadge'
import type { WalletNote } from '~src/types/wallet-notes.types'

/**
 * 测试钱包地址检测功能
 */
export function testWalletDetection() {
  console.log('🧪 开始测试钱包地址检测功能')
  
  const testTexts = [
    // EVM地址测试
    'Check this EVM wallet: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    // Solana地址测试
    'Solana address: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    // Sui地址测试
    'Sui wallet: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    // 混合地址测试
    'Multiple wallets: 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6 and 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    // 无效地址测试
    'No valid addresses here: hello world 123456',
    // 边界情况测试
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6 followed by text'
  ]

  testTexts.forEach((text, index) => {
    console.log(`\n📝 测试文本 ${index + 1}: "${text}"`)
    const addresses = extractWalletAddresses(text)
    console.log(`🔍 检测到 ${addresses.length} 个钱包地址:`)
    addresses.forEach(addr => {
      console.log(`  - ${addr.networkType}: ${addr.address} (位置: ${addr.startIndex}-${addr.endIndex})`)
    })
  })

  console.log('\n✅ 钱包地址检测测试完成')
}

/**
 * 测试页面检测功能
 */
export function testPageDetection() {
  console.log('🧪 开始测试页面检测功能')
  
  const currentUrl = window.location.href
  const isTweetDetail = isTweetDetailPage()
  
  console.log(`📍 当前URL: ${currentUrl}`)
  console.log(`🎯 是否为推文详情页: ${isTweetDetail}`)
  
  // 测试不同URL格式
  const testUrls = [
    'https://x.com/elonmusk/status/1234567890',
    'https://x.com/MoonshotListing/status/1940233230667719086',
    'https://x.com/home',
    'https://x.com/elonmusk',
    'https://twitter.com/elonmusk/status/1234567890'
  ]
  
  testUrls.forEach(url => {
    const originalHref = window.location.href
    // 模拟URL变化（仅用于测试）
    Object.defineProperty(window.location, 'href', {
      value: url,
      writable: true
    })
    
    const isDetail = isTweetDetailPage()
    console.log(`📝 ${url} -> ${isDetail ? '✅ 推文详情页' : '❌ 非推文详情页'}`)
    
    // 恢复原始URL
    Object.defineProperty(window.location, 'href', {
      value: originalHref,
      writable: true
    })
  })
  
  console.log('\n✅ 页面检测测试完成')
}

/**
 * 测试钱包备注徽章组件
 */
export function testWalletBadge() {
  console.log('🧪 开始测试钱包备注徽章组件')
  
  // 创建测试容器
  const testContainer = document.createElement('div')
  testContainer.id = 'wallet-badge-test-container'
  testContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: white;
    border: 2px solid #ccc;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    max-width: 400px;
  `
  
  // 添加标题
  const title = document.createElement('h3')
  title.textContent = '钱包备注徽章测试'
  title.style.cssText = 'margin: 0 0 15px 0; color: #333;'
  testContainer.appendChild(title)
  
  // 测试数据
  const testWallets = [
    {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      networkType: 'evm' as const,
      note: null
    },
    {
      address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      networkType: 'solana' as const,
      note: {
        wallet_address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        network: 'solana',
        note: '这是一个测试备注',
        source: 'Twitter',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as WalletNote
    },
    {
      address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      networkType: 'sui' as const,
      note: null
    }
  ]
  
  // 创建徽章实例
  testWallets.forEach((wallet, index) => {
    const badge = new WalletNotesBadge({
      walletAddress: wallet.address,
      networkType: wallet.networkType,
      existingNote: wallet.note
    })
    
    const badgeElement = badge.render()
    
    // 添加标签
    const label = document.createElement('div')
    label.textContent = `${wallet.networkType.toUpperCase()} ${wallet.note ? '(有备注)' : '(无备注)'}`
    label.style.cssText = 'font-size: 12px; color: #666; margin: 10px 0 5px 0;'
    
    testContainer.appendChild(label)
    testContainer.appendChild(badgeElement)
  })
  
  // 添加关闭按钮
  const closeBtn = document.createElement('button')
  closeBtn.textContent = '关闭测试'
  closeBtn.style.cssText = `
    margin-top: 15px;
    padding: 8px 16px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  `
  closeBtn.onclick = () => {
    document.body.removeChild(testContainer)
    console.log('🗑️ 钱包备注徽章测试容器已移除')
  }
  testContainer.appendChild(closeBtn)
  
  // 添加到页面
  document.body.appendChild(testContainer)
  
  console.log('✅ 钱包备注徽章测试组件已创建')
  console.log('💡 请查看页面右上角的测试容器')
}

/**
 * 运行所有测试
 */
export function runAllTests() {
  console.log('🚀 开始运行钱包备注功能完整测试')
  console.log('=' .repeat(50))
  
  testWalletDetection()
  console.log('\n' + '=' .repeat(50))
  
  testPageDetection()
  console.log('\n' + '=' .repeat(50))
  
  testWalletBadge()
  console.log('\n' + '=' .repeat(50))
  
  console.log('🎉 所有测试完成！')
  console.log('💡 提示：可以在控制台中调用以下函数进行单独测试：')
  console.log('  - window.tw3trackWalletNotesTest.testWalletDetection()')
  console.log('  - window.tw3trackWalletNotesTest.testPageDetection()')
  console.log('  - window.tw3trackWalletNotesTest.testWalletBadge()')
}

// 导出到全局对象供调试使用
if (typeof window !== 'undefined') {
  (window as any).tw3trackWalletNotesTest = {
    testWalletDetection,
    testPageDetection,
    testWalletBadge,
    runAllTests
  }
  
  console.log('🔧 钱包备注测试工具已添加到 window.tw3trackWalletNotesTest')
}
