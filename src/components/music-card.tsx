'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useConfigStore } from '../app/(home)/stores/config-store'
import { CARD_SPACING } from '@/consts'
import MusicSVG from '@/svgs/music.svg'
import PlaySVG from '@/svgs/play.svg'
import { HomeDraggableLayer } from '../app/(home)/home-draggable-layer'
import { Pause, Volume2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const MUSIC_FILE = '/music/starry-music.mp3'
const MUSIC_VOLUME = 0.16

export default function MusicCard() {
	const pathname = usePathname()
	const center = useCenterStore()
	const { cardStyles, siteContent } = useConfigStore()
	const styles = cardStyles.musicCard
	const hiCardStyles = cardStyles.hiCard
	const clockCardStyles = cardStyles.clockCard
	const calendarCardStyles = cardStyles.calendarCard
	const [isPlaying, setIsPlaying] = useState(false)
	const [progress, setProgress] = useState(0)
	const audioRef = useRef<HTMLAudioElement | null>(null)
	const startedFromInteraction = useRef(false)
	const isHomePage = pathname === '/'

	const { x, y } = useMemo(() => {
		if (!isHomePage) return { x: center.width - styles.width - 16, y: center.height - styles.height - 16 }
		return {
			x: styles.offsetX !== null ? center.x + styles.offsetX : center.x + CARD_SPACING + hiCardStyles.width / 2 - styles.offset,
			y: styles.offsetY !== null ? center.y + styles.offsetY : center.y - clockCardStyles.offset + CARD_SPACING + calendarCardStyles.height + CARD_SPACING
		}
	}, [isHomePage, center, styles, hiCardStyles, clockCardStyles, calendarCardStyles])

	const startPlayback = useCallback(() => {
		const audio = audioRef.current
		if (!audio) return Promise.resolve(false)
		return audio.play().then(() => {
			startedFromInteraction.current = true
			setIsPlaying(true)
			window.localStorage.setItem('music-autoplay-enabled', 'true')
			return true
		}).catch(() => false)
	}, [])

	useEffect(() => {
		const audio = new Audio(MUSIC_FILE)
		audio.autoplay = true
		audio.loop = true
		audio.volume = MUSIC_VOLUME
		audio.preload = 'auto'
		audioRef.current = audio
		const updateProgress = () => { if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100) }
		const retryAutoplay = () => { if (!startedFromInteraction.current) void startPlayback() }
		audio.addEventListener('timeupdate', updateProgress)
		audio.addEventListener('loadedmetadata', updateProgress)
		audio.addEventListener('canplay', retryAutoplay)
		void startPlayback()
		const startOnInteraction = () => {
			if (!startedFromInteraction.current) void startPlayback()
		}
		window.addEventListener('pointerdown', startOnInteraction)
		window.addEventListener('keydown', startOnInteraction)
		return () => {
			window.removeEventListener('pointerdown', startOnInteraction)
			window.removeEventListener('keydown', startOnInteraction)
			audio.pause()
			audio.src = ''
			audio.removeEventListener('timeupdate', updateProgress)
			audio.removeEventListener('loadedmetadata', updateProgress)
			audio.removeEventListener('canplay', retryAutoplay)
			audioRef.current = null
		}
	}, [startPlayback])

	useEffect(() => {
		if (isPlaying) void startPlayback()
		else audioRef.current?.pause()
	}, [isPlaying])

	if (!isHomePage && !isPlaying) return null

	return (
		<HomeDraggableLayer cardKey='musicCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className={clsx('flex items-center gap-3', !isHomePage && 'fixed')}>
				{siteContent.enableChristmas && <>
					<img src='/images/christmas/snow-10.webp' alt='Christmas decoration' className='pointer-events-none absolute' style={{ width: 120, left: -8, top: -12, opacity: 0.8 }} />
					<img src='/images/christmas/snow-11.webp' alt='Christmas decoration' className='pointer-events-none absolute' style={{ width: 80, right: -10, top: -12, opacity: 0.8 }} />
				</>}
				<MusicSVG className='h-8 w-8' />
				<div className='flex-1'>
					<div className='text-secondary flex items-center gap-1 text-sm'><Volume2 className='h-3.5 w-3.5' /> 星空の中でオルゴール</div>
					<div className='mt-1 h-2 rounded-full bg-white/60'><div className='bg-linear h-full rounded-full transition-all duration-300' style={{ width: `${progress}%` }} /></div>
				</div>
				<button onClick={() => setIsPlaying(current => !current)} aria-label={isPlaying ? '关闭音乐' : '播放音乐'} title={isPlaying ? '关闭音乐' : '播放音乐'} className='flex h-10 w-10 items-center justify-center rounded-full bg-white transition-opacity hover:opacity-80'>
					{isPlaying ? <Pause className='text-brand h-4 w-4' /> : <PlaySVG className='text-brand ml-1 h-4 w-4' />}
				</button>
			</Card>
		</HomeDraggableLayer>
	)
}
