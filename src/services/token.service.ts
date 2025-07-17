import { Storage } from "@plasmohq/storage"

import { APP_CONFIG } from "~src/config/config"
import type { UserInfo } from "~src/types/auth.service.types"

const storage = new Storage({
  area: "local"
})

export class TokenManager {
  // TOKEN KEY
  private static readonly TOKEN_KEY = APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN
  // 用户信息
  private static readonly USER_INFO = APP_CONFIG.STORAGE_KEYS.USER_INFO

  // 保存token
  static async saveToken(token: string): Promise<void> {
    await storage.set(this.TOKEN_KEY, token)
  }
  // 获取token
  static async getToken(): Promise<string | null> {
    return await storage.get(this.TOKEN_KEY)
  }
  // 删除token与用户信息
  static async removeToken(): Promise<void> {
    await storage.remove(this.TOKEN_KEY)
    await storage.remove(this.USER_INFO)
  }
  // 检查是否已登录
  static async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken()
    return !!token
  }
  // 保存用户信息
  static async saveUserInfo(userInfo: UserInfo): Promise<void> {
    await storage.set(this.USER_INFO, userInfo)
  }
  // 获取用户信息
  static async getUserInfo(): Promise<UserInfo | null> {
    return await storage.get(this.USER_INFO)
  }
}
