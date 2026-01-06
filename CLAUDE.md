# Project Name: [项目简称] - [一句话业务描述]

## 🎯 WHY: 项目定位与业务逻辑
- **定位**: [例如：高性能 AI 出海 SaaS 平台]
- **核心业务**: [例如：集成多模型 AI 聊天，支持 Stripe 订阅与积分充值，适配 Cloudflare 边缘计算]
- **目标用户**: [例如：全球开发者与创意工作者]

## 🗺️ WHAT: 技术架构与代码地图
- **Stack**: Next.js 15 (App Router), TypeScript, Tailwind 4.0, Drizzle ORM.
- **Key Services**: Better Auth (鉴权), Stripe (支付), next-intl (i18n).
- **Core Directories**:
  - `src/app/`: 路由与页面 (Server Components 优先)
  - `src/actions/`: 所有的 Server Actions (业务逻辑核心)
  - `src/db/`: Schema 定义与迁移脚本
  - `src/stores/`: Zustand 客户端状态
  - `content/`: MDX 内容管理

## 🛠️ HOW: 关键开发指令
- **开发**: `pnpm dev` | `pnpm db:studio` (数据库预览)
- **数据库**: `pnpm db:generate` (改完Schema后) | `pnpm db:migrate`
- **校验**: `pnpm lint` | `pnpm knip` (查无用依赖)
- **部署**: `pnpm deploy` (Cloudflare/OpenNext)

## ⚖️ LAWS: 核心约束 (不可违反)
- **逻辑位置**: 严禁在页面组件中写复杂逻辑，必须抽离至 `src/actions/`。
- **状态管理**: 优先使用 URL Params (`nuqs`)，其次是 `useState`，跨页状态才用 `Zustand`。
- **安全性**: 必须使用 `next-safe-action` 封装 Server Actions，接口必须通过 Zod 校验。
- **RSC**: 默认使用 Server Components，仅在交互叶子节点使用 `"use client"`。

## 📖 深入指南 (需要执行特定任务时请阅读)
- **代码规范与组件结构**: `docs/conventions.md`
- **支付与积分系统逻辑**: `docs/business-logic.md`
- **AI 接口集成与流式处理**: `docs/ai-integration.md`