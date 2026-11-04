# 算栗工坊

算栗工坊的博客网站，使用 Next.js、React 和 TypeScript 构建。

## 环境要求

- Node.js
- pnpm

## 本地开发

```bash
pnpm install
pnpm dev
```

开发服务器默认运行在 `http://localhost:2025`。

## 构建和运行

```bash
pnpm build
pnpm start
```

正式构建会先同步 `blog-content` 中的内容，再执行 Next.js 构建。需要覆盖同步目标时，可以设置：

```text
CONTENT_GITHUB_OWNER
CONTENT_GITHUB_REPO
CONTENT_GITHUB_BRANCH
```

## 其他命令

```bash
pnpm sync:content  # 只同步内容仓库
pnpm svg           # 生成 SVG 索引
pnpm build:cf      # 构建 Cloudflare 版本
pnpm preview       # 预览 Cloudflare 构建结果
pnpm deploy        # 部署到 Cloudflare
```

更多说明：

- [页面修改指南](docs/change-guide.md)
- [项目结构](docs/project-structure.md)
- [内容仓库与部署](docs/content-and-deployment.md)
- [网站分享：使用和代码说明](docs/website-sharing.md)
