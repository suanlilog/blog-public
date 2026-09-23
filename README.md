# 算栗工坊

算栗工坊的博客网站。网站代码和固定视觉配置放在 `suanlilog/blog-public`，文章、图片、相册、项目、分享等个人内容放在 `suanlilog/blog-content`。

## 内容仓库

创建公开仓库 `suanlilog/blog-content`，默认分支使用 `main`。仓库根目录按网站路径存放内容：

```text
public/blogs/                 文章 Markdown、文章配置、文章图片和索引
public/images/pictures/       相册图片
public/images/project/        项目图片
public/images/share/          分享条目图片
public/images/blogger/        博主头像
src/app/about/list.json       关于页面
src/app/pictures/list.json    相册索引
src/app/projects/list.json    项目列表
src/app/bloggers/list.json    博主列表
src/app/share/list.json       分享列表
src/app/snippets/list.json    句子列表
```

空列表可以先使用 `[]`；`src/app/about/list.json` 是包含 `title`、`description`、`content` 的 JSON 对象。每篇文章放在 `public/blogs/<slug>/`，包含 `index.md` 和 `config.json`，文章索引在 `public/blogs/index.json`，分类在 `public/blogs/categories.json`。

## Vercel

将 `blog-public` 导入 Vercel，设置：

```text
NEXT_PUBLIC_SITE_URL=https://www.suanlilog.com
NEXT_PUBLIC_GITHUB_OWNER=suanlilog
NEXT_PUBLIC_GITHUB_REPO=blog-public
NEXT_PUBLIC_GITHUB_BRANCH=main
NEXT_PUBLIC_CONTENT_GITHUB_OWNER=suanlilog
NEXT_PUBLIC_CONTENT_GITHUB_REPO=blog-content
NEXT_PUBLIC_CONTENT_GITHUB_BRANCH=main
SITE_URL=https://www.suanlilog.com
NEXT_PUBLIC_GITHUB_APP_ID=<GitHub App ID>
NEXT_PUBLIC_GITHUB_ENCRYPT_KEY=<自定义随机字符串>
```

将 GitHub App 安装到 `blog-public` 和 `blog-content`，并授予两个仓库 Contents 读写权限。网页里的内容管理会根据目标仓库申请安装令牌。在 Vercel 项目设置中创建 Deploy Hook，然后在 `blog-content` 的 Settings → Webhooks → Add webhook 中把 Hook 地址填为 Payload URL、Content type 选 `application/json`，事件选 Just the push event。内容仓库每次推送就会触发新部署，构建时从公开内容仓库同步文件。

旧博客文章已转换到本地忽略目录 `content-seed/`。创建内容仓库后，将该目录里的文件复制到 `blog-content` 仓库根目录并推送；该目录不会提交到 `blog-public`。

自定义域名添加 `www.suanlilog.com`。如果 DNS 服务商支持，可同时将根域 `suanlilog.com` 重定向到 `www.suanlilog.com`。

## 本地开发

```bash
pnpm install
pnpm dev
```

正式构建会先从 `blog-content` 同步个人内容，再运行 Next.js 构建。可通过 `CONTENT_GITHUB_OWNER`、`CONTENT_GITHUB_REPO` 和 `CONTENT_GITHUB_BRANCH` 覆盖同步目标。
