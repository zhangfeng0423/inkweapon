# InkWeapon Logo 文件说明

## 生成的 Logo 文件列表

### 主要 Logo 文件

| 文件名 | 尺寸 | 格式 | 用途 | 描述 |
|--------|------|------|------|------|
| `logo-dark.png` | 512x512px | PNG | 深色背景 | 主要深色版本 logo |
| `logo.png` | 512x512px | PNG | 浅色背景 | 主要浅色版本 logo |
| `logo-light-200.png` | 200x200px | PNG | 浅色背景 | 中等尺寸浅色版本 |
| `logo-200.png` | 200x200px | PNG | 深色背景 | 中等尺寸深色版本 |

### 横版 Logo

| 文件名 | 尺寸 | 格式 | 用途 |
|--------|------|------|------|
| `logo-horizontal.png` | 280x60px | PNG | 网站头部、导航栏 |

### 小图标版本

| 文件名 | 尺寸 | 格式 | 用途 |
|--------|------|------|------|
| `logo-icon-64.png` | 64x64px | PNG | 深色小图标 |
| `logo-icon-light-64.png` | 64x64px | PNG | 浅色小图标 |
| `favicon-32x32-new.png` | 32x32px | PNG | 浏览器图标 |
| `favicon-16x16-new.png` | 16x16px | PNG | 浏览器小图标 |

### SVG 源文件

| 文件名 | 格式 | 用途 |
|--------|------|------|
| `logo.svg` | SVG | 深色版本矢量源文件 |
| `logo-light.svg` | SVG | 浅色版本矢量源文件 |
| `logo-horizontal.svg` | SVG | 横版矢量源文件 |

## Logo 设计特点

### 深色版本 (logo-dark.png)
- **背景**: 深靛蓝渐变 (#0F172A → #1E293B)
- **主色**: 科技蓝渐变 (#00D4FF → #0066FF)
- **强调色**: 活力橙 (#FF6B35)
- **适用场景**: 深色主题网站、技术文档

### 浅色版本 (logo.png)
- **背景**: 浅灰渐变 (#F8FAFC → #E2E8F0)
- **主色**: 深蓝渐变 (#0066FF → #0047B3)
- **强调色**: 深橙 (#FF4500)
- **适用场景**: 浅色主题网站、打印材料

### 设计元素
1. **剑刃形状**: 代表"武器"概念，象征强大的迁移能力
2. **流动线条**: 代表"墨水"概念，象征知识流动
3. **代码括号**: `< >` 符号体现编程和技术属性
4. **墨滴装饰**: 顶部墨滴强化"Ink"概念
5. **底部扩散**: 底部墨迹扩散效果

## 使用建议

### 网站集成
```html
<!-- 主要 logo -->
<img src="/logo.png" alt="InkWeapon" width="200" height="200">

<!-- 横版 logo (推荐用于头部) -->
<img src="/logo-horizontal.png" alt="InkWeapon" width="280" height="60">

<!-- 响应式使用 -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/logo-dark.png">
  <img src="/logo.png" alt="InkWeapon">
</picture>
```

### Favicon 配置
在 HTML `<head>` 中添加：
```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32-new.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16-new.png">
```

### CSS 变量配置
```css
:root {
  --logo-primary: url('/logo.png');
  --logo-secondary: url('/logo-dark.png');
  --logo-horizontal: url('/logo-horizontal.png');
}

@media (prefers-color-scheme: dark) {
  :root {
    --logo-primary: url('/logo-dark.png');
    --logo-secondary: url('/logo.png');
  }
}
```

## 文件大小信息

- **主文件**: ~50KB (512x512px)
- **中等文件**: ~16-19KB (200x200px)
- **小图标**: ~3-4KB (64x64px)
- **Favicon**: ~1.5KB (16x16px), ~0.6KB (32x32px)
- **横版**: ~7KB (280x60px)

## 优化建议

1. **WebP 格式**: 可进一步转换为 WebP 格式以减少文件大小
2. **CSS 精灵**: 对于小图标可考虑使用 CSS 精灵技术
3. **懒加载**: 大尺寸 logo 可使用懒加载优化性能
4. **CDN**: 建议通过 CDN 分发以提高加载速度

## 版权说明

此 logo 为 InkWeapon 品牌专属设计，仅限用于：
- InkWeapon 官方网站和应用
- 相关技术文档和教程
- 官方社交媒体和营销材料
- 开源项目文档

未经授权不得用于商业用途或修改。