import { useState, useMemo, useEffect, useRef } from 'react'
import { Trash2, ExternalLink, Image as ImageIcon, Play, Check, Edit3, X, Save, RefreshCw, Folder, ChevronDown } from 'lucide-react'
import type { GalleryItem } from '@/models/gallery'
import { resolveMediaSrcCandidates, flattenFolders, findItemWithFolderPath } from '@/models/gallery'
import { useAppStore } from '@/hooks/useAppStore'
import { useLocalMedia } from '@/hooks/useLocalMedia'
import { GalleryLightbox } from './GalleryLightbox'
import { translations } from '@/data/translations'

interface GalleryTableProps {
  items: GalleryItem[]
  folderPath: string
  selectedItemIds: Set<string>
  onToggleSelect: (itemId: string, e?: React.MouseEvent) => void
  onToggleSelectAll: () => void
}

function RenameMediaModal({
  item,
  onClose,
}: {
  item: GalleryItem
  onClose: () => void
}) {
  const { state, dispatch } = useAppStore()
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
    return found ? `${found.folder.name} (${pStr})` : pStr || 'Pilih Folder'
  }, [targetFolderPath, flatFolders])

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
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
              Edit / Pindahkan Media
            </h4>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg cursor-pointer text-slate-400 hover:text-white">
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold" style={{ color: 'var(--color-text-muted)' }}>
              Judul / Caption Media
            </label>
            <input
              autoFocus
              className="w-full px-3 py-2 rounded-xl border outline-none"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-brand)',
                color: 'var(--color-text)',
              }}
              placeholder="Contoh: Screenshot_8 atau Banner Game"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold" style={{ color: 'var(--color-text-muted)' }}>
              File Path / URL
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
              Lokasi Folder
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
                  className="absolute left-0 right-0 bottom-full mb-1.5 rounded-2xl shadow-2xl border p-1 max-h-48 overflow-y-auto z-50 space-y-0.5"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-brand)',
                    backdropFilter: 'blur(16px)',
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
            Batal
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer shadow-md transition-all hover:scale-[1.02]"
            style={{ background: 'var(--color-brand)', color: '#050c14' }}
          >
            <Save size={13} />
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  )
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

function getYoutubeThumbnail(src: string): string {
  try {
    if (src.includes('youtu.be/')) {
      const id = src.split('youtu.be/')[1]?.split('?')[0]
      return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
    }
    const url = new URL(src)
    const id = url.searchParams.get('v')
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`
  } catch {
    return ''
  }
}

function TableItemPreview({ item }: { item: GalleryItem }) {
  const isVid = item.type === 'video'
  const isYt = isVid && isYoutubeUrl(item.src)
  const ytThumb = isYt ? getYoutubeThumbnail(item.src) : ''
  const candidates = useMemo(() => resolveMediaSrcCandidates(item.src), [item.src])
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [err, setErr] = useState(false)
  
  const localMediaSrc = useLocalMedia(item.src)

  useEffect(() => {
    setCandidateIndex(0)
    setErr(false)
  }, [item.src])

  const currentSrc = localMediaSrc || candidates[candidateIndex] || item.src

  function handleError() {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((i) => i + 1)
    } else {
      setErr(true)
    }
  }

  if (isYt && ytThumb) {
    return (
      <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-black shrink-0">
        <img src={ytThumb} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play size={12} className="text-white fill-white" />
        </div>
      </div>
    )
  }

  if (isVid) {
    return (
      <div className="relative w-12 h-9 rounded-lg overflow-hidden bg-black shrink-0 flex items-center justify-center">
        <video
          src={currentSrc}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
          onError={handleError}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
          <Play size={12} className="text-emerald-400 fill-emerald-400" />
        </div>
      </div>
    )
  }

  if (err) {
    return (
      <div className="w-12 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <ImageIcon size={14} className="text-slate-500" />
      </div>
    )
  }

  return (
    <div className="w-12 h-9 rounded-lg overflow-hidden bg-black shrink-0">
      <img
        src={currentSrc}
        alt=""
        className="w-full h-full object-cover"
        onError={handleError}
        loading="lazy"
      />
    </div>
  )
}

export function GalleryTable({
  items,
  folderPath,
  selectedItemIds,
  onToggleSelect,
  onToggleSelectAll,
}: GalleryTableProps) {
  const { state, dispatch } = useAppStore()
  const t = translations[state.language].gallery
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [renamingItem, setRenamingItem] = useState<GalleryItem | null>(null)

  function handleDelete(itemId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(t.confirmDeleteItem)) return
    dispatch({ type: 'DELETE_GALLERY_ITEM', payload: { itemId } })
  }

  function handleEdit(item: GalleryItem, e: React.MouseEvent) {
    e.stopPropagation()
    setRenamingItem(item)
  }

  const allSelected = items.length > 0 && items.every((i) => selectedItemIds.has(i.id))

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50 select-none">
        <ImageIcon size={36} style={{ color: 'var(--color-text-dim)' }} />
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-dim)' }}>
          {t.emptyFolderTitle}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto p-4 max-h-full">
        <table className="w-full text-xs font-display border-separate border-spacing-y-1">
          <thead>
            <tr>
              <th
                className="w-8 px-3 py-2 text-center rounded-l-xl"
                style={{ background: 'var(--color-surface-2)' }}
              >
                <div
                  className="w-4 h-4 rounded border flex items-center justify-center cursor-pointer mx-auto transition-all"
                  style={{
                    background: allSelected ? 'var(--color-brand)' : 'transparent',
                    borderColor: allSelected ? 'var(--color-brand)' : 'var(--color-border)',
                  }}
                  onClick={onToggleSelectAll}
                >
                  {allSelected && <Check size={11} className="text-slate-950 font-bold" />}
                </div>
              </th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: 'var(--color-text-dim)', background: 'var(--color-surface-2)' }}>{t.previewHeader}</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: 'var(--color-text-dim)', background: 'var(--color-surface-2)' }}>{t.fileUrlHeader}</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: 'var(--color-text-dim)', background: 'var(--color-surface-2)' }}>{t.captionHeader}</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: 'var(--color-text-dim)', background: 'var(--color-surface-2)' }}>{t.typeHeader}</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left" style={{ color: 'var(--color-text-dim)', background: 'var(--color-surface-2)' }}>{t.folderHeader}</th>
              <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-right rounded-r-xl" style={{ color: 'var(--color-text-dim)', background: 'var(--color-surface-2)' }}>{t.actionsHeader}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const isVid = item.type === 'video'
              const isYt = isVid && isYoutubeUrl(item.src)
              const filename = getFilename(item.src)
              const isSelected = selectedItemIds.has(item.id)

              return (
                <tr
                  key={item.id}
                  className="group transition-all duration-150 cursor-pointer hover:brightness-110"
                  style={{ color: 'var(--color-text)' }}
                  onClick={() => setLightboxIndex(i)}
                >
                  <td
                    className="px-3 py-2 rounded-l-xl text-center"
                    style={{ background: isSelected ? 'rgba(14,243,141,0.08)' : 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRight: 'none' }}
                    onClick={(e) => {
                      if (item.isAutoSynced) return
                      e.stopPropagation()
                      onToggleSelect(item.id, e)
                    }}
                  >
                    {!item.isAutoSynced ? (
                      <div
                        className="w-4 h-4 rounded border flex items-center justify-center cursor-pointer mx-auto transition-all"
                        style={{
                          background: isSelected ? 'var(--color-brand)' : 'transparent',
                          borderColor: isSelected ? 'var(--color-brand)' : 'var(--color-border)',
                        }}
                      >
                        {isSelected && <Check size={11} className="text-slate-950 font-bold" />}
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded flex items-center justify-center mx-auto opacity-75" title="Live Auto-Sync dari folder">
                        <RefreshCw size={11} className="text-sky-400 animate-spin-slow" />
                      </div>
                    )}
                  </td>

                  <td
                    className="px-3 py-2"
                    style={{ background: isSelected ? 'rgba(14,243,141,0.08)' : 'var(--color-surface-2)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <TableItemPreview item={item} />
                  </td>

                  <td
                    className="px-3 py-2 max-w-[200px]"
                    style={{ background: isSelected ? 'rgba(14,243,141,0.08)' : 'var(--color-surface-2)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <span className="font-mono text-[11px] truncate block" title={item.src}>
                      {filename}
                    </span>
                  </td>

                  <td
                    className="px-3 py-2"
                    style={{ background: isSelected ? 'rgba(14,243,141,0.08)' : 'var(--color-surface-2)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <span className="font-semibold text-[11px] truncate block max-w-[160px]" style={{ color: item.caption ? 'var(--color-text)' : 'var(--color-text-dim)' }}>
                      {item.caption ?? '—'}
                    </span>
                  </td>

                  <td
                    className="px-3 py-2"
                    style={{ background: isSelected ? 'rgba(14,243,141,0.08)' : 'var(--color-surface-2)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      {item.isAutoSynced && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg uppercase tracking-wide flex items-center gap-1"
                          style={{ background: 'rgba(2,132,199,0.2)', color: '#38bdf8' }}
                        >
                          <RefreshCw size={8} /> SYNC
                        </span>
                      )}
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-lg uppercase tracking-wide"
                        style={{
                          background: isVid ? 'rgba(239,68,68,0.15)' : 'rgba(14,243,141,0.1)',
                          color: isVid ? '#ef4444' : 'var(--color-brand)',
                        }}
                      >
                        {isYt ? 'YouTube' : item.type}
                      </span>
                    </div>
                  </td>

                  <td
                    className="px-3 py-2"
                    style={{ background: isSelected ? 'rgba(14,243,141,0.08)' : 'var(--color-surface-2)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}
                  >
                    <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>{folderPath}</span>
                  </td>

                  <td
                    className="px-3 py-2 rounded-r-xl text-right"
                    style={{ background: isSelected ? 'rgba(14,243,141,0.08)' : 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderLeft: 'none' }}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      {!item.isAutoSynced && (
                        <button
                          type="button"
                          className="p-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          title="Rename / Edit Media"
                          onClick={(e) => handleEdit(item, e)}
                        >
                          <Edit3 size={13} style={{ color: 'var(--color-brand)' }} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer"
                        title={t.openNewTab}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(item.src, '_blank')
                        }}
                      >
                        <ExternalLink size={13} style={{ color: 'var(--color-text-dim)' }} />
                      </button>
                      {!item.isAutoSynced && (
                        <button
                          type="button"
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors cursor-pointer"
                          title={t.deleteItem}
                          onClick={(e) => handleDelete(item.id, e)}
                        >
                          <Trash2 size={13} style={{ color: '#ef4444' }} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
