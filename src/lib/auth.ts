import { createInstallationToken, getInstallationId, signAppJwt } from './github-client'
import { CONTENT_GITHUB_CONFIG, GITHUB_CONFIG, type GitHubConfig } from '@/consts'
import { useAuthStore } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { decrypt,encrypt } from './aes256-util'

const GITHUB_TOKEN_CACHE_KEY = 'github_token'
const GITHUB_PEM_CACHE_KEY = 'p_info'

function tokenCacheKey(config: GitHubConfig): string {
	return `${GITHUB_TOKEN_CACHE_KEY}:${config.OWNER}/${config.REPO}`
}

function getTokenFromCache(config: GitHubConfig = GITHUB_CONFIG): string | null {
	if (typeof sessionStorage === 'undefined') return null
	try {
		return sessionStorage.getItem(tokenCacheKey(config))
	} catch {
		return null
	}
}

function saveTokenToCache(token: string, config: GitHubConfig = GITHUB_CONFIG): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.setItem(tokenCacheKey(config), token)
	} catch (error) {
		console.error('Failed to save token to cache:', error)
	}
}

function clearTokenCache(config: GitHubConfig = GITHUB_CONFIG): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.removeItem(tokenCacheKey(config))
	} catch (error) {
		console.error('Failed to clear token cache:', error)
	}
}

export async function getPemFromCache(): Promise<string | null> {
	if (typeof sessionStorage === 'undefined') return null
	try {
		// 解密缓存中的 pem
		const encryptedPem = sessionStorage.getItem(GITHUB_PEM_CACHE_KEY)
		if (!encryptedPem) return null
		return await decrypt(encryptedPem, GITHUB_CONFIG.ENCRYPT_KEY)
	} catch {
		return null
	}
}

export async function savePemToCache(pem: string): Promise<void> {
	if (typeof sessionStorage === 'undefined') return
	try {
		// 加密 pem 后存储
		const encryptedPem = await encrypt(pem, GITHUB_CONFIG.ENCRYPT_KEY)
		sessionStorage.setItem(GITHUB_PEM_CACHE_KEY, encryptedPem)
	} catch (error) {
		console.error('Failed to save pem to cache:', error)
	}
}

function clearPemCache(): void {
	if (typeof sessionStorage === 'undefined') return
	try {
		sessionStorage.removeItem(GITHUB_PEM_CACHE_KEY)
	} catch (error) {
		console.error('Failed to clear pem cache:', error)
	}
}

export function clearAllAuthCache(): void {
	clearTokenCache(GITHUB_CONFIG)
	clearTokenCache(CONTENT_GITHUB_CONFIG)
	clearPemCache()
}

export async function hasAuth(): Promise<boolean> {
	return !!getTokenFromCache(GITHUB_CONFIG) || !!getTokenFromCache(CONTENT_GITHUB_CONFIG) || !!(await getPemFromCache())
}

/**
 * 统一的认证 Token 获取
 * 自动处理缓存、签发等逻辑
 * @returns GitHub Installation Token
 */
export async function getAuthToken(config: GitHubConfig = GITHUB_CONFIG): Promise<string> {
	// 1. 先尝试从缓存获取 token
	const cachedToken = getTokenFromCache(config)
	if (cachedToken) {
		toast.info('使用缓存的令牌...')
		return cachedToken
	}

	// 2. 获取私钥（从缓存）
	const privateKey = useAuthStore.getState().privateKey
	if (!privateKey) {
		throw new Error('需要先设置私钥。请使用 useAuth().setPrivateKey()')
	}

	toast.info('正在签发 JWT...')
	const jwt = signAppJwt(config.APP_ID, privateKey)

	toast.info('正在获取安装信息...')
	const installationId = await getInstallationId(jwt, config.OWNER, config.REPO)

	toast.info('正在创建安装令牌...')
	const token = await createInstallationToken(jwt, installationId)

	saveTokenToCache(token, config)

	return token
}
