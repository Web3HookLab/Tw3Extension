/**
 * 格式化工具函数
 * 处理时间、数字、文本等的格式化显示
 */

/**
 * 格式化时间
 */
export function formatTime(date: Date, language: 'en' | 'zh' = 'zh'): string {
  try {
    return date.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.warn('⚠️ 时间格式化失败:', error)
    return date.toTimeString().slice(0, 5)
  }
}

/**
 * 格式化日期
 */
export function formatDate(date: Date, language: 'en' | 'zh' = 'zh'): string {
  try {
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch (error) {
    console.warn('⚠️ 日期格式化失败:', error)
    return date.toDateString()
  }
}

/**
 * 格式化粉丝数
 */
export function formatFollowerCount(count: number, language: 'en' | 'zh' = 'zh'): string {
  try {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')
  } catch (error) {
    console.warn('⚠️ 粉丝数格式化失败:', error)
    return count.toString()
  }
}

/**
 * 格式化数字
 */
export function formatNumber(num: number, language: 'en' | 'zh' = 'zh'): string {
  try {
    return num.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')
  } catch (error) {
    console.warn('⚠️ 数字格式化失败:', error)
    return num.toString()
  }
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
  try {
    if (total === 0) return '0%'
    const percentage = (value / total) * 100
    return `${percentage.toFixed(decimals)}%`
  } catch (error) {
    console.warn('⚠️ 百分比格式化失败:', error)
    return '0%'
  }
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: number, language: 'en' | 'zh' = 'zh'): string {
  try {
    const now = Date.now()
    const diff = now - timestamp
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    const week = 7 * day
    const month = 30 * day
    
    if (language === 'zh') {
      if (diff < minute) return '刚刚'
      if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
      if (diff < day) return `${Math.floor(diff / hour)}小时前`
      if (diff < week) return `${Math.floor(diff / day)}天前`
      if (diff < month) return `${Math.floor(diff / week)}周前`
      return `${Math.floor(diff / month)}个月前`
    } else {
      if (diff < minute) return 'just now'
      if (diff < hour) return `${Math.floor(diff / minute)}m ago`
      if (diff < day) return `${Math.floor(diff / hour)}h ago`
      if (diff < week) return `${Math.floor(diff / day)}d ago`
      if (diff < month) return `${Math.floor(diff / week)}w ago`
      return `${Math.floor(diff / month)}mo ago`
    }
  } catch (error) {
    console.warn('⚠️ 相对时间格式化失败:', error)
    return language === 'zh' ? '未知时间' : 'unknown time'
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  try {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  } catch (error) {
    console.warn('⚠️ 文件大小格式化失败:', error)
    return `${bytes} B`
  }
}

/**
 * 格式化钱包地址
 */
export function formatWalletAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  try {
    if (!address || address.length <= startChars + endChars) {
      return address
    }
    
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
  } catch (error) {
    console.warn('⚠️ 钱包地址格式化失败:', error)
    return address
  }
}

/**
 * 格式化用户名
 */
export function formatUsername(username: string, maxLength: number = 20): string {
  try {
    if (!username) return ''
    
    // 移除@符号
    const cleanUsername = username.replace(/^@/, '')
    
    if (cleanUsername.length <= maxLength) {
      return cleanUsername
    }
    
    return `${cleanUsername.slice(0, maxLength - 3)}...`
  } catch (error) {
    console.warn('⚠️ 用户名格式化失败:', error)
    return username
  }
}

/**
 * 格式化成功率
 */
export function formatSuccessRate(success: number, total: number, language: 'en' | 'zh' = 'zh'): string {
  try {
    if (total === 0) {
      return language === 'zh' ? '无数据' : 'No data'
    }
    
    const rate = formatPercentage(success, total)
    return `${success}/${total} (${rate})`
  } catch (error) {
    console.warn('⚠️ 成功率格式化失败:', error)
    return `${success}/${total}`
  }
}

/**
 * 格式化代币数据
 */
export function formatTokenData(count: number, successCount: number, language: 'en' | 'zh' = 'zh'): string {
  try {
    const rate = count > 0 ? formatPercentage(successCount, count) : '0%'
    return `${successCount}/${count} (${rate})`
  } catch (error) {
    console.warn('⚠️ 代币数据格式化失败:', error)
    return `${successCount}/${count}`
  }
}
