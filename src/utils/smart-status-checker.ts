import { REFRESH_CONFIG } from '~src/config/config';
import { TokenManager } from '~src/services/token.service';
import { ApiClient } from '~src/services/auth.api';

/**
 * 智能状态检查器
 * 在关键操作前自动检查用户状态，避免不必要的重复请求
 */
export class SmartStatusChecker {
  private static lastCheckTime: number = 0;
  private static isChecking: boolean = false;
  private static checkPromise: Promise<boolean> | null = null;

  /**
   * 检查是否需要刷新用户状态
   */
  private static shouldRefreshStatus(): boolean {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;
    
    // 如果距离上次检查时间超过缓存时间，则需要刷新
    return timeSinceLastCheck > REFRESH_CONFIG.USER_STATUS.CACHE_DURATION;
  }

  /**
   * 在关键操作前检查用户状态
   * @param operation 操作类型，用于日志记录
   * @param forceRefresh 是否强制刷新
   * @returns Promise<boolean> 返回用户是否有效
   */
  static async checkBeforeOperation(
    operation: string, 
    forceRefresh: boolean = false
  ): Promise<boolean> {
    try {
      // 如果正在检查中，返回现有的Promise
      if (this.isChecking && this.checkPromise) {
        console.log(`⏳ [${operation}] 状态检查进行中，等待结果...`);
        return await this.checkPromise;
      }

      // 如果不需要刷新且不强制刷新，直接检查本地token
      if (!forceRefresh && !this.shouldRefreshStatus()) {
        console.log(`✅ [${operation}] 使用缓存状态`);
        return await TokenManager.isLoggedIn();
      }

      console.log(`🔄 [${operation}] 执行状态检查...`);
      
      this.isChecking = true;
      this.checkPromise = this.performStatusCheck(operation);
      
      const result = await this.checkPromise;
      
      this.lastCheckTime = Date.now();
      this.isChecking = false;
      this.checkPromise = null;
      
      return result;
    } catch (error) {
      console.error(`❌ [${operation}] 状态检查失败:`, error);
      this.isChecking = false;
      this.checkPromise = null;
      return false;
    }
  }

  /**
   * 执行实际的状态检查
   */
  private static async performStatusCheck(operation: string): Promise<boolean> {
    try {
      const response = await ApiClient.refreshUserStatus();
      
      if (response && response.code === 200) {
        console.log(`✅ [${operation}] 用户状态有效`);
        return true;
      } else if (response && response.code === 502) {
        // 服务器不可用，但保持登录状态
        console.warn(`🔴 [${operation}] 服务器不可用，保持登录状态`);
        return await TokenManager.isLoggedIn();
      } else {
        console.warn(`❌ [${operation}] 用户状态无效`);
        return false;
      }
    } catch (error) {
      console.error(`❌ [${operation}] 状态检查异常:`, error);
      // 发生错误时，检查本地token状态
      return await TokenManager.isLoggedIn();
    }
  }

  /**
   * 检查特定功能的可用性
   * @param feature 功能类型
   * @param forceRefresh 是否强制刷新
   */
  static async checkFeatureAvailability(
    feature: 'history' | 'kol' | 'wallet' | 'premium' | 'followEvents',
    forceRefresh: boolean = false
  ): Promise<{
    available: boolean;
    reason?: string;
    requiresUpgrade?: boolean;
  }> {
    try {
      // 首先检查用户登录状态
      const isLoggedIn = await this.checkBeforeOperation(`feature-${feature}`, forceRefresh);
      
      if (!isLoggedIn) {
        return {
          available: false,
          reason: '用户未登录',
          requiresUpgrade: false
        };
      }

      // 获取用户信息检查功能权限
      const userInfo = await TokenManager.getUserInfo();
      
      if (!userInfo) {
        return {
          available: false,
          reason: '无法获取用户信息',
          requiresUpgrade: false
        };
      }

      // 根据功能类型检查权限
      switch (feature) {
        case 'history':
          if (userInfo.plan === 'Free') {
            return {
              available: false,
              reason: '历史功能需要会员权限',
              requiresUpgrade: true
            };
          }
          break;

        case 'followEvents':
          if (userInfo.plan === 'Free') {
            return {
              available: false,
              reason: 'Follow Events功能需要会员权限',
              requiresUpgrade: true
            };
          }
          break;

        case 'premium':
          if (userInfo.plan === 'Free') {
            return {
              available: false,
              reason: '需要升级到付费计划',
              requiresUpgrade: true
            };
          }
          break;

        case 'wallet':
          if (userInfo.wallet_notes_over_limit) {
            return {
              available: false,
              reason: '钱包备注已达上限',
              requiresUpgrade: true
            };
          }
          break;

        case 'kol':
          // KOL功能基础用户也可用
          break;
      }

      return { available: true };
    } catch (error) {
      console.error(`❌ 检查功能[${feature}]可用性失败:`, error);
      return {
        available: false,
        reason: '检查失败',
        requiresUpgrade: false
      };
    }
  }

  /**
   * 重置检查状态（用于测试或强制重新检查）
   */
  static resetCheckState(): void {
    this.lastCheckTime = 0;
    this.isChecking = false;
    this.checkPromise = null;
  }
}
