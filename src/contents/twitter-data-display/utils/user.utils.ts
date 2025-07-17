/**
 * 用户信息工具函数
 * 从本地缓存获取用户信息，避免不必要的API调用
 */

import { Storage } from '@plasmohq/storage'
import type { UserInfo } from '~src/types/auth.service.types'
import { SmartStatusChecker } from '~src/utils/smart-status-checker'

const storage = new Storage({ area: 'local' })

/**
 * 从本地缓存获取用户信息
 */
export async function getUserInfoFromCache(): Promise<UserInfo | null> {
  try {
    const userInfo = await storage.get('user_info')
    if (userInfo && typeof userInfo === 'object') {
      console.log('📦 从缓存获取用户信息成功')
      return userInfo as UserInfo
    }
    
    console.log('⚠️ 缓存中无用户信息')
    return null
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error)
    return null
  }
}

/**
 * 检查用户会员状态
 */
export async function checkMemberStatus(): Promise<boolean> {
  try {
    const userInfo = await getUserInfoFromCache()
    if (!userInfo) {
      console.log('⚠️ 无用户信息，默认为非会员')
      return false
    }
    
    // 根据plan判断是否为会员
    const isMember = userInfo.plan !== 'Free'
    console.log('🔍 会员状态检查:', { plan: userInfo.plan, isMember })
    
    return isMember
  } catch (error) {
    console.error('❌ 检查会员状态失败:', error)
    return false
  }
}

/**
 * 获取用户计划信息
 */
export async function getUserPlanInfo(): Promise<{
  plan: string
  limit: number
  used: number
  isOverLimit: boolean
} | null> {
  try {
    const userInfo = await getUserInfoFromCache()
    if (!userInfo) return null
    
    return {
      plan: userInfo.plan,
      limit: userInfo.limit,
      used: userInfo.used,
      isOverLimit: userInfo.used >= userInfo.limit
    }
  } catch (error) {
    console.error('❌ 获取用户计划信息失败:', error)
    return null
  }
}

/**
 * 检查用户是否被拉黑
 */
export async function checkBlacklistStatus(): Promise<boolean> {
  try {
    const userInfo = await getUserInfoFromCache()
    if (!userInfo) return false
    
    const isBlacklisted = userInfo.is_blacklisted || false
    if (isBlacklisted) {
      console.warn('⚠️ 用户已被拉黑')
    }
    
    return isBlacklisted
  } catch (error) {
    console.error('❌ 检查黑名单状态失败:', error)
    return false
  }
}

/**
 * 获取用户使用限制信息
 */
export async function getUserLimits(): Promise<{
  twitterNotes: { count: number; max: number; overLimit: boolean }
  walletNotes: { count: number; max: number; overLimit: boolean }
  twitterAccounts: { max: number }
  walletAddresses: { max: number }
} | null> {
  try {
    const userInfo = await getUserInfoFromCache()
    if (!userInfo) return null
    
    return {
      twitterNotes: {
        count: userInfo.twitter_notes_count || 0,
        max: userInfo.max_twitter_accounts || 0,
        overLimit: userInfo.twitter_notes_over_limit || false
      },
      walletNotes: {
        count: userInfo.wallet_notes_count || 0,
        max: userInfo.max_wallet_addresses || 0,
        overLimit: userInfo.wallet_notes_over_limit || false
      },
      twitterAccounts: {
        max: userInfo.max_twitter_accounts || 0
      },
      walletAddresses: {
        max: userInfo.max_wallet_addresses || 0
      }
    }
  } catch (error) {
    console.error('❌ 获取用户限制信息失败:', error)
    return null
  }
}

/**
 * 检查功能是否可用（使用智能状态检查）
 */
export async function checkFeatureAvailability(
  feature: 'history' | 'kol' | 'wallet' | 'followEvents',
  forceRefresh: boolean = false
): Promise<{
  available: boolean
  reason?: string
  requiresUpgrade?: boolean
}> {
  // 使用智能状态检查器
  return await SmartStatusChecker.checkFeatureAvailability(feature, forceRefresh);
}

/**
 * 检查功能是否可用（仅使用本地缓存）
 */
export async function checkFeatureAvailabilityFromCache(feature: 'history' | 'kol' | 'wallet' | 'followEvents'): Promise<{
  available: boolean
  reason?: string
  requiresUpgrade?: boolean
}> {
  try {
    const userInfo = await getUserInfoFromCache()
    if (!userInfo) {
      return {
        available: false,
        reason: '用户未登录',
        requiresUpgrade: false
      }
    }
    
    // 检查黑名单状态
    if (userInfo.is_blacklisted) {
      return {
        available: false,
        reason: '账户已被限制',
        requiresUpgrade: false
      }
    }
    
    // 根据功能类型检查
    switch (feature) {
      case 'history':
        // 历史功能需要会员
        if (userInfo.plan === 'Free') {
          return {
            available: false,
            reason: '历史功能需要会员权限',
            requiresUpgrade: true
          }
        }
        break

      case 'followEvents':
        // Follow Events功能需要会员
        if (userInfo.plan === 'Free') {
          return {
            available: false,
            reason: 'Follow Events功能需要会员权限',
            requiresUpgrade: true
          }
        }
        break

      case 'kol':
        // KOL功能基础用户也可用
        break

      case 'wallet':
        // 钱包功能检查使用限制
        if (userInfo.wallet_notes_over_limit) {
          return {
            available: false,
            reason: '钱包备注已达上限',
            requiresUpgrade: true
          }
        }
        break
    }
    
    return { available: true }
  } catch (error) {
    console.error('❌ 检查功能可用性失败:', error)
    return {
      available: false,
      reason: '检查失败',
      requiresUpgrade: false
    }
  }
}
