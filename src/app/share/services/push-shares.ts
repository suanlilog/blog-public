import { toBase64Utf8, getRef, getCommitTree, createTree, createCommit, updateRef, createBlob, type TreeItem } from '@/lib/github-client'
import { fileToBase64NoPrefix, hashFileSHA256 } from '@/lib/file-utils'
import { getAuthToken } from '@/lib/auth'
import { CONTENT_GITHUB_CONFIG as GITHUB_CONFIG } from '@/consts'
import { normalizeShare, validateShare, type Share } from '../types'
import type { LogoItem } from '../components/logo-upload-dialog'
import { getFileExt } from '@/lib/utils'
import { toast } from 'sonner'

export type PushSharesParams = {
	shares: Share[]
	logoItems?: Map<string, LogoItem>
}

export async function pushShares(params: PushSharesParams): Promise<Share[]> {
	const { logoItems } = params
	const shares = params.shares.map(normalizeShare)
	const urls = new Set<string>()
	for (const share of shares) {
		const error = validateShare(share)
		if (error) throw new Error(`${share.name || '未命名网站'}：${error}`)
		const url = new URL(share.url).href
		if (urls.has(url)) throw new Error(`网站地址重复：${share.url}`)
		urls.add(url)
	}

	const blobShares = shares.filter(s => s.logo.startsWith('blob:'))
	if (blobShares.length > 0) {
		const missing = blobShares.filter(s => !logoItems?.has(s.url))
		if (missing.length > 0) {
			throw new Error(`图标未上传完成：${missing.map(s => s.name).join('、')}`)
		}
	}

	// 获取认证 token（自动从全局认证状态获取）
	const token = await getAuthToken(GITHUB_CONFIG)

	toast.info('正在获取分支信息...')
	const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
	const latestCommitSha = refData.sha
	const baseTree = await getCommitTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, latestCommitSha)

	const commitMessage = `更新分享列表`

	toast.info('正在准备文件...')

	const treeItems: TreeItem[] = []
	const uploadedHashes = new Set<string>()
	let updatedShares = [...shares]

	// Process logo uploads
	if (logoItems && logoItems.size > 0) {
		toast.info('正在上传图标...')
		for (const [url, logoItem] of logoItems.entries()) {
			if (logoItem.type === 'file') {
				const hash = logoItem.hash || (await hashFileSHA256(logoItem.file))
				const ext = getFileExt(logoItem.file.name)
				const filename = `${hash}${ext}`
				const publicPath = `/images/share/${filename}`

				if (!uploadedHashes.has(hash)) {
					const path = `public/images/share/${filename}`
					const contentBase64 = await fileToBase64NoPrefix(logoItem.file)
					const blobData = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, contentBase64, 'base64')
					treeItems.push({
						path,
						mode: '100644',
						type: 'blob',
						sha: blobData.sha
					})
					uploadedHashes.add(hash)
				}

				// Update share logo URL
				updatedShares = updatedShares.map(s => (s.url === url ? { ...s, logo: publicPath } : s))
			}
		}
	}

	// Create blob for shares list.json
	const sharesJson = JSON.stringify(updatedShares, null, '\t')
	const sharesBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(sharesJson), 'base64')
	treeItems.push({
		path: 'src/app/share/list.json',
		mode: '100644',
		type: 'blob',
		sha: sharesBlob.sha
	})

	// Create tree
	toast.info('正在创建文件树...')
	// 与统一列表在同一个提交中清空旧列表，避免下次加载重新合并已删除的博主。
	treeItems.push({ path: 'src/app/bloggers/list.json', mode: '100644', type: 'blob', content: '[]\n' })
	const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, baseTree.sha)

	// Create commit
	toast.info('正在创建提交...')
	const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, commitMessage, treeData.sha, [latestCommitSha])

	// Update branch reference
	toast.info('正在更新分支...')
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)

	toast.success('发布成功！')

	return updatedShares
}
