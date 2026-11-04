# 网站分享

网站分享统一使用 `/share` 页面，数据位于 `src/app/share/list.json`。

- 工具：按标签筛选，可以填写多个标签。
- 博客：按“近期更新 / 长期失联”筛选；状态由管理员手动设置。
- 两类网站共用名称、图标、网址、介绍和星级。

## 添加和编辑

1. 打开分享页，点击右上角“编辑”；也可以按 `Ctrl/Cmd + ,`。
2. 点击“添加”，或某张卡片上的“编辑”。
3. 选择网站类型。工具至少填写一个标签，博客选择更新状态。
4. 确认弹窗后，改动暂存在当前页面，列表会切换到条目所在分类。
5. 点击页面右上角“保存”；未认证时需要先导入已有 GitHub App 私钥。

弹窗里的“取消”丢弃本次弹窗修改；页面上的“取消”丢弃列表自上次保存以来的全部修改。网站地址不可重复。

确认弹窗不会写入本地 JSON 文件，也不会立即发布。保存使用现有 GitHub API 流程，写入内容仓库 `blog-content` 的 `src/app/share/list.json`，上传的图标位于 `public/images/share/`。网站重新同步内容并构建后，后续访问才能读到新内容。本地开发时，刷新仍然读取本地列表；需要同步内容后才能看到远程保存的版本。

首页随机推荐里的博客会链接到 `/share?type=blog&status=recent` 或 `/share?type=blog&status=disconnected`，打开后直接进入相应分类。

## 数据和代码

```text
types.ts                         数据类型、兼容旧数据、提交校验
page.tsx                         管理列表、编辑草稿、取消和保存
grid-view.tsx                    搜索与分类筛选
components/share-card.tsx        显示网站卡片，触发编辑或删除
components/create-dialog.tsx    新增与编辑表单
services/push-shares.ts          校验并向内容仓库提交列表和图片
```

`type` 为 `tool` 或 `blog`，旧数据未填写时按工具处理。博客的 `status` 为 `recent` 或 `disconnected`，未填写时按近期更新处理。工具使用 `tags` 数组分类，保存时会去掉无效的博客状态。

旧 `/bloggers` 地址会重定向到 `/share?type=blog`。统一分享页和首页随机推荐会自动读取旧博主列表，将 `avatar` 转为 `logo`、补充 `type: "blog"` 和 `tags: []`，并保留更新状态。同网址以统一列表中的条目为准。

第一次保存时，统一分享列表与清空旧博主列表在同一个 GitHub 提交中完成。这样既保留原来的博主，也避免之后删除条目时又从旧列表中出现。

## 验证

```bash
pnpm test:share
```

检查包括表单确认和取消、类型与状态筛选、重复网址、图片修改网址后的关联、旧博主迁移，以及保存后的 JSON 字段。测试模拟 React hooks 和 GitHub 响应；其中也会运行真实 GitHub 客户端，检查提交父节点、基础文件树和两个列表的写入。不会向远程提交，也不替代浏览器的布局检查。

生产构建现在会执行 TypeScript 检查。需要在开发服务运行期间验证本地代码构建时，可以隔离输出目录（PowerShell）：

```powershell
$env:NEXT_BUILD_DIR = '.next-verify'
pnpm exec next build --webpack
Remove-Item Env:NEXT_BUILD_DIR
```

此命令只构建当前本地内容。正式部署仍使用 `pnpm build`，先同步内容仓库再构建。真实发布需要配置 GitHub App ID、在网站导入该 App 的私钥，以及配置相应部署平台；这些与本地模拟测试不同。
