'use client'

import { motion } from 'motion/react'
import { useState } from 'react'
import StarRating from '@/components/star-rating'
import { useSize } from '@/hooks/use-size'
import { cn } from '@/lib/utils'
import type { Share } from '../types'

export type { Share } from '../types'

interface ShareCardProps {
	share: Share
	isEditMode?: boolean
	onEdit?: () => void
	onDelete?: () => void
}

export function ShareCard({ share, isEditMode = false, onEdit, onDelete }: ShareCardProps) {
	const [expanded, setExpanded] = useState(false)
	const { maxSM } = useSize()
	const isBlog = share.type === 'blog'

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.6 }}
			{...(maxSM ? { animate: { opacity: 1, scale: 1 } } : { whileInView: { opacity: 1, scale: 1 } })}
			className='card relative block overflow-hidden'>
			{isEditMode && (
				<div className='mb-3 flex justify-end gap-2'>
					<button onClick={onEdit} className='rounded-lg px-2 py-1.5 text-xs text-blue-400 hover:text-blue-600'>
						编辑
					</button>
					<button onClick={onDelete} className='rounded-lg px-2 py-1.5 text-xs text-red-400 hover:text-red-600'>
						删除
					</button>
				</div>
			)}
			<div className='mb-4 flex items-center gap-4'>
				<img src={share.logo} alt={share.name} className={cn('h-16 w-16 object-cover', isBlog ? 'rounded-full' : 'rounded-xl')} />
				<div className='min-w-0 flex-1'>
					<h3 className='text-lg font-bold'>{share.name}</h3>
					<a href={share.url} target='_blank' rel='noopener noreferrer' className='text-secondary hover:text-brand mt-1 block truncate text-xs hover:underline'>
						{share.url}
					</a>
				</div>
			</div>
			<StarRating stars={share.stars} />
			<div className='mt-3 flex flex-wrap gap-1.5'>
				{isBlog ? (
					<span className='bg-secondary/10 rounded-full px-2.5 py-0.5 text-xs'>{(share.status ?? 'recent') === 'recent' ? '近期更新' : '长期失联'}</span>
				) : (
					share.tags.map(tag => (
						<span key={tag} className='bg-secondary/10 rounded-full px-2.5 py-0.5 text-xs'>
							{tag}
						</span>
					))
				)}
			</div>
			<p
				onClick={() => setExpanded(!expanded)}
				className={cn('mt-3 cursor-pointer text-sm leading-relaxed text-gray-600', expanded ? 'line-clamp-none' : 'line-clamp-3')}>
				{share.description}
			</p>
		</motion.div>
	)
}
