import { useState, useMemo, useEffect, useRef } from 'react'
import { Play, Trash2, Image as ImageIcon, Video, AlertCircle, Check, Edit3, X, Save, RefreshCw, Folder, ChevronDown } from 'lucide-react'
import type { GalleryItem } from '@/models/gallery'
import { resolveMediaSrcCandidates, flattenFolders, findItemWithFolderPath } from '@/models/gallery'
import { useAppStore } from '@/hooks/useAppStore'
import { useLocalMedia } from '@/hooks/useLocalMedia'
import { GalleryLightbox } from './GalleryLightbox'
import { translations } from '@/data/translations'

interface GalleryGridProps {
  items: GalleryItem[]
  selectedItemIds: Set<string>
  onToggleSelect: (itemId: string, e?: React.MouseEvent) => void
}

function RenameMediaModal({
  item,
  onClose,
}: {
  item: GalleryItem
  onClose: () => void
}) {
  const { state, dispatch } = useAppStore()
  const t = translations[state.language].gallery
  const [caption, setCaption] = useState(item.caption || '')
  const [src, setSrc] = useState(item.src || '')
  
  const itemInfo = useMemo(() => findItemWithFolderPath(state.galleryFolders, item.id), [state.galleryFolders, item.id])
  const flatFolders = useMemo(() => flattenFolders(state.galleryFolders), [state.galleryFolders])
  const [targetFolderPath, setTargetFolderPath] = useState<string[]>(itemInfo?.folderPath || [])
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false)
  const folderDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(e.target as Node)) {
        setIsFolderDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()

    // 1. Move to new folder if changed
    if (itemInfo && targetFolderPath.length > 0 && targetFolderPath.join('/') !== itemInfo.folderPath.join('/')) {
      dispatch({
        type: 'MOVE_GALLERY_ITEM',
        payload: {
          itemId: item.id,
          targetFolderPath,
        },
      })
    }

    // 2. Update caption & src
    dispatch({
      type: 'RENAME_GALLERY_ITEM',
      payload: {
        itemId: item.id,
        newCaption: caption.trim(),
        newSrc: src.trim() || undefined,
      },
    })
    onClose()
  }

  const selectedFolderLabel = useMemo(() => {
    const pStr = targetFolderPath.join('/')
    const found = flatFolders.find((f) => f.pathParts.join('/') === pStr)
    return found ? `${found.folder.name} (${pStr})` : pStr || t.selectFolderOption
  }, [targetFolderPath, flatFolders, t])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col font-display"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <Edit3 size={15} style={{ color: 'var(--color-brand)' }} />
            <h4 className="font-bold text-xs" style={{ color: 'var(--color-text)' }}>
              {t.editMediaTitle}
            </h4>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg cursor-pointer text-slate-400 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold" style={{ color: 'var(--color-text-muted)' }}>
              {t.editCaptionField}
            </label>
            <input
              autoFocus
              className="w-full px-3 py-2 rounded-xl border outline-none"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-brand)',
                color: 'var(--color-text)',
              }}
              placeholder={t.editCaptionPlaceholder}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold" style={{ color: 'var(--color-text-muted)' }}>
              {t.pathField}
            </label>
            <input
              className="w-full px-3 py-2 rounded-xl border outline-none font-mono text-[11px]"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              value={src}
              onChange={(e) => setSrc(e.target.value)}
            />
          </div>

          {/* Folder Target Selection */}
          <div className="space-y-1.5">
            <label className="font-bold" style={{ color: 'var(--color-text-muted)' }}>
              {t.folderLocation}
            </label>
            <div className="relative font-display" ref={folderDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all"
                style={{
                  background: 'var(--color-surface-2)',
                  borderColor: isFolderDropdownOpen ? 'var(--color-brand)' : 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder size={14} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
                  <span className="font-semibold truncate">{selectedFolderLabel}</span>
                </div>
                <ChevronDown
                  size={15}
                  className={`text-slate-400 shrink-0 transition-transform ${isFolderDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`}
                />
              </button>

              {isFolderDropdownOpen && (
                <div
                  className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl p-1.5 z-50 max-h-48 overflow-y-auto space-y-0.5"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  {flatFolders.map(({ folder, pathParts, depth }) => {
                    const pathStr = pathParts.join('/')
                    const isSelected = targetFolderPath.join('/') === pathStr

                    return (
                      <button
                        key={folder.id}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left cursor-pointer transition-colors"
                        style={{
                          paddingLeft: `${10 + depth * 12}px`,
                          background: isSelected ? 'var(--color-brand-glow)' : 'transparent',
                          color: isSelected ? 'var(--color-brand)' : 'var(--color-text)',
                        }}
                        onClick={() => {
                          setTargetFolderPath(pathParts)
                          setIsFolderDropdownOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] text-slate-500 font-mono">{depth > 0 ? '└' : '📁'}</span>
                          <span className={`truncate ${isSelected ? 'font-bold' : ''}`}>{folder.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">({pathStr})</span>
                        </div>
                        {isSelected && <Check size={13} className="text-emerald-400 shrink-0 ml-1" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-dim)' }}
          >
            {t.cancelBtn}
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-md transition-all hover:scale-[1.02]"
            style={{ background: 'var(--color-brand)', color: '#050c14' }}
          >
            <Save size={13} />
            {t.saveChanges}
          </button>
        </div>
      </form>
    </div>
  )
}

function MediaCard({
  item,
  index,
  isSelected,
  onToggleSelect,
  onOpen,
  onRename,
  t,
}: {
  item: GalleryItem
  index: number
  isSelected: boolean
  onToggleSelect: (itemId: string, e?: React.MouseEvent) => void
  onOpen: (index: number) => void
  onRename: (item: GalleryItem) => void
  t: typeof translations.id.gallery
}) {
  const { dispatch } = useAppStore()
  const [imgError, setImgError] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [candidateIndex, setCandidateIndex] = useState(0)

  const candidates = useMemo(() => resolveMediaSrcCandidates(item.src), [item.src])
  const localMediaSrc = useLocalMedia(item.src)
  const currentSrc = localMediaSrc || candidates[candidateIndex] || item.src

  useEffect(() => {
    setCandidateIndex(0)
    setImgError(false)
  }, [item.src])

  function handleImgError() {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((prev) => prev + 1)
    } else {
      setImgError(true)
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm(t.confirmDeleteItem)) return
    dispatch({ type: 'DELETE_GALLERY_ITEM', payload: { itemId: item.id } })
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    onRename(item)
  }

  const isImage = item.type === 'image'
  const isVideo = item.type === 'video'
  const isYoutube =
    isVideo && (item.src.includes('youtube.com') || item.src.includes('youtu.be'))

  function getYoutubeThumbnail(src: string): string {
    try {
      if (src.includes('youtu.be/')) {
        const id = src.split('youtu.be/')[1]?.split('?')[0]
        return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      }
      const url = new URL(src)
      const id = url.searchParams.get('v')
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    } catch {
      return ''
    }
  }

  const ytThumb = isYoutube ? getYoutubeThumbnail(item.src) : ''

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 select-none"
      style={{
        background: 'var(--color-surface-2)',
        border: isSelected ? '2px solid var(--color-brand)' : '1px solid var(--color-border)',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isSelected
          ? '0 0 20px rgba(14,243,141,0.25)'
          : hovered
          ? '0 8px 32px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(index)}
    >
      {/* Checkbox select trigger - High Contrast (Disabled for Auto-Synced items) */}
      {!item.isAutoSynced ? (
        <div
          className={`absolute top-2 left-2 z-30 transition-all ${
            isSelected || hovered ? 'opacity-100 scale-100' : 'opacity-85 scale-95'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(item.id, e)
          }}
        >
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-xl"
            style={{
              background: isSelected ? 'var(--color-brand)' : '#090d16',
              border: isSelected ? '2px solid #ffffff' : '2px solid rgba(255,255,255,0.75)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.85)',
            }}
          >
            {isSelected ? (
              <Check size={16} className="text-slate-950 font-black stroke-[3]" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-white/40 group-hover:bg-white/70" />
            )}
          </div>
        </div>
      ) : (
        <div
          className="absolute top-2 left-2 z-30 opacity-90 pointer-events-none"
          title="File live auto-sync dari folder"
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center shadow-lg"
            style={{
              background: 'rgba(14, 165, 233, 0.9)',
              border: '1px solid rgba(255,255,255,0.8)',
              color: '#ffffff',
            }}
          >
            <RefreshCw size={12} className="animate-spin-slow" />
          </div>
        </div>
      )}

      {/* Media preview */}
      <div className="aspect-video flex items-center justify-center overflow-hidden relative" style={{ background: '#0a0a0f' }}>
        {isYoutube && ytThumb ? (
          <>
            <img
              src={ytThumb}
              alt={item.caption ?? 'YouTube video'}
              className="w-full h-full object-cover transition-transform duration-300"
              style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl"
                style={{ background: '#dc2626', border: '2px solid rgba(255,255,255,0.8)' }}
              >
                <Play size={18} className="text-white ml-0.5 fill-white" />
              </div>
            </div>
          </>
        ) : isImage && !imgError ? (
          <img
            src={currentSrc}
            alt={item.caption ?? item.src}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
            onError={handleImgError}
            loading="lazy"
          />
        ) : isVideo && !isYoutube ? (
          <div className="relative w-full h-full">
            <video
              src={currentSrc}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
              onError={handleImgError}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center shadow-2xl"
                style={{
                  background: 'var(--color-brand)',
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.8)',
                }}
              >
                <Play size={17} className="text-slate-950 ml-0.5 fill-slate-950" />
              </div>
            </div>
          </div>
        ) : (
          /* Fallback for unknown or broken */
          <div className="flex flex-col items-center gap-2 opacity-60 p-2">
            {imgError
              ? <AlertCircle size={28} style={{ color: '#ef4444' }} />
              : item.type === 'video'
              ? <Video size={28} style={{ color: 'var(--color-brand)' }} />
              : <ImageIcon size={28} style={{ color: 'var(--color-brand)' }} />
            }
            <span className="text-[9px] text-center px-2 max-w-[160px] truncate font-mono text-slate-300">
              {item.src}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-200 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)',
            opacity: hovered ? 1 : 0,
          }}
        />
      </div>

      {/* Caption */}
      {item.caption && (
        <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <p className="text-[11px] font-bold truncate font-display" style={{ color: 'var(--color-text)' }}>
            {item.caption}
          </p>
        </div>
      )}

      {/* Badges (SYNC Badge + Type Badge) */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1">
        {item.isAutoSynced && (
          <span
            className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider font-display shadow-lg flex items-center gap-1"
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.85)',
            }}
          >
            <RefreshCw size={9} />
            SYNC
          </span>
        )}
        <span
          className="text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider font-display shadow-lg"
          style={{
            background: isYoutube ? '#dc2626' : isVideo ? '#ef4444' : '#059669',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.85)',
          }}
        >
          {isYoutube ? 'YT' : item.type === 'video' ? 'VID' : 'IMG'}
        </span>
      </div>

      {/* Action Buttons (Edit & Delete) - Only for non-sync items */}
      {!item.isAutoSynced && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 z-10">
          <button
            type="button"
            className="p-1.5 rounded-xl hover:scale-110 cursor-pointer shadow-md"
            style={{ background: 'rgba(30,41,59,0.9)', color: 'var(--color-brand)' }}
            title="Rename / Edit Media"
            onClick={handleEdit}
          >
            <Edit3 size={11} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-xl hover:scale-110 cursor-pointer shadow-md"
            style={{ background: 'rgba(239,68,68,0.85)', color: '#fff' }}
            title={t.deleteItem}
            onClick={handleDelete}
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

export function GalleryGrid({ items, selectedItemIds, onToggleSelect }: GalleryGridProps) {
  const { state } = useAppStore()
  const t = translations[state.language].gallery
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [renamingItem, setRenamingItem] = useState<GalleryItem | null>(null)

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50 select-none">
        <ImageIcon size={36} style={{ color: 'var(--color-text-dim)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-dim)' }}>
          {t.emptyFolderTitle}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-dim)' }}>
          {t.emptyFolderDesc}
        </p>
      </div>
    )
  }

  return (
    <>
      <div
        className="grid gap-4 p-4 overflow-y-auto max-h-full"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        }}
      >
        {items.map((item, i) => (
          <MediaCard
            key={item.id}
            item={item}
            index={i}
            isSelected={selectedItemIds.has(item.id)}
            onToggleSelect={onToggleSelect}
            onOpen={(idx) => setLightboxIndex(idx)}
            onRename={(it) => setRenamingItem(it)}
            t={t}
          />
        ))}
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox
          items={items}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {renamingItem !== null && (
        <RenameMediaModal
          item={renamingItem}
          onClose={() => setRenamingItem(null)}
        />
      )}
    </>
  )
}

