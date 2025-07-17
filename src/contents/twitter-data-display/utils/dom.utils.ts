/**
 * DOM操作工具函数
 * 提供安全的DOM操作和查询功能
 */

/**
 * 安全地查询DOM元素
 */
export function safeQuerySelector<T extends Element = Element>(
  selector: string,
  container: Document | Element = document
): T | null {
  try {
    return container.querySelector<T>(selector)
  } catch (error) {
    console.warn('⚠️ DOM查询失败:', { selector, error })
    return null
  }
}

/**
 * 安全地查询多个DOM元素
 */
export function safeQuerySelectorAll<T extends Element = Element>(
  selector: string,
  container: Document | Element = document
): T[] {
  try {
    return Array.from(container.querySelectorAll<T>(selector))
  } catch (error) {
    console.warn('⚠️ DOM查询失败:', { selector, error })
    return []
  }
}

/**
 * 检查元素是否在视口中
 */
export function isElementInViewport(element: Element): boolean {
  try {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  } catch (error) {
    console.warn('⚠️ 检查元素视口位置失败:', error)
    return false
  }
}

/**
 * 等待元素出现
 */
export function waitForElement(
  selector: string,
  timeout: number = 5000,
  container: Document | Element = document
): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = safeQuerySelector(selector, container)
    if (element) {
      resolve(element)
      return
    }

    const observer = new MutationObserver(() => {
      const element = safeQuerySelector(selector, container)
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })

    observer.observe(container === document ? document.body : container, {
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
 * 检测暗色模式
 */
export function isDarkMode(): boolean {
  try {
    return (
      document.documentElement.style.colorScheme === 'dark' ||
      document.body.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches ||
      document.querySelector('[data-theme="dark"]') !== null
    )
  } catch (error) {
    console.warn('⚠️ 检测暗色模式失败:', error)
    return false
  }
}

/**
 * 安全地添加事件监听器
 */
export function safeAddEventListener<K extends keyof HTMLElementEventMap>(
  element: Element,
  type: K,
  listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): () => void {
  try {
    element.addEventListener(type, listener as any, options)
    
    // 返回清理函数
    return () => {
      try {
        element.removeEventListener(type, listener as any, options)
      } catch (error) {
        console.warn('⚠️ 移除事件监听器失败:', error)
      }
    }
  } catch (error) {
    console.warn('⚠️ 添加事件监听器失败:', error)
    return () => {} // 空的清理函数
  }
}

/**
 * 创建元素并设置属性
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, string>,
  styles?: Partial<CSSStyleDeclaration>
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName)
  
  // 设置属性
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      try {
        element.setAttribute(key, value)
      } catch (error) {
        console.warn('⚠️ 设置元素属性失败:', { key, value, error })
      }
    })
  }
  
  // 设置样式
  if (styles) {
    Object.entries(styles).forEach(([key, value]) => {
      try {
        if (value !== undefined) {
          ;(element.style as any)[key] = value
        }
      } catch (error) {
        console.warn('⚠️ 设置元素样式失败:', { key, value, error })
      }
    })
  }
  
  return element
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
 * 获取元素的计算样式
 */
export function getComputedStyleProperty(element: Element, property: string): string {
  try {
    const computedStyle = window.getComputedStyle(element)
    return computedStyle.getPropertyValue(property)
  } catch (error) {
    console.warn('⚠️ 获取计算样式失败:', { property, error })
    return ''
  }
}

/**
 * 检查元素是否可见
 */
export function isElementVisible(element: Element): boolean {
  try {
    const style = window.getComputedStyle(element)
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    )
  } catch (error) {
    console.warn('⚠️ 检查元素可见性失败:', error)
    return false
  }
}

/**
 * 防抖函数
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
 * 节流函数
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
