# 项目工程与组件规范

## 1. 目录映射
- `src/actions/`: 业务逻辑心脏。所有数据库写操作必须封装在此。
- `src/components/ui/`: 仅存放基础的 Radix/Shadcn 原子组件。
- `src/components/features/`: 存放业务功能组件（如 `PaymentButton.tsx`）。
- `content/`: MDX 文件仓库，由 Fumadocs 管理。

## 2. 组件开发风格
- **UI 库**: 优先使用 Radix UI + Tailwind 4.0。
- **动画**: 复杂交互使用 `framer-motion`，且尽量抽离到独立组件中以减小主包体积。
- **国际化 (i18n)**:
  - 静态文本必须放入 `messages/*.json`。
  - 使用 `useTranslations` Hook 获取文本。
  - 保持 `en` 和 `zh` 翻译键名完全同步。

## 3. 安全约束
- 严禁在 Client Component 中暴露任何环境变量（除非以 `NEXT_PUBLIC_` 开头）。
- 所有的表单提交必须使用 `next-safe-action` 封装。
- 所有的查询语句必须通过 Drizzle Query Builder 编写，禁止拼接字符串。