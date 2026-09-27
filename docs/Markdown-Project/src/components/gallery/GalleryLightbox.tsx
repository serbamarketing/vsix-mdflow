import { useState, useCallback, useMemo, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import type { GalleryItem } from '@/models/gallery'
import { resolveMediaSrcCandidates } from '@/models/gallery'
import { useAppStore } from '@/hooks/useAppStore'
import { useLocalMedia } from '@/hooks/useLocalMedia'
import { translations } from '@/data/translations'

interface GalleryLightboxProps {
  items: GalleryItem[]
  initialIndex: number
  onClose: () => void
}

function getFilename(src: string): string {
  try {
    const parts = src.replace(/\\/g, '/').split('/')
    return parts.at(-1)?.split('?')[0] ?? src
  } catch {
    return src
  }
}

function isYoutubeUrl(src: string): boolean {
  return src.includes('youtube.com/watch') || src.includes('youtu.be/')
}

function getYoutubeEmbedUrl(src: string): string {
  try {
    if (src.includes('youtu.be/')) {
      const id = src.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${id}?autoplay=1`
    }
    const url = new URL(src)
    const id = url.searchParams.get('v')
    return `https://www.youtube.com/embed/${id}?autoplay=1`
  } catch {
    return src
  }
}

function LightboxMedia({ current }: { current: GalleryItem }) {
  const isVideo = current.type === 'video'
  const isYt = isVideo && isYoutubeUrl(current.src)
  const filename = getFilename(current.src)

  const candidates = useMemo(() => resolveMediaSrcCandidates(current.src), [current.src])
  const [candidateIndex, setCandidateIndex] = useState(0)

  const localMediaSrc = useLocalMedia(current.src)

  useEffect(() => {
    setCandidateIndex(0)
  }, [current.src])

  const currentSrc = localMediaSrc || candidates[candidateIndex] || current.src

  function handleError() {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((i) => i + 1)
    }
  }

  if (isYt) {
    return (
      <iframe
        src={getYoutubeEmbedUrl(current.src)}
        className="rounded-2xl shadow-2xl"
        style={{ width: 'min(900px, 85vw)', height: 'min(500px, 60vh)', border: 'none' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }

  if (isVideo) {
    return (
      <video
        src={currentSrc}
        controls
        autoPlay
        className="rounded-2xl shadow-2xl max-h-[75vh] max-w-[85vw]"
        style={{ objectFit: 'contain' }}
        onError={handleError}
      />
    )
  }

  return (
    <img
      src={currentSrc}
      alt={current.caption ?? filename}
      className="rounded-2xl shadow-2xl"
      style={{
        maxHeight: '75vh',
        maxWidth: '85vw',
        objectFit: 'contain',
      }}
      onError={handleError}
    />
  )
}

export function GalleryLightbox({ items, initialIndex, onClose }: GalleryLightboxProps) {
  const { state } = useAppStore()
  const t = translations[state.language].gallery
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const current = items[currentIndex]

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, items.length - 1))
  }, [items.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') onClose()
    },
    [goNext, goPrev, onClose]
  )

  if (!current) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center font-display select-none"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-label="Gallery Lightbox"
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 p-2 rounded-full transition-colors z-10 cursor-pointer hover:bg-white/10"
        style={{ color: 'var(--color-text-dim)' }}
        onClick={onClose}
        title={t.closeLightbox}
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
      >
        {currentIndex + 1} {t.lightboxCounter} {items.length}
      </div>

      {/* Prev button */}
      {currentIndex > 0 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all z-10 hover:scale-110 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          title={t.prevMedia}
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Next button */}
      {currentIndex < items.length - 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all z-10 hover:scale-110 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
          onClick={(e) => { e.stopPropagation(); goNext() }}
          title={t.nextMedia}
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Media content */}
      <div
        className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <LightboxMedia current={current} />
      </div>

      {/* Bottom info bar */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Caption or filename */}
        <div className="flex flex-col">
          {current.caption && (
            <span className="text-xs font-semibold text-white">{current.caption}</span>
          )}
          <span
            className="text-[10px] font-mono max-w-[300px] truncate"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {current.src}
          </span>
        </div>

        {/* Actions */}
        <a
          href={current.src}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-xl transition-colors hover:bg-white/10"
          title={t.openNewTab}
        >
          <ExternalLink size={14} className="text-white/60" />
        </a>
      </div>
    </div>
  )
}
