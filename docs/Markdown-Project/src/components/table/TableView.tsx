import { useState, useMemo } from 'react'
import {
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Plus,
  User,
  Calendar,
  Columns,
  Check,
  FolderOpen,
  Folder,
  Trash2,
  CornerDownRight,
  GitBranch,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAppStore } from '@/hooks/useAppStore'
import { getStatusColor, getAllMetadataKeys, generateFeatureId, flattenFeatures } from '@/models/feature'
import type { FeatureNode } from '@/models/feature'

type SortDir = 'asc' | 'desc'

export function TableView() {
  const { state, dispatch } = useAppStore()
  const [sortKey, setSortKey] = useState<string>('default')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set())
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false)
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null)

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBatchMoveOpen, setIsBatchMoveOpen] = useState(false)
  const [isBatchStatusOpen, setIsBatchStatusOpen] = useState(false)

  const allFlat = useMemo(() => flattenFeatures(state.features), [state.features])
  const allMetaKeys = useMemo(() => getAllMetadataKeys(state.features), [state.features])

  // Get active visible columns from table config
  const visibleMetaKeys = useMemo(() => {
    return allMetaKeys.filter((key) => {
      if (state.columnConfig.table[key] !== undefined) {
        return state.columnConfig.table[key]
      }
      return true
    })
  }, [allMetaKeys, state.columnConfig.table])

  // Flatten tree recursively considering collapsed state
  const visibleTreeRows = useMemo(() => {
    function flattenTree(nodes: FeatureNode[], depth = 0): { node: FeatureNode; depth: number; hasChildren: boolean }[] {
      const list: { node: FeatureNode; depth: number; hasChildren: boolean }[] = []
      for (const node of nodes) {
        const hasChildren = node.children && node.children.length > 0
        list.push({ node, depth, hasChildren })
        if (hasChildren && !collapsedIds.has(node.id)) {
          list.push(...flattenTree(node.children, depth + 1))
        }
      }
      return list
    }

    let rows = flattenTree(state.features)

    // Filter by search query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase()
      rows = rows.filter(({ node }) => {
        const titleMatch = node.title.toLowerCase().includes(q)
        const descMatch = node.description?.toLowerCase().includes(q)
        const metaMatch = Object.values(node.metadata).some((v) => v.toLowerCase().includes(q))
        return titleMatch || descMatch || metaMatch
      })
    }

    // Filter by status/priority
    if (state.filters.status) {
      rows = rows.filter(({ node }) => node.metadata.status === state.filters.status)
    }
    if (state.filters.priority) {
      rows = rows.filter(({ node }) => node.metadata.priority === state.filters.priority)
    }

    // Sort if not default
    if (sortKey !== 'default') {
      rows.sort((a, b) => {
        let av = ''
        let bv = ''
        if (sortKey === 'title') {
          av = a.node.title
          bv = b.node.title
        } else if (sortKey === 'level') {
          av = String(a.node.level)
          bv = String(b.node.level)
        } else {
          av = a.node.metadata[sortKey] ?? ''
          bv = b.node.metadata[sortKey] ?? ''
        }
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      })
    }

    return rows
  }, [state.features, collapsedIds, state.searchQuery, state.filters, sortKey, sortDir])

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const collapseAll = () => {
    const allParentIds = new Set<string>()
    function collect(nodes: FeatureNode[]) {
      for (const n of nodes) {
        if (n.children.length > 0) {
          allParentIds.add(n.id)
          collect(n.children)
        }
      }
    }
    collect(state.features)
    setCollapsedIds(allParentIds)
  }

  const expandAll = () => {
    setCollapsedIds(new Set())
  }

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newColumnName.trim()) return
    dispatch({
      type: 'ADD_CUSTOM_COLUMN',
      payload: { key: newColumnName.trim() },
    })
    setNewColumnName('')
    setIsAddColumnModalOpen(false)
  }

  const handleDeleteColumn = (key: string) => {
    if (confirm(`Hapus kolom "${key}" beserta seluruh isinya dari semua item?`)) {
      dispatch({
        type: 'DELETE_CUSTOM_COLUMN',
        payload: { key },
      })
    }
  }

  const toggleColumnVisibility = (key: string) => {
    const current = state.columnConfig.table[key] ?? true
    dispatch({
      type: 'SET_COLUMN_CONFIG',
      payload: {
        ...state.columnConfig,
        table: { ...state.columnConfig.table, [key]: !current },
      },
    })
  }

  // Selection handlers
  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleTreeRows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleTreeRows.map((r) => r.node.id)))
    }
  }

  // Batch actions
  const handleBatchReparent = (targetParentId: string | null) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    dispatch({
      type: 'BATCH_REPARENT_NODES',
      payload: { sourceIds: ids, targetParentId },
    })
    setIsBatchMoveOpen(false)
    setSelectedIds(new Set())
  }

  const handleBatchStatus = (status: string) => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    dispatch({
      type: 'BATCH_UPDATE_STATUS',
      payload: { ids, status },
    })
    setIsBatchStatusOpen(false)
    setSelectedIds(new Set())
  }

  const handleBatchDelete = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    if (confirm(`Hapus ${ids.length} item terpilih beserta seluruh sub-cabangnya?`)) {
      dispatch({
        type: 'BATCH_DELETE_NODES',
        payload: { ids },
      })
      setSelectedIds(new Set())
    }
  }

  const handleBatchReorder = (direction: 'up' | 'down') => {
    if (selectedIds.size === 0) return
    const selectedList = visibleTreeRows
      .filter(({ node }) => selectedIds.has(node.id))
      .map(({ node }) => node.id)

    if (selectedList.length === 0) return

    const orderToProcess = direction === 'up' ? selectedList : [...selectedList].reverse()

    for (const id of orderToProcess) {
      dispatch({
        type: 'REORDER_FEATURE_NODE',
        payload: { id, direction },
      })
    }
  }

  // Drag and drop re-parenting handlers (supporting multi-drag)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedNodeId(id)
  }

  const handleDragEnd = () => {
    setDraggedNodeId(null)
    setDragOverNodeId(null)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverNodeId !== id) {
      setDragOverNodeId(id)
    }
  }

  const handleDrop = (e: React.DragEvent, targetParentId: string | null) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain') || draggedNodeId
    setDraggedNodeId(null)
    setDragOverNodeId(null)

    if (!sourceId || sourceId === targetParentId) return

    // If multiple items are selected and dragged item is one of them, move all selected
    if (selectedIds.has(sourceId) && selectedIds.size > 1) {
      const filtered = Array.from(selectedIds).filter((id) => id !== targetParentId)
      dispatch({
        type: 'BATCH_REPARENT_NODES',
        payload: { sourceIds: filtered, targetParentId },
      })
      setSelectedIds(new Set())
    } else {
      dispatch({
        type: 'REPARENT_FEATURE_NODE',
        payload: { sourceId, targetParentId },
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* Top Toolbar */}
      <div
        className="flex items-center justify-between px-6 py-2.5 border-b shrink-0 text-xs gap-3 select-none"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--color-text-dim)' }}>
            Total: <strong style={{ color: 'var(--color-text)' }}>{visibleTreeRows.length}</strong> items
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              title="Buka semua cabang hierarki"
            >
              <FolderOpen size={12} /> Expand Semua
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              title="Tutup semua cabang hierarki"
            >
              <Folder size={12} /> Collapse Semua
            </button>
          </div>

          <span className="hidden md:inline text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
            💡 <em>Centang beberapa baris untuk ubah urutan atau pindah hierarki bersamaan</em>
          </span>
        </div>

        {/* Action Controls: Columns Dropdown Only */}
        <div className="flex items-center gap-2 relative">
          {/* Drop area to make an item Root (H1) when dragging */}
          {draggedNodeId && (
            <div
              onDragOver={(e) => handleDragOver(e, 'root')}
              onDrop={(e) => handleDrop(e, null)}
              className="px-3 py-1 rounded-xl border border-dashed border-indigo-400 bg-indigo-500/20 text-indigo-300 text-xs font-semibold animate-pulse"
            >
              Lepas di sini untuk jadikan Root (Level 1)
            </div>
          )}

          {/* Columns Visibility & Delete Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors"
              style={{
                background: isColumnDropdownOpen ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
            >
              <Columns size={13} style={{ color: 'var(--color-brand)' }} />
              <span>Tampilan Kolom ({visibleMetaKeys.length})</span>
            </button>

            {isColumnDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsColumnDropdownOpen(false)} />
                <div
                  className="absolute right-0 mt-2 w-60 rounded-2xl border shadow-2xl p-2.5 z-30 glass-panel space-y-1"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-display border-b pb-1.5 mb-1" style={{ color: 'var(--color-text-dim)', borderColor: 'var(--color-border)' }}>
                    TAMPILKAN / SEMBUNYIKAN KOLOM
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                    {allMetaKeys.map((key) => {
                      const isVisible = state.columnConfig.table[key] ?? true
                      const isDefaultKey = ['status', 'priority', 'type', 'pic', 'deadline', 'image', 'link'].includes(key)
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors group cursor-pointer"
                          onClick={() => toggleColumnVisibility(key)}
                        >
                          <span className="text-xs font-medium capitalize" style={{ color: 'var(--color-text)' }}>{key}</span>
                          <div className="flex items-center gap-2">
                            {isVisible && <Check size={14} style={{ color: 'var(--color-brand)' }} />}
                            {!isDefaultKey && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteColumn(key) }}
                                title={`Hapus kolom "${key}"`}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-500 cursor-pointer transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="pt-1.5 mt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <button
                      onClick={() => {
                        setIsColumnDropdownOpen(false)
                        setIsAddColumnModalOpen(true)
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer font-display transition-colors"
                      style={{ background: 'var(--color-surface-2)', color: 'var(--color-brand)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                    >
                      <Plus size={13} /> + Tambah Kolom Kustom
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Database Tree Table */}
      <div className="flex-1 overflow-auto pb-16">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10" style={{ background: 'var(--color-surface-2)' }}>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {/* Checkbox Select All */}
              <th className="px-3 py-3 w-10 text-center select-none">
                <input
                  type="checkbox"
                  checked={visibleTreeRows.length > 0 && selectedIds.size === visibleTreeRows.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </th>

              {/* Feature Title with Tree Indent */}
              <th
                onClick={() => toggleSort('title')}
                className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none min-w-[300px]"
                style={{ color: sortKey === 'title' ? 'var(--color-primary)' : 'var(--color-text-dim)' }}
              >
                <span className="flex items-center gap-1">
                  Item / Task
                  {sortKey === 'title' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </span>
              </th>

              {/* Heading Level */}
              <th
                onClick={() => toggleSort('level')}
                className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none w-16"
                style={{ color: sortKey === 'level' ? 'var(--color-primary)' : 'var(--color-text-dim)' }}
              >
                Level
              </th>

              {/* Dynamic Metadata Columns */}
              {visibleMetaKeys.map((key) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="text-left px-3.5 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none capitalize whitespace-nowrap"
                  style={{ color: sortKey === key ? 'var(--color-primary)' : 'var(--color-text-dim)' }}
                >
                  <span className="flex items-center gap-1">
                    {key}
                    {sortKey === key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}

              {/* Inline Add Column Header Button (icon + only) */}
              <th className="px-2 py-3 text-left w-12">
                <button
                  onClick={() => setIsAddColumnModalOpen(true)}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  style={{ background: 'var(--color-surface)', color: 'var(--color-brand)', border: '1px dashed var(--color-brand)' }}
                  title="Tambah Kolom Metadata Baru"
                >
                  <Plus size={14} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleTreeRows.map(({ node, depth, hasChildren }) => (
              <TreeTableRow
                key={node.id}
                node={node}
                depth={depth}
                hasChildren={hasChildren}
                isCollapsed={collapsedIds.has(node.id)}
                onToggleCollapse={() => toggleCollapse(node.id)}
                visibleMetaKeys={visibleMetaKeys}
                onSelect={() => dispatch({ type: 'SELECT_FEATURE', payload: node.id })}
                isSelected={state.selectedFeatureId === node.id}
                isChecked={selectedIds.has(node.id)}
                onToggleCheck={(e) => toggleSelectRow(node.id, e)}
                customStatuses={state.customStatuses}
                isBeingDragged={draggedNodeId === node.id}
                isDragOver={dragOverNodeId === node.id}
                onDragStart={(e) => handleDragStart(e, node.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, node.id)}
                onDrop={(e) => handleDrop(e, node.id)}
              />
            ))}
          </tbody>
        </table>

        {visibleTreeRows.length === 0 && (
          <div className="p-12 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>
            Tidak ada item yang cocok dengan filter atau pencarian.
          </div>
        )}
      </div>

      {/* Floating Multi-Selection Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border shadow-2xl glass-panel select-none animate-in fade-in slide-in-from-bottom-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-brand)' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md"
              style={{ background: 'var(--color-brand)', color: '#050c14' }}
            >
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold font-display" style={{ color: 'var(--color-text)' }}>
              Item Terpilih
            </span>
          </div>

          <div className="w-px h-5" style={{ background: 'var(--color-border)' }} />

          {/* Batch Reorder Up / Down */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleBatchReorder('up')}
              title="Naikkan urutan semua item terpilih"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors font-display"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <ChevronUp size={13} style={{ color: 'var(--color-brand)' }} />
              <span>Naikkan</span>
            </button>
            <button
              onClick={() => handleBatchReorder('down')}
              title="Turunkan urutan semua item terpilih"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors font-display"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <ChevronDown size={13} style={{ color: 'var(--color-brand)' }} />
              <span>Turunkan</span>
            </button>
          </div>

          <div className="w-px h-5" style={{ background: 'var(--color-border)' }} />

          {/* Batch Move to Parent */}
          <div className="relative">
            <button
              onClick={() => {
                setIsBatchMoveOpen(!isBatchMoveOpen)
                setIsBatchStatusOpen(false)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors font-display"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <GitBranch size={13} style={{ color: 'var(--color-brand)' }} />
              <span>Pindah Parent...</span>
            </button>

            {isBatchMoveOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsBatchMoveOpen(false)} />
                <div
                  className="absolute bottom-11 left-0 w-64 max-h-56 overflow-y-auto rounded-2xl border shadow-2xl p-2 z-50 glass-panel space-y-1"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--color-text-dim)' }}>
                    Pilih Target Parent:
                  </div>
                  <button
                    onClick={() => handleBatchReparent(null)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-[var(--color-surface-2)]"
                    style={{ color: 'var(--color-brand)' }}
                  >
                    ■ Jadikan Root (Level 1)
                  </button>
                  {allFlat
                    .filter((f) => !selectedIds.has(f.id))
                    .map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleBatchReparent(f.id)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium truncate cursor-pointer hover:bg-[var(--color-surface-2)]"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {'—'.repeat(Math.max(0, f.level - 1))} {f.title} (H{f.level})
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>

          {/* Batch Status Change */}
          <div className="relative">
            <button
              onClick={() => {
                setIsBatchStatusOpen(!isBatchStatusOpen)
                setIsBatchMoveOpen(false)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors font-display"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <Check size={13} style={{ color: 'var(--color-brand)' }} />
              <span>Ubah Status...</span>
            </button>

            {isBatchStatusOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsBatchStatusOpen(false)} />
                <div
                  className="absolute bottom-11 left-0 w-48 rounded-2xl border shadow-2xl p-2 z-50 glass-panel space-y-1"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--color-text-dim)' }}>
                    Set Status Semua:
                  </div>
                  {state.customStatuses.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleBatchStatus(st.label)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 cursor-pointer hover:bg-[var(--color-surface-2)]"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: st.color }} />
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Batch Delete */}
          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer font-display"
            style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
          >
            <Trash2 size={13} />
            <span>Hapus</span>
          </button>

          {/* Cancel selection */}
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{ color: 'var(--color-text-dim)' }}
            title="Batalkan pilihan"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Modal Add Custom Column */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-sm p-6 rounded-3xl border shadow-2xl glass-panel space-y-4"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <Plus size={16} className="text-indigo-400" /> Tambah Kolom Metadata Baru
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Kolom baru akan langsung tersedia di Database Table, Mindmap, dan Kanban.
            </p>

            <form onSubmit={handleAddCustomColumn} className="space-y-3">
              <input
                type="text"
                placeholder="Misal: Sprint, Estimasi, Platform, PIC"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                autoFocus
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-medium"
                style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-xl cursor-pointer"
                  style={{ color: 'var(--color-text-dim)' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-xl cursor-pointer shadow-md"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  Tambah Kolom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function TreeTableRow({
  node,
  depth,
  hasChildren,
  isCollapsed,
  onToggleCollapse,
  visibleMetaKeys,
  onSelect,
  isSelected,
  isChecked,
  onToggleCheck,
  customStatuses,
  isBeingDragged,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  node: FeatureNode
  depth: number
  hasChildren: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  visibleMetaKeys: string[]
  onSelect: () => void
  isSelected: boolean
  isChecked: boolean
  onToggleCheck: (e: React.MouseEvent) => void
  customStatuses: { id: string; label: string; color: string }[]
  isBeingDragged: boolean
  isDragOver: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}) {
  const { dispatch } = useAppStore()
  const statusColor = getStatusColor(node.metadata.status, customStatuses)

  const handleAddSub = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newId = generateFeatureId('Sub-item')
    const newNode: FeatureNode = {
      id: newId,
      title: 'Sub-item Baru',
      level: node.level + 1,
      description: '',
      metadata: {},
      children: [],
    }
    dispatch({
      type: 'ADD_FEATURE_NODE',
      payload: { parentId: node.id, node: newNode },
    })
  }

  return (
    <tr
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      className={`cursor-grab active:cursor-grabbing transition-all duration-150 border-b select-none group ${
        isDragOver ? 'ring-2 ring-indigo-400 bg-indigo-950/40' : ''
      } ${isChecked ? 'bg-indigo-950/30' : ''}`}
      style={{
        opacity: isBeingDragged ? 0.35 : 1,
        borderColor: isDragOver ? 'var(--color-primary)' : 'var(--color-border)',
        background: isSelected ? 'var(--color-surface-2)' : isChecked ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!isSelected && !isDragOver && !isChecked) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--color-surface)'
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !isDragOver && !isChecked) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
      }}
    >
      {/* Selection Checkbox */}
      <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isChecked}
          onClick={onToggleCheck}
          onChange={() => {}}
          className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
        />
      </td>

      {/* Title with Tree Hierarchy Indent */}
      <td className="px-3 py-2.5 font-medium" style={{ color: 'var(--color-text)' }}>
        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 18}px` }}>
          {/* Expand / Collapse Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (hasChildren) onToggleCollapse()
            }}
            className="w-4 h-4 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            style={{ color: 'var(--color-text-dim)' }}
          >
            {hasChildren ? (
              <ChevronRight
                size={13}
                style={{
                  transform: !isCollapsed ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-border)' }} />
            )}
          </button>

          {/* Status Dot */}
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor }} />

          {/* Title */}
          <span className="font-semibold text-xs truncate max-w-sm" style={{ color: 'var(--color-text)' }}>{node.title}</span>

          {/* Quick + Sub on hover */}
          <button
            onClick={handleAddSub}
            title="Tambah sub-item ke baris ini"
            className="opacity-0 group-hover:opacity-100 p-0.5 px-1.5 rounded text-[10px] font-semibold transition-opacity ml-1 flex items-center gap-0.5 cursor-pointer font-display"
            style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}
          >
            <CornerDownRight size={10} /> Sub
          </button>
        </div>
      </td>

      {/* Level */}
      <td className="px-3 py-2.5">
        <code
          className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-accent)' }}
        >
          H{node.level}
        </code>
      </td>

      {/* Dynamic Metadata Columns */}
      {visibleMetaKeys.map((key) => {
        const val = node.metadata[key]
        if (!val) {
          return (
            <td key={key} className="px-3.5 py-2.5 text-xs" style={{ color: 'var(--color-text-dim)' }}>
              —
            </td>
          )
        }

        if (key === 'status') {
          return (
            <td key={key} className="px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap" style={{ color: statusColor }}>
              {val}
            </td>
          )
        }

        if (key === 'priority') {
          return (
            <td key={key} className="px-3.5 py-2.5 text-xs font-medium text-amber-500 whitespace-nowrap">
              {val}
            </td>
          )
        }

        if (key === 'pic') {
          return (
            <td key={key} className="px-3.5 py-2.5 text-xs text-sky-500 whitespace-nowrap">
              <span className="flex items-center gap-1">
                <User size={11} /> {val}
              </span>
            </td>
          )
        }

        if (key === 'deadline') {
          return (
            <td key={key} className="px-3.5 py-2.5 text-xs text-rose-500 whitespace-nowrap">
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {val}
              </span>
            </td>
          )
        }

        const lowerKey = key.toLowerCase()

        if (['image', 'img', 'thumbnail', 'cover', 'photo'].includes(lowerKey)) {
          return (
            <td key={key} className="px-3.5 py-2 text-xs whitespace-nowrap">
              <div className="flex items-center gap-2">
                <img
                  src={val}
                  alt={node.title}
                  className="w-9 h-9 rounded-xl object-cover border border-[var(--color-border)] shadow-sm hover:scale-125 transition-transform"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
                <span className="text-[10px] max-w-[120px] truncate" style={{ color: 'var(--color-text-dim)' }}>{val}</span>
              </div>
            </td>
          )
        }

        if (['link', 'url', 'href', 'website'].includes(lowerKey)) {
          return (
            <td key={key} className="px-3.5 py-2 text-xs whitespace-nowrap">
              <a
                href={val.startsWith('http') ? val : `https://${val}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-colors font-display"
                style={{
                  background: 'var(--color-brand-glow)',
                  borderColor: 'var(--color-brand)',
                  color: 'var(--color-brand)',
                }}
              >
                <span>Buka Link</span>
                <ExternalLink size={11} />
              </a>
            </td>
          )
        }

        return (
          <td key={key} className="px-3.5 py-2.5 text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
            {val}
          </td>
        )
      })}

      {/* Reordering & Action column */}
      <td className="px-3 py-2 text-center w-28" onClick={(e) => e.stopPropagation()}>
        <div className="opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity duration-150">
          <button
            onClick={() => dispatch({ type: 'REORDER_FEATURE_NODE', payload: { id: node.id, direction: 'up' } })}
            className="p-1 rounded border cursor-pointer transition-colors"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            title="Naikkan Urutan"
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={() => dispatch({ type: 'REORDER_FEATURE_NODE', payload: { id: node.id, direction: 'down' } })}
            className="p-1 rounded border cursor-pointer transition-colors"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            title="Turunkan Urutan"
          >
            <ChevronDown size={12} />
          </button>
          <button
            onClick={() => {
              if (confirm(`Hapus item "${node.title}" beserta sub-cabangnya?`)) {
                dispatch({ type: 'DELETE_FEATURE_NODE', payload: { id: node.id } })
              }
            }}
            className="p-1 rounded border cursor-pointer transition-colors ml-1"
            style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
            title="Hapus Item"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  )
}
