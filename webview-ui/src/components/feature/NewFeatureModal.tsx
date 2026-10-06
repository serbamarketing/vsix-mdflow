import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { useAppStore } from '../../hooks/useAppStore'
import { generateFeatureId, findFeatureById } from '../../models/feature'
import type { FeatureNode } from '../../models/feature'

export function NewFeatureModal() {
  const { state, dispatch } = useAppStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('🔴 Todo')
  const [priority, setPriority] = useState('🔴 High')
  const [pic, setPic] = useState('')
  const [deadline, setDeadline] = useState('')
  const [type, setType] = useState('')

  if (!state.isNewFeatureModalOpen) return null

  const parentNode = state.newFeatureParentId
    ? findFeatureById(state.features, state.newFeatureParentId)
    : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const newId = generateFeatureId(title)
    const level = parentNode ? parentNode.level + 1 : 1

    const meta: Record<string, string> = {}
    if (status) meta.status = status
    if (priority) meta.priority = priority
    if (pic.trim()) meta.pic = pic.trim()
    if (deadline.trim()) meta.deadline = deadline.trim()
    if (type.trim()) meta.type = type.trim()

    const newNode: FeatureNode = {
      id: newId,
      title: title.trim(),
      level,
      description: description.trim() || undefined,
      metadata: meta,
      children: [],
    }

    dispatch({
      type: 'ADD_FEATURE_NODE',
      payload: { parentId: state.newFeatureParentId, node: newNode },
    })

    // Reset input form
    setTitle('')
    setDescription('')
    setPic('')
    setDeadline('')
    setType('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        onClick={() => dispatch({ type: 'CLOSE_NEW_FEATURE_MODAL' })}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: 'var(--color-brand)' }} />
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              {parentNode ? `Tambah Sub-item (${parentNode.title})` : 'Tambah Fitur / Item Baru'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dispatch({ type: 'CLOSE_NEW_FEATURE_MODAL' })}
            className="p-1.5 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
            style={{ color: 'var(--color-text-dim)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
              Judul Item / Fitur <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: Sistem Inventori / Leaderboard..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border outline-none"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
                Status Awal
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer font-medium"
                style={{
                  background: 'var(--color-surface-2)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
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
                  color: 'var(--color-text)',
                }}
              >
                <option value="🔴 High">🔴 High</option>
                <option value="🟡 Medium">🟡 Medium</option>
                <option value="🟢 Low">🟢 Low</option>
                <option value="">— Tanpa Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
                PIC (@username)
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
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
                Deadline
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

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
              Type / Kategori
            </label>
            <input
              type="text"
              placeholder="Contoh: UI, System, Core, Feature, Bug"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border outline-none"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-dim)' }}>
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              placeholder="Detail tugas atau penjelasan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border outline-none resize-none font-medium"
              style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2">
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
              + Tambah Fitur
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
