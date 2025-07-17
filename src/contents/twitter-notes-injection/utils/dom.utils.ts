/**
 * DOM操作工具函数
 * 提供安全的DOM查询和操作功能
 */

/**
 * 安全的querySelector，避免抛出异常
 */
export function safeQuerySelector(selector: string, context: Document | Element = document): Element | null {
  try {
    return context.querySelector(selector)
  } catch (error) {
    console.warn('⚠️ querySelector失败:', selector, error)
    return null
  }
}

/**
 * 安全的querySelectorAll，避免抛出异常
 */
export function safeQuerySelectorAll(selector: string, context: Document | Element = document): NodeListOf<Element> | [] {
  try {
    return context.querySelectorAll(selector)
  } catch (error) {
    console.warn('⚠️ querySelectorAll失败:', selector, error)
    return [] as any
  }
}

/**
 * 等待元素出现
 */
export function waitForElement(
  selector: string, 
  timeout: number = 5000,
  context: Document | Element = document
): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = safeQuerySelector(selector, context)
    if (element) {
      resolve(element)
      return
    }

    const observer = new MutationObserver(() => {
      const element = safeQuerySelector(selector, context)
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })

    observer.observe(context === document ? document.body : context as Element, {
      childList: true,
      subtree: true
    })

    // 超时处理
    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeout)
  })
}

/**
 * 检查元素是否可见
 */
export function isElementVisible(element: Element): boolean {
  if (!element) return false
  
  const rect = element.getBoundingClientRect()
  const style = window.getComputedStyle(element)
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  )
}

/**
 * 检查是否为暗色模式
 */
export function isDarkMode(): boolean {
  try {
    // 检查HTML元素的data-theme属性
    const htmlElement = document.documentElement
    const theme = htmlElement.getAttribute('data-theme')
    if (theme) {
      return theme === 'dark'
    }

    // 检查body的背景色
    const bodyStyle = window.getComputedStyle(document.body)
    const backgroundColor = bodyStyle.backgroundColor
    
    // 解析RGB值
    const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number)
      // 计算亮度，如果亮度低于128则认为是暗色模式
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness < 128
    }

    return false
  } catch (error) {
    console.warn('⚠️ 检查暗色模式失败:', error)
    return false
  }
}

/**
 * 获取元素的最近的滚动容器
 */
export function getScrollContainer(element: Element): Element {
  let parent = element.parentElement
  
  while (parent) {
    const style = window.getComputedStyle(parent)
    const overflow = style.overflow + style.overflowY + style.overflowX
    
    if (overflow.includes('scroll') || overflow.includes('auto')) {
      return parent
    }
    
    parent = parent.parentElement
  }
  
  return document.documentElement
}

/**
 * 检查元素是否在视口内
 */
export function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * 创建防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * 创建节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }
}

/**
 * 安全地移除元素
 */
export function safeRemoveElement(element: Element | null): boolean {
  try {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element)
      return true
    }
    return false
  } catch (error) {
    console.warn('⚠️ 移除元素失败:', error)
    return false
  }
}

/**
 * 检查元素是否包含指定的类名
 */
export function hasClass(element: Element, className: string): boolean {
  return element.classList.contains(className)
}

/**
 * 安全地添加类名
 */
export function addClass(element: Element, className: string): void {
  try {
    element.classList.add(className)
  } catch (error) {
    console.warn('⚠️ 添加类名失败:', className, error)
  }
}

/**
 * 安全地移除类名
 */
export function removeClass(element: Element, className: string): void {
  try {
    element.classList.remove(className)
  } catch (error) {
    console.warn('⚠️ 移除类名失败:', className, error)
  }
}
