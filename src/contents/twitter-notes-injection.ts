/**
 * Twitter备注注入功能的Content Script入口
 * 负责在Twitter页面注入备注徽章功能
 */

console.log('🚀 Twitter备注注入Content Script开始加载，当前页面:', location.href)
console.log('📍 当前时间:', new Date().toISOString())
console.log('📄 文档状态:', document.readyState)

// 导入新的模块化注入功能
import './twitter-notes-injection/index'



console.log('✅ Twitter备注注入功能已加载完成');

// // 添加全局测试函数
// (window as any).tw3trackContentScript = {
//   loaded: true,
//   loadTime: new Date().toISOString(),
//   url: location.href,
//   testMessage: () => {
//     console.log('🧪 Content Script测试消息...')
//     chrome.runtime.sendMessage({
//       type: 'TWITTER_NOTES_CACHE_UPDATED',
//       notes: []
//     }).catch(console.error)
//   }
// }

// console.log('🔧 Content Script调试工具已添加到 window.tw3trackContentScript')
