import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const owner = process.env.CONTENT_GITHUB_OWNER || process.env.NEXT_PUBLIC_CONTENT_GITHUB_OWNER || 'suanlilog'
const repo = process.env.CONTENT_GITHUB_REPO || process.env.NEXT_PUBLIC_CONTENT_GITHUB_REPO || 'blog-content'
const branch = process.env.CONTENT_GITHUB_BRANCH || process.env.NEXT_PUBLIC_CONTENT_GITHUB_BRANCH || 'main'
const api = `https://api.github.com/repos/${owner}/${repo}`
const raw = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`
const allowlisted = file =>
	file.startsWith('public/blogs/') ||
	['public/images/pictures/', 'public/images/project/', 'public/images/share/', 'public/images/blogger/'].some(prefix => file.startsWith(prefix)) ||
	/^src\/app\/(about|pictures|projects|bloggers|share|snippets)\/list\.json$/.test(file)

async function get(url) {
	const response = await fetch(url, { headers: { 'User-Agent': 'suanlilog-blog-content-sync' } })
	if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
	return response
}

const treeResponse = await fetch(`${api}/git/trees/${encodeURIComponent(branch)}?recursive=1`, {
	headers: { 'User-Agent': 'suanlilog-blog-content-sync', Accept: 'application/vnd.github+json' }
})

if (treeResponse.status === 404) {
	console.warn(`[content-sync] ${owner}/${repo}@${branch} is not available yet; building with empty content.`)
	process.exit(0)
}
if (!treeResponse.ok) throw new Error(`Content repository lookup failed: ${treeResponse.status} ${treeResponse.statusText}`)

const treeData = await treeResponse.json()
if (treeData.truncated) throw new Error('Content repository is too large for a single tree response.')
const files = treeData.tree.filter(entry => entry.type === 'blob' && allowlisted(entry.path))

const syncRoots = ['public/blogs', 'public/images/pictures', 'public/images/project', 'public/images/share', 'public/images/blogger']
for (const root of syncRoots) {
	await rm(root, { recursive: true, force: true })
	await mkdir(root, { recursive: true })
}

for (const file of files) {
	const destination = path.resolve(file.path)
	if (!destination.startsWith(`${process.cwd()}${path.sep}`)) throw new Error(`Invalid content path: ${file.path}`)
	await mkdir(path.dirname(destination), { recursive: true })
	const response = await get(`${raw}/${file.path.split('/').map(encodeURIComponent).join('/')}`)
	await writeFile(destination, Buffer.from(await response.arrayBuffer()))
}

console.log(`[content-sync] Synced ${files.length} files from ${owner}/${repo}@${branch}.`)
