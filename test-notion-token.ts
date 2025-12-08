import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

// 确保加载正确的环境变量文件
dotenv.config({ path: '.env' });

console.log('🔑 测试 Notion API Token...');
console.log('Token:', process.env.NOTION_TOKEN ? '已加载' : '未加载');

if (process.env.NOTION_TOKEN) {
  const notion = new Client({ auth: process.env.NOTION_TOKEN });

  // 测试 token 是否有效
  notion
    .search({ query: '', page_size: 1 })
    .then((result) => {
      console.log('✅ Token 有效！');
      console.log('📊 搜索结果:', result.results.length, '个项目');
    })
    .catch((error) => {
      console.log('❌ Token 无效或权限不足:');
      console.log('错误代码:', error.code);
      console.log('错误消息:', error.message);
    });
} else {
  console.log('❌ 未找到 NOTION_TOKEN 环境变量');
}
