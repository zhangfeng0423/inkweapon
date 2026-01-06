import * as fs from 'fs';
import * as path from 'path';
import { Client } from '@notionhq/client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { NotionToMarkdown } from 'notion-to-md';

// 确保加载正确的环境变量文件
dotenv.config({ path: '.env' });

// ============================================================
// 类型定义
// ============================================================

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

// 删除未使用的 MarkdownBlock 接口，使用 notion-to-md 的内置类型

// ============================================================
// 工具函数
// ============================================================

/**
 * 安全性函数：验证和清理文件名
 */
function sanitizeSlug(slug: string): string {
  return slug
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * 验证 Notion Page ID 格式
 */
function isValidNotionId(pageId: string): boolean {
  const idRegex = /^[a-f0-9]{32}$/;
  const urlRegex =
    /^https:\/\/www\.notion\.so\/[a-zA-Z0-9-]+-([a-f0-9]{32})(\?.*)?$/;

  return idRegex.test(pageId) || urlRegex.test(pageId);
}

/**
 * 从URL中提取纯ID
 */
function extractPageId(pageId: string): string {
  const urlMatch = pageId.match(
    /^https:\/\/www\.notion\.so\/[a-zA-Z0-9-]+-([a-f0-9]{32})(\?.*)?$/
  );
  return urlMatch ? urlMatch[1] : pageId;
}

/**
 * 从 URL 或字符串中提取章节名
 */
function extractChapterName(chapterIdOrUrl: string): string {
  const chapterMatch = chapterIdOrUrl.match(/chapter(\d+)/i);
  if (chapterMatch) {
    return `chapter${chapterMatch[1]}`;
  }

  // 如果不是标准格式，则清理字符串作为文件名
  return chapterIdOrUrl
    .toLowerCase()
    .replace(/https?:\/\/www\.notion\.so\//g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * 智能分类生成函数
 */
function generateCategories(content: string): string[] {
  const contentLower = content.toLowerCase();
  const categories: string[] = [];

  // 编程语言检测
  if (contentLower.includes('javascript')) categories.push('javascript');
  if (contentLower.includes('typescript')) categories.push('typescript');
  if (contentLower.includes('python')) categories.push('python');
  if (contentLower.includes('react')) categories.push('react');
  if (contentLower.includes('next.js') || contentLower.includes('nextjs'))
    categories.push('nextjs');
  if (contentLower.includes('node') || contentLower.includes('node.js'))
    categories.push('nodejs');

  // 概念检测
  if (
    contentLower.includes('tutorial') ||
    contentLower.includes('guide') ||
    contentLower.includes('learn')
  ) {
    categories.push('tutorial');
  }
  if (
    contentLower.includes('async') ||
    contentLower.includes('event loop') ||
    contentLower.includes('promise')
  ) {
    categories.push('async');
  }
  if (
    contentLower.includes('web') ||
    contentLower.includes('api') ||
    contentLower.includes('server')
  ) {
    categories.push('web-development');
  }

  // 如果没有检测到任何分类，使用通用分类
  if (categories.length === 0) {
    categories.push('programming');
  }

  return categories.slice(0, 3); // 最多3个分类
}

/**
 * 智能描述生成函数
 */
function generateDescription(title: string, content: string): string {
  // 尝试找到第一个非标题段落作为描述
  const firstParagraph = content.match(/^##.+?\n\n([^#\n].+?)(?:\n\n|\n#|$)/);
  if (firstParagraph?.[1]) {
    let description = firstParagraph[1].trim();
    // 移除多余的换行符和特殊字符
    description = description
      .replace(/\n+/g, ' ')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // 移除markdown链接，保留文本

    // 限制长度
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }

    return sanitizeForYaml(description);
  }

  // 尝试找到第一个包含实际内容的段落（不包含代码块）
  const contentLines = content.split('\n');
  for (const line of contentLines) {
    const trimmed = line.trim();
    // 跳过标题、空行、代码行
    if (
      trimmed &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('```') &&
      !trimmed.startsWith('    ') &&
      !trimmed.match(/^[*-]\s+/) && // 跳过列表项
      trimmed.length > 20 && // 确保有足够的内容
      !trimmed.includes('import ') &&
      !trimmed.includes('export ')
    ) {
      // 跳过导入导出语句

      let description = trimmed
        .replace(/\*\*/g, '')
        .replace(/`/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

      // 限制长度
      if (description.length > 160) {
        description = description.substring(0, 157) + '...';
      }

      return sanitizeForYaml(description);
    }
  }

  // 分析内容生成更智能的描述
  const contentLower = content.toLowerCase();
  if (
    contentLower.includes('javascript') ||
    contentLower.includes('typescript')
  ) {
    return `深入探讨${title}的JavaScript/TypeScript实现，涵盖核心概念、最佳实践和高级技巧。`;
  }
  if (contentLower.includes('react') || contentLower.includes('next.js')) {
    return `全面的${title}React/Next.js开发指南，包含组件设计、状态管理和性能优化。`;
  }
  if (contentLower.includes('python')) {
    return `${title}Python开发完整教程，从基础语法到高级应用的实战指南。`;
  }
  if (contentLower.includes('tutorial') || contentLower.includes('guide')) {
    return `${title}详细教程，循序渐进学习核心概念和实用技巧。`;
  }

  // 如果没有匹配到特定模式，生成通用描述
  return `深入解析${title}，涵盖理论基础、实践应用和高级开发技巧。`;
}

/**
 * 清理字符串以用于 YAML frontmatter
 * 移除或替换会破坏 YAML 解法的字符
 */
function sanitizeForYaml(str: string): string {
  return str
    .replace(/"/g, "'") // 将双引号替换为单引号
    .replace(/"/g, "'") // 替换中文双引号
    .replace(/"/g, "'") // 替换中文双引号
    .replace(/'/g, "'") // 替换中文单引号
    .replace(/:/g, '：'); // 替换中文冒号，防止 YAML 键值对冲突
}

// ============================================================
// 内容清理函数
// ============================================================

/**
 * 内容清理函数 - 修复 Notion 导出的 MDX 格式问题
 */
function cleanMarkdownContent(content: string): string {
  let cleaned = content;

  // 语言名称映射（转换为Shiki支持的小写格式）
  const langMap: Record<string, string> = {
    TypeScript: 'typescript',
    JavaScript: 'javascript',
    Python: 'python',
    Bash: 'bash',
    Shell: 'shell',
    JSON: 'json',
    SQL: 'sql',
    CSS: 'css',
    HTML: 'html',
  };

  // 1. 修复行尾的语言名称标记问题
  // 例如: "some text TypeScript" -> "some text TypeScript\n\n```typescript"
  cleaned = cleaned.replace(
    /:\s*(TypeScript|JavaScript|Python|Bash|Shell|JSON|SQL|CSS|HTML)\s*$/gm,
    (match, lang) => `: ${lang}\n\n\`\`\`${langMap[lang]}`
  );

  // 2. 修复特殊情况：- **契约：**TypeScript
  cleaned = cleaned.replace(
    /^- \*\*([^*：]+)[：:]\*\*\s*(TypeScript|JavaScript|Python|Bash|Shell|JSON|SQL|CSS|HTML)/gm,
    (match, text, lang) => `- **${text}:** ${lang}\n\n\`\`\`${langMap[lang]}`
  );

  // 3. 处理单独一行的语言名称后面跟着反引号的情况
  cleaned = cleaned.replace(/^(\w+)\s*\n`\s*$/gm, '```$1');

  // 4. 清理错误的代码块标记格式
  cleaned = cleaned.replace(/```(\w+)```/g, '```$1');
  cleaned = cleaned.replace(/````/g, '```');

  // 5. 修复行末尾的反引号语言标记
  cleaned = cleaned.replace(/```\s*`$/gm, '```');
  cleaned = cleaned.replace(/\n```\s*`/g, '\n```');

  // 6. 最终清理：移除多余的空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned;
}

/**
 * 轻量级 MDX 语法验证
 * 检查常见的语法错误，不需要完整构建
 */
function validateMdxSyntax(content: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const lines = content.split('\n');
  const codeBlockStack: string[] = [];
  let inFrontmatter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 检查 frontmatter
    if (i === 0 && line.startsWith('---')) {
      inFrontmatter = true;
      continue;
    }
    if (inFrontmatter && line.startsWith('---')) {
      inFrontmatter = false;
      continue;
    }
    if (inFrontmatter) continue;

    // 检查代码块
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      if (
        lang &&
        codeBlockStack.length > 0 &&
        codeBlockStack[codeBlockStack.length - 1] === lang
      ) {
        // 闭合代码块
        codeBlockStack.pop();
      } else if (lang) {
        // 打开新代码块
        codeBlockStack.push(lang);
      } else if (codeBlockStack.length > 0) {
        // 空的 ``` 关闭代码块
        codeBlockStack.pop();
      }
      continue;
    }

    // 在代码块内，不检查语法
    if (codeBlockStack.length > 0) continue;

    // 检查未闭合的大括号
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    if (openBraces > closeBraces) {
      // 可能是 JSX，检查是否在行尾闭合
      if (!line.trim().endsWith('\\')) {
        const remainingOpen = openBraces - closeBraces;
        // 向前搜索闭合
        let found = false;
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const futureClose = (lines[j].match(/}/g) || []).length;
          if (futureClose >= remainingOpen) {
            found = true;
            break;
          }
        }
        if (!found && remainingOpen > 0) {
          errors.push(
            `第 ${lineNum} 行: 可能未闭合的大括号 (剩余 ${remainingOpen} 个)`
          );
        }
      }
    }

    // 检查行尾单独的语言标记（常见错误）
    if (
      /^(TypeScript|JavaScript|Python|Bash|Shell|JSON|SQL|CSS|HTML)$/.test(
        line.trim()
      )
    ) {
      errors.push(
        `第 ${lineNum} 行: 发现单独的语言标记 "${line.trim()}"，应该使用代码块标记 \`\`\`${line.trim().toLowerCase()}`
      );
    }
  }

  // 检查未闭合的代码块
  if (codeBlockStack.length > 0) {
    errors.push(
      `文件末尾: ${codeBlockStack.length} 个代码块未闭合 (${codeBlockStack.join(', ')})`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================
// 核心导入功能
// ============================================================

/**
 * 导入单个 Notion 页面
 */
async function importNotionPage(
  pageId: string,
  slug: string,
  options: { validate?: boolean; verbose?: boolean } = {}
): Promise<{ success: boolean; filePath?: string; errors?: string[] }> {
  const { validate = true, verbose = true } = options;
  const errors: string[] = [];

  try {
    if (verbose) console.log(`🔍 正在连接 Notion，读取页面: ${pageId}...`);

    // 提取纯ID（如果传入的是完整URL）
    const purePageId = extractPageId(pageId);

    // 初始化 Notion 客户端
    const notion = new Client({ auth: process.env.NOTION_TOKEN });
    const n2m = new NotionToMarkdown({ notionClient: notion });

    // 自定义图片下载功能
    n2m.setCustomTransformer('image', async (block) => {
      try {
        const { image } = block as ImageBlock;
        if (!image) {
          if (verbose) console.warn('⚠️ 警告: 图片块缺少 image 属性');
          return '';
        }

        const imageUrl = image.file?.url || image.external?.url;
        if (!imageUrl) {
          if (verbose) console.warn('⚠️ 警告: 图片缺少 URL');
          return '';
        }

        // 获取图片后缀
        const urlPath = new URL(imageUrl).pathname;
        const extension =
          urlPath.split('.').pop()?.split('?')[0]?.toLowerCase() || 'png';

        // 验证文件扩展名
        const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        const safeExtension = validExtensions.includes(extension)
          ? extension
          : 'png';

        const filename = `${slug}-${block.id}.${safeExtension}`;
        const localDir = path.join(process.cwd(), 'public', 'images', 'blog');
        const localPath = path.join(localDir, filename);

        // 如果文件夹不存在，自动创建
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }

        // 下载图片
        const response = await axios({
          url: imageUrl,
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NotionImporter/1.0)',
          },
        });

        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);

        await new Promise<void>((resolve, reject) => {
          writer.on('finish', () => resolve());
          writer.on('error', reject);
        });

        if (verbose) console.log(`✅ 图片下载成功: ${filename}`);
        return `![${filename}](/images/blog/${filename})`;
      } catch (error) {
        const imageUrl =
          (block as any).image?.file?.url ||
          (block as any).image?.external?.url;
        if (verbose) {
          console.error(
            '⚠️ 图片下载失败:',
            error instanceof Error ? error.message : error
          );
        }
        errors.push(`图片下载失败: ${imageUrl}`);
        return `![图片下载失败](${imageUrl})`;
      }
    });

    // 1. 获取页面标题和元数据
    let pageDetails: NotionPageDetails;
    try {
      pageDetails = (await notion.pages.retrieve({
        page_id: purePageId,
      })) as NotionPageDetails;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`获取 Notion 页面失败: ${errorMsg}`);
      return { success: false, errors };
    }

    // 尝试获取标题
    let title = '未命名文章';
    const properties = pageDetails.properties;

    if (properties?.Name?.title?.[0]?.plain_text) {
      title = properties.Name.title[0].plain_text;
    } else if (properties?.title?.title?.[0]?.plain_text) {
      title = properties.title.title[0].plain_text;
    } else {
      if (verbose) console.warn('⚠️ 警告: 无法获取页面标题，使用默认标题');
    }

    if (verbose) console.log(`📝 原始标题: ${title}`);

    // 2. 获取正文并转为 Markdown
    if (verbose) console.log('🔄 正在转换页面内容为 Markdown...');

    let mdblocks: any[];
    let mdString: any;

    try {
      mdblocks = await n2m.pageToMarkdown(purePageId);
      mdString = n2m.toMarkdownString(mdblocks);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`转换内容失败: ${errorMsg}`);
      return { success: false, errors };
    }

    if (!mdString?.parent) {
      errors.push('转换后的内容为空');
      return { success: false, errors };
    }

    if (verbose)
      console.log(`✅ 内容转换成功，共 ${mdString.parent.length} 个字符`);

    // 清理Markdown内容
    const cleanedContent = cleanMarkdownContent(mdString.parent);
    if (verbose) console.log('🧹 内容格式已清理');

    // 验证 MDX 语法
    if (validate) {
      if (verbose) console.log('🔍 验证 MDX 语法...');
      const validation = validateMdxSyntax(cleanedContent);
      if (!validation.valid) {
        errors.push(...validation.errors);
        if (verbose) {
          console.warn('⚠️ 发现 MDX 语法问题:');
          validation.errors.forEach((err) => console.warn(`  - ${err}`));
        }
      } else {
        if (verbose) console.log('✅ MDX 语法验证通过');
      }
    }

    // 智能内容分析
    if (verbose) console.log('🤖 正在分析内容并生成智能元数据...');

    const smartCategories = generateCategories(cleanedContent);
    if (verbose) console.log(`📂 自动分类: [${smartCategories.join(', ')}]`);

    const smartDescription = generateDescription(title, cleanedContent);
    if (verbose) console.log(`📝 自动描述: "${smartDescription}"`);

    // 3. 生成 MDX 内容
    const currentDate = new Date().toISOString().split('T')[0];

    // 查找文章中的第一张图片作为封面图
    const firstImageMatch = cleanedContent.match(
      /!\[.*?\]\(\/images\/blog\/([^)]+)\)/
    );
    const coverImage = firstImageMatch
      ? `/images/blog/${firstImageMatch[1]}`
      : '/images/blog/post-1.png';

    if (firstImageMatch) {
      if (verbose)
        console.log(`🖼️ 使用文章中的图片作为封面: ${firstImageMatch[1]}`);
    } else {
      if (verbose) console.log('🖼️ 文章中没有图片，使用默认封面图');
    }

    const fileContent = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${smartDescription}"
date: "${currentDate}"
published: true
categories: [${smartCategories.map((cat) => `"${cat}"`).join(', ')}]
author: "notion-import"
image: "${coverImage}"
---

${cleanedContent}
`;

    // 4. 写入文件
    const outputPath = path.join(
      process.cwd(),
      'content',
      'blog',
      `${slug}.mdx`
    );

    // 确保 content/blog 目录存在
    const blogDir = path.dirname(outputPath);
    if (!fs.existsSync(blogDir)) {
      fs.mkdirSync(blogDir, { recursive: true });
    }

    // 检查文件是否已存在
    if (fs.existsSync(outputPath)) {
      if (verbose) console.warn(`⚠️ 警告: 文件已存在，将被覆盖: ${outputPath}`);
    }

    try {
      fs.writeFileSync(outputPath, fileContent, 'utf8');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`写入文件失败: ${errorMsg}`);
      return { success: false, errors };
    }

    if (verbose) {
      console.log('\n🎉 导入成功！');
      console.log(`📄 文章已生成: content/blog/${slug}.mdx`);
      console.log('🖼️  图片已下载至: public/images/blog/');
      console.log(
        `📊 统计: ${mdString.parent.length} 字符 | ${mdblocks.length} 个内容块`
      );
      console.log(
        '\n💡 提示: 请根据需要修改 frontmatter 中的 description 和 categories 字段'
      );
    }

    return {
      success: true,
      filePath: outputPath,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(errorMsg);
    return { success: false, errors };
  }
}

// ============================================================
// 批量导入功能
// ============================================================

/**
 * 批量导入多个页面
 */
async function batchImport(
  pageIdsOrUrls: string[],
  options: { delay?: number; validate?: boolean; verbose?: boolean } = {}
): Promise<{
  results: Array<{ page: string; success: boolean }>;
  successCount: number;
  failCount: number;
}> {
  const { delay = 2000, validate = true, verbose = true } = options;

  if (verbose) console.log(`📚 准备批量导入 ${pageIdsOrUrls.length} 个页面...`);

  const results: Array<{ page: string; success: boolean }> = [];

  for (let i = 0; i < pageIdsOrUrls.length; i++) {
    const pageIdOrUrl = pageIdsOrUrls[i];
    const chapterName = extractChapterName(pageIdOrUrl);

    if (verbose)
      console.log(
        `\n📖 [${i + 1}/${pageIdsOrUrls.length}] 处理: ${pageIdOrUrl}`
      );

    const result = await importNotionPage(pageIdOrUrl, chapterName, {
      validate,
      verbose,
    });
    results.push({ page: pageIdOrUrl, success: result.success });

    // 延迟以避免 API 限制
    if (i < pageIdsOrUrls.length - 1 && delay > 0) {
      if (verbose) console.log(`⏳ 等待 ${delay / 1000} 秒以避免 API 限制...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  return { results, successCount, failCount };
}

// ============================================================
// CLI 界面
// ============================================================

function showUsage() {
  console.log(`
📖 Notion 到 MDX 导入工具

用法:
  单页导入:
    npx tsx scripts/import.ts <Notion页面ID或URL> <网址别名>

  批量导入:
    npx tsx scripts/import.ts <页面1或URL1> <页面2或URL2> ...

示例:
  npx tsx scripts/import.ts a1b2c3d4e5f6789012345678901234ab my-article
  npx tsx scripts/import.ts https://www.notion.so/chapter2-xxx chapter2
  npx tsx scripts/import.ts chapter3 chapter4 chapter5

选项:
  --no-validate   跳过 MDX 语法验证
  --no-verbose    静默模式（减少输出）
  --delay=<ms>    批量导入时的延迟（默认 2000ms）
`);
}

async function main() {
  const args = process.argv.slice(2);

  // 显示帮助
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    args.length === 0 && process.exit(1);
    process.exit(0);
  }

  // 解析选项
  const options: { validate?: boolean; verbose?: boolean; delay?: number } = {
    validate: !args.includes('--no-validate'),
    verbose: !args.includes('--no-verbose'),
    delay: 2000,
  };

  // 提取延迟参数
  const delayArg = args.find((arg) => arg.startsWith('--delay='));
  if (delayArg) {
    const delayValue = Number.parseInt(delayArg.split('=')[1], 10);
    if (!isNaN(delayValue)) {
      options.delay = delayValue;
    }
  }

  // 过滤掉选项参数，只保留页面参数
  const pageArgs = args.filter((arg) => !arg.startsWith('--'));

  // 单页导入
  if (pageArgs.length === 1) {
    console.log('❌ 错误: 单页导入需要提供网址别名');
    console.log(
      '✅ 正确用法: npx tsx scripts/import.ts <Notion页面ID或URL> <网址别名>'
    );
    process.exit(1);
  }

  // 单页导入（2个参数）
  if (pageArgs.length === 2) {
    const [pageId, slug] = pageArgs;

    // 验证参数
    if (!isValidNotionId(pageId)) {
      console.log('❌ 错误: Notion页面ID格式不正确');
      process.exit(1);
    }

    const cleanSlug = sanitizeSlug(slug);
    if (!cleanSlug) {
      console.log('❌ 错误: 网址别名包含无效字符');
      process.exit(1);
    }

    const result = await importNotionPage(pageId, cleanSlug, options);

    if (!result.success) {
      console.error('\n❌ 导入失败:');
      result.errors?.forEach((err) => console.error(`  - ${err}`));
      process.exit(1);
    }
    return;
  }

  // 批量导入（多个参数）
  const batchResult = await batchImport(pageArgs, options);

  console.log('\n' + '='.repeat(50));
  console.log('📊 批量导入完成！');
  console.log(`✅ 成功: ${batchResult.successCount} 个页面`);
  console.log(`❌ 失败: ${batchResult.failCount} 个页面`);

  if (batchResult.failCount > 0) {
    console.log('\n❌ 失败的页面:');
    batchResult.results
      .filter((r) => !r.success)
      .forEach((r) => console.log(`  - ${r.page}`));
    process.exit(1);
  } else {
    console.log('\n🎉 所有页面导入成功！');
  }
}

main().catch((error) => {
  console.error(
    '\n❌ 发生错误:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
