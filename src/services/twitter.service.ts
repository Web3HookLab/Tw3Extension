import { Storage } from '@plasmohq/storage';
import { APP_CONFIG } from '~src/config/config';

const storage = new Storage({
  area: 'local',
});

// 推特自动查询设置管理
export class TwitterAutoQueryManager {
  private static readonly AUTO_QUERY_KEY = APP_CONFIG.STORAGE_KEYS.TWITTER_AUTO_QUERY;

  // 获取自动查询设置
  static async getAutoQueryEnabled(): Promise<boolean> {
    try {
      const enabled = await storage.get(this.AUTO_QUERY_KEY);
      // 修复类型不匹配问题：支持boolean和字符串格式
      if (enabled === null || enabled === undefined) {
        return APP_CONFIG.DEFAULTS.TWITTER_AUTO_QUERY;
      }
      
      // 处理boolean值
      if (typeof enabled === 'boolean') {
        return enabled;
      }
      
      // 处理字符串值（向后兼容）
      if (typeof enabled === 'string') {
        return enabled === 'true';
      }
      
      return APP_CONFIG.DEFAULTS.TWITTER_AUTO_QUERY;
    } catch (error) {
      console.error('❌ 获取自动查询设置时出错:', error);
      return APP_CONFIG.DEFAULTS.TWITTER_AUTO_QUERY;
    }
  }

  // 设置自动查询
  static async setAutoQueryEnabled(enabled: boolean): Promise<void> {
    try {
      // 确保存储boolean值
      await storage.set(this.AUTO_QUERY_KEY, enabled);
      console.log(`⚙️ 推特自动查询已设置为: ${enabled}`);
    } catch (error) {
      console.error('❌ 设置自动查询时出错:', error);
    }
  }
}

// 推特KOL列表显示设置管理
export class TwitterKolListManager {
  private static readonly KOL_LIST_KEY = 'twitter_show_kol_list';
  private static readonly DEFAULT_SHOW_KOL_LIST = true;

  // 获取KOL列表显示设置
  static async getShowKolListEnabled(): Promise<boolean> {
    try {
      const storage = new Storage({ area: 'local' });
      const enabled = await storage.get(this.KOL_LIST_KEY);
      
      if (enabled === null || enabled === undefined) {
        return this.DEFAULT_SHOW_KOL_LIST;
      }
      
      // 处理boolean值
      if (typeof enabled === 'boolean') {
        return enabled;
      }
      
      // 处理字符串值（向后兼容）
      if (typeof enabled === 'string') {
        return enabled === 'true';
      }
      
      return this.DEFAULT_SHOW_KOL_LIST;
    } catch (error) {
      console.error('❌ 获取KOL列表显示设置时出错:', error);
      return this.DEFAULT_SHOW_KOL_LIST;
    }
  }

  // 设置KOL列表显示
  static async setShowKolListEnabled(enabled: boolean): Promise<void> {
    try {
      const storage = new Storage({ area: 'local' });
      await storage.set(this.KOL_LIST_KEY, enabled);
      console.log(`⚙️ 推特KOL列表显示已设置为: ${enabled}`);

      // 发送消息通知content script
      try {
        const tabs = await chrome.tabs.query({ url: ['*://x.com/*', '*://twitter.com/*'] });
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'TWITTER_KOL_SETTING_CHANGED',
              enabled: enabled
            }).catch(error => {
              // 忽略无法发送消息的错误（页面可能没有content script）
              console.log('📝 无法发送消息到标签页:', tab.id, error.message);
            });
          }
        }
        console.log(`📡 已发送KOL设置变更消息到 ${tabs.length} 个Twitter标签页`);
      } catch (error) {
        console.warn('⚠️ 发送KOL设置变更消息失败:', error);
      }
    } catch (error) {
      console.error('❌ 设置KOL列表显示时出错:', error);
      throw error; // 重新抛出错误，让调用者处理
    }
  }
}