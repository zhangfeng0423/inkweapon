# AI 集成开发规范

## 1. 核心架构
- **多供应商支持**: 集成了 OpenAI, Anthropic, Gemini, Replicate, FAL, Fireworks。
- **配置中心**: 所有的模型配置与 API Keys 必须通过 `src/config/ai.ts` 或环境变量管理。
- **流式处理**: 文本生成必须优先使用 `ai` SDK 实现 Streaming 响应，以优化 UX。

## 2. 功能模块实现逻辑
- **聊天 (Chat)**: 历史记录存放在数据库中，通过 `src/actions/chat.ts` 处理上下文聚合。
- **图像/视频生成**:
  - 异步处理：大型生成任务应在后台执行，完成后通过 Webhook 或轮询更新状态。
  - 存储：生成结果必须上传至 S3，并返回 CDN 优化后的 URL。
- **音频处理**: OpenAI Whisper 用于转录，注意处理文件大小限制（通过前端分片或 Vercel Body Limit 配置）。

## 3. 错误处理与重试
- 所有 AI 请求必须包裹在 Try-Catch 中。
- **Rate Limits**: 必须捕获供应商的 429 错误，并返回友好的“服务繁忙”提示。
- **Fallback**: 关键业务（如基础聊天）应具备备用模型切换逻辑。