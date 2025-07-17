import React, { createContext, useContext, useEffect, useState } from 'react'
import { Storage } from '@plasmohq/storage'
import { useSettings } from './SettingsContext'

export type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "light"
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// 导出context供其他地方使用
export { ThemeProviderContext }

// 使用Plasmo的存储API
const storage = new Storage({ area: 'local' })

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "app-theme",
  ...props
}: ThemeProviderProps) {
  const { theme, setTheme: setSettingsTheme } = useSettings() // 在组件顶层调用 hook
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light')
  const [mounted, setMounted] = useState(false)

  // 获取系统主题
  const getSystemTheme = (): 'dark' | 'light' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // 应用主题到DOM
  const applyTheme = (resolvedTheme: 'dark' | 'light') => {
    if (typeof document === 'undefined') return
    
    const root = document.documentElement
    
    // 移除所有主题类
    root.classList.remove("light", "dark")
    
    // 添加新主题类
    root.classList.add(resolvedTheme)
    
    // 设置color-scheme属性
    root.style.colorScheme = resolvedTheme
    
    // 为Plasmo扩展设置额外的样式属性
    document.body.setAttribute('data-theme', resolvedTheme)
    
    console.log(`🎨 Theme applied: ${resolvedTheme}`)
  }

  // 监听 theme 变化
  useEffect(() => {
    const actualTheme = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(actualTheme as 'dark' | 'light');
    applyTheme(actualTheme as 'dark' | 'light');
    setMounted(true);
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    if (!mounted || theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const systemTheme = e.matches ? "dark" : "light";
      setResolvedTheme(systemTheme as 'dark' | 'light');
      applyTheme(systemTheme as 'dark' | 'light');
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, mounted]);

  // 在 ThemeProvider 组件中修改 value 对象
  // 修复 setTheme 函数
  const handleSetTheme = async (newTheme: Theme) => {
    console.log('🎨 Setting theme:', newTheme)
    await setSettingsTheme(newTheme)
    
    // 立即应用主题
    const actualTheme = newTheme === "system" ? getSystemTheme() : newTheme
    setResolvedTheme(actualTheme as 'dark' | 'light')
    applyTheme(actualTheme as 'dark' | 'light')
  }

  const value = {
    theme: theme as Theme,
    resolvedTheme,
    setTheme: handleSetTheme, // 使用修复后的函数
  }

  // 防止水合不匹配，在客户端挂载前不渲染
  if (!mounted) {
    return null
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}