# 项目结构

这个仓库是一个使用 Next.js、React 和 TypeScript 构建的博客网站。

目录可以先按下面这条数据流理解：

```text
页面 app
  ↓
界面 components
  ↓
交互 hooks / 状态 stores
  ↓
业务 services
  ↓
底层 lib
  ↓
GitHub API 或 blog-content 内容仓库
```

## 顶层目录

| 路径 | 作用 |
| --- | --- |
| `src/` | 网站的主要源代码 |
| `public/` | 可以被浏览器直接访问的静态文件，以及构建时同步过来的内容 |
| `scripts/` | 本地或构建时运行的 Node.js 脚本 |
| `package.json` | 依赖和项目命令，例如 `pnpm dev`、`pnpm build` |
| `pnpm-lock.yaml` | 锁定依赖的具体版本 |
| `tsconfig.json` | TypeScript 配置；`@/*` 指向 `src/*` |
| `global.d.ts` | 全局 TypeScript 类型声明 |
| `next.config.ts` | Next.js 构建配置 |
| `open-next.config.ts`、`wrangler.toml` | Cloudflare/OpenNext 部署配置 |

## `src/app`

`app` 是 Next.js App Router 的约定目录。目录路径通常会对应网站 URL：

```text
src/app/about/page.tsx       → /about
src/app/blog/page.tsx        → /blog
src/app/projects/page.tsx    → /projects
```

常见的特殊文件名：

| 文件名 | 作用 |
| --- | --- |
| `page.tsx` | 一个页面的入口 |
| `layout.tsx` | 页面共享布局；`src/app/layout.tsx` 是全站布局 |
| `route.ts` | HTTP 接口，例如 RSS 接口 |
| `[id]`、`[slug]` | 动态路由参数 |
| `(home)` | 路由分组，不会出现在 URL 中 |

当前主要页面目录包括：

- `(home)`：首页及首页卡片、首页设置面板
- `about`：关于页面
- `blog`：文章列表和文章详情
- `bloggers`：博主列表
- `clock`：时钟
- `image-toolbox`：图片工具
- `music`：音乐
- `pictures`：相册
- `projects`：项目展示
- `share`：分享内容
- `snippets`：句子或代码片段
- `svgs`：SVG 展示
- `write`：写文章、编辑文章和发布文章
- `wuthering-waves`：独立页面

页面目录中还会出现一些按功能划分的子目录。这些名称主要是项目组织习惯，不是 Next.js 的强制要求：

| 子目录 | 作用 |
| --- | --- |
| `components/` | 只供当前功能使用的界面组件 |
| `hooks/` | 只供当前功能使用的 React Hook |
| `services/` | 当前功能的业务操作，例如发布或删除内容 |
| `stores/` | 当前功能的状态管理 |
| `types.ts` | 当前功能使用的 TypeScript 类型 |

`src/consts.ts` 位于 `app` 外面，保存全站常量以及 `blog-public`、`blog-content` 两个 GitHub 仓库的配置。

## `src/components`

这里放可在多个页面复用的界面组件，例如：

- `card.tsx`：卡片
- `dialog-modal.tsx`：弹窗
- `select.tsx`：选择器
- `like-button.tsx`：点赞按钮
- `blog-preview.tsx`：文章预览
- `blog-toc.tsx`：文章目录

如果一个组件只服务于博客页面，它可以放在 `src/app/blog/components/`；如果多个页面都可能使用，就放在这里。

## `src/lib`

`lib` 放不负责直接绘制界面的核心代码。这个目录名是常见的工程约定，不是 TypeScript 规定的名称。

| 文件 | 作用 |
| --- | --- |
| `github-client.ts` | 调用 GitHub API，读取和写入仓库文件 |
| `auth.ts` | 登录、Token 和认证 |
| `blog-index.ts` | 读取和更新文章索引 |
| `load-blog.ts` | 加载一篇文章 |
| `markdown-renderer.ts` | 将 Markdown 转为网页内容 |
| `file-utils.ts` | 文件读取、Base64 和文件哈希 |
| `aes256-util.ts` | 加解密 |
| `color.ts` | 颜色处理 |
| `utils.ts` | 通用辅助函数 |
| `log.ts` | 日志 |

例如，文章详情页大致经过：

```text
app/blog/[id]/page.tsx
  → lib/load-blog.ts
  → /blogs/<slug>/index.md
  → lib/markdown-renderer.ts
  → 页面显示
```

## `src/hooks`

这里放可复用的 React 逻辑，文件一般以 `use` 开头：

| 文件 | 作用 |
| --- | --- |
| `use-auth.ts` | 读取认证状态 |
| `use-blog-index.ts` | 读取文章列表 |
| `use-categories.ts` | 读取文章分类 |
| `use-read-articles.ts` | 处理已读文章 |
| `use-size.ts` | 监听屏幕尺寸 |
| `use-markdown-render.tsx` | 处理 Markdown 渲染 |

Hook 的作用是把状态、事件和生命周期逻辑从界面组件中抽出来，供多个组件复用。

## `src/layout`

这里放网站的整体外壳：

```text
header.tsx       顶部导航
footer.tsx       页脚
head.tsx         页面头部信息
index.tsx        布局入口
backgrounds/     背景效果
```

## `src/config`、`src/styles` 和 `src/svgs`

- `src/config/`：站点内容和卡片样式等配置数据，主要是 JSON。
- `src/styles/`：全局样式、文章样式和主题样式。
- `src/svgs/`：SVG 图标；`index.ts` 用来统一导出图标。

## `.ts` 和 `.tsx` 文件

`.ts` 是普通 TypeScript 文件，通常用于类型、函数、API 调用和数据处理。

`.tsx` 是 TypeScript 加 JSX，通常用于 React 界面：

```tsx
export function Example() {
	return <div>页面内容</div>
}
```

常见文件命名可以这样理解：

| 文件名或目录 | 通常表示 |
| --- | --- |
| `types.ts` | 类型定义，例如表单和 API 数据的形状 |
| `services/*.ts` | 有实际业务效果的操作，例如发布、删除或保存 |
| `stores/*.ts` | 跨组件状态，当前项目使用 Zustand |
| `hooks/use-*.ts(x)` | React Hook |
| `components/*.tsx` | React 界面组件 |
| `page.tsx` | Next.js 页面 |
| `route.ts` | Next.js HTTP 接口 |
| `index.ts` | 目录入口或统一导出 |
| `utils.ts` | 通用辅助函数 |

这些目录和命名大多是工程约定，不是 TypeScript 语法要求。真正理解文件职责时，应继续看它导出了什么、被谁引用，以及数据从哪里流向哪里。

## 两条最值得先读的数据流

### 阅读文章

```text
app/blog/page.tsx
  → hooks/use-blog-index.ts
  → lib/blog-index.ts
  → public/blogs/index.json
```

```text
app/blog/[id]/page.tsx
  → lib/load-blog.ts
  → public/blogs/<slug>/index.md
```

### 发布文章

```text
app/write/page.tsx
  → app/write/components/editor.tsx
  → app/write/hooks/use-publish.ts
  → app/write/services/push-blog.ts
  → lib/github-client.ts
  → blog-content 仓库
```

另外，`app` 中的组件默认是 Next.js 服务端组件。文件顶部出现 `'use client'` 时，它才可以使用浏览器 API、点击事件、React 状态和客户端 Hook。
