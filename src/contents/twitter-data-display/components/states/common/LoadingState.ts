/**
 * 加载状态组件
 * 显示数据加载中的状态
 */

export class LoadingState {
  /**
   * 创建加载状态元素
   */
  static create(container: HTMLElement, message: string, isDarkMode: boolean): void {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; padding: 20px; color: ${isDarkMode ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'};">
        <div style="width: 16px; height: 16px; border: 2px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'}; border-top: 2px solid rgb(59, 130, 246); border-radius: 50%; animation: tw3track-spin 1s linear infinite; margin-right: 8px;"></div>
        <span style="font-size: 14px;">${message}</span>
      </div>
    `
  }

  /**
   * 创建简单的加载状态（仅图标）
   */
  static createSimple(container: HTMLElement, isDarkMode: boolean): void {
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; padding: 10px;">
        <div style="width: 14px; height: 14px; border: 2px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'}; border-top: 2px solid rgb(59, 130, 246); border-radius: 50%; animation: tw3track-spin 1s linear infinite;"></div>
      </div>
    `
  }

  /**
   * 创建内联加载状态
   */
  static createInline(message: string, isDarkMode: boolean): string {
    return `
      <div style="display: flex; align-items: center; color: ${isDarkMode ? 'rgb(161, 161, 170)' : 'rgb(113, 113, 122)'};">
        <div style="width: 12px; height: 12px; border: 1px solid ${isDarkMode ? 'rgb(39, 39, 42)' : 'rgb(228, 228, 231)'}; border-top: 1px solid rgb(59, 130, 246); border-radius: 50%; animation: tw3track-spin 1s linear infinite; margin-right: 6px;"></div>
        <span style="font-size: 12px;">${message}</span>
      </div>
    `
  }
}
