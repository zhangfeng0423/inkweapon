# 支付、积分与鉴权逻辑

## 1. Stripe 支付流程
- **订阅制**: 处理 Monthly/Yearly/Lifetime 三种模式。Webhook 处理器位于 `src/app/api/webhook/stripe/route.ts`。
- **一次性支付**: 用于积分包（Credits）购买。
- **安全性**: 在更新订阅状态前，必须验证 Webhook 签名。

## 2. 积分系统 (Credit System)
- **原子操作**: 积分扣除/增加必须使用 `db.transaction` (Drizzle) 包装，防止并发超额扣费。
- **日志审计**: 每次积分变动必须在 `credit_logs` 表记录 `reason` 和 `amount`。
- **乐观锁**: 在高频操作下考虑使用数据库行锁或逻辑校验防止负值。

## 3. 鉴权与用户管理 (Better Auth)
- **社交登录**: 统一通过 `Better Auth` 的 PostgreSQL 适配器。
- **钩子处理**: 用户首次注册成功后，必须自动执行 `subscribeNewsletter` 服务。
- **权限管理**: 管理员插件用于禁用用户。在 Server Actions 中使用 `getSession()` 校验权限。