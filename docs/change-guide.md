# 改页面时先去哪里找

不需要先读完整个项目。先根据你想改变的东西找到入口，再沿着文件里的 `import` 和函数调用往下看。

## 先判断改动属于哪一类

| 想改什么 | 先看哪里 |
| --- | --- |
| 首页整体布局 | `src/app/(home)/page.tsx` |
| 首页上的某张卡片 | `src/app/(home)/` 下对应的 `*-card.tsx` |
| 首页顶部图片卡片的图片 | 网站设置中的“首页图片”，数据在 `src/config/site-content.json` |
| 首页设置弹窗 | `src/app/(home)/config-dialog/` |
| 文章列表页 | `src/app/blog/page.tsx` |
| 文章详情页 | `src/app/blog/[id]/page.tsx` |
| 文章卡片或文章目录 | `src/components/blog-preview.tsx`、`blog-toc.tsx` |
| 关于页 | `src/app/about/page.tsx` |
| 相册页 | `src/app/pictures/page.tsx` |
| 项目页 | `src/app/projects/page.tsx` |
| 分享页 | `src/app/share/page.tsx` |
| 写文章页面 | `src/app/write/page.tsx` |
| 写文章编辑器 | `src/app/write/components/editor.tsx` |
| 写文章预览 | `src/app/write/components/preview.tsx` |
| 发布文章的逻辑 | `src/app/write/services/push-blog.ts` |
| 全站顶部、底部或背景 | `src/layout/` |
| 全站颜色和基础样式 | `src/styles/globals.css`、`src/styles/theme.css` |
| 文章排版样式 | `src/styles/article.css` |
| 文章、相册、项目等内容 | `blog-content` 仓库 |

## 页面改动通常只需要看三层

以文章列表为例：

```text
src/app/blog/page.tsx
  页面入口：决定页面有哪些区域

src/app/blog/components/
  局部界面：例如分类弹窗和封面效果

src/hooks/use-blog-index.ts
  数据和交互：决定文章列表从哪里来、什么时候刷新
```

如果只是改标题、间距、颜色，通常先看页面或组件的 JSX 和 className；如果要改变数据来源或保存方式，再继续看 `hooks`、`services` 或 `lib`。

## 改动类型和常见文件

### 只改文字

先在对应页面或组件中搜索原文字。不要一开始就改 `lib` 或 API。

### 改布局

先看对应的 `page.tsx` 或组件的 JSX 结构，再看它引用的组件。页面通常负责“摆放哪些区域”，组件负责“某个区域长什么样”。

### 改颜色、字体、间距

先看当前元素的 `className`，再看：

- `src/styles/globals.css`
- `src/styles/theme.css`
- `src/styles/article.css`

### 改文章内容

去 `blog-content` 改 Markdown、`config.json` 或对应的图片。不要把文章正文写进 `blog-public` 的页面组件。

### 改首页顶部图片

如果你说的是首页上方那张图片卡片，推荐直接使用网站里的设置功能：

1. 打开首页，点击“写文章”旁边的三个点；也可以按 `Ctrl/Cmd + ,`。
2. 进入“网站设置”，找到“首页图片”。
3. 上传图片或添加图片 URL，点击某张图片将它设为“当前使用”。
4. 点击“保存”。未认证时，按钮会要求导入 GitHub App 的 `.pem` 私钥。

这套设置会更新 `blog-public` 中的 `src/config/site-content.json`，上传的本地图片会放到 `public/images/art/`。对应的代码链路是：

```text
app/(home)/art-card.tsx
  → siteContent.artImages / currentArtImageId
  → src/config/site-content.json
  → app/(home)/services/push-site-content.ts
  → blog-public 仓库
```

如果你说的是点击首页图片后进入的 `/pictures` 相册页面，则应在 `/pictures` 页面点击“编辑”并上传；这套功能更新的是 `blog-content` 中的 `src/app/pictures/list.json` 和 `public/images/pictures/`。

首页设置适合更换首页展示图；相册页面适合管理完整的图片集合。两者使用不同的配置和仓库。

### 改保存、发布或删除行为

先看当前功能目录下的 `services/`，再看它调用的 `src/lib/github-client.ts`。这里通常涉及 GitHub API，改动前要弄清楚写入的是 `blog-public` 还是 `blog-content`。

## 让 AI 改代码时这样提问

先让 AI 定位和解释，不要直接让它大范围重写：

```text
我想把博客列表页的卡片改成两列布局。
请先告诉我涉及哪些文件、每个文件负责什么、数据流怎么走，暂时不要修改。
```

确认位置后再让它修改：

```text
按刚才的方案修改，只改博客列表相关文件。
保留现有数据加载和交互，告诉我每个改动解决什么问题。
```

改完后要求它解释 diff：

```text
请按文件解释这次 diff：原来是什么，改成了什么，为什么必须改这里，可能有什么副作用。
```

## 看 AI 改动时只抓四件事

1. **入口**：它改的是哪个页面或组件？这个文件真的负责我想改的区域吗？
2. **显示**：它改了 JSX、CSS 还是组件参数？这决定页面长什么样。
3. **数据**：它有没有改 Hook、Service、API 或仓库路径？这决定数据从哪里来、会写到哪里。
4. **范围**：它有没有顺手改无关文件，或者用 `any`、删除类型检查来绕过报错？

## 一条适合当前项目的阅读路线

不要按文件名从头读。按一个真实需求读：

```text
首页 → src/app/(home)/page.tsx
  → 首页卡片组件
  → src/components 中被复用的组件
  → src/styles 中相关样式
```

或者：

```text
发布文章 → src/app/write/page.tsx
  → components/editor.tsx
  → hooks/use-publish.ts
  → services/push-blog.ts
  → lib/github-client.ts
```

你只需要理解当前需求经过的这条链路。下一次遇到别的需求，再从对应页面开始建立另一条小链路。
