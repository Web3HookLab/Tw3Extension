/**
 * 删帖榜单格式化工具函数
 */

/**
 * 格式化数字为本地化字符串
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * 格式化删帖率为百分比
 */
export function formatDeleteRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/**
 * 格式化时间为相对时间
 */
export function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString();
  } catch {
    return dateStr;
  }
}

/**
 * 格式化用户名显示
 */
export function formatUsername(screenName: string): string {
  return `@${screenName}`;
}

/**
 * 获取删帖率的严重程度
 */
export function getDeleteRateSeverity(rate: number): 'low' | 'medium' | 'high' {
  if (rate > 0.1) return 'high';    // 超过10%
  if (rate > 0.05) return 'medium'; // 5%-10%
  return 'low';                     // 低于5%
}

/**
 * 获取排名的显示样式
 */
export function getRankDisplayStyle(rank: number): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
} {
  if (rank === 1) {
    return { variant: 'destructive', className: 'bg-yellow-500 text-white' };
  }
  if (rank <= 3) {
    return { variant: 'secondary', className: 'bg-gray-400 text-white' };
  }
  if (rank <= 10) {
    return { variant: 'outline', className: 'bg-orange-400 text-white' };
  }
  return { variant: 'default' };
}

/**
 * 生成 CSV 内容
 */
export function generateCSVContent(data: any[], headers: string[]): string {
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // 处理包含逗号或引号的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * 验证筛选条件
 */
export function validateFilters(filters: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!filters.time_range) {
    errors.push('时间范围不能为空');
  }
  
  if (!filters.sort_by) {
    errors.push('排序方式不能为空');
  }
  
  if (!filters.order) {
    errors.push('排序顺序不能为空');
  }
  
  if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
    errors.push('每页显示数量必须在1-100之间');
  }
  
  if (filters.offset && filters.offset < 0) {
    errors.push('偏移量不能为负数');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 生成缓存键
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return `${prefix}_${sortedParams}`;
}

/**
 * 检查缓存是否过期
 */
export function isCacheExpired(timestamp: number, maxAge: number): boolean {
  return Date.now() - timestamp > maxAge;
}
