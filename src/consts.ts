export const INIT_DELAY = 0.3
export const ANIMATION_DELAY = 0.1
export const CARD_SPACING = 36
export const CARD_SPACING_SM = 24
export const BLOG_SLUG_KEY = process.env.BLOG_SLUG_KEY || ''

export type GitHubConfig = {
	OWNER: string
	REPO: string
	BRANCH: string
	APP_ID: string
	ENCRYPT_KEY: string
}

/** Repository that contains the site code and fixed visual configuration. */
export const GITHUB_CONFIG: GitHubConfig = {
	OWNER: process.env.NEXT_PUBLIC_GITHUB_OWNER || 'suanlilog',
	REPO: process.env.NEXT_PUBLIC_GITHUB_REPO || 'blog-public',
	BRANCH: process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main',
	APP_ID: process.env.NEXT_PUBLIC_GITHUB_APP_ID || '-',
	ENCRYPT_KEY: process.env.NEXT_PUBLIC_GITHUB_ENCRYPT_KEY || 'wudishiduomejimo'
}

/** Repository that contains articles and all frequently changing personal content. */
export const CONTENT_GITHUB_CONFIG: GitHubConfig = {
	OWNER: process.env.NEXT_PUBLIC_CONTENT_GITHUB_OWNER || process.env.NEXT_PUBLIC_GITHUB_OWNER || 'suanlilog',
	REPO: process.env.NEXT_PUBLIC_CONTENT_GITHUB_REPO || 'blog-content',
	BRANCH: process.env.NEXT_PUBLIC_CONTENT_GITHUB_BRANCH || 'main',
	APP_ID: process.env.NEXT_PUBLIC_CONTENT_GITHUB_APP_ID || process.env.NEXT_PUBLIC_GITHUB_APP_ID || '-',
	ENCRYPT_KEY: process.env.NEXT_PUBLIC_CONTENT_GITHUB_ENCRYPT_KEY || process.env.NEXT_PUBLIC_GITHUB_ENCRYPT_KEY || 'wudishiduomejimo'
}
