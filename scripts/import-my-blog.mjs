import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const source = path.resolve(process.env.MY_BLOG_POSTS || 'D:/my-blog/posts')
const destination = path.join(root, 'content-seed')

function parsePost(raw, filename) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
	if (!match) return { slug: path.basename(filename, '.md'), markdown: raw }

	const fields = {}
	let listKey = ''
	for (const line of match[1].split(/\r?\n/)) {
		const listItem = line.match(/^\s+-\s*(.*)$/)
		if (listItem && listKey) {
			fields[listKey].push(listItem[1].replace(/^['"]|['"]$/g, ''))
			continue
		}
		const field = line.match(/^([\w-]+):\s*(.*)$/)
		if (!field) continue
		const [, key, value] = field
		listKey = ''
		if (!value && key === 'tags') {
			fields[key] = []
			listKey = key
		} else if (value.startsWith('[') && value.endsWith(']')) {
			fields[key] = value.slice(1, -1).split(',').map(item => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
		} else {
			fields[key] = value.replace(/^['"]|['"]$/g, '')
		}
	}

	return { ...fields, slug: fields.slug || path.basename(filename, '.md'), markdown: match[2] }
}

await mkdir(destination, { recursive: true })
const files = (await readdir(source)).filter(file => file.endsWith('.md'))
const index = []

for (const filename of files) {
	const post = parsePost(await readFile(path.join(source, filename), 'utf8'), filename)
	const date = post.published || post.date || new Date().toISOString().slice(0, 10)
	const config = {
		title: post.title || post.slug,
		tags: Array.isArray(post.tags) ? post.tags : [],
		date,
		summary: post.summary || '',
		hidden: false,
		category: post.category || ''
	}
	const folder = path.join(destination, 'public', 'blogs', post.slug)
	await mkdir(folder, { recursive: true })
	await writeFile(path.join(folder, 'index.md'), post.markdown, 'utf8')
	await writeFile(path.join(folder, 'config.json'), `${JSON.stringify(config, null, 2)}\n`, 'utf8')
	index.push({ slug: post.slug, ...config })
}

index.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
await mkdir(path.join(destination, 'public', 'blogs'), { recursive: true })
await writeFile(path.join(destination, 'public', 'blogs', 'index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8')
await writeFile(path.join(destination, 'public', 'blogs', 'categories.json'), `${JSON.stringify({ categories: [...new Set(index.map(post => post.category).filter(Boolean))] }, null, 2)}\n`, 'utf8')
for (const section of ['pictures', 'projects', 'bloggers', 'share', 'snippets']) {
	const sectionDir = path.join(destination, 'src', 'app', section)
	await mkdir(sectionDir, { recursive: true })
	await writeFile(path.join(sectionDir, 'list.json'), '[]\n', 'utf8')
}
const aboutDir = path.join(destination, 'src', 'app', 'about')
await mkdir(aboutDir, { recursive: true })
await writeFile(path.join(aboutDir, 'list.json'), `${JSON.stringify({
	title: '关于算栗工坊',
	description: '每个知识点，都值得举个栗子。',
	content: '这个站点记录工具、代码、学习和生活里值得慢慢剥开的知识点。\n\n欢迎通过 [GitHub](https://github.com/suanlilog)、[知乎](https://www.zhihu.com/people/suanligongfang) 或 [小红书](https://www.xiaohongshu.com/user/profile/69a24d6d0000000021008a0b) 交流。\n\n邮箱：lzihan1226@163.com'
}, null, 2)}\n`, 'utf8')

console.log(`[blog-import] Imported ${index.length} posts into ${path.relative(root, destination)}.`)
