import { useState, useMemo, useEffect } from 'react'
import { Plus, User, Calendar, Tag, ChevronRight, Layers, Check, LayoutGrid, Trash2, ChevronUp, ChevronDown, ExternalLink, CheckSquare } from 'lucide-react'
import { useAppStore } from '../hooks/useAppStore'
import { flattenFeatures, getStatusColor, generateFeatureId, isTodoItem } from '../models/feature'
import type { FeatureNode, StatusDefinition } from '../models/feature'

type GroupByType = 'status' | 'priority' | 'pic' | 'type'

export function KanbanView() {
  const { state, dispatch } = useAppStore()
  const [groupBy, setGroupBy] = useState<GroupByType>('status')
  const [onlyTodoItems, setOnlyTodoItems] = useState(true)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'before' | 'after'>('after')
  const [newStatusName, setNewStatusName] = useState('')
  const [isAddingStatus, setIsAddingStatus] = useState(false)
  const [isBadgeDropdownOpen, setIsBadgeDropdownOpen] = useState(false)

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; feature: FeatureNode } | null>(null)

  const allFlat = useMemo(() => flattenFeatures(state.features), [state.features])

  useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const uniquePics = useMemo(() => {
    const pics = new Set<string>()
    for (const f of allFlat) {
      const pic = f.metadata.pic?.trim()
      if (pic) pics.add(pic)
    }
    return Array.from(pics)
  }, [allFlat])

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>()
    for (const f of allFlat) {
      const t = f.metadata.type?.trim()
      if (t) types.add(t)
    }
    return Array.from(types)
  }, [allFlat])

  const columns = useMemo((): StatusDefinition[] => {
    if (groupBy === 'priority') {
      return [
        { id: '🔴 High', label: '🔴 High', color: '#ef4444' },
        { id: '🟡 Medium', label: '🟡 Medium', color: '#eab308' },
        { id: '🟢 Low', label: '🟢 Low', color: '#22c55e' },
        { id: 'no-priority', label: '— Tanpa Prioritas', color: '#64748b' },
      ]
    }
    if (groupBy === 'pic') {
      const cols: StatusDefinition[] = uniquePics.map((pic) => ({ id: pic, label: pic, color: '#38bdf8' }))
      cols.push({ id: 'no-pic', label: '— Tanpa PIC', color: '#64748b' })
      return cols
    }
    if (groupBy === 'type') {
      const cols: StatusDefinition[] = uniqueTypes.map((t) => ({ id: t, label: t, color: '#a78bfa' }))
      cols.push({ id: 'no-type', label: '— Tanpa Tipe', color: '#64748b' })
      return cols
    }
    const list: StatusDefinition[] = [...state.customStatuses]
    list.push({ id: 'no-status', label: '— Tanpa Status', color: '#64748b' })
    return list
  }, [groupBy, state.customStatuses, uniquePics, uniqueTypes])

  const byColumn = useMemo(() => {
    const map: Record<string, FeatureNode[]> = {}
    for (const col of columns) {
      map[col.id] = []
    }

    const items = onlyTodoItems ? allFlat.filter((f) => isTodoItem(f)) : allFlat

    for (const f of items) {
      if (groupBy === 'priority') {
        const p = f.metadata.priority?.trim()
        if (p && map[p]) map[p].push(f)
        else map['no-priority'].push(f)
      } else if (groupBy === 'pic') {
        const pic = f.metadata.pic?.trim()
        if (pic && map[pic]) map[pic].push(f)
        else map['no-pic'].push(f)
      } else if (groupBy === 'type') {
        const t = f.metadata.type?.trim()
        if (t && map[t]) map[t].push(f)
        else map['no-type'].push(f)
      } else {
        const statusText = f.metadata.status?.trim()
        let matched = false
        if (statusText) {
          for (const col of state.customStatuses) {
            if (
              col.label.toLowerCase() === statusText.toLowerCase() ||
              statusText.toLowerCase().includes(col.id.toLowerCase()) ||
              col.label.toLowerCase().includes(statusText.toLowerCase())
            ) {
              map[col.id].push(f)
              matched = true
              break
            }
          }
        }
        if (!matched) map['no-status'].push(f)
      }
    }
    return map
  }, [allFlat, columns, groupBy, state.customStatuses, onlyTodoItems])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedId(id)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverColumn(null)
    setDragOverCardId(null)
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== colId) setDragOverColumn(colId)
  }

  const handleDragLeave = (colId: string) => {
    if (dragOverColumn === colId) setDragOverColumn(null)
  }

  const handleCardDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'

    if (draggedId === targetId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const pos = e.clientY < midY ? 'before' : 'after'

    setDragOverCardId(targetId)
    setDropPosition(pos)
  }

  const handleCardDragLeave = (targetId: string) => {
    if (dragOverCardId === targetId) {
      setDragOverCardId(null)
    }
  }

  const handleCardDrop = (e: React.DragEvent, targetFeature: FeatureNode, targetCol: StatusDefinition) => {
    e.preventDefault()
    e.stopPropagation()

    const sourceId = e.dataTransfer.getData('text/plain') || draggedId
    const currentPos = dropPosition

    setDraggedId(null)
    setDragOverColumn(null)
    setDragOverCardId(null)

    if (!sourceId || sourceId === targetFeature.id) return

    const sourceItem = allFlat.find((f) => f.id === sourceId)
    if (!sourceItem) return

    const updatedMeta = { ...sourceItem.metadata }
    if (groupBy === 'priority') {
      updatedMeta.priority = targetCol.id === 'no-priority' ? '' : targetCol.label
    } else if (groupBy === 'pic') {
      updatedMeta.pic = targetCol.id === 'no-pic' ? '' : targetCol.label
    } else if (groupBy === 'type') {
      updatedMeta.type = targetCol.id === 'no-type' ? '' : targetCol.label
    } else {
      updatedMeta.status = targetCol.id === 'no-status' ? '' : targetCol.label
    }

    dispatch({
      type: 'REORDER_NODE_RELATIVE',
      payload: {
        sourceId,
        targetId: targetFeature.id,
        position: currentPos,
        newMetadata: updatedMeta,
      },
    })
  }

  const handleDrop = (e: React.DragEvent, targetCol: StatusDefinition) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || draggedId
    setDraggedId(null)
    setDragOverColumn(null)
    setDragOverCardId(null)

    if (!id) return

    const item = allFlat.find((f) => f.id === id)
    if (!item) return

    const updatedMeta = { ...item.metadata }
    if (groupBy === 'priority') {
      updatedMeta.priority = targetCol.id === 'no-priority' ? '' : targetCol.label
    } else if (groupBy === 'pic') {
      updatedMeta.pic = targetCol.id === 'no-pic' ? '' : targetCol.label
    } else if (groupBy === 'type') {
      updatedMeta.type = targetCol.id === 'no-type' ? '' : targetCol.label
    } else {
      updatedMeta.status = targetCol.id === 'no-status' ? '' : targetCol.label
    }

    const cardsInCol = byColumn[targetCol.id] ?? []
    if (cardsInCol.length > 0 && !cardsInCol.some((c) => c.id === id)) {
      const lastCard = cardsInCol[cardsInCol.length - 1]
      dispatch({
        type: 'REORDER_NODE_RELATIVE',
        payload: {
          sourceId: id,
          targetId: lastCard.id,
          position: 'after',
          newMetadata: updatedMeta,
        },
      })
    } else {
      dispatch({ type: 'UPDATE_FEATURE_NODE', payload: { id, updates: { metadata: updatedMeta } } })
    }
  }

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatusName.trim()) return
    const id = newStatusName.toLowerCase().replace(/[^\w-]/g, '') || 'status'
    const newStatus: StatusDefinition = { id, label: newStatusName.trim(), color: '#38bdf8' }
    dispatch({ type: 'SET_CUSTOM_STATUSES', payload: [...state.customStatuses, newStatus] })
    setNewStatusName('')
    setIsAddingStatus(false)
  }

  const handleQuickAddCard = (col: StatusDefinition) => {
    const newId = generateFeatureId('Item Baru')
    const initialMeta: Record<string, string> = {}

    if (groupBy === 'priority') {
      if (col.id !== 'no-priority') initialMeta.priority = col.label
    } else if (groupBy === 'pic') {
      if (col.id !== 'no-pic') initialMeta.pic = col.label
    } else if (groupBy === 'type') {
      if (col.id !== 'no-type') initialMeta.type = col.label
    } else {
      if (col.id !== 'no-status') initialMeta.status = col.label
    }

    const newNode: FeatureNode = {
      id: newId,
      title: 'Item Baru',
      level: 2,
      description: '',
      metadata: initialMeta,
      children: [],
    }
    dispatch({ type: 'ADD_FEATURE_NODE', payload: { parentId: null, node: newNode } })
  }

  const handleSetStatus = (feature: FeatureNode, status: string) => {
    dispatch({ type: 'UPDATE_FEATURE_NODE', payload: { id: feature.id, updates: { metadata: { ...feature.metadata, status } } } })
  }

  const handleSetPriority = (feature: FeatureNode, priority: string) => {
    dispatch({ type: 'UPDATE_FEATURE_NODE', payload: { id: feature.id, updates: { metadata: { ...feature.metadata, priority } } } })
  }

  const handleSetPic = (feature: FeatureNode) => {
    const name = prompt('Masukkan nama PIC (@username):', feature.metadata.pic || '')
    if (name !== null) {
      dispatch({ type: 'UPDATE_FEATURE_NODE', payload: { id: feature.id, updates: { metadata: { ...feature.metadata, pic: name.trim() } } } })
    }
  }

  const handleDeleteCard = (feature: FeatureNode) => {
    if (confirm(`Hapus kartu "${feature.title}"?`)) {
      dispatch({ type: 'DELETE_FEATURE_NODE', payload: { id: feature.id } })
    }
  }

  const handleCreateFirstItem = () => {
    const newId = generateFeatureId('Item Baru')
    const newNode: FeatureNode = {
      id: newId,
      title: 'Item Baru',
      level: 1,
      description: '',
      metadata: { status: '🔴 Todo' },
      children: [],
    }
    dispatch({ type: 'ADD_FEATURE_NODE', payload: { parentId: null, node: newNode } })
  }

  if (state.features.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-dim)' }}>
          Belum ada item di dokumen ini.
        </p>
        <button
          onClick={handleCreateFirstItem}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={16} />
          Buat Item Pertama
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        className="flex items-center justify-between px-6 py-2.5 border-b shrink-0 text-xs"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--color-text-dim)' }}>Kelompokkan:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByType)}
              className="px-2.5 py-1 rounded-lg border outline-none font-semibold cursor-pointer"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="pic">PIC</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Switcher Filter To Do vs Tree */}
          <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              onClick={() => setOnlyTodoItems(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                onlyTodoItems
                  ? 'bg-[var(--color-brand)] text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hanya tampilkan item yang merupakan To Do / Task"
            >
              <CheckSquare size={13} />
              <span>Hanya Item To Do</span>
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-slate-950/20">
                {allFlat.filter((f) => isTodoItem(f)).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyTodoItems(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                !onlyTodoItems
                  ? 'bg-[var(--color-brand)] text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tampilkan semua item termasuk cabang/kategori pohon"
            >
              <Layers size={13} />
              <span>Semua Item Tree</span>
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-slate-950/20">
                {allFlat.length}
              </span>
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsBadgeDropdownOpen(!isBadgeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors"
              style={{
                background: isBadgeDropdownOpen ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <LayoutGrid size={13} style={{ color: 'var(--color-brand)' }} />
              <span>Tampilan Kolom</span>
            </button>

            {isBadgeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsBadgeDropdownOpen(false)} />
                <div
                  className="absolute right-0 mt-2 w-60 rounded-2xl border shadow-2xl p-2.5 z-30 space-y-1 glass-panel"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b pb-1.5 mb-1" style={{ color: 'var(--color-text-dim)', borderColor: 'var(--color-border)' }}>
                    TAMPILKAN KOLOM & BADGE
                  </div>
                  {[
                    { key: 'showStatus', label: 'Status Dot' },
                    { key: 'showPriority', label: 'Priority' },
                    { key: 'showType', label: 'Type' },
                    { key: 'showPic', label: 'PIC' },
                    { key: 'showDeadline', label: 'Deadline' },
                    { key: 'showImage', label: '🖼 Gambar Cover' },
                    { key: 'showLink', label: '🔗 Tautan Link' },
                    { key: 'showDescription', label: 'Deskripsi Singkat' },
                    { key: 'showSubCount', label: 'Jumlah Sub-item' },
                  ].map((item) => {
                    const isChecked = (state.columnConfig.kanban as Record<string, boolean>)[item.key] !== false
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          dispatch({
                            type: 'SET_COLUMN_CONFIG',
                            payload: {
                              ...state.columnConfig,
                              kanban: { ...state.columnConfig.kanban, [item.key]: !isChecked },
                            },
                          })
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left font-medium cursor-pointer transition-colors"
                        style={{ color: 'var(--color-text)' }}
                      >
                        <span>{item.label}</span>
                        {isChecked && <Check size={14} style={{ color: 'var(--color-brand)' }} />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {groupBy === 'status' && (
            <>
              {isAddingStatus ? (
                <form onSubmit={handleAddStatus} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Misal: 🔵 In Review"
                    value={newStatusName}
                    onChange={(e) => setNewStatusName(e.target.value)}
                    autoFocus
                    className="px-2.5 py-1 text-xs rounded-lg border outline-none"
                    style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-primary)', color: 'var(--color-text)' }}
                  />
                  <button type="submit" className="px-2.5 py-1 rounded-lg text-xs font-medium text-white cursor-pointer" style={{ background: 'var(--color-primary)' }}>
                    Simpan
                  </button>
                  <button type="button" onClick={() => setIsAddingStatus(false)} className="px-2 py-1 text-xs cursor-pointer transition-colors" style={{ color: 'var(--color-text-dim)' }}>
                    Batal
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingStatus(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
                >
                  <Plus size={13} />
                  <span>Tambah Kolom Status</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4 md:p-6">
        <div className="flex gap-3.5 h-full min-w-max items-start">
          {columns.map((col) => {
            const cards = byColumn[col.id] ?? []
            const isOver = dragOverColumn === col.id
            const colColor = col.color || getStatusColor(col.label, state.customStatuses)

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => handleDragLeave(col.id)}
                onDrop={(e) => handleDrop(e, col)}
                className={`flex flex-col w-64 md:w-68 max-h-full rounded-2xl border transition-all duration-200 ${isOver ? 'ring-2 shadow-xl scale-[1.01]' : ''}`}
                style={{
                  background: 'var(--color-surface)',
                  borderColor: isOver ? 'var(--color-primary)' : 'var(--color-border)',
                  boxShadow: isOver ? '0 0 24px var(--color-primary-glow)' : 'none',
                }}
              >
                <div className="px-3.5 py-2.5 border-b flex items-center justify-between gap-2 shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colColor }} />
                    <h3 className="text-xs font-bold truncate" style={{ color: 'var(--color-text)' }}>{col.label}</h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-semibold shrink-0" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                    {cards.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {cards.map((feature) => (
                    <KanbanCard
                      key={feature.id}
                      feature={feature}
                      isSelected={state.selectedFeatureId === feature.id}
                      isBeingDragged={draggedId === feature.id}
                      dragOverPosition={dragOverCardId === feature.id ? dropPosition : null}
                      onDragStart={(e) => handleDragStart(e, feature.id)}
                      onDragEnd={handleDragEnd}
                      onCardDragOver={(e) => handleCardDragOver(e, feature.id)}
                      onCardDragLeave={() => handleCardDragLeave(feature.id)}
                      onCardDrop={(e) => handleCardDrop(e, feature, col)}
                      onClick={() => dispatch({ type: 'SELECT_FEATURE', payload: feature.id })}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setContextMenu({ x: e.clientX, y: e.clientY, feature })
                      }}
                      customStatuses={state.customStatuses}
                      config={state.columnConfig.kanban}
                    />
                  ))}

                  {cards.length === 0 && (
                    <div
                      className="text-xs text-center py-10 rounded-xl border border-dashed flex flex-col items-center justify-center gap-1"
                      style={{ color: 'var(--color-text-dim)', borderColor: isOver ? 'var(--color-primary)' : 'var(--color-border)', background: isOver ? 'var(--color-surface-2)' : 'transparent' }}
                    >
                      <span>Geser kartu ke sini</span>
                    </div>
                  )}
                </div>

                <div className="p-2 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={() => handleQuickAddCard(col)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                    style={{ color: 'var(--color-text-dim)', background: 'var(--color-surface-2)' }}
                  >
                    <Plus size={13} />
                    Tambah Item
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed w-56 rounded-2xl border shadow-2xl p-1.5 z-50 glass-panel space-y-0.5 select-none text-xs"
            style={{ left: contextMenu.x, top: contextMenu.y, background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">
              {contextMenu.feature.title}
            </div>

            <div className="h-px my-1" style={{ background: 'var(--color-border)' }} />
            <div className="px-3 py-1 text-[9px] font-bold uppercase" style={{ color: 'var(--color-text-dim)' }}>Urutan / Posisi</div>
            <div className="grid grid-cols-2 gap-1 px-2.5 pb-1">
              <button
                onClick={() => { dispatch({ type: 'REORDER_FEATURE_NODE', payload: { id: contextMenu.feature.id, direction: 'up' } }); setContextMenu(null) }}
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] text-center cursor-pointer font-bold border transition-colors"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                <ChevronUp size={11} /> Naik
              </button>
              <button
                onClick={() => { dispatch({ type: 'REORDER_FEATURE_NODE', payload: { id: contextMenu.feature.id, direction: 'down' } }); setContextMenu(null) }}
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] text-center cursor-pointer font-bold border transition-colors"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                <ChevronDown size={11} /> Turun
              </button>
            </div>

            <div className="h-px my-1" style={{ background: 'var(--color-border)' }} />
            <div className="px-3 py-0.5 text-[9px] font-bold uppercase" style={{ color: 'var(--color-text-dim)' }}>Ubah Status</div>
            {state.customStatuses.map((st) => (
              <button
                key={st.id}
                onClick={() => { handleSetStatus(contextMenu.feature, st.label); setContextMenu(null) }}
                className="w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] text-left cursor-pointer transition-colors"
                style={{ color: 'var(--color-text)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                <span>{st.label}</span>
              </button>
            ))}

            <div className="h-px my-1" style={{ background: 'var(--color-border)' }} />
            <div className="px-3 py-0.5 text-[9px] font-bold uppercase" style={{ color: 'var(--color-text-dim)' }}>Ubah Prioritas</div>
            {['🔴 High', '🟡 Medium', '🟢 Low'].map((p) => (
              <button
                key={p}
                onClick={() => { handleSetPriority(contextMenu.feature, p); setContextMenu(null) }}
                className="w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] text-left cursor-pointer transition-colors"
                style={{ color: 'var(--color-text)' }}
              >
                <span>{p}</span>
              </button>
            ))}
            <button
              onClick={() => { handleSetPriority(contextMenu.feature, ''); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] text-left cursor-pointer transition-colors"
              style={{ color: 'var(--color-text-dim)' }}
            >
              — Hapus Prioritas
            </button>

            <div className="h-px my-1" style={{ background: 'var(--color-border)' }} />
            <button
              onClick={() => { handleSetPic(contextMenu.feature); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors"
              style={{ color: 'var(--color-text)' }}
            >
              <User size={13} className="text-sky-400" /> Assign PIC...
            </button>

            <div className="h-px bg-slate-800 my-1" />
            <button
              onClick={() => {
                const isTodo = isTodoItem(contextMenu.feature)
                const updatedMeta = { ...contextMenu.feature.metadata }
                if (isTodo) {
                  updatedMeta.todo = 'false'
                  delete updatedMeta.status
                } else {
                  updatedMeta.todo = 'true'
                  if (!updatedMeta.status) updatedMeta.status = '🔴 Todo'
                }
                dispatch({
                  type: 'UPDATE_FEATURE_NODE',
                  payload: { id: contextMenu.feature.id, updates: { metadata: updatedMeta } },
                })
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors"
              style={{ color: isTodoItem(contextMenu.feature) ? '#f43f5e' : 'var(--color-brand)' }}
            >
              {isTodoItem(contextMenu.feature) ? (
                <>
                  <Trash2 size={13} /> Keluarkan dari To Do (Kategori Saja)
                </>
              ) : (
                <>
                  <Check size={13} /> Masukkan ke To Do (Task)
                </>
              )}
            </button>

            <button
              onClick={() => { handleDeleteCard(contextMenu.feature); setContextMenu(null) }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer hover:bg-red-500/10 text-red-400"
            >
              <Trash2 size={13} /> Hapus Kartu
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function KanbanCard({
  feature,
  isSelected,
  isBeingDragged,
  dragOverPosition,
  onDragStart,
  onDragEnd,
  onCardDragOver,
  onCardDragLeave,
  onCardDrop,
  onClick,
  onContextMenu,
  customStatuses,
  config,
}: {
  feature: FeatureNode
  isSelected: boolean
  isBeingDragged: boolean
  dragOverPosition?: 'before' | 'after' | null
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onCardDragOver: (e: React.DragEvent) => void
  onCardDragLeave: () => void
  onCardDrop: (e: React.DragEvent) => void
  onClick: () => void
  onContextMenu: (e: React.MouseEvent) => void
  customStatuses: StatusDefinition[]
  config: {
    showDescription: boolean
    showPriority: boolean
    showType: boolean
    showPic: boolean
    showDeadline: boolean
    showSubCount: boolean
    showImage?: boolean
    showLink?: boolean
  }
}) {
  const statusColor = getStatusColor(feature.metadata.status, customStatuses)

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onCardDragOver}
      onDragLeave={onCardDragLeave}
      onDrop={onCardDrop}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`group relative p-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-100 select-none ${
        isSelected
          ? 'ring-2 ring-emerald-400 shadow-md shadow-emerald-500/20'
          : 'hover:border-slate-500'
      } ${
        dragOverPosition === 'before'
          ? 'border-t-2 !border-t-emerald-400 shadow-sm'
          : dragOverPosition === 'after'
          ? 'border-b-2 !border-b-emerald-400 shadow-sm'
          : ''
      }`}
      style={{
        opacity: isBeingDragged ? 0.35 : 1,
        background: isSelected ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
        borderColor: isSelected ? 'var(--color-brand)' : 'var(--color-border)',
      }}
    >
      {(config.showImage !== false) && (feature.metadata.image || feature.metadata.images || feature.metadata.thumbnail || feature.metadata.cover) && (
        <div className="mb-2 rounded-lg overflow-hidden border border-[var(--color-border)] shadow-sm">
          <img
            src={feature.metadata.image || feature.metadata.images || feature.metadata.thumbnail || feature.metadata.cover}
            alt={feature.title}
            className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}

      <div className="flex items-start gap-1.5">
        <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: statusColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-snug break-words" style={{ color: 'var(--color-text)' }}>{feature.title}</p>
        </div>
      </div>

      {config.showDescription && feature.description && (
        <p className="text-[10.5px] mt-1.5 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
          {feature.description.replace(/^\*\*(?:desc|deskripsi):\*\*\s*/i, '')}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1 mt-2">
        {config.showPriority && feature.metadata.priority && (
          <span className="text-[9.5px] px-1.5 py-0.2 rounded font-medium border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: '#f59e0b' }}>
            {feature.metadata.priority}
          </span>
        )}

        {config.showType && feature.metadata.type && (
          <span className="text-[9.5px] px-1.5 py-0.2 rounded font-medium border inline-flex items-center gap-0.5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: '#a78bfa' }}>
            <Tag size={8} />
            <span>{feature.metadata.type}</span>
          </span>
        )}

        {config.showPic && feature.metadata.pic && (
          <span className="text-[9.5px] px-1.5 py-0.2 rounded font-medium border inline-flex items-center gap-0.5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: '#38bdf8' }}>
            <User size={8} />
            <span>{feature.metadata.pic}</span>
          </span>
        )}

        {config.showDeadline && feature.metadata.deadline && (
          <span className="text-[9.5px] px-1.5 py-0.2 rounded font-medium border inline-flex items-center gap-0.5" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: '#f43f5e' }}>
            <Calendar size={8} />
            <span>{feature.metadata.deadline}</span>
          </span>
        )}

        {(config.showLink !== false) && (feature.metadata.link || feature.metadata.url || feature.metadata.href || feature.metadata.website) && (
          <a
            href={(feature.metadata.link || feature.metadata.url || feature.metadata.href || feature.metadata.website)?.startsWith('http') ? (feature.metadata.link || feature.metadata.url || feature.metadata.href || feature.metadata.website) : `https://${feature.metadata.link || feature.metadata.url || feature.metadata.href || feature.metadata.website}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-semibold border transition-colors"
            style={{ background: 'var(--color-brand-glow)', borderColor: 'var(--color-brand)', color: 'var(--color-brand)' }}
          >
            <span>Link</span>
            <ExternalLink size={8} />
          </a>
        )}

        {Object.entries(feature.metadata)
          .filter(([k]) => !['status', 'priority', 'type', 'pic', 'deadline', 'image', 'images', 'thumbnail', 'cover', 'link', 'url', 'href', 'website', 'todo', 'task'].includes(k.toLowerCase()))
          .map(([k, v]) => (
            <span key={k} className="text-[9px] px-1.5 py-0.2 rounded border font-mono truncate max-w-[120px]" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}>
              {k}:{v}
            </span>
          ))}
      </div>

      {config.showSubCount && feature.children.length > 0 && (
        <div className="mt-2 pt-1.5 flex items-center justify-between border-t text-[9.5px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}>
          <span className="flex items-center gap-1">
            <Layers size={10} />
            {feature.children.length} Sub-items
          </span>
          <ChevronRight size={10} />
        </div>
      )}
    </div>
  )
}
