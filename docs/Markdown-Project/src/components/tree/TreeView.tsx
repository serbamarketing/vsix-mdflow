import { useState, useMemo } from 'react'
import { ChevronRight, Plus, User, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/hooks/useAppStore'
import { getStatusColor, generateFeatureId } from '@/models/feature'
import type { FeatureNode } from '@/models/feature'

export function TreeView() {
  const { state, dispatch } = useAppStore()
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!state.searchQuery) return state.features
    const q = state.searchQuery.toLowerCase()
    return filterTree(state.features, q)
  }, [state.features, state.searchQuery])

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAddRoot = () => {
    const newId = generateFeatureId('Fitur Utama')
    const newNode: FeatureNode = {
      id: newId,
      title: 'Fitur Utama Baru',
      level: 1,
      description: '',
      metadata: { status: '🔴 Todo' },
      children: [],
    }
    dispatch({
      type: 'ADD_FEATURE_NODE',
      payload: { parentId: null, node: newNode },
    })
  }

  if (state.features.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-dim)' }}>
          Tidak ada data feature.
        </p>
        <button
          onClick={handleAddRoot}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={16} /> Buat Fitur Pertama
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top action header */}
      <div
        className="flex items-center justify-between px-6 py-2.5 border-b shrink-0 text-xs"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <span style={{ color: 'var(--color-text-dim)' }}>
          Struktur Hierarki Pohon Dokumen
        </span>
        <button
          onClick={handleAddRoot}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={13} /> Tambah Root
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-1">
        {filtered.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            openIds={openIds}
            onToggle={toggleOpen}
          />
        ))}
      </div>
    </div>
  )
}

function TreeNode({
  node,
  depth,
  openIds,
  onToggle,
}: {
  node: FeatureNode
  depth: number
  openIds: Set<string>
  onToggle: (id: string) => void
}) {
  const { dispatch, state } = useAppStore()
  const isOpen = openIds.has(node.id)
  const hasChildren = node.children.length > 0
  const isSelected = state.selectedFeatureId === node.id
  const statusColor = getStatusColor(node.metadata.status, state.customStatuses)

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newId = generateFeatureId('Sub-fitur')
    const newNode: FeatureNode = {
      id: newId,
      title: 'Sub-fitur Baru',
      level: node.level + 1,
      description: '',
      metadata: {},
      children: [],
    }
    dispatch({
      type: 'ADD_FEATURE_NODE',
      payload: { parentId: node.id, node: newNode },
    })
    if (!isOpen) onToggle(node.id)
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-100 group select-none border"
        style={{
          marginLeft: `${depth * 18}px`,
          background: isSelected ? 'var(--color-surface-2)' : 'transparent',
          borderColor: isSelected ? 'var(--color-primary)' : 'transparent',
        }}
        onClick={() => {
          dispatch({ type: 'SELECT_FEATURE', payload: node.id })
          if (hasChildren) onToggle(node.id)
        }}
        onMouseEnter={(e) => {
          if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface)'
        }}
        onMouseLeave={(e) => {
          if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
        }}
      >
        {/* Toggle Icon */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggle(node.id)
          }}
          className="w-5 h-5 flex items-center justify-center shrink-0 cursor-pointer"
        >
          {hasChildren ? (
            <motion.span
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              className="inline-flex"
              style={{ color: 'var(--color-text-dim)' }}
            >
              <ChevronRight size={14} />
            </motion.span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-border)' }} />
          )}
        </button>

        {/* Status Dot */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColor }} />

        {/* Heading Level indicator */}
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0"
          style={{ background: 'var(--color-surface-3)', color: 'var(--color-accent)' }}
        >
          H{node.level}
        </span>

        {/* Title */}
        <span
          className="text-sm font-semibold flex-1 truncate"
          style={{ color: 'var(--color-text)' }}
        >
          {node.title}
        </span>

        {/* Metadata badges on row */}
        <div className="flex items-center gap-1.5 shrink-0">
          {node.metadata.status && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: statusColor, background: 'var(--color-surface-2)' }}>
              {node.metadata.status}
            </span>
          )}

          {node.metadata.priority && (
            <span className="text-[11px] px-2 py-0.5 rounded-md font-medium text-amber-400" style={{ background: 'var(--color-surface-2)' }}>
              {node.metadata.priority}
            </span>
          )}

          {node.metadata.pic && (
            <span className="text-[11px] px-2 py-0.5 rounded-md font-medium text-sky-400 flex items-center gap-1" style={{ background: 'var(--color-surface-2)' }}>
              <User size={10} /> {node.metadata.pic}
            </span>
          )}

          {node.metadata.deadline && (
            <span className="text-[11px] px-2 py-0.5 rounded-md font-medium text-rose-400 flex items-center gap-1" style={{ background: 'var(--color-surface-2)' }}>
              <Calendar size={10} /> {node.metadata.deadline}
            </span>
          )}
        </div>

        {/* Quick Add Sub-feature Button on Hover */}
        <button
          onClick={handleAddChild}
          title="Tambah Sub-fitur"
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-opacity cursor-pointer text-xs flex items-center gap-1"
          style={{ background: 'var(--color-primary)', color: 'white' }}
        >
          <Plus size={12} /> Sub
        </button>
      </div>

      {/* Children Animated Collapsible */}
      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                openIds={openIds}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function filterTree(nodes: FeatureNode[], query: string): FeatureNode[] {
  const result: FeatureNode[] = []
  for (const node of nodes) {
    const matchesSelf =
      node.title.toLowerCase().includes(query) ||
      node.description?.toLowerCase().includes(query) ||
      Object.values(node.metadata).some((v) => v.toLowerCase().includes(query))
    const filteredChildren = filterTree(node.children, query)
    if (matchesSelf || filteredChildren.length > 0) {
      result.push({ ...node, children: filteredChildren })
    }
  }
  return result
}
