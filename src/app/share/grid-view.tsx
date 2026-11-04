'use client'

import { useState } from 'react'

import { ShareCard } from './components/share-card'
import type { Share, WebsiteType, BloggerStatus } from './types'

interface GridViewProps {
	shares: Share[]
	selectedType: WebsiteType
	selectedStatus: BloggerStatus
	onTypeChange: (type: WebsiteType) => void
	onStatusChange: (status: BloggerStatus) => void
	isEditMode?: boolean
	onEdit?: (share: Share) => void
	onDelete?: (share: Share) => void
}

export default function GridView({ shares, selectedType, selectedStatus, onTypeChange, onStatusChange, isEditMode = false, onEdit, onDelete }: GridViewProps) {
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedTag, setSelectedTag] = useState<string>('all')

	const allTags = Array.from(new Set(shares.filter(share => (share.type ?? 'tool') === 'tool').flatMap(share => share.tags)))

	const filteredShares = shares.filter(share => {
		const matchesSearch = share.name.toLowerCase().includes(searchTerm.toLowerCase()) || share.description.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesTag = selectedType === 'blog' || selectedTag === 'all' || share.tags.includes(selectedTag)
		const matchesType = (share.type ?? 'tool') === selectedType
		const matchesStatus = selectedType === 'tool' || (share.status ?? 'recent') === selectedStatus
		return matchesSearch && matchesTag && matchesType && matchesStatus
	})

	return (
		<div className='mx-auto w-full max-w-7xl px-6 pt-24 pb-12'>
			<div className='mb-8 space-y-4'>
				<div className='flex justify-center gap-3'>
					<button
						onClick={() => onTypeChange('tool')}
						aria-pressed={selectedType === 'tool'}
						className={selectedType === 'tool' ? 'bg-brand rounded-full px-4 py-2 text-white' : 'rounded-full bg-gray-200 px-4 py-2 text-gray-700'}>
						工具
					</button>

					<button
						onClick={() => onTypeChange('blog')}
						aria-pressed={selectedType === 'blog'}
						className={selectedType === 'blog' ? 'bg-brand rounded-full px-4 py-2 text-white' : 'rounded-full bg-gray-200 px-4 py-2 text-gray-700'}>
						博客
					</button>
				</div>

				<input
					type='search'
					aria-label='搜索网站'
					placeholder='搜索网站...'
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					className='focus:ring-brand mx-auto block w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:outline-none'
				/>

				{selectedType === 'tool' && (
					<div className='flex flex-wrap justify-center gap-2'>
						<button
							onClick={() => setSelectedTag('all')}
							aria-pressed={selectedTag === 'all'}
							className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
								selectedTag === 'all' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}>
							全部
						</button>
						{allTags.map(tag => (
							<button
								key={tag}
								onClick={() => setSelectedTag(tag)}
								aria-pressed={selectedTag === tag}
								className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
									selectedTag === tag ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
								}`}>
								{tag}
							</button>
						))}
					</div>
				)}

				{selectedType === 'blog' && (
					<div className='flex flex-wrap justify-center gap-2'>
						<button
							onClick={() => onStatusChange('recent')}
							aria-pressed={selectedStatus === 'recent'}
							className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
								selectedStatus === 'recent' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}>
							近期更新
						</button>
						<button
							onClick={() => onStatusChange('disconnected')}
							aria-pressed={selectedStatus === 'disconnected'}
							className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
								selectedStatus === 'disconnected' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
							}`}>
							长期失联
						</button>
					</div>
				)}
			</div>

			<div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
				{filteredShares.map(share => (
					<ShareCard key={share.url} share={share} isEditMode={isEditMode} onEdit={() => onEdit?.(share)} onDelete={() => onDelete?.(share)} />
				))}
			</div>

			{filteredShares.length === 0 && (
				<div className='mt-12 text-center text-gray-500'>
					<p>没有找到相关资源</p>
				</div>
			)}
		</div>
	)
}
