import { useState, useEffect } from "react"
import { ApiClient } from "./auth.api"
import { TokenManager } from "./token.service"
import type { AuthState } from "~src/types/auth.service.types"

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    userInfo: null
  })
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 获取是否有token信息在本地 如果没有 直接返回
        const isLoggedIn = await TokenManager.isLoggedIn()
        if (!isLoggedIn) {
          // 返回没有登陆
          return setAuthState({
            isLoggedIn: false,
            userInfo: null
          })
        }
        // 获取用户信息
        const userInfo = await TokenManager.getUserInfo()
        // 如果存在用户信息
        if (userInfo) {
          return setAuthState({
            isLoggedIn: true,
            userInfo: userInfo
          })
        }
      } catch (error) {
        console.log(`❌ 获取token 初始化 错误`, error)
      }
    }
    initAuth()
  }, [])

  // 登陆方法
  const login = async (token: string) => {
    try {
      const response = await ApiClient.verifyToken(token)
      if (response.code === 200) {
        setAuthState({
          isLoggedIn: true,
          userInfo: response.data
        })
        return { success: true }
      } else {
        return { success: false, message: response.msg }
      }
    } catch (error) {
      console.log("❌ 登陆失败", error)
    }
  }
  // 登出方法
  const logout = async () => {
    try {
      // 立即更新UI状态，提供即时反馈
      setAuthState({
        isLoggedIn: false,
        userInfo: null
      })
      // 在后台清理数据
      await TokenManager.removeToken()
      console.log("✅ 用户登出成功")
    } catch (error) {
      console.error("❌ 用户登出失败:", error)
      // 即使清理失败，也保持登出状态
    }
  }
  // 刷新用户状态方法
  const refreshUserStatus = async () => {
    try {
      const response = await ApiClient.refreshUserStatus()
      if (response && response.code === 200) {
        setAuthState((prev) => ({
          ...prev,
          isLoggedIn: true,
          userInfo: response.data
        }))
      } else if (response && response.code === 502) {
        // 服务器不可用，保持登录状态但不更新用户数据
        console.warn("🔴 服务器错误。保持后台 ")
        setAuthState((prev) => ({
          ...prev,
          isLoggedIn: true,
          userInfo: response.data
        }))
      } else {
        // 其他错误，可能token已过期
        console.warn("❌ Token 刷新失败 退出")
        await logout()
      }
    } catch (error) {
      console.error("❌ 刷新用户状态失败:", error)
      await logout()
    }
  }
  // 检查token 有效性方法
  const checkTokenValidity = async () => {
    try {
      const token = await TokenManager.getToken()
      if (!token) {
        return false
      }
      const response = await ApiClient.verifyToken(token)
      if (response.code === 200) {
        return true
      }
    } catch (error) {
      console.error("❌ 检查token 有效性失败:", error)
    }
  }
  return {
    ...authState,
    login,
    logout,
    refreshUserStatus,
    checkTokenValidity
  }
}
export { ApiClient }

