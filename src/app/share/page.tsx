'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import GridView from './grid-view'
import CreateDialog from './components/create-dialog'
import { pushShares } from './services/push-shares'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import initialList from './list.json'
import legacyBloggers from '@/app/bloggers/list.json'
import { mergeLegacyBloggers, type Share, type LegacyBlogger, type WebsiteType, type BloggerStatus } from './types'
import type { LogoItem } from './components/logo-upload-dialog'

const initialShares = mergeLegacyBloggers(initialList as Share[], legacyBloggers as LegacyBlogger[])

export default function Page() {
	return (
		<Suspense fallback={<div className='px-6 pt-24 text-center'>加载网站分享...</div>}>
			<SharePage />
		</Suspense>
	)
}

function SharePage() {
	const searchParams = useSearchParams()
	const requestedType = searchParams.get('type') === 'blog' ? 'blog' : 'tool'
	const requestedStatus = searchParams.get('status') === 'disconnected' ? 'disconnected' : 'recent'
	const [shares, setShares] = useState<Share[]>(initialShares)
	const [originalShares, setOriginalShares] = useState<Share[]>(initialShares)
	const [selectedType, setSelectedType] = useState<WebsiteType>(requestedType)
	const [selectedStatus, setSelectedStatus] = useState<BloggerStatus>(requestedStatus)
	const [filterVersion, setFilterVersion] = useState(0)
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [editingShare, setEditingShare] = useState<Share | null>(null)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [logoItems, setLogoItems] = useState<Map<string, LogoItem>>(new Map())
	const keyInputRef = useRef<HTMLInputElement>(null)

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	useEffect(() => {
		setSelectedType(requestedType)
		setSelectedStatus(requestedStatus)
		setFilterVersion(prev => prev + 1)
	}, [requestedType, requestedStatus])

	const handleEdit = (share: Share) => {
		setEditingShare(share)
		setIsCreateDialogOpen(true)
	}

	const handleAdd = () => {
		setEditingShare(null)
		setIsCreateDialogOpen(true)
	}

	const handleSaveShare = (updatedShare: Share, logoItem?: LogoItem) => {
		const duplicate = shares.some(s => s.url !== editingShare?.url && new URL(s.url).href === new URL(updatedShare.url).href)
		if (duplicate) {
			toast.error('这个网址已经在列表中')
			return false
		}
		setShares(prev => (editingShare ? prev.map(s => (s.url === editingShare.url ? updatedShare : s)) : [...prev, updatedShare]))
		setLogoItems(prev => {
			const newMap = new Map(prev)
			const pendingLogo = logoItem ?? (editingShare ? prev.get(editingShare.url) : undefined)
			if (editingShare) newMap.delete(editingShare.url)
			if (pendingLogo && updatedShare.logo.startsWith('blob:')) newMap.set(updatedShare.url, pendingLogo)
			return newMap
		})
		// 确认后切换到条目所在分类，清除旧搜索和标签，避免新条目被筛掉。
		setSelectedType(updatedShare.type ?? 'tool')
		setSelectedStatus(updatedShare.status ?? 'recent')
		setFilterVersion(prev => prev + 1)
		return true
	}

	const handleDelete = (share: Share) => {
		if (confirm(`确定要删除 ${share.name} 吗？`)) {
			setShares(shares.filter(s => s.url !== share.url))
			setLogoItems(prev => {
				const newMap = new Map(prev)
				newMap.delete(share.url)
				return newMap
			})
		}
	}

	const handleChoosePrivateKey = async (file: File) => {
		try {
			const text = await file.text()
			setPrivateKey(text)
			// 选择文件后自动保存
			await handleSave()
		} catch (error) {
			console.error('Failed to read private key:', error)
			toast.error('读取密钥文件失败')
		}
	}

	const handleSaveClick = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			handleSave()
		}
	}

	const handleSave = async () => {
		setIsSaving(true)

		try {
			const updatedShares = await pushShares({
				shares,
				logoItems
			})

			setShares(updatedShares)
			setOriginalShares(updatedShares)
			setLogoItems(new Map())
			setIsEditMode(false)
			toast.success('保存成功！')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setShares(originalShares)
		setLogoItems(new Map())
		setIsEditMode(false)
		setIsCreateDialogOpen(false)
		setEditingShare(null)
	}

	const buttonText = isAuth ? '保存' : '导入密钥'

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				setIsEditMode(true)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isEditMode])

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const input = e.currentTarget
					const f = input.files?.[0]
					if (f) await handleChoosePrivateKey(f)
					input.value = ''
				}}
			/>

			<GridView
				key={filterVersion}
				shares={shares}
				selectedType={selectedType}
				selectedStatus={selectedStatus}
				onTypeChange={setSelectedType}
				onStatusChange={setSelectedStatus}
				isEditMode={isEditMode && !isSaving}
				onEdit={handleEdit}
				onDelete={handleDelete}
			/>

			<motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='absolute top-4 right-6 flex gap-3 max-sm:hidden'>
				{isEditMode ? (
					<>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleCancel}
							disabled={isSaving}
							className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							取消
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleAdd}
							disabled={isSaving}
							className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							添加
						</motion.button>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>
							{isSaving ? '保存中...' : buttonText}
						</motion.button>
					</>
				) : (
					!hideEditButton && (
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setIsEditMode(true)}
							className='bg-card rounded-xl border px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80'>
							编辑
						</motion.button>
					)
				)}
			</motion.div>

			{isCreateDialogOpen && (
				<CreateDialog
					share={editingShare}
					defaultType={selectedType}
					defaultStatus={selectedStatus}
					onClose={() => setIsCreateDialogOpen(false)}
					onSave={handleSaveShare}
				/>
			)}
		</>
	)
}
