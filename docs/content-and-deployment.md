# 内容仓库与部署

网站代码和固定视觉配置位于 `suanlilog/blog-public`；文章、图片、相册、项目、分享等经常变化的个人内容位于 `suanlilog/blog-content`。

## 内容仓库结构

`blog-content` 根目录按网站路径存放内容：

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

每篇文章位于 `public/blogs/<slug>/`，包含 `index.md` 和 `config.json`。文章索引位于 `public/blogs/index.json`，分类位于 `public/blogs/categories.json`。

## 构建时同步

`pnpm build` 会先运行 `scripts/sync-content.mjs`，从 `blog-content` 下载允许的内容文件到本地 `public/`，然后执行 Next.js 构建。因此 `blog-public` 中的 `public/blogs` 内容是构建工作目录中的同步副本，内容源仍然是 `blog-content`。

同步目标可以通过下面的环境变量覆盖：

```text
CONTENT_GITHUB_OWNER
CONTENT_GITHUB_REPO
CONTENT_GITHUB_BRANCH
```

## Vercel 配置

将 `blog-public` 导入 Vercel 后，可以配置：

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

内容管理功能需要 GitHub App 同时安装到 `blog-public` 和 `blog-content`，并授予两个仓库的 Contents 读写权限。

## GitHub API 认证

这个项目使用 GitHub App，不需要手动创建长期 Personal Access Token。配置步骤是：

1. 在 GitHub 的 Settings → Developer settings → GitHub Apps 中创建或选择一个 App。
2. 记下 App ID，并在 App 的 Private keys 中生成一个 `.pem` 私钥。
3. 将 App 安装到 `blog-public` 和 `blog-content`，授予 Contents 的读写权限。
4. 在环境变量中设置 `NEXT_PUBLIC_GITHUB_APP_ID`，并按仓库设置 Owner、Repo 和 Branch。
5. 在网站保存内容时导入 `.pem` 私钥。

网站会在浏览器中用 App ID 和私钥签发短期 JWT，再向 GitHub 换取安装令牌，最后调用 GitHub API 提交文件。代码入口是 `src/lib/auth.ts` 和 `src/lib/github-client.ts`。

### 生成 `.pem` 私钥的具体操作

如果 GitHub App 已经存在：

1. 打开 GitHub 的头像菜单 → Settings → Developer settings → GitHub Apps。
2. 在 “Owned by you” 中点击这个项目使用的 App。
3. 打开左侧的 **Credentials**。
4. 找到 **Key pairs** 区域（不要进 `Client secrets`）；点击该区域里的生成按钮来创建 App 私钥。
5. 浏览器会自动下载一个类似 `my-blog-app.2026-10-28.private-key.pem` 的文件。
6. 在网站出现“导入密钥”时选择这个文件。

如果列表里没有 App，需要先点击 “New GitHub App” 创建一个。创建后在 Repository permissions 中将 Contents 设置为 Read and write，再生成私钥，并通过 “Install App” 将它安装到 `blog-public` 和 `blog-content`。

GitHub 不会再次显示已经生成过的私钥内容。如果文件丢失，就重新生成一个新的私钥；旧私钥可以在同一页面删除。`.pem` 是 GitHub App 私钥，不是 SSH 公钥，也不是 Personal Access Token，不要提交到仓库或发送给别人。

当前方案适合个人博客管理员使用。私钥不要提交到任何仓库；如果以后要让普通访客编辑内容，应改成服务端保存私钥并通过 OAuth 或自有登录系统授权，不能让访客直接接触仓库写权限。

如果希望 `blog-content` 推送后自动部署，可以在 Vercel 创建 Deploy Hook，再将 Hook 地址添加到 `blog-content` 的 GitHub Webhook，事件选择 `Just the push event`。

旧文章已经转换到本地忽略目录 `content-seed/`。创建内容仓库后，将其中的文件复制到 `blog-content` 根目录并推送；该目录不会提交到 `blog-public`。
