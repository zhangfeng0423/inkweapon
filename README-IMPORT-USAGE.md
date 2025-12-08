# Notion 导入功能使用指南

## 功能概述

该项目现在支持从 Notion 自动导入内容并生成 MDX 博客文章，具备以下智能功能：

- ✅ **自动图片下载**: 自动下载 Notion 中的图片到本地 `public/images/blog/` 目录
- ✅ **智能描述生成**: 基于内容自动生成文章描述（支持中英文）
- ✅ **智能分类**: 根据内容自动识别并分配分类标签
- ✅ **自动封面图**: 使用文章第一张图片作为封面，或使用默认图片
- ✅ **多语言支持**: 支持中英文博客文章的创建和管理
- ✅ **翻译模板**: 提供标准化的翻译工作流程

## 使用方法

### 1. 基本语法

```bash
npx tsx scripts/import.ts <Notion页面ID或URL> <英文网址别名>
```

### 2. 获取 Notion 页面 ID

**方法一：使用页面URL**
```
https://www.notion.so/Your-Page-Title-a1b2c3d4e5f6789012345678901234ab
```

**方法二：使用页面ID**
```
a1b2c3d4e5f6789012345678901234ab
```

### 3. 环境配置

确保在 `.env.local` 文件中配置了 Notion token：

```env
NOTION_TOKEN=your_notion_token_here
```

### 4. 使用示例

```bash
# 导入文章并命名为 "javascript-guide"
npx tsx scripts/import.ts a1b2c3d4e5f6789012345678901234ab javascript-guide

# 使用完整URL导入
npx tsx scripts/import.ts "https://www.notion.so/Your-Page-Title-a1b2c3d4e5f6789012345678901234ab" react-tutorial

# 导入Python教程
npx tsx scripts/import.ts b2c3d4e5f6g789012345678901234ab python-basics
```

### 5. 创建多语言版本

```bash
# 1. 导入中文版本
npx tsx scripts/import.ts a1b2c3d4e5f6789012345678901234ab chapter1-zh

# 2. 创建英文版本
cp content/blog/chapter1-zh.mdx content/blog/chapter1-en.mdx

# 3. 编辑英文版本
# - 翻译标题和内容
# - 保持代码示例不变
# - 更新description（脚本会自动生成）
```

## 智能功能详解

### 📝 自动描述生成

导入脚本会智能分析内容并生成描述：

1. **优先级1**: 提取第一个非标题段落的实际内容
2. **优先级2**: 查找第一个有意义的内容段落（跳过代码、列表等）
3. **优先级3**: 根据关键词生成智能描述：
   - JavaScript/TypeScript: `深入探讨${title}的JavaScript/TypeScript实现，涵盖核心概念、最佳实践和高级技巧。`
   - React/Next.js: `全面的${title}React/Next.js开发指南，包含组件设计、状态管理和性能优化。`
   - Python: `${title}Python开发完整教程，从基础语法到高级应用的实战指南。`
   - 教程类: `${title}详细教程，循序渐进学习核心概念和实用技巧。`
4. **默认**: `深入解析${title}，涵盖理论基础、实践应用和高级开发技巧。`

### 🏷️ 自动分类

系统会根据内容自动识别分类：

- **编程语言**: `javascript`, `typescript`, `python`, `react`, `nextjs`, `nodejs`
- **概念类型**: `tutorial`, `async`, `web-development`
- **默认分类**: `programming`

### 🖼️ 图片处理

- 自动下载 Notion 中的图片到 `public/images/blog/` 目录
- 图片文件名格式：`{slug}-{blockId}.{extension}`
- 支持格式：jpg, jpeg, png, gif, webp, svg
- 自动使用文章第一张图片作为封面图

## 生成的文件结构

```
content/blog/
└── {slug}.mdx
```

生成的MDX文件包含：

```yaml
---
title: "文章标题"
description: "智能生成的描述"
date: "2025-12-07"
published: true
categories: ["自动分类1", "自动分类2"]
author: "notion-import"
image: "/images/blog/封面图片路径"
---

文章内容...
```

## 注意事项

1. **权限**: 确保你的 Notion token 对目标页面有读取权限
2. **图片**: 大图片可能需要较长下载时间，请耐心等待
3. **格式**: 导入后会自动清理多余的空行和格式
4. **覆盖**: 如果目标文件已存在，会被新导入的内容覆盖

## 示例输出

```bash
🔍 正在连接 Notion，读取页面: a1b2c3d4e5f6789012345678901234ab...
📝 原始标题: JavaScript异步编程指南
🔄 正在转换页面内容为 Markdown...
✅ 内容转换成功，共 2540 个字符
🧹 内容格式已清理
🤖 正在分析内容并生成智能元数据...
📂 自动分类: [javascript, async, tutorial]
📝 自动描述: "异步编程是JavaScript的核心概念之一。它允许程序在等待某些操作完成时继续执行其他任务。"
📝 使用原始标题: JavaScript异步编程指南
🖼️ 使用文章中的图片作为封面: javascript-async-abc123.png

🎉 导入成功！
📄 文章已生成: content/blog/javascript-guide.mdx
🖼️  图片已下载至: public/images/blog/
📊 统计: 2540 字符 | 15 个内容块

💡 提示: 请根据需要修改 frontmatter 中的 description 和 categories 字段
```

## 故障排除

### 常见错误

1. **页面权限不足**: 检查 Notion token 权限和页面分享设置
2. **页面ID格式错误**: 确保使用32位十六进制ID或完整URL
3. **网络超时**: 图片下载失败时会保留原链接并显示警告
4. **文件权限**: 确保有写入 `content/blog/` 目录的权限

### 调试建议

- 检查 `.env.local` 文件中的 `NOTION_TOKEN` 配置
- 确认 Notion 页面已正确分享给集成应用
- 查看控制台输出的详细错误信息
- 验证页面ID是否正确复制