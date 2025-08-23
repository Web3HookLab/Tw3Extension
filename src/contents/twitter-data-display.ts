/**
 * 重构完成：此文件已被模块化重构
 * 新的入口文件：src/contents/twitter-data-display/index.tsx
 *
 * 为了保持向后兼容，此文件现在导入并使用新的模块化结构
 */

import type { PlasmoCSConfig } from "plasmo"

// Plasmo配置 - 只在Twitter/X页面激活
export const config: PlasmoCSConfig = {
  matches: ["https://x.com/*", "https://twitter.com/*"],
  all_frames: false,
  run_at: "document_end"
}

// 导入新的模块化入口
import './twitter-data-display/index'


// 导出类型以保持兼容性
export type { TwitterJsonLD, TwitterUserData } from "~src/types/twitter-data.types"
