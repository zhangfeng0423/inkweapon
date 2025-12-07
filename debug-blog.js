// 动态导入以处理 TypeScript
async function getBlogSource() {
  const { blogSource } = await import('./src/lib/source.js');
  return blogSource;
}

async function debugBlog() {
  console.log('=== 调试博客文章 ===');

  const blogSource = await getBlogSource();

  // 获取所有中文文章
  const zhPosts = blogSource.getPages('zh');
  console.log('\n所有中文文章数量:', zhPosts.length);

  // 过滤已发布的文章
  const publishedPosts = zhPosts.filter(post => post.data.published);
  console.log('已发布的中文文章数量:', publishedPosts.length);

  // 按日期排序
  const sortedPosts = publishedPosts.sort((a, b) => {
    return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
  });

  console.log('\n已发布文章列表（按日期降序）:');
  sortedPosts.forEach((post, index) => {
    console.log(`${index + 1}. 标题: ${post.data.title}`);
    console.log(`   日期: ${post.data.date}`);
    console.log(`   路径: ${post.slugs.join('/')}`);
    console.log(`   发布状态: ${post.data.published}`);
    console.log('');
  });

  // 特别检查我们的文章
  const aiAgentPost = zhPosts.find(p => p.slugs.includes('ai-agent-guide'));
  if (aiAgentPost) {
    console.log('\n=== 找到 AI Agent 文章 ===');
    console.log('标题:', aiAgentPost.data.title);
    console.log('日期:', aiAgentPost.data.date);
    console.log('发布状态:', aiAgentPost.data.published);
    console.log('分类:', aiAgentPost.data.categories);
    console.log('作者:', aiAgentPost.data.author);
  } else {
    console.log('\n❌ 没有找到 ai-agent-guide 文章！');
  }
}

debugBlog().catch(console.error);