# Tw3Track Extension

[English](#english) | [中文](#中文)

---

## English

### Overview
A Chrome extension for tracking Twitter Web3 data and trends.

### Features
- 🐦 **Twitter Data Analysis**: Real-time tracking of Twitter user follow changes, history records and KOL analysis
- 💰 **Wallet Address Tracking**: Automatically identify and manage wallet addresses associated with Twitter users  
- 📝 **Smart Notes System**: Add personalized notes for Twitter users and wallet addresses
- 📊 **Web3 Trends Monitoring**: Track hot trends and market dynamics in the Web3 field
- 🔍 **Multi-Network Support**: Support for EVM, Solana, and Sui networks

### Tech Stack
- **Framework**: React + TypeScript
- **Extension Platform**: Chrome Extension (Plasmo Framework)
- **UI Components**: Tailwind CSS + shadcn/ui
- **Build Tool**: Bun

### Installation & Development

#### Prerequisites
- Node.js 16+ or Bun
- Chrome Browser

#### Build from Source
```bash
# Clone the repository
git clone https://github.com/Web3HookLab/Tw3Extension.git
cd Tw3Extension

# Install dependencies
bun install

# Development build
bun run dev

# Production build
bun run build
```

#### Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `build/chrome-mv3-prod` folder

### Usage
1. Install the extension in Chrome
2. Visit Twitter/X pages to see Web3 data analysis
3. Click the extension icon to access dashboard and settings
4. Add notes for Twitter users and wallet addresses
5. Monitor Web3 trends and KOL activities

### Contact & Support
- **Official Website**: https://www.tw3track.com
- **Telegram Channel**: https://t.me/Tw3Track
- **GitHub**: https://github.com/Web3HookLab/Tw3Extension

### License
This project is licensed under the MIT License.

---

## 中文

### 项目简介
这是一个基于Chrome扩展的Twitter Web3数据追踪工具。

### 功能特性
- 🐦 **Twitter数据分析**: 实时追踪Twitter用户的关注变化、历史记录和KOL分析
- 💰 **钱包地址追踪**: 自动识别和管理Twitter用户关联的钱包地址
- 📝 **智能备注系统**: 为Twitter用户和钱包地址添加个性化备注
- 📊 **Web3趋势监控**: 追踪Web3领域的热门趋势和市场动态
- 🔍 **多网络支持**: 支持EVM、Solana和Sui网络

### 技术栈
- **框架**: React + TypeScript
- **扩展平台**: Chrome Extension (Plasmo框架)
- **UI组件**: Tailwind CSS + shadcn/ui
- **构建工具**: Bun

### 安装与开发

#### 环境要求
- Node.js 16+ 或 Bun
- Chrome浏览器

#### 从源码构建
```bash
# 克隆仓库
git clone https://github.com/Web3HookLab/Tw3Extension.git
cd Tw3Extension

# 安装依赖
bun install

# 开发构建
bun run dev

# 生产构建
bun run build
```

#### 在Chrome中加载扩展
1. 打开Chrome浏览器，访问 `chrome://extensions/`
2. 在右上角启用"开发者模式"
3. 点击"加载已解压的扩展程序"，选择 `build/chrome-mv3-prod` 文件夹

### 使用方法
1. 在Chrome中安装扩展
2. 访问Twitter/X页面查看Web3数据分析
3. 点击扩展图标访问仪表板和设置
4. 为Twitter用户和钱包地址添加备注
5. 监控Web3趋势和KOL活动

### 联系与支持
- **官方网站**: https://www.tw3track.com
- **Telegram频道**: https://t.me/Tw3Track
- **GitHub仓库**: https://github.com/Web3HookLab/Tw3Extension

### 开源协议
本项目采用MIT开源协议。

---

## Changelog | 更新日志

### v1.0.1 - 2025.07.24

#### English
**🐛 Bug Fixes & Improvements**
- Fixed KOL card loading error when StatsCard fails to load data
- Corrected KOL card text display: changed "Following KOLs" to "KOL Followers" to accurately reflect "KOLs who follow this account"
- Fixed KOL card empty state message to properly indicate "No KOLs are following this account"
- Replaced hardcoded text in TermsAgreement component with internationalization support

**📄 New Features**
- Added comprehensive Terms of Service and Privacy Policy
- Enhanced multilingual support for all user-facing text
- Improved error handling and user experience

#### 中文
**🐛 错误修复与改进**
- 修复了当StatsCard数据加载失败时KOL卡片持续加载的错误
- 修正了KOL卡片文案显示：将"关注的KOL"改为"KOL关注者"，准确表达"关注此账户的KOL"含义
- 修复了KOL卡片空状态提示，正确显示"没有任何KOL关注此账户"
- 将TermsAgreement组件中的硬编码文本替换为多语言支持

**📄 新增功能**
- 添加了完整的服务条款和隐私政策
- 增强了所有用户界面文本的多语言支持
- 改进了错误处理和用户体验

---

**Version**: 1.0.1
**Author**: Web3Hook
**Last Updated**: 2025.07.24