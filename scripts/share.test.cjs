const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
const base = {
	name: '测试网站',
	logo: '/images/avatar.png',
	url: 'https://example.com/',
	description: '测试介绍',
	tags: ['开发'],
	stars: 4
}

// 执行真实 TS/TSX 模块；替换浏览器环境、React hooks 和外部 API。
// 这些检查验证事件与数据流，不会提交 GitHub，也不代替浏览器布局检查。
function runtime(extra = {}) {
	let current
	const toastErrors = []
	const mocks = {
		react: {
			Suspense: 'suspense',
			useState(initial) {
				const host = current
				const slot = host.cursor++
				if (!(slot in host.states)) host.states[slot] = typeof initial === 'function' ? initial() : initial
				return [
					host.states[slot],
					value => {
						host.states[slot] = typeof value === 'function' ? value(host.states[slot]) : value
					}
				]
			},
			useRef(initial) {
				const host = current
				const slot = host.cursor++
				if (!(slot in host.states)) host.states[slot] = { current: initial }
				return host.states[slot]
			},
			useEffect() {}
		},
		'motion/react': { motion: { div: 'div', button: 'button' } },
		'next/navigation': { useSearchParams: () => new URLSearchParams() },
		sonner: { toast: { error: message => toastErrors.push(message), info() {}, success() {} } },
		'lucide-react': { Plus: () => null },
		'@/components/dialog-modal': { DialogModal: 'dialog' },
		'@/components/editable-star-rating': () => null,
		'@/components/star-rating': () => null,
		'@/hooks/use-size': { useSize: () => ({ maxSM: false }) },
		'@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' '), getFileExt: filename => path.extname(filename) },
		'./logo-upload-dialog': function LogoUploadDialog() {},
		'@/hooks/use-auth': { useAuthStore: () => ({ isAuth: true, setPrivateKey() {} }) },
		'@/app/(home)/stores/config-store': { useConfigStore: () => ({ siteContent: {} }) },
		...extra
	}
	const cache = new Map()
	function load(filename) {
		const absolute = path.resolve(root, filename)
		if (cache.has(absolute)) return cache.get(absolute).exports
		const module = { exports: {} }
		cache.set(absolute, module)
		const source = fs.readFileSync(absolute, 'utf8')
		if (absolute.endsWith('.json')) {
			module.exports = JSON.parse(source)
			return module.exports
		}
		const output = ts.transpileModule(source, {
			compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 }
		}).outputText
		function localRequire(id) {
			if (Object.hasOwn(mocks, id)) return mocks[id]
			if (!id.startsWith('.') && !id.startsWith('@/')) return require(id)
			const target = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(absolute), id)
			const resolved = ['', '.ts', '.tsx', '.json'].map(ext => target + ext).find(file => fs.existsSync(file) && fs.statSync(file).isFile())
			if (!resolved) throw new Error('Cannot resolve ' + id)
			return load(resolved)
		}
		vm.runInThisContext('(function(require,module,exports){\n' + output + '\n})', { filename: absolute })(localRequire, module, module.exports)
		return module.exports
	}
	function mount(Component, props) {
		const host = { states: [], cursor: 0 }
		return {
			render() {
				current = host
				host.cursor = 0
				return Component(props)
			}
		}
	}
	return { load, mount, toastErrors }
}

function nodes(tree, predicate) {
	if (Array.isArray(tree)) return tree.flatMap(item => nodes(item, predicate))
	if (!tree || typeof tree !== 'object') return []
	return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)]
}
const button = (tree, label) => nodes(tree, node => node.type === 'button' && node.props.children === label)[0]
const grid = tree => nodes(tree, node => node.type?.name === 'GridView')[0]
const editor = tree => nodes(tree, node => node.type?.name === 'CreateDialog')[0]

test('旧数据兼容工具，标签清理，博客状态和工具状态分别处理', () => {
	const { normalizeShare, validateShare } = runtime().load('src/app/share/types.ts')
	const tool = normalizeShare({ ...base, name: ' 测试网站 ', tags: ['开发', ' 开发 ', ''], status: 'disconnected' })
	assert.equal(tool.type, 'tool')
	assert.equal(tool.name, '测试网站')
	assert.deepEqual(tool.tags, ['开发'])
	assert.equal(tool.status, undefined)
	assert.equal(validateShare(tool), null)
	const blog = normalizeShare({ ...base, type: 'blog', tags: [] })
	assert.equal(blog.status, 'recent')
	assert.equal(validateShare(blog), null)
	assert.ok(validateShare(normalizeShare({ ...base, tags: [] })))
	assert.ok(validateShare({ ...base, url: 'javascript:alert(1)' }))
})

test('新增博客无需工具标签，可选长期失联，确认前不修改原对象', () => {
	const r = runtime()
	const CreateDialog = r.load('src/app/share/components/create-dialog.tsx').default
	const original = { ...base, tags: [] }
	let saved
	let closed = false
	const view = r.mount(CreateDialog, {
		share: original,
		onSave: value => {
			saved = value
			return true
		},
		onClose: () => {
			closed = true
		}
	})
	let tree = view.render()
	nodes(tree, node => node.type === 'select')[0].props.onChange({ target: { value: 'blog' } })
	tree = view.render()
	nodes(tree, node => node.type === 'select')[1].props.onChange({ target: { value: 'disconnected' } })
	tree = view.render()
	assert.equal(saved, undefined)
	assert.equal(original.type, undefined)
	nodes(tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} })
	assert.equal(saved.type, 'blog')
	assert.equal(saved.status, 'disconnected')
	assert.deepEqual(saved.tags, [])
	assert.equal(closed, true)
})

test('编辑弹窗取消不触发列表更新', () => {
	const r = runtime()
	const CreateDialog = r.load('src/app/share/components/create-dialog.tsx').default
	let saved = false
	let closed = false
	const original = { ...base }
	const view = r.mount(CreateDialog, {
		share: original,
		onSave: () => {
			saved = true
			return true
		},
		onClose: () => {
			closed = true
		}
	})
	let tree = view.render()
	nodes(tree, node => node.props?.['aria-label'] === '网站名称')[0].props.onChange({ target: { value: '不应保存的名称' } })
	tree = view.render()
	button(tree, '取消').props.onClick()
	assert.equal(saved, false)
	assert.equal(closed, true)
	assert.equal(original.name, base.name)
})

test('工具无标签时阻止确认；父页面拒绝重复网址时保留弹窗', () => {
	const r = runtime()
	const CreateDialog = r.load('src/app/share/components/create-dialog.tsx').default
	let closed = false
	let calls = 0
	const props = {
		share: { ...base, tags: [] },
		onSave: () => {
			calls++
			return false
		},
		onClose: () => {
			closed = true
		}
	}
	const view = r.mount(CreateDialog, props)
	let tree = view.render()
	nodes(tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} })
	assert.equal(calls, 0)
	assert.equal(r.toastErrors.length, 1)
	nodes(tree, node => node.type === 'input' && node.props.placeholder?.includes('用逗号'))[0].props.onChange({ target: { value: 'AI，图片, AI' } })
	tree = view.render()
	nodes(tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} })
	assert.equal(calls, 1)
	assert.equal(closed, false)
})

test('工具标签与博客状态互不干扰，旧博客默认近期更新', () => {
	const r = runtime()
	const GridView = r.load('src/app/share/grid-view.tsx').default
	const shares = [
		{ ...base },
		{ ...base, url: 'https://recent.example/', type: 'blog', tags: ['不应进入工具标签'] },
		{ ...base, url: 'https://old.example/', type: 'blog', tags: [], status: 'disconnected' }
	]
	const props = { shares, selectedType: 'tool', selectedStatus: 'recent', onTypeChange() {}, onStatusChange() {} }
	const view = r.mount(GridView, props)
	let tree = view.render()
	const cards = tree => nodes(tree, node => node.type?.name === 'ShareCard').map(node => node.props.share.url)
	assert.deepEqual(cards(tree), [base.url])
	assert.equal(button(tree, '不应进入工具标签'), undefined)
	button(tree, '开发').props.onClick()
	props.selectedType = 'blog'
	tree = view.render()
	assert.deepEqual(cards(tree), ['https://recent.example/'])
	assert.equal(button(tree, '开发'), undefined)
	props.selectedStatus = 'disconnected'
	tree = view.render()
	assert.deepEqual(cards(tree), ['https://old.example/'])
	nodes(tree, node => node.props?.['aria-label'] === '搜索网站')[0].props.onChange({ target: { value: '不存在' } })
	assert.deepEqual(cards(view.render()), [])
})

test('卡片读取父级新数据，博客显示更新状态', () => {
	const r = runtime()
	const ShareCard = r.load('src/app/share/components/share-card.tsx').ShareCard
	const props = { share: { ...base, type: 'blog', tags: [], status: 'recent' } }
	const view = r.mount(ShareCard, props)
	assert.equal(nodes(view.render(), node => node.type === 'h3')[0].props.children, base.name)
	props.share = { ...props.share, name: '已更新', status: 'disconnected' }
	const tree = view.render()
	assert.equal(nodes(tree, node => node.type === 'h3')[0].props.children, '已更新')
	assert.ok(nodes(tree, node => node.type === 'span' && node.props.children === '长期失联').length)
})

test('页面确认编辑后切换分类，全局取消恢复原始列表', () => {
	const r = runtime({
		'./list.json': [{ ...base }],
		'./grid-view': function GridView() {},
		'./components/create-dialog': function CreateDialog() {},
		'./services/push-shares': { pushShares: async ({ shares }) => shares }
	})
	const Page = r.load('src/app/share/page.tsx').default
	const view = r.mount(Page().props.children.type, {})
	let tree = view.render()
	const original = grid(tree).props.shares
	button(tree, '编辑').props.onClick()
	tree = view.render()
	grid(tree).props.onEdit(original[0])
	tree = view.render()
	const changed = { ...original[0], type: 'blog', tags: [], status: 'disconnected' }
	assert.equal(editor(tree).props.onSave(changed), true)
	editor(tree).props.onClose()
	tree = view.render()
	assert.equal(grid(tree).props.selectedType, 'blog')
	assert.equal(grid(tree).props.selectedStatus, 'disconnected')
	assert.equal(grid(tree).props.shares[0].type, 'blog')
	button(tree, '取消').props.onClick()
	tree = view.render()
	assert.deepEqual(grid(tree).props.shares, original)
})

test('页面阻止重复网址，待上传图标在修改网址后仍跟随条目', async () => {
	let submission
	const r = runtime({
		'./list.json': [{ ...base }],
		'./grid-view': function GridView() {},
		'./components/create-dialog': function CreateDialog() {},
		'./services/push-shares': {
			pushShares: async params => {
				submission = params
				return params.shares
			}
		}
	})
	const Page = r.load('src/app/share/page.tsx').default
	const view = r.mount(Page().props.children.type, {})
	let tree = view.render()
	button(tree, '编辑').props.onClick()
	tree = view.render()
	button(tree, '添加').props.onClick()
	tree = view.render()
	const existing = grid(tree).props.shares[0]
	assert.equal(editor(tree).props.onSave(existing), false)
	const added = { ...base, url: 'https://new.example/', logo: 'blob:pending', type: 'blog', status: 'recent', tags: [] }
	const logo = { type: 'file', file: { name: 'logo.png' }, previewUrl: 'blob:pending' }
	assert.equal(editor(tree).props.onSave(added, logo), true)
	editor(tree).props.onClose()
	tree = view.render()
	grid(tree).props.onEdit(grid(tree).props.shares.find(item => item.url === added.url))
	tree = view.render()
	const renamed = { ...added, url: 'https://renamed.example/' }
	assert.equal(editor(tree).props.onSave(renamed), true)
	editor(tree).props.onClose()
	tree = view.render()
	button(tree, '保存').props.onClick()
	await new Promise(resolve => setImmediate(resolve))
	assert.equal(submission.logoItems.has(added.url), false)
	assert.equal(submission.logoItems.get(renamed.url), logo)
})

function persistenceRuntime() {
	const writes = []
	let tokenCalls = 0
	const r = runtime({
		'@/consts': { CONTENT_GITHUB_CONFIG: { OWNER: 'test-owner', REPO: 'test-content', BRANCH: 'main' } },
		'@/lib/auth': {
			getAuthToken: async () => {
				tokenCalls++
				return 'test-token'
			}
		},
		'@/lib/file-utils': { fileToBase64NoPrefix: async () => 'aW1hZ2U=', hashFileSHA256: async () => 'image-hash' },
		'@/lib/github-client': {
			toBase64Utf8: value => Buffer.from(value).toString('base64'),
			getRef: async () => ({ sha: 'base-commit' }),
			getCommitTree: async (_token, _owner, _repo, commitSha) => {
				assert.equal(commitSha, 'base-commit')
				return { sha: 'base-tree' }
			},
			createBlob: async (_token, _owner, _repo, content) => {
				const sha = 'blob-' + writes.length
				writes.push({ content, sha })
				return { sha }
			},
			createTree: async (_token, _owner, _repo, items, baseTree) => {
				assert.equal(baseTree, 'base-tree')
				assert.ok(items.some(item => item.path === 'src/app/share/list.json'))
				assert.ok(items.some(item => item.path === 'src/app/bloggers/list.json' && item.content.trim() === '[]'))
				return { sha: 'tree' }
			},
			createCommit: async () => ({ sha: 'commit' }),
			updateRef: async () => {}
		}
	})
	return { ...r, writes, tokenCalls: () => tokenCalls }
}

test('保存和重新读取保留网站类型、博客状态，上传图标不会覆盖其他字段', async () => {
	const r = persistenceRuntime()
	const { pushShares } = r.load('src/app/share/services/push-shares.ts')
	const blog = { ...base, url: 'https://blog.example/', type: 'blog', tags: [], status: 'disconnected', logo: 'blob:pending' }
	const result = await pushShares({
		shares: [base, blog],
		logoItems: new Map([[blog.url, { type: 'file', file: { name: 'logo.png' }, previewUrl: blog.logo }]])
	})
	const saved = JSON.parse(Buffer.from(r.writes.at(-1).content, 'base64').toString('utf8'))
	assert.deepEqual(saved, JSON.parse(JSON.stringify(result)))
	assert.equal(saved[0].type, 'tool')
	assert.equal(Object.hasOwn(saved[0], 'status'), false)
	assert.equal(saved[1].type, 'blog')
	assert.equal(saved[1].status, 'disconnected')
	assert.deepEqual(saved[1].tags, [])
	assert.equal(saved[1].logo, '/images/share/image-hash.png')
	assert.equal(r.tokenCalls(), 1)
})

test('无效数据、重复网址和缺少待上传图片时，在认证和远程写入前拒绝保存', async () => {
	for (const shares of [[{ ...base, tags: [] }], [base, { ...base, url: 'https://example.com' }], [{ ...base, logo: 'blob:missing' }]]) {
		const r = persistenceRuntime()
		await assert.rejects(r.load('src/app/share/services/push-shares.ts').pushShares({ shares }))
		assert.equal(r.tokenCalls(), 0)
		assert.equal(r.writes.length, 0)
	}
})

test('分类链接直接打开长期失联博客，无效参数回落到默认工具分类', () => {
	for (const [query, type, status] of [
		['type=blog&status=disconnected', 'blog', 'disconnected'],
		['type=unknown&status=unknown', 'tool', 'recent']
	]) {
		const r = runtime({
			'./list.json': [{ ...base }],
			'./grid-view': function GridView() {},
			'./components/create-dialog': function CreateDialog() {},
			'./services/push-shares': { pushShares: async ({ shares }) => shares },
			'next/navigation': { useSearchParams: () => new URLSearchParams(query) }
		})
		const Page = r.load('src/app/share/page.tsx').default
		const view = r.mount(Page().props.children.type, {})
		const props = grid(view.render()).props
		assert.equal(props.selectedType, type)
		assert.equal(props.selectedStatus, status)
	}
})

test('远程保存失败保留编辑状态和草稿，可以继续修改或重试', async () => {
	const r = runtime({
		'./list.json': [{ ...base }],
		'./grid-view': function GridView() {},
		'./components/create-dialog': function CreateDialog() {},
		'./services/push-shares': {
			pushShares: async () => {
				throw new Error('模拟网络失败')
			}
		}
	})
	const Page = r.load('src/app/share/page.tsx').default
	const view = r.mount(Page().props.children.type, {})
	let tree = view.render()
	button(tree, '编辑').props.onClick()
	tree = view.render()
	grid(tree).props.onEdit(grid(tree).props.shares[0])
	tree = view.render()
	editor(tree).props.onSave({ ...base, name: '未发布的修改' })
	editor(tree).props.onClose()
	tree = view.render()
	const previousError = console.error
	console.error = () => {}
	try {
		button(tree, '保存').props.onClick()
		await new Promise(resolve => setImmediate(resolve))
	} finally {
		console.error = previousError
	}
	tree = view.render()
	assert.equal(grid(tree).props.isEditMode, true)
	assert.equal(grid(tree).props.shares[0].name, '未发布的修改')
	assert.ok(button(tree, '保存'))
	assert.ok(r.toastErrors.some(message => message.includes('模拟网络失败')))
})

test('迁移旧博主保留头像和状态，统一列表中的同网址数据优先', () => {
	const { mergeLegacyBloggers } = runtime().load('src/app/share/types.ts')
	const legacy = [
		{ name: '旧名称', avatar: '/old.png', url: base.url, description: '不应覆盖', stars: 1 },
		{ name: '旧博主', avatar: '/blogger.png', url: 'https://legacy.example/', description: '旧博客', stars: 5, status: 'disconnected' }
	]
	const merged = mergeLegacyBloggers([base], legacy)
	assert.equal(merged.length, 2)
	assert.equal(merged[0].name, base.name)
	assert.equal(merged[1].logo, '/blogger.png')
	assert.equal(merged[1].type, 'blog')
	assert.equal(merged[1].status, 'disconnected')
	assert.deepEqual(merged[1].tags, [])
	assert.equal(Object.hasOwn(merged[1], 'avatar'), false)
	assert.deepEqual(mergeLegacyBloggers(merged, legacy), merged)
	// 保存时旧列表被清空，后续删除的条目不会在重新加载后复活。
	assert.equal(mergeLegacyBloggers([merged[0]], []).length, 1)
})

test('真实 GitHub 客户端使用 tree SHA 保留旧文件，提交新列表并清空旧博主列表', async () => {
	const requests = []
	const blobs = new Map()
	let treeItems
	let committed = false
	const realFetch = global.fetch
	global.fetch = async (url, options = {}) => {
		const endpoint = new URL(url).pathname
		const body = options.body ? JSON.parse(options.body) : undefined
		requests.push({ endpoint, method: options.method || 'GET', body })
		const respond = data => new Response(JSON.stringify(data), { status: 200 })
		if (endpoint.includes('/git/ref/')) return respond({ object: { sha: 'head-commit' } })
		if (endpoint.endsWith('/git/commits/head-commit')) return respond({ tree: { sha: 'existing-tree' } })
		if (endpoint.endsWith('/git/blobs')) {
			const sha = 'blob-' + blobs.size
			blobs.set(sha, Buffer.from(body.content, body.encoding === 'base64' ? 'base64' : 'utf8').toString('utf8'))
			return respond({ sha })
		}
		if (endpoint.endsWith('/git/trees')) {
			assert.equal(body.base_tree, 'existing-tree')
			treeItems = body.tree
			return respond({ sha: 'updated-tree' })
		}
		if (endpoint.endsWith('/git/commits')) {
			assert.equal(body.tree, 'updated-tree')
			assert.deepEqual(body.parents, ['head-commit'])
			return respond({ sha: 'new-commit' })
		}
		if (endpoint.includes('/git/refs/')) {
			assert.equal(options.method, 'PATCH')
			assert.deepEqual(body, { sha: 'new-commit', force: false })
			committed = true
			return respond({})
		}
		throw new Error('Unexpected GitHub endpoint: ' + endpoint)
	}
	try {
		const r = runtime({
			'@/consts': { CONTENT_GITHUB_CONFIG: { OWNER: 'test-owner', REPO: 'test-content', BRANCH: 'main' } },
			'@/lib/auth': { getAuthToken: async () => 'fake-token' }
		})
		const { pushShares } = r.load('src/app/share/services/push-shares.ts')
		const saved = await pushShares({ shares: [{ ...base, type: 'blog', tags: [], status: 'disconnected' }] })
		assert.equal(committed, true)
		const listFile = treeItems.find(item => item.path === 'src/app/share/list.json')
		assert.deepEqual(JSON.parse(blobs.get(listFile.sha)), JSON.parse(JSON.stringify(saved)))
		assert.equal(JSON.parse(blobs.get(listFile.sha))[0].status, 'disconnected')
		assert.deepEqual(JSON.parse(treeItems.find(item => item.path === 'src/app/bloggers/list.json').content), [])
		assert.equal(requests.length, 6)
	} finally {
		global.fetch = realFetch
	}
})
