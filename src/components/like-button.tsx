'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Heart } from 'lucide-react'
import clsx from 'clsx'

type LikeButtonProps = { slug?: string; className?: string; delay?: number }

export default function LikeButton({ slug = 'suanlilog', delay, className }: LikeButtonProps) {
	const storageKey = `blog-liked:${slug}`
	const [liked, setLiked] = useState(false)
	const [show, setShow] = useState(false)
	const [justLiked, setJustLiked] = useState(false)
	const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])

	useEffect(() => {
		const timer = window.setTimeout(() => setShow(true), delay || 1000)
		setLiked(window.localStorage.getItem(storageKey) === 'true')
		return () => window.clearTimeout(timer)
	}, [delay, storageKey])

	const handleLike = () => {
		const nextLiked = !liked
		setLiked(nextLiked)
		window.localStorage.setItem(storageKey, String(nextLiked))
		if (!nextLiked) return
		setJustLiked(true)
		window.setTimeout(() => setJustLiked(false), 600)
		setParticles(Array.from({ length: 6 }, (_, i) => ({ id: Date.now() + i, x: Math.random() * 60 - 30, y: Math.random() * 60 - 30 })))
		window.setTimeout(() => setParticles([]), 1000)
	}

	if (!show) return null
	return (
		<motion.button initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} aria-label={liked ? '取消喜欢' : '喜欢'} title={liked ? '取消喜欢' : '喜欢'} onClick={handleLike} className={clsx('card heartbeat-container relative overflow-visible rounded-full p-3', className)}>
			<AnimatePresence>
				{particles.map(particle => <motion.div key={particle.id} className='pointer-events-none absolute inset-0 flex items-center justify-center' initial={{ opacity: 1, scale: 0, x: 0, y: 0 }} animate={{ opacity: [1, 1, 0], scale: [0, 1.2, 0.8], x: particle.x, y: particle.y }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}><Heart className='fill-rose-400 text-rose-400' size={12} /></motion.div>)}
			</AnimatePresence>
			<motion.div animate={justLiked ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] } : {}} transition={{ duration: 0.6, ease: 'easeOut' }}><Heart className={clsx('heartbeat', liked ? 'fill-rose-400 text-rose-400' : 'fill-rose-200 text-rose-200')} size={28} /></motion.div>
		</motion.button>
	)
}
