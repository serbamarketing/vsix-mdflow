import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Plus,
  Trash2,
  Tag,
  Calendar,
  User,
  Layers,
  AlertTriangle,
  GitBranch,
  ExternalLink,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'
import { findFeatureById, flattenFeatures, generateFeatureId, getStatusColor } from '../../models/feature'
import type { FeatureNode } from '../../models/feature'

export function DetailPanel() {
  const { state, dispatch } = useAppStore()
  const { isDetailOpen, selectedFeatureId, features, customStatuses } = state

  const feature = selectedFeatureId ? findFeatureById(features, selectedFeatureId) : null
  const allFlat = useMemo(() => flattenFeatures(features), [features])
  const parent = feature ? allFlat.find((f) => f.children.some((c) => c.id === feature.id)) : null

  // Local form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [newMetaKey, setNewMetaKey] = useState('')
  const [newMetaVal, setNewMetaVal] = useState('')
  const [isAddingMeta, setIsAddingMeta] = useState(false)
  const [isConfirmDelete, setIsConfirmDelete] = useState(false)

  // Sync form state when selected feature changes
  useEffect(() => {
    if (feature) {
      setTitle(feature.title)
      setDescription(feature.description ?? '')
      setMetadata({ ...feature.metadata })
      setIsAddingMeta(false)
      setIsConfirmDelete(false)
    }
  }, [feature?.id, feature?.title, feature?.description, feature?.metadata])

  if (!isDetailOpen || !feature) return null

  const handleSaveField = (key: string, value: string) => {
    const updatedMeta = { ...metadata, [key.toLowerCase()]: value }
    if (!value.trim()) {
      delete updatedMeta[key.toLowerCase()]
    }
    setMetadata(updatedMeta)
    dispatch({
      type: 'UPDATE_FEATURE_NODE',
      payload: {
        id: feature.id,
        updates: { metadata: updatedMeta },
      },
    })
  }

  const handleTitleBlur = () => {
    if (title.trim() && title !== feature.title) {
      dispatch({
        type: 'UPDATE_FEATURE_NODE',
        payload: { id: feature.id, updates: { title: title.trim() } },
      })
    }
  }

  const handleDescriptionBlur = () => {
    if (description !== (feature.description ?? '')) {
      dispatch({
        type: 'UPDATE_FEATURE_NODE',
        payload: { id: feature.id, updates: { description: description.trim() || undefined } },
      })
    }
  }

  const handleAddNewMeta = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMetaKey.trim()) return
    const key = newMetaKey.trim().toLowerCase()
    const val = newMetaVal.trim()
    const updated = { ...metadata, [key]: val }
    setMetadata(updated)
    dispatch({
      type: 'UPDATE_FEATURE_NODE',
      payload: { id: feature.id, updates: { metadata: updated } },
    })
    setNewMetaKey('')
    setNewMetaVal('')
    setIsAddingMeta(false)
  }

  const handleDeleteMetaKey = (key: string) => {
    const updated = { ...metadata }
    delete updated[key]
    setMetadata(updated)
    dispatch({
      type: 'UPDATE_FEATURE_NODE',
      payload: { id: feature.id, updates: { metadata: updated } },
    })
  }

  const handleAddChild = () => {
    const childId = generateFeatureId('Sub-item')
    const newNode: FeatureNode = {
      id: childId,
      title: 'Sub-item Baru',
      level: feature.level + 1,
      description: '',
      metadata: {},
      children: [],
    }
    dispatch({
      type: 'ADD_FEATURE_NODE',
      payload: { parentId: feature.id, node: newNode },
    })
  }

  const handleReparent = (newParentId: string) => {
    dispatch({
      type: 'REPARENT_FEATURE_NODE',
      payload: {
        sourceId: feature.id,
        targetParentId: newParentId === 'root' ? null : newParentId,
      },
    })
  }

  const handleDeleteFeature = () => {
    dispatch({
      type: 'DELETE_FEATURE_NODE',
      payload: { id: feature.id },
    })
  }

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 w-96 max-w-full flex flex-col border-l shadow-2xl transition-transform duration-200 ease-out select-none"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      {/* Panel Header */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] px-2 py-0.5 rounded font-mono font-bold"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent)' }}
          >
            H{feature.level}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
            Detail & Edit Item
          </span>
        </div>

        <button
          type="button"
          onClick={() => dispatch({ type: 'CLOSE_DETAIL' })}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer hover:bg-slate-800"
          style={{ color: 'var(--color-text-dim)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Thumbnail Image Banner */}
        {(metadata.image || metadata.img || metadata.thumbnail || metadata.cover || metadata.photo) && (
          <div className="relative rounded-2xl overflow-hidden border shadow-lg group mb-2" style={{ borderColor: 'var(--color-border)' }}>
            <img
              src={metadata.image || metadata.img || metadata.thumbnail || metadata.cover || metadata.photo}
              alt={title}
              className="w-full h-36 object-cover"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-[10px] text-white flex items-center gap-1 font-semibold">
              <ImageIcon size={11} style={{ color: 'var(--color-brand)' }} /> Preview Gambar
            </div>
          </div>
        )}

        {/* External Link Button */}
        {(metadata.link || metadata.url || metadata.href || metadata.website) && (
          <a
            href={
              (metadata.link || metadata.url || metadata.href || metadata.website)?.startsWith('http')
                ? metadata.link || metadata.url || metadata.href || metadata.website
                : `https://${metadata.link || metadata.url || metadata.href || metadata.website}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs shadow-md transition-all mb-2"
            style={{
              background: 'var(--color-brand)',
              color: '#050c14',
            }}
          >
            <span>Buka Link ({metadata.link || metadata.url || metadata.href || metadata.website})</span>
            <ExternalLink size={13} />
          </a>
        )}

        {/* 1. Posisi Hierarki */}
        <div className="flex items-center gap-3">
          <label className="w-28 text-xs font-semibold shrink-0 flex items-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
            <GitBranch size={12} style={{ color: 'var(--color-brand)' }} /> Posisi Hierarki
          </label>
          <select
            value={parent ? parent.id : 'root'}
            onChange={(e) => handleReparent(e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer truncate font-semibold"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            <option value="root">■ Root Utama (Level 1)</option>
            {allFlat
              .filter((f) => f.id !== feature.id)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {'—'.repeat(Math.max(0, f.level - 1))} Parent: {f.title} (H{f.level})
                </option>
              ))}
          </select>
        </div>

        {/* 1.5. Urutan / Posisi */}
        <div className="flex items-center gap-3">
          <label className="w-28 text-xs font-semibold shrink-0" style={{ color: 'var(--color-text-dim)' }}>
            Urutan Posisi
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              title="Naikkan posisi"
              onClick={() => dispatch({ type: 'REORDER_FEATURE_NODE', payload: { id: feature.id, direction: 'up' } })}
              className="p-1.5 rounded-xl cursor-pointer transition-all border hover:opacity-80"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-brand)' }}
            >
              <ChevronUp size={15} />
            </button>
            <button
              type="button"
              title="Turunkan posisi"
              onClick={() => dispatch({ type: 'REORDER_FEATURE_NODE', payload: { id: feature.id, direction: 'down' } })}
              className="p-1.5 rounded-xl cursor-pointer transition-all border hover:opacity-80"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-brand)' }}
            >
              <ChevronDown size={15} />
            </button>
          </div>
        </div>

        {/* 2. Judul Item */}
        <div className="flex items-center gap-3">
          <label className="w-28 text-xs font-semibold shrink-0" style={{ color: 'var(--color-text-dim)' }}>
            Judul Item
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur()
              }
            }}
            className="flex-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border outline-none"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>

        {/* 3. Status */}
        <div className="flex items-center gap-3">
          <label className="w-28 text-xs font-semibold shrink-0" style={{ color: 'var(--color-text-dim)' }}>
            Status
          </label>
          <select
            value={metadata.status ?? ''}
            onChange={(e) => handleSaveField('status', e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer font-medium"
            style={{
              background: 'var(--color-surface-2)',
              borderColor: metadata.status ? getStatusColor(metadata.status, customStatuses) : 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <option value="">— Tanpa Status</option>
            {customStatuses.map((st) => (
              <option key={st.id} value={st.label}>
                {st.label}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Priority */}
        <div className="flex items-center gap-3">
          <label className="w-28 text-xs font-semibold shrink-0" style={{ color: 'var(--color-text-dim)' }}>
            Priority
          </label>
          <select
            value={metadata.priority ?? ''}
            onChange={(e) => handleSaveField('priority', e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer font-medium"
            style={{
              background: 'var(--color-surface-2)',
              borderColor: 'var(--color-border)',
              color: metadata.priority ? '#f59e0b' : 'var(--color-text-dim)',
            }}
          >
            <option value="">— Tanpa Priority</option>
            <option value="🔴 High">🔴 High</option>
            <option value="🟡 Medium">🟡 Medium</option>
            <option value="🟢 Low">🟢 Low</option>
          </select>
        </div>

        {/* 5. PIC */}
        <div className="flex items-center gap-3">
          <label className="w-28 text-xs font-semibold shrink-0 flex items-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
            <User size={11} className="text-sky-400" /> PIC
          </label>
          <input
            type="text"
            placeholder="@username"
            value={metadata.pic ?? ''}
            onChange={(e) => handleSaveField('pic', e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none font-semibold"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>

        {/* 6. Deadline */}
        <div className="flex items-center gap-3">
          <label className="w-28 text-xs font-semibold shrink-0 flex items-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
            <Calendar size={11} className="text-rose-400" /> Deadline
          </label>
          <input
            type="date"
            value={metadata.deadline ?? ''}
            onChange={(e) => handleSaveField('deadline', e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none cursor-pointer font-semibold"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>

        {/* 7. Type */}
        <div className="flex items-center gap-3">
          <label className="w-28 text-xs font-semibold shrink-0 flex items-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
            <Tag size={11} className="text-purple-400" /> Type
          </label>
          <input
            type="text"
            placeholder="Misal: System, UI, Core"
            value={metadata.type ?? ''}
            onChange={(e) => handleSaveField('type', e.target.value)}
            className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none font-semibold"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>

        {/* 8. Image URL */}
        <div className="flex items-start gap-3">
          <label className="w-28 text-xs font-semibold shrink-0 flex items-center gap-1 pt-1.5" style={{ color: 'var(--color-text-dim)' }}>
            <ImageIcon size={11} className="text-emerald-400" /> Image
          </label>
          <div className="flex-1 space-y-1">
            <input
              type="text"
              placeholder="https://... atau ./image.png"
              value={metadata.image ?? ''}
              onChange={(e) => handleSaveField('image', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border outline-none font-semibold"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
        </div>

        {/* 9. Link */}
        <div className="flex items-center gap-3">
          <label className="w-28 text-xs font-semibold shrink-0 flex items-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
            <ExternalLink size={11} className="text-sky-400" /> Link
          </label>
          <div className="flex-1 flex items-center gap-1">
            <input
              type="text"
              placeholder="https://example.com"
              value={metadata.link ?? ''}
              onChange={(e) => handleSaveField('link', e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none font-semibold"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
        </div>

        {/* Custom Metadata Rows */}
        {Object.entries(metadata)
          .filter(
            ([k]) =>
              ![
                'status',
                'priority',
                'type',
                'pic',
                'deadline',
                'image',
                'img',
                'thumbnail',
                'cover',
                'photo',
                'link',
                'url',
                'href',
                'website',
              ].includes(k.toLowerCase())
          )
          .map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-28 text-xs font-medium capitalize truncate shrink-0" style={{ color: 'var(--color-text-dim)' }}>
                {k}
              </span>
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="text"
                  value={v}
                  onChange={(e) => handleSaveField(k, e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none font-semibold"
                  style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteMetaKey(k)}
                  className="p-1 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                  title="Hapus field ini"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

        {/* Add Custom Metadata Form */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {isAddingMeta ? (
            <form onSubmit={handleAddNewMeta} className="p-3 rounded-xl border space-y-2" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <p className="text-[11px] font-bold" style={{ color: 'var(--color-text)' }}>
                Tambah Kolom Metadata Kustom
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama (Sprint)"
                  value={newMetaKey}
                  onChange={(e) => setNewMetaKey(e.target.value)}
                  autoFocus
                  className="px-2 py-1 text-xs rounded-lg border outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
                <input
                  type="text"
                  placeholder="Nilai (Sprint 2)"
                  value={newMetaVal}
                  onChange={(e) => setNewMetaVal(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg border outline-none"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingMeta(false)}
                  className="px-2 py-1 text-xs cursor-pointer"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-bold rounded-lg cursor-pointer"
                  style={{ background: 'var(--color-brand)', color: '#050c14' }}
                >
                  Tambah
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingMeta(true)}
              className="text-xs font-semibold flex items-center gap-1 cursor-pointer"
              style={{ color: 'var(--color-brand)' }}
            >
              <Plus size={13} /> Tambah Kolom Kustom
            </button>
          )}
        </div>

        {/* Description Textarea */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
            Deskripsi & Catatan
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Catatan atau detail tugas..."
            className="w-full px-3 py-2 text-xs rounded-xl border outline-none resize-y font-medium"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>

        {/* Sub-items Section */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>
              Sub-Item ({feature.children.length})
            </span>
            <button
              type="button"
              onClick={handleAddChild}
              className="text-xs font-semibold flex items-center gap-0.5 cursor-pointer"
              style={{ color: 'var(--color-brand)' }}
            >
              <Plus size={12} /> Sub-item
            </button>
          </div>

          <div className="space-y-1">
            {feature.children.map((child) => (
              <div
                key={child.id}
                onClick={() => dispatch({ type: 'SELECT_FEATURE', payload: child.id })}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-brand)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <span className="truncate font-medium" style={{ color: 'var(--color-text)' }}>
                  {child.title}
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-dim)' }}>
                  H{child.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel Footer */}
      <div
        className="p-3.5 border-t shrink-0 flex items-center justify-between"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        {isConfirmDelete ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
              <AlertTriangle size={13} /> Yakin hapus?
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsConfirmDelete(false)}
                className="px-2.5 py-1 text-xs rounded-lg text-slate-400 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteFeature}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleAddChild}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)' }}
            >
              <Layers size={13} /> + Sub-item
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmDelete(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
            >
              <Trash2 size={13} /> Hapus
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
