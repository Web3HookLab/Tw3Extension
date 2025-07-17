import { API_CONFIG } from "../config/config"
import {
  type ApiResponse,
  type BlacklistCheckResult,
  type UserInfo
} from "../types/auth.service.types"
import { TokenManager } from "./token.service"

export class ApiClient {
  //验证token 是否有效
  static async verifyToken(token: string): Promise<ApiResponse<UserInfo>> {
    const requestUrl = `${API_CONFIG.BASE}${API_CONFIG.ENDPOINTS.USER_STATUS}`
    console.log(`🔄 API Request: ${requestUrl}`)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.REQUEST_TIMEOUT
      )

      const response = await fetch(requestUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          'User-Agent': 'Tw3Track-Extension/1.0'
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      console.log(`📡 API Response: ${response.status} ${response.statusText}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data: ApiResponse<UserInfo> = await response.json()
      console.log(
        `✅ API Success: code=${data.code}, user_id=${data.data?.user_id}, blacklisted=${data.data?.is_blacklisted}`
      )

      // 注意：这里只验证，不保存token和用户状态
      // token和用户状态将在登录流程的最后一步保存
      return data
    } catch (error) {
      console.error(`❌ API Error for ${requestUrl}:`, error)
      throw error
    }
  }
  // 保存状态 和token
  static async completeLogin(token: string, userInfo: UserInfo): Promise<void> {
    await TokenManager.saveToken(token)
    await TokenManager.saveUserInfo(userInfo)
    console.log("✅ Login completed and token saved")
  }
  // 检查黑名单
  static async checkBlacklistStatus(
    userStatus: UserInfo
  ): Promise<BlacklistCheckResult> {
    const isBlacklisted = userStatus.is_blacklisted
    if (isBlacklisted) {
      // 如果用户被加入黑名单，清除本地数据并要求重新登录
      await TokenManager.removeToken()
      return {
        isBlacklisted: true,
        shouldLogout: true,
        message: "Your account has been blacklisted. Please contact support."
      }
    }

    return {
      isBlacklisted: false,
      shouldLogout: false
    }
  }
  static async refreshUserStatus(): Promise<ApiResponse<UserInfo> | null> {
    try {
      const token = await TokenManager.getToken()
      if (!token) {
        return null
      }
      const response = await this.verifyToken(token)

      if (response.code === 200) {
        const BlacklistCheckResult = await this.checkBlacklistStatus(
          response.data
        )
        if (BlacklistCheckResult.isBlacklisted) {
          console.warn("User is blacklisted:", BlacklistCheckResult.message)
          return null
        }
        // 刷新时需要更新用户状态
        await TokenManager.saveUserInfo(response.data)
      }
      return response
    } catch (error) {
      console.error("❌ 刷新用户信息失败:", error)
      // 检查是否是服务器错误（502等）- 服务器未启动
      if (error instanceof Error && error.message.includes("502")) {
        console.warn("🔴 Server unavailable (502), keeping login state")
        // 返回特殊标记，表示服务器不可用但保持登录状态
        return {
          code: 502,
          msg: "Server unavailable",
          data: null as any,
          timestamp: new Date().toISOString()
        }
      }
      // 其他错误（如401, 403）可能是token问题，清除本地数据
      if (
        error instanceof Error &&
        (error.message.includes("401") || error.message.includes("403"))
      ) {
        console.warn("❌ 刷新用户信息失败，token可能失效")
        await TokenManager.removeToken()
      }
      return null
    }
  }
}
