import { REFRESH_CONFIG } from '../config/config';
import { ApiClient } from '../services/auth.api';
import { SmartStatusChecker } from '../utils/smart-status-checker';

console.log('🚀 Background script loaded');

// 设置侧栏行为
chrome.runtime.onInstalled.addListener(() => {
  console.log('🔧 Extension installed, setting up side panel behavior');
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});

// 设置定期刷新 alarm（60秒间隔）
chrome.alarms.create('userStatusRefresh', {
  delayInMinutes: REFRESH_CONFIG.BACKGROUND_INTERVAL / 60000,
  periodInMinutes: REFRESH_CONFIG.BACKGROUND_INTERVAL / 60000
});

// 监听 alarm 事件
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'userStatusRefresh') {
    try {
      if (REFRESH_CONFIG.USER_STATUS.ENABLE_LOGGING) {
        console.log('[Background] 执行定期用户状态刷新');
      }
      // 使用智能状态检查，避免不必要的重复请求
      await SmartStatusChecker.checkBeforeOperation('background-periodic', false);
    } catch (error) {
      if (REFRESH_CONFIG.USER_STATUS.ENABLE_LOGGING) {
        console.error('[Background] 用户状态刷新失败:', error);
      }
    }
  }
});

// 扩展启动时立即执行一次刷新
chrome.runtime.onStartup.addListener(async () => {
  try {
    console.log('[Background] 扩展启动，执行初始用户状态刷新');
    await SmartStatusChecker.checkBeforeOperation('extension-startup', true);
  } catch (error) {
    console.error('[Background] 启动时用户状态刷新失败:', error);
  }
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(async () => {
  try {
    console.log('[Background] 扩展图标点击，检查用户状态');
    await SmartStatusChecker.checkBeforeOperation('extension-icon-click');
  } catch (error) {
    console.error('[Background] 图标点击状态检查失败:', error);
  }
});

// 监听侧边栏打开事件
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    console.log('[Background] 侧边栏连接，检查用户状态');
    SmartStatusChecker.checkBeforeOperation('sidepanel-open').catch(error => {
      console.error('[Background] 侧边栏打开状态检查失败:', error);
    });
  }
});

// 扩展安装时执行一次刷新
chrome.runtime.onInstalled.addListener(async () => {
  try {
    console.log('[Background] 扩展安装，执行初始用户状态刷新');
    await ApiClient.refreshUserStatus();
  } catch (error) {
    console.error('[Background] 安装时用户状态刷新失败:', error);
  }
});

// 注意：消息中转逻辑已移至各个background消息处理器中直接处理
// 这里不再需要中转逻辑，避免重复发送消息
