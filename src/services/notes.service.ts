import { Storage } from "@plasmohq/storage"

import type {
  DataFetchResult,
  TwitterNote,
  WalletNote
} from "~src/types/notes.service.types"

import { API_CONFIG } from "../config/config"
import { TokenManager } from "./token.service"

// 创建存储实例
const storage = new Storage({
  area: "local"
})

// 通用数据服务类
export class DataService {
  // 存储键名
  static readonly TWITTER_NOTES_KEY = "twitter_notes"
  static readonly WALLET_NOTES_KEY = "wallet_notes"

  // API端点
  static readonly TWITTER_NOTES_API =
    API_CONFIG.BASE + API_CONFIG.ENDPOINTS.TWITTER_NOTES_LIST
  static readonly WALLET_NOTES_API =
    API_CONFIG.BASE + API_CONFIG.ENDPOINTS.WALLET_NOTES_LIST

  /**
   * 通用数据拉取函数
   * @param apiUrl API地址
   * @param storageKey 存储键名
   * @param dataPath 数据在响应中的路径
   * @param maxItems 最大条数
   * @param onProgress 进度回调
   */
  private static async fetchAllData<T>(
    apiUrl: string,
    storageKey: string,
    dataPath: string,
    maxItems: number = 5000,
    onProgress?: (progress: number) => void,
    tempToken?: string // 新增临时token参数
  ): Promise<DataFetchResult<T>> {
    try {
      // 优先使用临时token，否则从本地获取
      const token = tempToken || (await TokenManager.getToken())
      if (!token) {
        return { success: false, data: [], error: "No token available" }
      }

      let allData: T[] = []
      let offset = 0
      const limit = 200
      let code429 = false
      const maxPages = Math.ceil(maxItems / limit)

      for (let i = 0; i < maxPages && i < 25; i++) {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            'User-Agent': 'Tw3Track-Extension/1.0'
          },
          body: JSON.stringify({ limit, offset })
        })

        if (res.status === 429) {
          code429 = true
          break
        }

        const response = await res.json()
        if (response.code === 200) {
          const pageData = this.getNestedData(response.data, dataPath) || []
          allData.push(...pageData)

          // 更新进度
          if (onProgress) {
            const progress = Math.min(((i + 1) / maxPages) * 100, 100)
            onProgress(progress)
          }

          if (!response.data.has_more) break
          offset += limit
        } else {
          return {
            success: false,
            data: [],
            error: response.msg || "API request failed"
          }
        }
      }

      if (code429) {
        // 429错误时使用Chrome Storage缓存
        const cached = (await storage.get(storageKey)) || []
        return {
          success: true,
          data: Array.isArray(cached) ? cached : [],
          cached: true,
          error: "Rate limited, using cached data"
        }
      } else {
        // 成功拉取，更新Chrome Storage缓存
        await storage.set(storageKey, allData)
        return {
          success: true,
          data: allData,
          cached: false
        }
      }
    } catch (error) {
      console.error("Data fetch error:", error)
      // 发生错误时尝试使用Chrome Storage缓存
      const cached = (await storage.get(storageKey)) || []
      return {
        success: false,
        data: Array.isArray(cached) ? cached : [],
        cached: true,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  /**
   * 从嵌套对象中获取数据
   */
  private static getNestedData(obj: any, path: string): any[] {
    const keys = path.split(".")
    let current = obj
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key]
      } else {
        return []
      }
    }
    return Array.isArray(current) ? current : []
  }

  /**
   * 拉取推特备注数据
   */
  static async fetchTwitterNotes(
    onProgress?: (progress: number) => void,
    tempToken?: string
  ): Promise<DataFetchResult<TwitterNote>> {
    return this.fetchAllData<TwitterNote>(
      this.TWITTER_NOTES_API,
      this.TWITTER_NOTES_KEY,
      "data",
      5000,
      onProgress,
      tempToken
    )
  }

  static async fetchWalletNotes(
    onProgress?: (progress: number) => void,
    tempToken?: string
  ): Promise<DataFetchResult<WalletNote>> {
    return this.fetchAllData<WalletNote>(
      this.WALLET_NOTES_API,
      this.WALLET_NOTES_KEY,
      "notes",
      5000,
      onProgress,
      tempToken
    )
  }
  /**
   * 获取本地缓存的钱包数据
   */
  static async getLocalWalletNotes(): Promise<WalletNote[]> {
    try {
      // 使用Plasmo Storage，保持项目一致性
      const data = (await storage.get(this.WALLET_NOTES_KEY)) || []
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error("Error getting local wallet notes:", error)
      return []
    }
  }
  /**
   * 获取本地缓存的推特数据
   */
  static async getLocalTwitterNotes(): Promise<TwitterNote[]> {
    try {
      // 使用Plasmo Storage，保持项目一致性
      const data = (await storage.get(this.TWITTER_NOTES_KEY)) || []
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error("Error getting local Twitter notes:", error)
      return []
    }
  }
  /**
   * 清除本地缓存数据
   */
  static async clearLocalCache(
    type: "twitter" | "wallet" | "all" = "all"
  ): Promise<void> {
    try {
      if (type === "twitter" || type === "all") {
        await storage.remove(this.TWITTER_NOTES_KEY)
        localStorage.removeItem(this.TWITTER_NOTES_KEY) // 同时清理可能存在的localStorage数据
      }
      if (type === "wallet" || type === "all") {
        await storage.remove(this.WALLET_NOTES_KEY)
        localStorage.removeItem(this.WALLET_NOTES_KEY) // 同时清理可能存在的localStorage数据
      }
      console.log(`✅ 已清除本地缓存: ${type}`)
    } catch (error) {
      console.error(`❌ 清除本地缓存失败: ${type}`, error)
    }
  }
  /**
   * 导出数据为CSV格式
   */
  static exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    headers: { key: keyof T; label: string }[]
  ): void {
    if (data.length === 0) {
      console.warn("No data to export")
      return
    }

    // 创建CSV标题行
    const csvHeaders = headers.map((h) => h.label).join(",")

    // 创建CSV数据行
    const csvRows = data.map((item) => {
      return headers
        .map((header) => {
          let value: any = item[header.key]

          // 处理数组类型（如tags）
          if (Array.isArray(value)) {
            value = value.join(";")
          }

          // 处理空值
          if (value === null || value === undefined) {
            value = ""
          }

          // 转换为字符串并处理特殊字符
          const stringValue = String(value)

          // 如果包含逗号、换行符或引号，需要用引号包围并转义内部引号
          if (
            stringValue.includes(",") ||
            stringValue.includes("\n") ||
            stringValue.includes('"')
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }

          return stringValue
        })
        .join(",")
    })

    // 合并标题行和数据行
    const csvContent = [csvHeaders, ...csvRows].join("\n")

    // 添加BOM以支持中文
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;"
    })

    // 创建下载链接
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * 导出推特数据为CSV
   */
  static async exportTwitterNotesToCSV(): Promise<void> {
    const data = await this.getLocalTwitterNotes()
    const headers = [
      { key: "twitter_rest_id" as keyof TwitterNote, label: "Twitter ID" },
      { key: "name" as keyof TwitterNote, label: "Name" },
      { key: "screen_name" as keyof TwitterNote, label: "Username" },
      { key: "note" as keyof TwitterNote, label: "Note" },
      { key: "tags" as keyof TwitterNote, label: "Tags" },
      { key: "created_at" as keyof TwitterNote, label: "Created At" }
    ]

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "")
    this.exportToCSV(data, `twitter-notes-${timestamp}.csv`, headers)
  }

  /**
   * 导出钱包数据为CSV
   */
  static async exportWalletNotesToCSV(): Promise<void> {
    const data = await this.getLocalWalletNotes()
    const headers = [
      { key: "wallet_address" as keyof WalletNote, label: "Wallet Address" },
      { key: "network" as keyof WalletNote, label: "Network" },
      { key: "note" as keyof WalletNote, label: "Note" },
      { key: "source" as keyof WalletNote, label: "Source" },
      { key: "created_at" as keyof WalletNote, label: "Created At" }
    ]

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "")
    this.exportToCSV(data, `wallet-notes-${timestamp}.csv`, headers)
  }
}
