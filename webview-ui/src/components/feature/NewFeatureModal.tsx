import { useState, useEffect, useMemo } from 'react'
import {
  X,
  Sparkles,
  GitBranch,
  Calendar,
  User,
  Tag,
  ImageIcon,
  ExternalLink,
  Plus,
  Trash2,
} from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'
import { generateFeatureId, flattenFeatures, getStatusColor } from '../../models/feature'
import type { FeatureNode } from '../../models/feature'

export function NewFeatureModal() {
  const { state, dispatch } = useAppStore()

  const allFlat = useMemo(() => flattenFeatures(state.features), [state.features])

  const [selectedParentId, setSelectedParentId] = useState<string>('root')
  const [title, setTitle] = useState('')
  const [isTodo, setIsTodo] = useState(true)
  const [status, setStatus] = useState('🔴 Todo')
  const [priority, setPriority] = useState('')
  const [pic, setPic] = useState('')
  const [deadline, setDeadline] = useState('')
  const [type, setType] = useState('')
  const [image, setImage] = useState('')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')

  // Custom metadata state
  const [customMeta, setCustomMeta] = useState<Record<string, string>>({})
  const [isAddingMeta, setIsAddingMeta] = useState(false)
  const [newMetaKey, setNewMetaKey] = useState('')
  const [newMetaVal, setNewMetaVal] = useState('')

  // Reset / inisialisasi state saat modal dibuka
  useEffect(() => {
    if (state.isNewFeatureModalOpen) {
      const initialParentId = state.newFeatureParentId || 'root'
      setSelectedParentId(initialParentId)
      setTitle('')
      setIsTodo(true)
      setStatus(initialParentId !== 'root' ? '' : '🔴 Todo')
      setPriority('')
      setPic('')
      setDeadline('')
      setType('')
      setImage('')
      setLink('')
      setDescription('')
      setCustomMeta({})
      setIsAddingMeta(false)
      setNewMetaKey('')
      setNewMetaVal('')
    }
  }, [state.isNewFeatureModalOpen, state.newFeatureParentId])

  if (!state.isNewFeatureModalOpen) return null

  const parentNode = selectedParentId !== 'root'
    ? allFlat.find((f) => f.id === selectedParentId) || null
    : null

  const targetLevel = parentNode ? parentNode.level + 1 : 1

  const handleAddNewMeta = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMetaKey.trim()) return
    const key = newMetaKey.trim().toLowerCase()
    const val = newMetaVal.trim()
    setCustomMeta((prev) => ({ ...prev, [key]: val }))
    setNewMetaKey('')
    setNewMetaVal('')
    setIsAddingMeta(false)
  }

  const handleDeleteMetaKey = (key: string) => {
    setCustomMeta((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const newId = generateFeatureId(title.trim())

    const meta: Record<string, string> = { ...customMeta }

    if (isTodo) {
      meta.todo = 'true'
      if (status) meta.status = status
    } else {
      meta.todo = 'false'
      if (status) meta.status = status
    }

    if (priority) meta.priority = priority
    if (pic.trim()) meta.pic = pic.trim()
    if (deadline.trim()) meta.deadline = deadline.trim()
    if (type.trim()) meta.type = type.trim()
    if (image.trim()) meta.image = image.trim()
    if (link.trim()) meta.link = link.trim()

    const newNode: FeatureNode = {
      id: newId,
      title: title.trim(),
      level: targetLevel,
      description: description.trim() || undefined,
      metadata: meta,
      children: [],
    }

    dispatch({
      type: 'ADD_FEATURE_NODE',
      payload: {
        parentId: selectedParentId === 'root' ? null : selectedParentId,
        node: newNode,
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        onClick={() => dispatch({ type: 'CLOSE_NEW_FEATURE_MODAL' })}
        className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-pointer"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-xl border flex items-center justify-center"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface-2)',
                color: 'var(--color-brand)',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                  {parentNode ? `Tambah Sub-item` : 'Tambah Fitur / Item Baru'}
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-brand)',
                  }}
                >
                  H{targetLevel}
                </span>
              </div>
              {parentNode && (
                <p className="text-[11px] truncate max-w-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Di bawah: <span className="font-semibold text-slate-200">{parentNode.title}</span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'CLOSE_NEW_FEATURE_MODAL' })}
            className="p-1.5 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
            style={{ color: 'var(--color-text-dim)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* 1. Posisi Hierarki */}
          <div className="flex items-center gap-3">
            <label
              className="w-28 text-xs font-semibold shrink-0 flex items-center gap-1"
              style={{ color: 'var(--color-text-dim)' }}
            >
              <GitBranch size={12} style={{ color: 'var(--color-brand)' }} /> Posisi Hierarki
            </label>
            <select
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="flex-1 px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer truncate font-semibold"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <option value="root">■ Root Utama (Level 1)</option>
              {allFlat.map((f) => (
                <option key={f.id} value={f.id}>
                  {'—'.repeat(Math.max(0, f.level - 1))} Parent: {f.title} (H{f.level})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Judul Item */}
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs font-semibold shrink-0" style={{ color: 'var(--color-text-dim)' }}>
              Judul Item <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: Sistem Inventori / Leaderboard..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border outline-none focus:border-emerald-400 transition-colors"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* 3. Bagian To Do */}
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs font-semibold shrink-0" style={{ color: 'var(--color-text-dim)' }}>
              Bagian To Do
            </label>
            <div
              className="flex-1 flex gap-1 p-0.5 rounded-xl border"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsTodo(false)
                  setStatus('')
                }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer text-center ${
                  !isTodo ? 'bg-slate-700/90 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📁 Kategori Saja
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTodo(true)
                  if (!status) setStatus('🔴 Todo')
                }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer text-center ${
                  isTodo ? 'bg-[var(--color-brand)] text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ✅ Ya, Item To Do
              </button>
            </div>
          </div>

          {/* 4. Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer font-medium"
                style={{
                  background: 'var(--color-surface-2)',
                  borderColor: status ? getStatusColor(status, state.customStatuses) : 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                <option value="">— Tanpa Status</option>
                {state.customStatuses.map((st) => (
                  <option key={st.id} value={st.label}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer font-medium"
                style={{
                  background: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: priority ? '#f59e0b' : 'var(--color-text-dim)',
                }}
              >
                <option value="">— Tanpa Priority</option>
                <option value="🔴 High">🔴 High</option>
                <option value="🟡 Medium">🟡 Medium</option>
                <option value="🟢 Low">🟢 Low</option>
              </select>
            </div>
          </div>

          {/* 5. PIC & Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
                <User size={11} className="text-sky-400" /> PIC
              </label>
              <input
                type="text"
                placeholder="@username"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border outline-none"
                style={{
                  background: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
                <Calendar size={11} className="text-rose-400" /> Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border outline-none cursor-pointer"
                style={{
                  background: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>
          </div>

          {/* 6. Type */}
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs font-semibold shrink-0 flex items-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
              <Tag size={11} className="text-purple-400" /> Type
            </label>
            <input
              type="text"
              placeholder="Misal: System, UI, Core, Feature, Bug"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border outline-none"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* 7. Image URL */}
          <div className="flex items-start gap-3">
            <label className="w-28 text-xs font-semibold shrink-0 flex items-center gap-1 pt-2" style={{ color: 'var(--color-text-dim)' }}>
              <ImageIcon size={11} className="text-emerald-400" /> Image
            </label>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="https://... atau ./image.png"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border outline-none"
                style={{
                  background: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
              {image.trim() && (
                <div className="relative rounded-xl overflow-hidden border max-h-32 bg-black/40 flex items-center justify-center p-1" style={{ borderColor: 'var(--color-border)' }}>
                  <img
                    src={image}
                    alt="Preview"
                    className="max-h-28 max-w-full rounded-lg object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 8. Link */}
          <div className="flex items-center gap-3">
            <label className="w-28 text-xs font-semibold shrink-0 flex items-center gap-1" style={{ color: 'var(--color-text-dim)' }}>
              <ExternalLink size={11} className="text-sky-400" /> Link
            </label>
            <input
              type="text"
              placeholder="https://example.com"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border outline-none"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* 9. Custom Metadata List */}
          {Object.entries(customMeta).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="w-28 text-xs font-medium capitalize truncate shrink-0" style={{ color: 'var(--color-text-dim)' }}>
                {k}
              </span>
              <div className="flex-1 flex items-center gap-1">
                <input
                  type="text"
                  value={v}
                  onChange={(e) => setCustomMeta((prev) => ({ ...prev, [k]: e.target.value }))}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border outline-none font-semibold"
                  style={{
                    background: 'var(--color-surface-2)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleDeleteMetaKey(k)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 cursor-pointer"
                  title="Hapus field ini"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* 10. Tambah Kolom Kustom */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {isAddingMeta ? (
              <div className="p-3 rounded-xl border space-y-2" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
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
                    className="px-2 py-1.5 text-xs rounded-lg border outline-none font-semibold"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                  <input
                    type="text"
                    placeholder="Nilai (Sprint 2)"
                    value={newMetaVal}
                    onChange={(e) => setNewMetaVal(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border outline-none font-semibold"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingMeta(false)}
                    className="px-2.5 py-1 text-xs cursor-pointer rounded-lg text-slate-400"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewMeta}
                    className="px-3 py-1 text-xs font-bold rounded-lg cursor-pointer"
                    style={{ background: 'var(--color-brand)', color: '#050c14' }}
                  >
                    Tambah
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingMeta(true)}
                className="text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors hover:underline"
                style={{ color: 'var(--color-brand)' }}
              >
                <Plus size={13} /> Tambah Kolom Kustom
              </button>
            )}
          </div>

          {/* 11. Deskripsi & Catatan */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
              Deskripsi & Catatan
            </label>
            <textarea
              rows={3}
              placeholder="Catatan atau detail tugas..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border outline-none resize-y font-medium"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Footer Actions */}
          <div
            className="flex items-center justify-end gap-2 pt-3 border-t sticky bottom-0"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <button
              type="button"
              onClick={() => dispatch({ type: 'CLOSE_NEW_FEATURE_MODAL' })}
              className="px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer hover:bg-slate-800 transition-colors"
              style={{ color: 'var(--color-text-dim)' }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all shadow-lg hover:brightness-110 active:scale-95"
              style={{ background: 'var(--color-brand)', color: '#050c14' }}
            >
              {parentNode ? '+ Tambah Sub-item' : '+ Tambah Fitur Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
