# 删帖榜单模块

## 概述

删帖榜单模块是一个完整的 React 组件，用于显示 Twitter 用户的删帖统计排行榜。该模块支持多种筛选条件、分页浏览、数据导出等功能。

## 功能特性

- ✅ **多时间范围筛选**：今日、7天、30天、全部时间
- ✅ **灵活排序**：按删帖数量或最新删帖时间排序
- ✅ **分页浏览**：支持大数据量的分页展示
- ✅ **实时统计**：显示总用户数、当前页信息、缓存状态
- ✅ **数据缓存**：智能缓存机制，减少 API 调用
- ✅ **数据导出**：支持导出为 CSV 格式
- ✅ **多语言支持**：中英文切换
- ✅ **响应式设计**：适配不同屏幕尺寸
- ✅ **错误处理**：友好的错误提示和重试机制

## 文件结构

```
src/components/dashboard/DeletedTweetsLeaderboard/
├── DeletedTweetsLeaderboardModule.tsx     # 主模块组件
├── components/
│   ├── FilterPanel.tsx                    # 筛选面板
│   ├── StatsPanel.tsx                     # 统计信息面板
│   ├── LeaderboardTable.tsx               # 榜单表格
│   ├── UserRow.tsx                        # 用户行组件
│   └── PaginationControls.tsx             # 分页控制
├── hooks/
│   └── useDeletedTweetsLeaderboard.ts     # 数据获取 Hook
├── utils/
│   └── formatters.ts                      # 格式化工具函数
└── README.md                              # 说明文档
```

## 使用方法

### 基本使用

```tsx
import { DeletedTweetsLeaderboardModule } from '~src/components/dashboard/DeletedTweetsLeaderboard/DeletedTweetsLeaderboardModule';

function App() {
  return (
    <div>
      <DeletedTweetsLeaderboardModule />
    </div>
  );
}
```

### Hook 使用

```tsx
import { useDeletedTweetsLeaderboard } from './hooks/useDeletedTweetsLeaderboard';

function CustomComponent() {
  const { state, actions } = useDeletedTweetsLeaderboard();
  
  const {
    rankings,
    loading,
    error,
    filters,
    pagination,
    stats
  } = state;
  
  const {
    updateFilters,
    refreshData,
    goToPage
  } = actions;
  
  // 自定义逻辑...
}
```

## API 接口

### 请求格式

```typescript
interface FilterOptions {
  time_range: 'today' | '7days' | '30days' | 'all';
  sort_by: 'deleted_count' | 'latest_delete';
  order: 'desc' | 'asc';
  limit: number;
  offset: number;
}
```

### 响应格式

```typescript
interface LeaderboardResponse {
  code: number;
  msg: string;
  data: {
    time_range: TimeRange;
    total_users: number;
    rankings: UserRanking[];
    next_offset: number;
    has_more: boolean;
  };
}
```

## 配置说明

### 缓存配置

```typescript
const CACHE_CONFIG = {
  CACHE_DURATION: {
    today: 5 * 60 * 1000,      // 5分钟
    '7days': 30 * 60 * 1000,   // 30分钟
    '30days': 2 * 60 * 60 * 1000, // 2小时
    all: 6 * 60 * 60 * 1000,   // 6小时
  }
};
```

### 分页配置

```typescript
const PAGE_SIZE_OPTIONS = [20, 50, 100];
const DEFAULT_PAGE_SIZE = 50;
```

## 多语言支持

模块支持中英文切换，翻译键位于：
- `src/locales/zh.json`
- `src/locales/en.json`

主要翻译键：
- `deletedTweetsLeaderboard.title`
- `deletedTweetsLeaderboard.description`
- `deletedTweetsLeaderboard.timeRange.*`
- `deletedTweetsLeaderboard.sortBy.*`
- `deletedTweetsLeaderboard.table.*`

## 样式定制

组件使用 Tailwind CSS 和 shadcn/ui 组件库，可以通过以下方式定制样式：

1. **修改 Tailwind 类名**：直接在组件中修改 className
2. **使用 CSS 变量**：通过 CSS 变量定制主题色彩
3. **覆盖组件样式**：使用更高优先级的 CSS 规则

## 性能优化

1. **数据缓存**：根据时间范围设置不同的缓存时间
2. **分页加载**：避免一次性加载大量数据
3. **防抖处理**：筛选条件变更时的防抖处理
4. **虚拟滚动**：大数据量时可考虑虚拟滚动优化

## 错误处理

模块包含完善的错误处理机制：

- **网络错误**：自动重试和友好提示
- **认证错误**：引导用户重新登录
- **数据错误**：显示错误信息和重试选项
- **缓存错误**：降级到 API 请求

## 测试建议

1. **功能测试**：
   - 筛选条件切换
   - 分页浏览
   - 数据刷新
   - 导出功能

2. **性能测试**：
   - 大数据量加载
   - 缓存命中率
   - 内存使用情况

3. **兼容性测试**：
   - 不同浏览器
   - 不同屏幕尺寸
   - 多语言切换

## 故障排除

### 常见问题

1. **数据加载失败**
   - 检查网络连接
   - 验证 API 端点配置
   - 确认认证令牌有效

2. **缓存问题**
   - 清除浏览器缓存
   - 检查存储权限
   - 验证缓存键生成逻辑

3. **样式问题**
   - 确认 Tailwind CSS 正确加载
   - 检查 shadcn/ui 组件依赖
   - 验证 CSS 变量定义

### 调试技巧

1. 开启浏览器开发者工具
2. 查看 Network 面板的 API 请求
3. 检查 Console 面板的错误信息
4. 使用 React DevTools 查看组件状态

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 初始版本发布
- ✅ 基础功能实现
- ✅ 多语言支持
- ✅ 响应式设计
- ✅ 数据缓存机制
- ✅ 网络状态监控
- ✅ 完善的错误处理
