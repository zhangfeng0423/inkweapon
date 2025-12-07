// scripts/import.ts
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import fs from "fs";
import path from "path";
import axios from "axios";
import 'dotenv/config';
import dotenv from 'dotenv';

// 确保加载正确的环境变量文件
dotenv.config({ path: '.env' });

// 类型定义
interface ImageBlock {
  image: {
    file?: { url: string };
    external?: { url: string };
  };
  id: string;
}

interface NotionPageDetails {
  properties: {
    Name?: { title?: Array<{ plain_text: string }> };
    title?: { title?: Array<{ plain_text: string }> };
  };
}

// 安全性函数：验证和清理文件名
function sanitizeSlug(slug: string): string {
  // 移除或替换不安全的字符
  return slug
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// 验证 Notion Page ID 格式
function isValidNotionId(pageId: string): boolean {
  // 支持两种格式：
  // 1. 原始32位ID: a1b2c3d4e5f6789012345678901234ab
  // 2. 完整URL: https://www.notion.so/Your-Page-Title-a1b2c3d4e5f6789012345678901234ab
  const idRegex = /^[a-f0-9]{32}$/;
  const urlRegex = /^https:\/\/www\.notion\.so\/[a-zA-Z0-9-]+-([a-f0-9]{32})(\?v=[a-f0-9]+)?$/;

  if (idRegex.test(pageId)) {
    return true;
  }

  if (urlRegex.test(pageId)) {
    return true;
  }

  return false;
}

// 从URL中提取纯ID
function extractPageId(pageId: string): string {
  const urlMatch = pageId.match(/^https:\/\/www\.notion\.so\/[a-zA-Z0-9-]+-([a-f0-9]{32})(\?v=[a-f0-9]+)?$/);
  return urlMatch ? urlMatch[1] : pageId;
}


// 智能分类生成函数
function generateCategories(content: string): string[] {
  const contentLower = content.toLowerCase();
  const categories: string[] = [];

  // 编程语言检测
  if (contentLower.includes('javascript')) categories.push('javascript');
  if (contentLower.includes('typescript')) categories.push('typescript');
  if (contentLower.includes('python')) categories.push('python');
  if (contentLower.includes('react')) categories.push('react');
  if (contentLower.includes('next.js') || contentLower.includes('nextjs')) categories.push('nextjs');
  if (contentLower.includes('node') && contentLower.includes('node.js')) categories.push('nodejs');

  // 概念检测
  if (contentLower.includes('tutorial') || contentLower.includes('guide') || contentLower.includes('learn')) {
    categories.push('tutorial');
  }
  if (contentLower.includes('async') || contentLower.includes('event loop') || contentLower.includes('promise')) {
    categories.push('async');
  }
  if (contentLower.includes('web') || contentLower.includes('api') || contentLower.includes('server')) {
    categories.push('web-development');
  }

  // 如果没有检测到任何分类，使用通用分类
  if (categories.length === 0) {
    categories.push('programming');
  }

  return categories.slice(0, 3); // 最多3个分类
}

// 智能描述生成函数
function generateDescription(title: string, content: string): string {
  // 尝试找到第一个非标题段落作为描述
  const firstParagraph = content.match(/^##.+?\n\n([^#\n].+?)(?:\n\n|\n#|$)/);
  if (firstParagraph && firstParagraph[1]) {
    let description = firstParagraph[1].trim();
    // 移除多余的换行符和特殊字符
    description = description.replace(/\n+/g, ' ').replace(/\*\*/g, '').replace(/`/g, '');

    // 限制长度
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }

    return description;
  }

  // 如果找不到合适的第一段话，生成通用描述
  return `Complete guide about ${title}. Learn best practices, patterns, and advanced techniques.`;
}

// 内容清理函数
function cleanMarkdownContent(content: string): string {
  return content
    // 移除连续的空行（最多保留一个空行）
    .replace(/\n{3,}/g, '\n\n')
    // 清理中文双引号为标准英文双引号
    .replace(/"/g, '"')
    // 修复加粗标记后的重复文本问题（如 "**Python:**Python" -> "**Python:**"）
    .replace(/\*\*([^*:]+):\*\*([a-zA-Z]+)/gm, '**$1:**')
    // 修复连续加粗标记问题（如 "**JavaScript (ESM):**JavaScript" -> "**JavaScript (ESM):**"）
    .replace(/\*\*([^*:]+):\*\*\1([a-zA-Z]*)/gm, '**$1:**')
    // 修复代码块前的格式问题
    .replace(/:\n\n    `/g, ':\n\n    ```\n    `')
    // 修复代码块语言标识：将 python 改为 javascript（当内容包含 JS 关键字时）
    .replace(/```python\n([\s\S]*?(import|from|const|let|function|async|await|=>|console\.|\.then\(|\.catch\()[\s\S]*?)\n```/g, '```javascript\n$1\n```')
    // 修复代码块语言标识：将 python 改为 typescript（当内容包含 TS 关键字时）
    .replace(/```python\n([\s\S]*?(interface|type|Promise<|: string|: number|: boolean|: void)[\s\S]*?)\n```/g, '```typescript\n$1\n```')
    // 清理多余的空格
    .replace(/[ \t]+$/gm, '')
    // 确保标题前后只有一个空行
    .replace(/(\n#{1,6}[^#\n]*\n)\n+/g, '$1\n')
    // 移除文件开头和结尾的多余空行
    .trim();
}

// 获取命令行参数
const pageId = process.argv[2];
const slug = process.argv[3];

if (!pageId || !slug) {
  console.log("❌ 错误: 缺少参数");
  console.log("✅ 正确用法: npx tsx scripts/import.ts <Notion页面ID> <英文网址别名>");
  console.log("📝 示例: npx tsx scripts/import.ts a1b2c3d4e5f6789012345678901234ab my-article-title");
  process.exit(1);
}

// 验证参数
if (!isValidNotionId(pageId)) {
  console.log("❌ 错误: Notion页面ID格式不正确");
  process.exit(1);
}

const cleanSlug = sanitizeSlug(slug);
if (!cleanSlug) {
  console.log("❌ 错误: 网址别名包含无效字符");
  process.exit(1);
}

// 提取纯ID（如果传入的是完整URL）
const purePageId = extractPageId(pageId);

// 初始化 Notion 客户端
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

// 🔧 自定义功能：自动下载图片到本地 public 文件夹
n2m.setCustomTransformer("image", async (block) => {
  try {
    const { image } = block as ImageBlock;
    if (!image) {
      console.warn('⚠️ 警告: 图片块缺少 image 属性');
      return '';
    }

    const imageUrl = image.file?.url || image.external?.url;
    if (!imageUrl) {
      console.warn('⚠️ 警告: 图片缺少 URL');
      return '';
    }

    // 获取图片后缀 (jpg/png/svg/webp)
    const urlPath = new URL(imageUrl).pathname;
    const extension = urlPath.split('.').pop()?.split('?')[0]?.toLowerCase() || 'png';

    // 验证文件扩展名
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const safeExtension = validExtensions.includes(extension) ? extension : 'png';

    const filename = `${cleanSlug}-${block.id}.${safeExtension}`;

    // 图片保存路径: public/images/blog/
    const localDir = path.join(process.cwd(), "public", "images", "blog");
    const localPath = path.join(localDir, filename);

    // 如果文件夹不存在，自动创建
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }

    // 下载图片（带超时和错误处理）
    const response = await axios({
      url: imageUrl,
      responseType: "stream",
      timeout: 30000, // 30秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotionImporter/1.0)'
      }
    });

    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);

    // 等待下载完成
    await new Promise<void>((resolve, reject) => {
      writer.on('finish', () => resolve());
      writer.on('error', reject);

      // 设置写入流错误处理
      writer.on('error', (error) => {
        console.error(`⚠️ 图片写入失败: ${filename}`, error.message);
        reject(error);
      });
    });

    console.log(`✅ 图片下载成功: ${filename}`);
    // 返回 MDX 标准图片语法
    return `![${filename}](/images/blog/${filename})`;
  } catch (error) {
    const imageUrl = (block as any).image?.file?.url || (block as any).image?.external?.url;
    console.error(`⚠️ 图片下载失败:`, error instanceof Error ? error.message : error);
    // 如果下载失败，保留原链接但添加警告
    return `![图片下载失败](${imageUrl})`;
  }
});

async function main() {
  try {
    console.log(`🔍 正在连接 Notion，读取页面: ${purePageId}...`);

    // 1. 获取页面标题和元数据
    let pageDetails;
    try {
      pageDetails = await notion.pages.retrieve({
        page_id: purePageId
      });
    } catch (error) {
      console.error('❌ 获取 Notion 页面失败:', error instanceof Error ? error.message : error);
      throw new Error('无法访问 Notion 页面，请检查页面ID和权限');
    }

    // 尝试获取标题（适配不同类型的 Title 属性）
    let title = "未命名文章";
    const properties = (pageDetails as NotionPageDetails).properties;

    if (properties?.Name?.title?.[0]?.plain_text) {
      title = properties.Name.title[0].plain_text;
    } else if (properties?.title?.title?.[0]?.plain_text) {
      title = properties.title.title[0].plain_text;
    } else {
      console.warn('⚠️ 警告: 无法获取页面标题，使用默认标题');
    }

    console.log(`📝 原始标题: ${title}`);

    // 2. 获取正文并转为 Markdown
    console.log('🔄 正在转换页面内容为 Markdown...');
    let mdblocks, mdString;

    try {
      mdblocks = await n2m.pageToMarkdown(purePageId);
      mdString = n2m.toMarkdownString(mdblocks);
    } catch (error) {
      console.error('❌ 转换内容失败:', error instanceof Error ? error.message : error);
      throw new Error('无法转换页面内容，请检查页面结构和权限');
    }

    if (!mdString?.parent) {
      throw new Error('转换后的内容为空');
    }

    console.log(`✅ 内容转换成功，共 ${mdString.parent.length} 个字符`);

    // 清理Markdown内容
    const cleanedContent = cleanMarkdownContent(mdString.parent);
    console.log('🧹 内容格式已清理');

    // 智能内容分析
    console.log('🤖 正在分析内容并生成智能元数据...');

    // 智能分类生成
    const smartCategories = generateCategories(cleanedContent);
    console.log(`📂 自动分类: [${smartCategories.join(', ')}]`);

    // 智能描述生成
    const smartDescription = generateDescription(title, cleanedContent);
    console.log(`📝 自动描述: "${smartDescription}"`);

    console.log(`📝 使用原始标题: ${title}`);

    // 3. 生成 MDX 内容 (包含 Frontmatter)
    const currentDate = new Date().toISOString().split('T')[0];

    // 查找文章中的第一张图片作为封面图，如果没有图片则使用默认图片
    const firstImageMatch = cleanedContent.match(/!\[.*?\]\(\/images\/blog\/([^)]+)\)/);
    const coverImage = firstImageMatch ? `/images/blog/${firstImageMatch[1]}` : '/images/blog/post-1.png';

    // 如果找到了图片，显示信息
    if (firstImageMatch) {
      console.log(`🖼️ 使用文章中的图片作为封面: ${firstImageMatch[1]}`);
    } else {
      console.log(`🖼️ 文章中没有图片，使用默认封面图`);
    }

    const fileContent = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${smartDescription}"
date: "${currentDate}"
published: true
categories: [${smartCategories.map(cat => `"${cat}"`).join(', ')}]
author: "notion-import"
image: "${coverImage}"
---

${cleanedContent}
`;

    // 4. 写入文件
    const outputPath = path.join(process.cwd(), "content", "blog", `${cleanSlug}.mdx`);

    // 确保 content/blog 目录存在
    const blogDir = path.dirname(outputPath);
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    // 检查文件是否已存在
    if (fs.existsSync(outputPath)) {
      console.warn(`⚠️ 警告: 文件已存在，将被覆盖: ${outputPath}`);
    }

    try {
      fs.writeFileSync(outputPath, fileContent, 'utf8');
    } catch (error) {
      console.error('❌ 写入文件失败:', error instanceof Error ? error.message : error);
      throw new Error('无法写入文件，请检查文件权限');
    }

    console.log(`\n🎉 导入成功！`);
    console.log(`📄 文章已生成: content/blog/${cleanSlug}.mdx`);
    console.log(`🖼️  图片已下载至: public/images/blog/`);
    console.log(`📊 统计: ${mdString.parent.length} 字符 | ${mdblocks.length} 个内容块`);
    console.log(`\n💡 提示: 请根据需要修改 frontmatter 中的 description 和 categories 字段`);

  } catch (error) {
    console.error('\n❌ 导入失败:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
