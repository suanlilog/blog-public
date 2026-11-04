export type WebsiteType = 'tool' | 'blog'
export type BloggerStatus = 'recent' | 'disconnected'

export interface Share {
	name: string
	logo: string
	url: string
	description: string
	tags: string[]
	stars: number
	// 兼容尚未填写类型的旧分享数据，默认视为工具。
	type?: WebsiteType
	status?: BloggerStatus
}

export interface LegacyBlogger {
	name: string
	avatar: string
	url: string
	description: string
	stars: number
	status?: BloggerStatus
}

export function mergeLegacyBloggers(shares: Share[], bloggers: LegacyBlogger[]): Share[] {
	const result = shares.map(normalizeShare)
	const urls = new Set(result.map(share => new URL(share.url).href))
	for (const blogger of bloggers) {
		const url = new URL(blogger.url).href
		if (urls.has(url)) continue
		const { avatar, ...fields } = blogger
		result.push(normalizeShare({ ...fields, logo: avatar, tags: [], type: 'blog' }))
		urls.add(url)
	}
	return result
}

export function normalizeShare(share: Share): Share {
	const type = share.type ?? 'tool'
	return {
		...share,
		name: share.name.trim(),
		logo: share.logo.trim(),
		url: share.url.trim(),
		description: share.description.trim(),
		tags: [...new Set(share.tags.map(tag => tag.trim()).filter(Boolean))],
		type,
		status: type === 'blog' ? (share.status ?? 'recent') : undefined
	}
}

export function validateShare(share: Share): string | null {
	if (!share.name || !share.logo || !share.url || !share.description) return '请填写名称、图标、网址和介绍'
	try {
		const url = new URL(share.url)
		if (!['http:', 'https:'].includes(url.protocol)) return '网站地址必须以 http:// 或 https:// 开头'
	} catch {
		return '请输入有效的网站地址'
	}
	if ((share.type ?? 'tool') === 'tool' && share.tags.length === 0) return '请至少为工具添加一个标签'
	return null
}
