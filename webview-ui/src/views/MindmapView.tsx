import { useEffect, useRef, useMemo, useState } from 'react'
import { Markmap } from 'markmap-view'
import { Transformer } from 'markmap-lib'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  HelpCircle,
  X,
  Edit3,
  Columns,
  Check,
  MousePointer,
  GitBranch,
  Trash2,
  Hand,
  Plus,
  EyeOff,
  SlidersHorizontal,
} from 'lucide-react'
import { useAppStore } from '../hooks/useAppStore'
import { flattenFeatures, generateFeatureId, isTodoItem } from '../models/feature'
import type { FeatureNode, ViewVisibilityOptions } from '../models/feature'

const transformer = new Transformer()

const MINDMAP_COLORS = ['#818cf8', '#a78bfa', '#38bdf8', '#34d399', '#f472b6', '#fbbf24']

interface ContextMenuState {
  x: number
  y: number
  node: FeatureNode | null
}

function buildMetaBadgeString(node: FeatureNode, config: ViewVisibilityOptions): string {
  const badges: string[] = []

  if (config.showStatus && node.metadata.status) {
    const s = node.metadata.status.toLowerCase()
    let dotColor = '#94a3b8'
    if (s.includes('done') || s.includes('selesai')) dotColor = '#22c55e'
    else if (s.includes('prog') || s.includes('jalan')) dotColor = '#eab308'
    else if (s.includes('todo') || s.includes('pending') || s.includes('open')) dotColor = '#ef4444'

    badges.push(`<span class="mdflow-badge"><span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${dotColor};margin-right:3px;"></span>${node.metadata.status}</span>`)
  }

  if (config.showPriority && node.metadata.priority) {
    const p = node.metadata.priority.toLowerCase()
    let pColor = '#94a3b8'
    if (p.includes('high') || p.includes('urgent') || p.includes('tinggi')) pColor = '#ef4444'
    else if (p.includes('med') || p.includes('sedang')) pColor = '#eab308'
    else if (p.includes('low') || p.includes('rendah')) pColor = '#3b82f6'

    badges.push(`<span class="mdflow-badge" style="color:${pColor};">${node.metadata.priority}</span>`)
  }

  if (config.showPic && node.metadata.pic) {
    badges.push(`<span class="mdflow-badge">👤 ${node.metadata.pic}</span>`)
  }

  if (config.showDeadline && node.metadata.deadline) {
    badges.push(`<span class="mdflow-badge">📅 ${node.metadata.deadline}</span>`)
  }

  if (config.showType && node.metadata.type) {
    badges.push(`<span class="mdflow-badge">🏷️ ${node.metadata.type}</span>`)
  }

  const excludeFromCustom = ['status', 'priority', 'pic', 'deadline', 'type', 'image', 'img', 'thumbnail', 'cover', 'link', 'url', 'href', 'website', 'todo', 'task']
  if (config.showCustomMeta !== false) {
    for (const [k, v] of Object.entries(node.metadata)) {
      if (v && !excludeFromCustom.includes(k.toLowerCase())) {
        badges.push(`<span class="mdflow-badge">${k}: ${v}</span>`)
      }
    }
  }

  if (badges.length === 0) return ''
  return `<span class="mdflow-badge-wrap">${badges.join('')}</span>`
}

function buildNodeLabel(node: FeatureNode, config: ViewVisibilityOptions): string {
  let label = node.title

  const badgeStr = buildMetaBadgeString(node, config)
  if (badgeStr) {
    label += ` ${badgeStr}`
  }

  const imgUrl = node.metadata.image || node.metadata.img || node.metadata.thumbnail || node.metadata.cover
  if (config.showImage && imgUrl) {
    label += `<br><img src="${imgUrl}" style="max-width: 140px; max-height: 80px; border-radius: 8px; margin-top: 4px; display: inline-block; border: 1px solid rgba(255,255,255,0.2);" onError="this.style.display='none'" />`
  }

  const linkUrl = node.metadata.link || node.metadata.url || node.metadata.href || node.metadata.website
  if (config.showLink && linkUrl) {
    const fullLink = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
    label += `<br><a href="${fullLink}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; font-size: 11px; font-weight: bold; text-decoration: underline;">🔗 Buka Link</a>`
  }

  if (config.showDescription && node.description && node.description.trim()) {
    const cleanDesc = node.description
      .replace(/^\s*\*\*(?:desc|deskripsi):\*\*\s*/i, '')
      .replace(/^\s*\*\*(?:desc|deskripsi)\*\*:\s*/i, '')
      .replace(/^\s*(?:desc|deskripsi):\s*/i, '')
      .trim()
    if (cleanDesc) {
      const shortDesc = cleanDesc.replace(/\n/g, ' ').slice(0, 55)
      label += `<br><span class="mdflow-desc-text">📝 ${shortDesc}${cleanDesc.length > 55 ? '...' : ''}</span>`
    }
  }

  return label
}

function featuresToMarkdown(nodes: FeatureNode[], config: ViewVisibilityOptions, depth = 0): string {
  return nodes
    .map((node) => {
      const indent = '  '.repeat(depth)
      const label = buildNodeLabel(node, config)
      const header = `${indent}- ${label}`
      const children = featuresToMarkdown(node.children, config, depth + 1)
      return children ? `${header}\n${children}` : header
    })
    .join('\n')
}

export function MindmapView() {
  const { state, dispatch } = useAppStore()
  const svgRef = useRef<SVGSVGElement>(null)
  const markmapRef = useRef<Markmap | null>(null)
  const lastFileName = useRef<string | null>(null)

  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false)
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false)
  const [interactMode, setInteractMode] = useState<'pan' | 'drag'>('drag')
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [isBatchMoveOpen, setIsBatchMoveOpen] = useState(false)
  const [isBatchStatusOpen, setIsBatchStatusOpen] = useState(false)

  const [dragInfo, setDragInfo] = useState<{
    sourceNode: FeatureNode
    isMulti: boolean
    count: number
    cursorX: number
    cursorY: number
    targetTitle: string | null
  } | null>(null)

  const displayConfig = state.columnConfig.mindmap

  const toggleDisplayOption = (key: keyof typeof displayConfig) => {
    dispatch({
      type: 'SET_COLUMN_CONFIG',
      payload: {
        ...state.columnConfig,
        mindmap: {
          ...state.columnConfig.mindmap,
          [key]: !state.columnConfig.mindmap[key],
        },
      },
    })
  }

  const allFlat = useMemo(() => flattenFeatures(state.features), [state.features])
  const activeNode = useMemo(
    () => (state.selectedFeatureId ? allFlat.find((f) => f.id === state.selectedFeatureId) : null),
    [state.selectedFeatureId, allFlat]
  )

  const markdownStr = useMemo(() => {
    if (state.features.length === 0) return ''
    const root = state.features.length === 1 ? state.features[0] : null
    if (root) {
      const rootLabel = buildNodeLabel(root, displayConfig)
      return `# ${rootLabel}\n${featuresToMarkdown(root.children, displayConfig, 0)}`
    }
    return `# Project Map\n${featuresToMarkdown(state.features, displayConfig, 0)}`
  }, [state.features, displayConfig])

  useEffect(() => {
    if (!svgRef.current || !markdownStr) return

    const { root } = transformer.transform(markdownStr)
    let colorIdx = 0

    if (markmapRef.current) {
      markmapRef.current.setData(root)

      if (lastFileName.current !== state.fileName) {
        lastFileName.current = state.fileName
        markmapRef.current.fit()
      }
    } else {
      markmapRef.current = Markmap.create(
        svgRef.current,
        {
          color: () => MINDMAP_COLORS[colorIdx++ % MINDMAP_COLORS.length],
          duration: 300,
          spacingVertical: 10,
          spacingHorizontal: 100,
          fitRatio: 0.95,
          paddingX: 30,
          autoFit: false,
        },
        root
      )
      lastFileName.current = state.fileName
      markmapRef.current.fit()
    }
  }, [markdownStr, state.fileName])

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const removeHrefs = () => {
      svgEl.querySelectorAll('a').forEach((link) => {
        if (link.hasAttribute('href')) {
          link.removeAttribute('href')
          link.style.cursor = 'pointer'
        }
      })
    }

    removeHrefs()

    const observer = new MutationObserver(removeHrefs)
    observer.observe(svgEl, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [markdownStr])

  useEffect(() => {
    const mm = markmapRef.current
    if (mm && mm.zoom) {
      mm.zoom.filter((event: any) => {
        if (event.button === 2) return true
        if (interactMode === 'drag' && event.button === 0 && event.target.closest('.markmap-node')) {
          return false
        }
        return true
      })
    }
  }, [markdownStr, interactMode])

  const findNodeFromElement = (el: Element | null): FeatureNode | null => {
    if (!el) return null
    const nodeEl = el.closest('.markmap-node')
    if (!nodeEl) return null

    const textEl = nodeEl.querySelector('text, foreignObject, div, span')
    const rawText = (textEl?.textContent || '').trim().toLowerCase()
    if (!rawText) return null

    return (
      allFlat.find((f: FeatureNode) => {
        const clean = f.title.toLowerCase().trim()
        return rawText.startsWith(clean) || rawText.includes(clean) || clean.includes(rawText)
      }) || null
    )
  }

  useEffect(() => {
    const syncNodeHighlights = () => {
      const svgEl = svgRef.current
      if (!svgEl) return

      svgEl.querySelectorAll('.markmap-node').forEach((nodeEl) => {
        const node = findNodeFromElement(nodeEl)
        if (node) {
          if (state.selectedFeatureId && node.id === state.selectedFeatureId) {
            nodeEl.classList.add('markmap-node-active')
          } else {
            nodeEl.classList.remove('markmap-node-active')
          }

          if (selectedNodeIds.has(node.id)) {
            nodeEl.classList.add('markmap-node-selected')
          } else {
            nodeEl.classList.remove('markmap-node-selected')
          }
        }
      })
    }

    syncNodeHighlights()
    const timers = [
      setTimeout(syncNodeHighlights, 60),
      setTimeout(syncNodeHighlights, 180),
      setTimeout(syncNodeHighlights, 340),
      setTimeout(syncNodeHighlights, 550),
    ]

    const svgEl = svgRef.current
    if (!svgEl) return () => timers.forEach(clearTimeout)

    const observer = new MutationObserver(() => {
      syncNodeHighlights()
    })
    observer.observe(svgEl, { childList: true, subtree: true })

    return () => {
      timers.forEach(clearTimeout)
      observer.disconnect()
    }
  }, [state.selectedFeatureId, selectedNodeIds, allFlat, markdownStr])

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    let currentSourceNode: FeatureNode | null = null
    let startX = 0
    let startY = 0
    let isDragging = false
    let isCtrlPressed = false
    let isAltPressed = false

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return

      isCtrlPressed = e.ctrlKey || e.metaKey
      isAltPressed = e.altKey
      const target = e.target as HTMLElement
      const nodeEl = target.closest('.markmap-node')

      if (nodeEl) {
        const node = findNodeFromElement(nodeEl)
        if (node) {
          e.stopPropagation()
          currentSourceNode = node
          startX = e.clientX
          startY = e.clientY
          isDragging = false
        }
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!currentSourceNode) return

      const dist = Math.hypot(e.clientX - startX, e.clientY - startY)

      if (dist > 6) {
        isDragging = true

        const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY)
        let targetTitle: string | null = null

        svgEl.querySelectorAll('.markmap-drop-target').forEach((el) => {
          el.classList.remove('markmap-drop-target')
        })

        for (const el of elementsUnder) {
          const targetNodeEl = el.closest('.markmap-node')
          if (targetNodeEl && targetNodeEl !== svgEl) {
            const targetNode = findNodeFromElement(targetNodeEl)
            if (targetNode && targetNode.id !== currentSourceNode.id) {
              targetTitle = targetNode.title
              targetNodeEl.classList.add('markmap-drop-target')
              break
            }
          }
        }

        const isMulti = selectedNodeIds.has(currentSourceNode.id) && selectedNodeIds.size > 1

        setDragInfo({
          sourceNode: currentSourceNode,
          isMulti,
          count: isMulti ? selectedNodeIds.size : 1,
          cursorX: e.clientX,
          cursorY: e.clientY,
          targetTitle,
        })
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (currentSourceNode) {
        if (isDragging) {
          const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY)
          for (const el of elementsUnder) {
            const targetNodeEl = el.closest('.markmap-node')
            if (targetNodeEl) {
              const targetNode = findNodeFromElement(targetNodeEl)
              if (targetNode && targetNode.id !== currentSourceNode.id) {
                if (selectedNodeIds.has(currentSourceNode.id) && selectedNodeIds.size > 1) {
                  const filtered = Array.from(selectedNodeIds).filter((id) => id !== targetNode.id)
                  dispatch({
                    type: 'BATCH_REPARENT_NODES',
                    payload: { sourceIds: filtered, targetParentId: targetNode.id },
                  })
                  setSelectedNodeIds(new Set())
                } else {
                  dispatch({
                    type: 'REPARENT_FEATURE_NODE',
                    payload: { sourceId: currentSourceNode.id, targetParentId: targetNode.id },
                  })
                }
                break
              }
            }
          }
        } else {
          if (isCtrlPressed || isAltPressed) {
            setSelectedNodeIds((prev) => {
              const next = new Set(prev)
              if (next.has(currentSourceNode!.id)) next.delete(currentSourceNode!.id)
              else next.add(currentSourceNode!.id)
              return next
            })
          } else {
            setSelectedNodeIds(new Set())
            dispatch({ type: 'SELECT_FEATURE', payload: currentSourceNode.id })
          }
        }

        currentSourceNode = null
        isDragging = false
        setDragInfo(null)
        svgEl.querySelectorAll('.markmap-drop-target').forEach((el) => {
          el.classList.remove('markmap-drop-target')
        })
      }
    }

    svgEl.addEventListener('pointerdown', handlePointerDown, { capture: true })
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      svgEl.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFlat, selectedNodeIds, dispatch])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const nodeEl = target.closest('.markmap-node')
    const node = nodeEl ? findNodeFromElement(nodeEl) : null

    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }

  useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    window.addEventListener('click', closeMenu)
    return () => window.removeEventListener('click', closeMenu)
  }, [])

  const handleToggleSelectNode = (node: FeatureNode) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(node.id)) next.delete(node.id)
      else next.add(node.id)
      return next
    })
  }

  const handleAddSubItemFromMenu = (node: FeatureNode) => {
    dispatch({ type: 'OPEN_NEW_FEATURE_MODAL', payload: node.id })
  }

  const handleToggleTodoFromMenu = (node: FeatureNode) => {
    const isTodo = isTodoItem(node)
    const updatedMeta = { ...node.metadata }
    if (isTodo) {
      updatedMeta.todo = 'false'
      delete updatedMeta.status
    } else {
      updatedMeta.todo = 'true'
      if (!updatedMeta.status) updatedMeta.status = '🔴 Todo'
    }
    dispatch({
      type: 'UPDATE_FEATURE_NODE',
      payload: { id: node.id, updates: { metadata: updatedMeta } },
    })
  }

  const handleSetStatusFromMenu = (node: FeatureNode, status: string) => {
    dispatch({
      type: 'UPDATE_FEATURE_NODE',
      payload: { id: node.id, updates: { metadata: { ...node.metadata, status } } },
    })
  }

  const handleDeleteNodeFromMenu = (node: FeatureNode) => {
    if (confirm(`Hapus item "${node.title}" beserta sub-cabangnya?`)) {
      dispatch({ type: 'DELETE_FEATURE_NODE', payload: { id: node.id } })
    }
  }

  const handleAddNewItemRoot = () => {
    const newId = generateFeatureId('Item Baru')
    const newNode: FeatureNode = {
      id: newId,
      title: 'Item Baru',
      level: 1,
      description: '',
      metadata: {},
      children: [],
    }
    dispatch({ type: 'ADD_FEATURE_NODE', payload: { parentId: null, node: newNode } })
  }

  const handleBatchReparent = (targetParentId: string | null) => {
    const ids = Array.from(selectedNodeIds)
    if (ids.length === 0) return
    dispatch({ type: 'BATCH_REPARENT_NODES', payload: { sourceIds: ids, targetParentId } })
    setIsBatchMoveOpen(false)
    setSelectedNodeIds(new Set())
  }

  const handleBatchStatus = (status: string) => {
    const ids = Array.from(selectedNodeIds)
    if (ids.length === 0) return
    dispatch({ type: 'BATCH_UPDATE_STATUS', payload: { ids, status } })
    setIsBatchStatusOpen(false)
    setSelectedNodeIds(new Set())
  }

  const handleBatchDelete = () => {
    const ids = Array.from(selectedNodeIds)
    if (ids.length === 0) return
    if (confirm(`Hapus ${ids.length} node terpilih beserta sub-cabangnya?`)) {
      dispatch({ type: 'BATCH_DELETE_NODES', payload: { ids } })
      setSelectedNodeIds(new Set())
    }
  }

  const handleMakeRoot = () => {
    if (dragInfo?.sourceNode) {
      if (dragInfo.isMulti) {
        dispatch({ type: 'BATCH_REPARENT_NODES', payload: { sourceIds: Array.from(selectedNodeIds), targetParentId: null } })
        setSelectedNodeIds(new Set())
      } else {
        dispatch({ type: 'REPARENT_FEATURE_NODE', payload: { sourceId: dragInfo.sourceNode.id, targetParentId: null } })
      }
      setDragInfo(null)
    }
  }

  useEffect(() => {
    return () => {
      markmapRef.current?.destroy()
      markmapRef.current = null
    }
  }, [])

  if (state.features.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p style={{ color: 'var(--color-text-dim)' }} className="text-sm mb-4">
          Tidak ada item untuk divisualisasikan.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden select-none">
      {/* Active Selected Node Floating Badge */}
      {activeNode && (
        <div
          onClick={() => dispatch({ type: 'OPEN_DETAIL', payload: activeNode.id })}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border shadow-xl cursor-pointer transition-all hover:scale-105 active:scale-95 glass-panel"
          style={{ borderColor: 'var(--color-brand)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
          title="Klik untuk membuka panel detail & edit item ini"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold" style={{ color: 'var(--color-brand)' }}>Sedang Aktif:</span>
          <span className="text-xs font-bold truncate max-w-[200px]" style={{ color: 'var(--color-text)' }}>{activeNode.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-dim)' }}>
            H{activeNode.level}
          </span>
        </div>
      )}

      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center gap-2">
        {isToolbarCollapsed ? (
          <button
            onClick={() => setIsToolbarCollapsed(false)}
            title="Tampilkan Kontrol Canvas (Pan, Zoom, Fit, Kolom)"
            className="p-3 rounded-2xl border glass-panel shadow-2xl transition-transform hover:scale-110 cursor-pointer"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-brand)', color: 'var(--color-brand)' }}
          >
            <SlidersHorizontal size={18} />
          </button>
        ) : (
          <div
            className="flex flex-col items-center gap-2 p-2 rounded-2xl border glass-panel shadow-2xl select-none"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <button
              onClick={() => setIsToolbarCollapsed(true)}
              title="Sembunyikan Toolbar"
              className="p-2 rounded-xl transition-colors cursor-pointer"
              style={{ color: 'var(--color-text-dim)' }}
            >
              <EyeOff size={15} />
            </button>

            <div className="w-6 h-px" style={{ background: 'var(--color-border)' }} />

            <div className="flex flex-col gap-1 p-1 rounded-xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setInteractMode('pan')}
                title="Mode Pan (Geser Kamera)"
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{
                  background: interactMode === 'pan' ? 'var(--color-brand)' : 'transparent',
                  color: interactMode === 'pan' ? '#050c14' : 'var(--color-text-dim)',
                }}
              >
                <Hand size={14} />
              </button>
              <button
                onClick={() => setInteractMode('drag')}
                title="Mode Tarik Node (Pindah Hierarki)"
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{
                  background: interactMode === 'drag' ? 'var(--color-brand)' : 'transparent',
                  color: interactMode === 'drag' ? '#050c14' : 'var(--color-text-dim)',
                }}
              >
                <GitBranch size={14} />
              </button>
            </div>

            <div className="w-6 h-px" style={{ background: 'var(--color-border)' }} />

            <button
              onClick={() => markmapRef.current?.rescale(1.25)}
              title="Zoom In"
              className="p-2 rounded-xl transition-colors cursor-pointer"
              style={{ color: 'var(--color-text)' }}
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => markmapRef.current?.rescale(0.8)}
              title="Zoom Out"
              className="p-2 rounded-xl transition-colors cursor-pointer"
              style={{ color: 'var(--color-text)' }}
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={() => markmapRef.current?.fit()}
              title="Reset Posisi & Fit View"
              className="p-2 rounded-xl transition-colors cursor-pointer"
              style={{ color: 'var(--color-text)' }}
            >
              <Maximize2 size={16} />
            </button>

            <div className="w-6 h-px" style={{ background: 'var(--color-border)' }} />

            <div className="relative">
              <button
                onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                title="Pilih data / badge yang ingin ditampilkan di Mindmap"
                className="p-2 rounded-xl transition-colors cursor-pointer flex flex-col items-center gap-0.5"
                style={{ color: isColumnMenuOpen ? 'var(--color-brand)' : 'var(--color-text)' }}
              >
                <Columns size={16} />
              </button>

              {isColumnMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setIsColumnMenuOpen(false)} />
                  <div
                    className="absolute right-full bottom-0 mr-3 w-64 rounded-2xl border shadow-2xl p-2.5 z-30 space-y-1 glass-panel"
                    style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b pb-1.5 mb-1" style={{ color: 'var(--color-text-dim)', borderColor: 'var(--color-border)' }}>
                      TAMPILKAN KOLOM & BADGE
                    </div>
                    {[
                      { key: 'showStatus' as const, label: 'Status Dot' },
                      { key: 'showPriority' as const, label: 'Priority' },
                      { key: 'showType' as const, label: 'Type' },
                      { key: 'showPic' as const, label: 'PIC' },
                      { key: 'showDeadline' as const, label: 'Deadline' },
                      { key: 'showImage' as const, label: '🖼 Gambar Cover' },
                      { key: 'showLink' as const, label: '🔗 Tautan Link' },
                      { key: 'showDescription' as const, label: 'Deskripsi Singkat' },
                      { key: 'showCustomMeta' as const, label: 'Kolom Metadata Kustom' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => toggleDisplayOption(key)}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left font-medium cursor-pointer transition-colors"
                        style={{ color: 'var(--color-text)' }}
                      >
                        <span>{label}</span>
                        {displayConfig[key] && <Check size={14} style={{ color: 'var(--color-brand)' }} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              title="Panduan Navigasi & Gestur Mindmap"
              className="p-2 rounded-xl transition-colors cursor-pointer flex flex-col items-center gap-0.5"
              style={{ color: isHelpOpen ? 'var(--color-brand)' : 'var(--color-text)' }}
            >
              <HelpCircle size={16} />
            </button>
          </div>
        )}
      </div>

      {dragInfo && (
        <div
          className="fixed pointer-events-none z-50 px-3.5 py-2 rounded-xl shadow-2xl border flex items-center gap-2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-md"
          style={{ left: dragInfo.cursorX, top: dragInfo.cursorY, background: 'rgba(79, 70, 229, 0.95)', borderColor: '#818cf8', color: 'white' }}
        >
          <GitBranch size={14} className="text-indigo-200" />
          <div className="flex flex-col">
            <span className="text-xs font-bold leading-tight">
              {dragInfo.isMulti ? `📦 ${dragInfo.count} Item Terpilih` : dragInfo.sourceNode.title}
            </span>
            <span className="text-[10px] text-indigo-200">
              {dragInfo.targetTitle ? `➔ Pindahkan ke: "${dragInfo.targetTitle}"` : 'Tarik ke node target'}
            </span>
          </div>
        </div>
      )}

      {dragInfo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-2xl border shadow-xl bg-indigo-950/90 border-indigo-500 text-white text-xs font-semibold">
          <GitBranch size={15} className="text-indigo-400" />
          <span>
            {dragInfo.targetTitle
              ? `Lepas untuk jadikan sub-cabang dari "${dragInfo.targetTitle}"`
              : 'Arahkan kursor ke node target untuk memindahkan hierarki'}
          </span>
          <button onClick={handleMakeRoot} className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer ml-2">
            Jadikan Root (Level 1)
          </button>
        </div>
      )}

      {selectedNodeIds.size > 0 && !dragInfo && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-2.5 rounded-2xl border shadow-2xl glass-panel select-none"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-primary)' }}
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              {selectedNodeIds.size}
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>Node Terpilih (Kanan/Ctrl+Klik)</span>
          </div>

          <div className="w-px h-5 bg-slate-700" />

          <div className="relative">
            <button
              onClick={() => { setIsBatchMoveOpen(!isBatchMoveOpen); setIsBatchStatusOpen(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <GitBranch size={13} className="text-indigo-400" />
              <span>Pindah Parent...</span>
            </button>

            {isBatchMoveOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsBatchMoveOpen(false)} />
                <div className="absolute bottom-11 left-0 w-64 max-h-56 overflow-y-auto rounded-2xl border shadow-2xl p-2 z-50 glass-panel space-y-1"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-dim)' }}>
                    Pilih Target Parent:
                  </div>
                  <button
                    onClick={() => handleBatchReparent(null)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    style={{ color: 'var(--color-brand)' }}
                  >
                    ■ Jadikan Root (Level 1)
                  </button>
                  {allFlat
                    .filter((f: FeatureNode) => !selectedNodeIds.has(f.id))
                    .map((f: FeatureNode) => (
                      <button
                        key={f.id}
                        onClick={() => handleBatchReparent(f.id)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate cursor-pointer transition-colors"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {'—'.repeat(Math.max(0, f.level - 1))} {f.title} (H{f.level})
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setIsBatchStatusOpen(!isBatchStatusOpen); setIsBatchMoveOpen(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors"
              style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              <Check size={13} className="text-emerald-400" />
              <span>Ubah Status...</span>
            </button>

            {isBatchStatusOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsBatchStatusOpen(false)} />
                <div className="absolute bottom-11 left-0 w-48 rounded-2xl border shadow-2xl p-2 z-50 glass-panel space-y-1"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase" style={{ color: 'var(--color-text-dim)' }}>
                    Set Status Semua:
                  </div>
                  {state.customStatuses.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleBatchStatus(st.label)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer transition-colors"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: st.color }} />
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleBatchDelete}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-semibold border border-red-800/60 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Hapus</span>
          </button>

          <button
            onClick={() => setSelectedNodeIds(new Set())}
            className="p-1 rounded-lg cursor-pointer transition-colors"
            style={{ color: 'var(--color-text-dim)' }}
            title="Batalkan pilihan"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {isHelpOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsHelpOpen(false)} />
          <div
            className="absolute top-16 right-4 w-88 p-5 rounded-2xl border shadow-2xl z-30 glass-panel space-y-3 select-none"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <HelpCircle size={16} style={{ color: 'var(--color-brand)' }} />
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>Panduan Gestur Mindmap</h4>
              </div>
              <button onClick={() => setIsHelpOpen(false)} className="cursor-pointer transition-colors" style={{ color: 'var(--color-text-dim)' }}>
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-xl shrink-0" style={{ background: 'var(--color-surface-2)', color: 'var(--color-brand)' }}>
                  <GitBranch size={14} />
                </div>
                <div>
                  <strong className="font-semibold" style={{ color: 'var(--color-text)' }}>Tarik Node (Mode Tarik):</strong> Aktifkan mode tarik di toolbar, lalu seret node dengan klik kiri untuk pindah parent.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-xl shrink-0" style={{ background: 'var(--color-surface-2)', color: 'var(--color-brand)' }}>
                  <Check size={14} />
                </div>
                <div>
                  <strong className="font-semibold" style={{ color: 'var(--color-text)' }}>Konteks Menu (Klik Kanan):</strong> Klik kanan node untuk menu edit cepat, tambah sub-item, hapus, dan seleksi multi-item.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-xl shrink-0" style={{ background: 'var(--color-surface-2)', color: '#38bdf8' }}>
                  <MousePointer size={14} />
                </div>
                <div>
                  <strong className="font-semibold" style={{ color: 'var(--color-text)' }}>Geser Canvas (Pan):</strong> Klik dan tahan area kosong lalu geser.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-xl shrink-0" style={{ background: 'var(--color-surface-2)', color: '#f59e0b' }}>
                  <ZoomIn size={14} />
                </div>
                <div>
                  <strong className="font-semibold" style={{ color: 'var(--color-text)' }}>Zoom In / Out:</strong> Scroll mouse atau tombol +/- di toolbar.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {contextMenu && (
        <div
          className="fixed w-52 rounded-2xl border shadow-2xl p-1.5 z-50 glass-panel space-y-0.5 select-none"
          style={{ left: contextMenu.x, top: contextMenu.y, background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {contextMenu.node ? (
            <>
              <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: 'var(--color-text-dim)' }}>
                {contextMenu.node.title}
              </div>
              <button
                onClick={() => dispatch({ type: 'SELECT_FEATURE', payload: contextMenu.node!.id })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]"
                style={{ color: 'var(--color-text)' }}
              >
                <Edit3 size={13} style={{ color: 'var(--color-brand)' }} /> Pilih Node
              </button>
              <button
                onClick={() => handleToggleSelectNode(contextMenu.node!)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]"
                style={{ color: 'var(--color-text)' }}
              >
                <span className="flex items-center gap-2">
                  <Check size={13} className="text-sky-400" />
                  <span>Pilih / Seleksi Item</span>
                </span>
                {selectedNodeIds.has(contextMenu.node.id) && <Check size={13} className="text-sky-400" />}
              </button>
              <button
                onClick={() => handleAddSubItemFromMenu(contextMenu.node!)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]"
                style={{ color: 'var(--color-text)' }}
              >
                <Plus size={13} className="text-emerald-400" /> Tambah Sub-item
              </button>

              <button
                onClick={() => handleToggleTodoFromMenu(contextMenu.node!)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]"
                style={{ color: isTodoItem(contextMenu.node!) ? 'var(--color-brand)' : 'var(--color-text-dim)' }}
              >
                {isTodoItem(contextMenu.node!) ? (
                  <>
                    <Check size={13} style={{ color: 'var(--color-brand)' }} />
                    <span>✓ Bagian Dari To Do (Task)</span>
                  </>
                ) : (
                  <>
                    <Plus size={13} style={{ color: 'var(--color-text-dim)' }} />
                    <span>Tandai Sebagai To Do</span>
                  </>
                )}
              </button>

              <div className="h-px my-1" style={{ background: 'var(--color-border)' }} />
              <div className="px-3 py-1 text-[9px] font-bold uppercase" style={{ color: 'var(--color-text-dim)' }}>Urutan / Posisi</div>
              <div className="grid grid-cols-2 gap-1 px-2 pb-1">
                <button
                  onClick={() => dispatch({ type: 'REORDER_FEATURE_NODE', payload: { id: contextMenu.node!.id, direction: 'up' } })}
                  className="px-2 py-1 border rounded-lg text-[10px] text-center cursor-pointer font-bold transition-colors"
                  style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  ▲ Naik
                </button>
                <button
                  onClick={() => dispatch({ type: 'REORDER_FEATURE_NODE', payload: { id: contextMenu.node!.id, direction: 'down' } })}
                  className="px-2 py-1 border rounded-lg text-[10px] text-center cursor-pointer font-bold transition-colors"
                  style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  ▼ Turun
                </button>
              </div>

              <div className="h-px my-1" style={{ background: 'var(--color-border)' }} />
              <div className="px-3 py-1 text-[9px] font-bold uppercase" style={{ color: 'var(--color-text-dim)' }}>Ubah Status</div>
              {state.customStatuses.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleSetStatusFromMenu(contextMenu.node!, st.label)}
                  className="w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] text-left cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: st.color }} />
                  <span>{st.label}</span>
                </button>
              ))}

              <div className="h-px my-1" style={{ background: 'var(--color-border)' }} />
              <button
                onClick={() => handleDeleteNodeFromMenu(contextMenu.node!)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors"
                style={{ color: '#ef4444' }}
              >
                <Trash2 size={13} /> Hapus
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAddNewItemRoot}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]"
                style={{ color: 'var(--color-text)' }}
              >
                <Plus size={13} className="text-emerald-400" /> Tambah Item Utama
              </button>
              <button
                onClick={() => markmapRef.current?.fit()}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]"
                style={{ color: 'var(--color-text)' }}
              >
                <Maximize2 size={13} style={{ color: 'var(--color-brand)' }} /> Fit View
              </button>
              {selectedNodeIds.size > 0 && (
                <button
                  onClick={() => setSelectedNodeIds(new Set())}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]"
                  style={{ color: 'var(--color-text)' }}
                >
                  <X size={13} style={{ color: 'var(--color-text-dim)' }} /> Bersihkan Seleksi
                </button>
              )}
            </>
          )}
        </div>
      )}

      <svg
        ref={svgRef}
        onContextMenu={handleContextMenu}
        onClickCapture={(e) => {
          const target = e.target as HTMLElement
          if (target.closest('.markmap-node') || target.closest('a')) {
            e.preventDefault()
          }
        }}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing"
        style={{ background: 'transparent' }}
      />
    </div>
  )
}
