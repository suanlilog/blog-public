'use client'

import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import LogoUploadDialog, { type LogoItem } from './logo-upload-dialog'
import { normalizeShare, validateShare, type Share, type WebsiteType, type BloggerStatus } from '../types'
import { DialogModal } from '@/components/dialog-modal'
import EditableStarRating from '@/components/editable-star-rating'

interface CreateDialogProps {
	share: Share | null
	defaultType?: WebsiteType
	defaultStatus?: BloggerStatus
	onClose: () => void
	onSave: (share: Share, logoItem?: LogoItem) => boolean
}

export default function CreateDialog({ share, defaultType = 'tool', defaultStatus = 'recent', onClose, onSave }: CreateDialogProps) {
	const [formData, setFormData] = useState<Share>(() =>
		normalizeShare(
			share ?? {
				name: '',
				logo: '',
				url: '',
				description: '',
				tags: [],
				stars: 3,
				type: defaultType,
				status: defaultStatus
			}
		)
	)
	const [showLogoDialog, setShowLogoDialog] = useState(false)
	const [logoItem, setLogoItem] = useState<LogoItem | null>(null)
	const [tagsInput, setTagsInput] = useState(share?.tags.join(', ') ?? '')

	const handleLogoSubmit = (logo: LogoItem) => {
		setLogoItem(logo)
		setFormData(prev => ({ ...prev, logo: logo.type === 'url' ? logo.url : logo.previewUrl }))
	}

	const handleTagsChange = (value: string) => {
		setTagsInput(value)
		const tags = value
			.split(/[,，]/)
			.map(tag => tag.trim())
			.filter(Boolean)
		setFormData(prev => ({ ...prev, tags }))
	}

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		// 图片选择器通过 portal 渲染，它的表单事件仍可能冒泡到这里。
		if (event.target !== event.currentTarget) return
		event.preventDefault()
		const updatedShare = normalizeShare(formData)
		const error = validateShare(updatedShare)
		if (error) {
			toast.error(error)
			return
		}
		if (!onSave(updatedShare, logoItem || undefined)) return
		onClose()
		toast.success(share ? '已更新，请保存列表以发布' : '已添加，请保存列表以发布')
	}

	return (
		<DialogModal open onClose={onClose} closeOnEsc={!showLogoDialog} className='card max-h-[90vh] w-sm overflow-y-auto'>
			<h2 className='mb-4 text-lg font-semibold'>{share ? '编辑网站' : '添加网站'}</h2>
			<form onSubmit={handleSubmit} className='space-y-4'>
				<div className='flex items-center gap-4'>
					<button type='button' aria-label='选择网站图标' className='group relative shrink-0 cursor-pointer' onClick={() => setShowLogoDialog(true)}>
						{formData.logo ? (
							<img src={formData.logo} alt={formData.name} className='h-16 w-16 rounded-xl object-cover' />
						) : (
							<span className='flex h-16 w-16 items-center justify-center rounded-xl bg-gray-200'>
								<Plus className='h-6 w-6 text-gray-500' />
							</span>
						)}
						<span className='text-secondary mt-1 block text-xs'>选择图标</span>
					</button>
					<div className='min-w-0 flex-1 space-y-2'>
						<input
							aria-label='网站名称'
							value={formData.name}
							onChange={e => setFormData({ ...formData, name: e.target.value })}
							placeholder='网站名称'
							className='w-full text-lg font-bold focus:outline-none'
						/>
						<input
							aria-label='网站地址'
							type='url'
							value={formData.url}
							onChange={e => setFormData({ ...formData, url: e.target.value })}
							placeholder='https://example.com'
							className='text-secondary w-full text-xs focus:outline-none'
						/>
					</div>
				</div>
				<label className='block text-sm'>
					网站类型
					<select
						value={formData.type ?? 'tool'}
						onChange={e => setFormData({ ...formData, type: e.target.value as WebsiteType })}
						className='mt-1 block w-full rounded-md border px-3 py-2'>
						<option value='tool'>工具</option>
						<option value='blog'>博客</option>
					</select>
				</label>
				{formData.type === 'blog' ? (
					<label className='block text-sm'>
						更新状态
						<select
							value={formData.status ?? 'recent'}
							onChange={e => setFormData({ ...formData, status: e.target.value as BloggerStatus })}
							className='mt-1 block w-full rounded-md border px-3 py-2'>
							<option value='recent'>近期更新</option>
							<option value='disconnected'>长期失联</option>
						</select>
					</label>
				) : (
					<label className='block text-sm'>
						工具标签
						<input
							value={tagsInput}
							onChange={e => handleTagsChange(e.target.value)}
							placeholder='用逗号分隔，如：图片，AI'
							className='mt-1 block w-full rounded-md border px-3 py-2'
						/>
						<span className='mt-2 flex flex-wrap gap-1.5'>
							{[...new Set(formData.tags)].map(tag => (
								<span key={tag} className='bg-secondary/10 rounded-full px-2.5 py-0.5 text-xs'>
									{tag}
								</span>
							))}
						</span>
					</label>
				)}
				<EditableStarRating stars={formData.stars} editable onChange={stars => setFormData({ ...formData, stars })} />
				<label className='block text-sm'>
					网站介绍
					<textarea
						value={formData.description}
						onChange={e => setFormData({ ...formData, description: e.target.value })}
						rows={4}
						className='mt-1 block w-full resize-none rounded-md border px-3 py-2'
					/>
				</label>
				<div className='flex gap-3'>
					<button type='button' onClick={onClose} className='flex-1 rounded-lg border px-4 py-2 text-sm'>
						取消
					</button>
					<button type='submit' className='brand-btn flex-1 justify-center px-4'>
						{share ? '确认修改' : '添加'}
					</button>
				</div>
			</form>
			{showLogoDialog && <LogoUploadDialog currentLogo={formData.logo} onClose={() => setShowLogoDialog(false)} onSubmit={handleLogoSubmit} />}
		</DialogModal>
	)
}
