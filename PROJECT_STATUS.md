# 📊 Project Status Report: Receipt Manifestation App

**日期**: 2025-11-24
**版本**: v1.0.0 (MVP Complete)
**状态**: ✅ 已交付 (Production Ready)

---

## 1. 项目概述 (Executive Summary)

本项目是一个集 **"手绘风 UI"** 与 **"自动化工作流"** 于一体的全栈 Web 应用。旨在通过极其简单的交互（拍照/发邮件），利用 AI 自动将杂乱的小票转化为结构化的财务数据，并归档至 Google Drive 和 Sheets。

**核心理念**: "Manifesting Abundance" (显化丰盛) —— 让记账不再枯燥，而是一种充满仪式感的能量流动。

---

## 2. 已实现功能 (Implemented Features)

### 🎨 前端体验 (Frontend Experience)
*   **高保真手绘 UI**: 使用 `Patrick Hand` 字体、纸张纹理背景、波浪边框和有机动画，营造独特的视觉体验。
*   **实时进度反馈**: 通过 SSE (Server-Sent Events) 技术，实时展示后台处理状态（上传 -> AI 思考 -> 归档 -> 完成）。
*   **系统健康看板**: 顶部状态栏实时显示 AI、Drive、Sheet、Email 四大核心服务的连接状态（绿灯/橙灯）。
*   **动态数据统计**: "Spending Insight" 卡片根据当前会话上传的小票金额实时求和显示。
*   **移动端优先**: 完美适配手机屏幕 (375x812 设计规范)。

### 🤖 核心自动化 (Core Automation)
*   **AI 智能识别**: 集成 **OpenRouter (Claude 3.5 Sonnet)**，精准提取商家、日期、总额、税费及商品明细。
*   **多渠道采集**:
    1.  **网页上传**: 直接点击 UI 卡片调用相机或相册。
    2.  **邮件监听**: 后台自动扫描指定邮箱的收件箱，提取小票附件并自动处理。

### 📂 智能归档 (Smart Archiving)
*   **Google Drive**: 
    *   自动按月创建文件夹（例如 `2025-11/`）。
    *   上传小票原图，防止丢失。
*   **Google Sheets**: 
    *   自动按月创建工作表（例如 `Sheet: 2025-11`）。
    *   自动追加一行数据，包含详细 JSON 和原图链接。

---

## 3. 技术架构 (Technical Architecture)

| 模块 | 技术栈 | 说明 |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS | 极速构建，手绘风格组件库 |
| **Backend** | Node.js, Express | REST API + SSE 推送服务 |
| **AI Engine** | OpenRouter API | 调用 Claude 3.5 Sonnet 模型 |
| **Storage** | Google APIs (Drive v3, Sheets v4) | 官方 SDK，Service Account 鉴权 |
| **Email** | imap-simple, mailparser | IMAP 协议监听附件 |
| **Process** | Multer, Node-Cron | 文件流处理与定时任务 |

---

## 4. 文件结构 (File Structure)

```text
receipe-helper/
├── src/
│   ├── App.jsx            # 前端主逻辑 (UI + SSE监听 + 状态管理)
│   └── index.css          # Tailwind 手绘风格配置
├── server/
│   ├── index.js           # 后端核心 (API + AI逻辑 + Google逻辑 + Email逻辑)
│   ├── .env               # [敏感] 配置文件 (Key, 账号, 密码)
│   └── .env.example       # 配置模板
├── mockup.html            # 单文件高保真 UI 预览
├── package.json           # 项目依赖与启动脚本
└── README.md              # 项目说明文档
```

---

## 5. 如何运行 (How to Run)

### 环境要求
*   Node.js v18+
*   配置好的 `server/.env` 文件

### 启动命令
在项目根目录运行：

```bash
npm run dev
```

此命令会同时启动：
1.  **前端**: `http://localhost:5173`
2.  **后端**: `http://localhost:3001` (自动开启邮件监听)

---

## 6. 后续迭代建议 (Future Roadmap)

*   **[P1] 历史数据持久化**: 目前前端列表刷新后会重置。建议增加 API 从 Google Sheets读取历史数据，实现真正的“账本查看器”。
*   **[P2] 多图上传**: 支持一次选择多张小票批量处理。
*   **[P3] 错误重试机制**: 当 AI 或网络失败时，在 UI 上提供“重试”按钮。
*   **[P4] 统计图表**: 利用 `Recharts` 或类似库，在 Stats 页面绘制月度消费趋势图。

---

**项目交付人**: Cursor AI Assistant
**日期**: 2025-11-24

