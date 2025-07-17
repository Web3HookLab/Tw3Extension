/**
 * Content Script多语言Hook
 * 在Content Script环境中使用多语言功能
 */

import { useState, useEffect } from 'react'
import { getContentI18n } from '~src/utils/i18n-content'
import type { ContentI18n } from '~src/utils/i18n-content'

interface UseContentI18nReturn {
  t: (key: string, params?: Record<string, any>) => string
  language: string
  isLoading: boolean
  error: string | null
}

/**
 * 在Content Script中使用多语言的Hook
 */
export function useContentI18n(): UseContentI18nReturn {
  const [i18n, setI18n] = useState<ContentI18n | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const initializeI18n = async () => {
      try {
        console.log('🌍 初始化Content Script多语言')
        const i18nInstance = await getContentI18n()
        
        if (mounted) {
          setI18n(i18nInstance)
          setError(null)
          console.log('✅ Content Script多语言初始化成功:', i18nInstance.getLanguage())
        }
      } catch (err) {
        console.error('❌ Content Script多语言初始化失败:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : '多语言初始化失败')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initializeI18n()

    return () => {
      mounted = false
    }
  }, [])

  // 翻译函数
  const t = (key: string, params?: Record<string, any>): string => {
    if (!i18n) {
      console.warn('⚠️ i18n未初始化，返回原始key:', key)
      return key
    }

    try {
      let result = i18n.t(key)

      // 如果有参数，手动替换占位符
      if (params && typeof params === 'object') {
        Object.entries(params).forEach(([paramKey, value]) => {
          result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(value))
        })
      }

      return result
    } catch (error) {
      console.warn('⚠️ 翻译失败:', { key, params, error })
      return key
    }
  }

  return {
    t,
    language: i18n?.getLanguage() || 'en',
    isLoading,
    error
  }
}

/**
 * 简化版本的多语言Hook，直接返回翻译函数
 */
export function useSimpleI18n(): (key: string, params?: Record<string, any>) => string {
  const { t } = useContentI18n()
  return t
}

/**
 * 获取当前语言
 */
export function useCurrentLanguage(): string {
  const { language } = useContentI18n()
  return language
}

/**
 * 检查多语言是否已准备就绪
 */
export function useI18nReady(): boolean {
  const { isLoading, error } = useContentI18n()
  return !isLoading && !error
}
