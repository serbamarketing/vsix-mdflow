import { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  CheckCircle2,
  Sliders,
  ExternalLink,
  GripVertical,
  Check,
} from 'lucide-react'
import { useAppStore } from '../hooks/useAppStore'
import { flattenFeatures, getStatusColor, generateFeatureId, findFeatureById } from '../models/feature'
import type { FeatureNode, ColumnVisibilityConfig } from '../models/feature'

const monthNamesId = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const dayNamesId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function normalizeDate(rawStr?: string): string | null {
  if (!rawStr || !rawStr.trim()) return null
  const clean = rawStr.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(clean)) return clean.replace(/\//g, '-')

  const dmy = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dmy) {
    const day = dmy[1].padStart(2, '0')
    const month = dmy[2].padStart(2, '0')
    const year = dmy[3]
    return `${year}-${month}-${day}`
  }

  const parsed = new Date(clean)
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return null
}

export function CalendarView() {
  const { state, dispatch } = useAppStore()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDateCell, setSelectedDateCell] = useState<string | null>(null)
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false)

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const allFlat = useMemo(() => flattenFeatures(state.features), [state.features])

  const calConfig = state.columnConfig.calendar || {
    showStatus: true,
    showPriority: true,
    showPic: true,
    showType: true,
    showImage: true,
    showLink: false,
  }

  const toggleCalendarCol = (key: keyof typeof calConfig) => {
    const updated: ColumnVisibilityConfig = {
      ...state.columnConfig,
      calendar: { ...calConfig, [key]: !calConfig[key] },
    }
    dispatch({ type: 'SET_COLUMN_CONFIG', payload: updated })
  }

  const { itemsWithDeadline, unscheduledItems } = useMemo(() => {
    const withDate: { node: FeatureNode; dateKey: string }[] = []
    const unscheduled: FeatureNode[] = []

    for (const item of allFlat) {
      const normalized = normalizeDate(item.metadata.deadline)
      if (normalized) {
        withDate.push({ node: item, dateKey: normalized })
      } else {
        unscheduled.push(item)
      }
    }

    return { itemsWithDeadline: withDate, unscheduledItems: unscheduled }
  }, [allFlat])

  const itemsByDate = useMemo(() => {
    const map: Record<string, FeatureNode[]> = {}
    for (const { node, dateKey } of itemsWithDeadline) {
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(node)
    }
    return map
  }, [itemsWithDeadline])

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: { date: number; fullDate: string; isCurrentMonth: boolean; isToday: boolean }[] = []
    const todayStr = new Date().toISOString().split('T')[0]

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i
      const prevM = month === 0 ? 12 : month
      const prevY = month === 0 ? year - 1 : year
      const fullDate = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ date: d, fullDate, isCurrentMonth: false, isToday: fullDate === todayStr })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ date: d, fullDate, isCurrentMonth: true, isToday: fullDate === todayStr })
    }

    const remaining = (7 - (days.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
      const nextM = month === 11 ? 1 : month + 2
      const nextY = month === 11 ? year + 1 : year
      const fullDate = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ date: d, fullDate, isCurrentMonth: false, isToday: fullDate === todayStr })
    }

    return days
  }, [year, month])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  const handleQuickAddForDate = (dateStr: string) => {
    const newId = generateFeatureId('Task Baru')
    const newNode: FeatureNode = {
      id: newId,
      title: 'Task Baru',
      level: 2,
      description: '',
      metadata: { status: '🔴 Todo', deadline: dateStr },
      children: [],
    }
    dispatch({ type: 'ADD_FEATURE_NODE', payload: { parentId: null, node: newNode } })
  }

  const handleQuickSetToday = (item: FeatureNode) => {
    const todayStr = new Date().toISOString().split('T')[0]
    dispatch({
      type: 'UPDATE_FEATURE_NODE',
      payload: { id: item.id, updates: { metadata: { ...item.metadata, deadline: todayStr } } },
    })
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation()
    setDraggedItemId(id)
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, fullDate: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverDate !== fullDate) setDragOverDate(fullDate)
  }

  const handleDragLeave = (e: React.DragEvent, fullDate: string) => {
    e.preventDefault()
    if (dragOverDate === fullDate) setDragOverDate(null)
  }

  const handleDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault()
    setDragOverDate(null)
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId
    setDraggedItemId(null)

    if (!itemId) return

    const targetNode = findFeatureById(state.features, itemId)
    if (!targetNode) return

    dispatch({
      type: 'UPDATE_FEATURE_NODE',
      payload: { id: targetNode.id, updates: { metadata: { ...targetNode.metadata, deadline: targetDateStr } } },
    })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none">
      <div
        className="flex items-center justify-between px-6 py-3 border-b shrink-0 text-xs flex-wrap gap-2"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} style={{ color: 'var(--color-brand)' }} />
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              {monthNamesId[month]} {year}
            </h3>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg border cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} title="Bulan sebelumnya">
              <ChevronLeft size={14} />
            </button>
            <button onClick={goToToday} className="px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer hover:bg-[var(--color-surface-3)] transition-colors" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)' }}>
              Hari Ini
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg border cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }} title="Bulan berikutnya">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="relative">
            <button
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)' }}
            >
              <Sliders size={13} style={{ color: 'var(--color-brand)' }} />
              <span>Tampilan Kolom</span>
            </button>

            {isColumnDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsColumnDropdownOpen(false)} />
                <div
                  className="absolute right-0 mt-2 w-60 rounded-2xl border shadow-2xl p-2.5 z-30 space-y-1 glass-panel"
                  style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border-b pb-1.5 mb-1" style={{ color: 'var(--color-text-dim)', borderColor: 'var(--color-border)' }}>
                    TAMPILKAN KOLOM & BADGE
                  </div>
                  {[
                    { key: 'showStatus' as const, label: 'Status Dot' },
                    { key: 'showPriority' as const, label: 'Badge Prioritas' },
                    { key: 'showPic' as const, label: 'Badge PIC' },
                    { key: 'showType' as const, label: 'Badge Level Tipe' },
                    { key: 'showImage' as const, label: 'Gambar Thumbnail' },
                    { key: 'showLink' as const, label: 'Tautan Eksternal' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleCalendarCol(key)}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left font-medium cursor-pointer transition-colors"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <span>{label}</span>
                      {calConfig[key] && <Check size={14} style={{ color: 'var(--color-brand)' }} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <span style={{ color: 'var(--color-text-dim)' }}>
            📅 Terjadwal: <strong style={{ color: 'var(--color-text)' }}>{itemsWithDeadline.length}</strong> items
          </span>
          <span style={{ color: 'var(--color-text-dim)' }}>
            ⏳ Belum Terjadwal: <strong style={{ color: 'var(--color-progress)' }}>{unscheduledItems.length}</strong> items
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div
            className="grid grid-cols-7 border-b shrink-0 text-center text-xs font-bold py-2"
            style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            {dayNamesId.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-px p-px" style={{ background: 'var(--color-border)' }}>
            {calendarDays.map((d, idx) => {
              const dayItems = itemsByDate[d.fullDate] || []
              const isSelected = selectedDateCell === d.fullDate
              const isDragTarget = dragOverDate === d.fullDate

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDateCell(d.fullDate)}
                  onDragOver={(e) => handleDragOver(e, d.fullDate)}
                  onDragLeave={(e) => handleDragLeave(e, d.fullDate)}
                  onDrop={(e) => handleDrop(e, d.fullDate)}
                  className={`min-h-[110px] p-2 flex flex-col transition-all border group relative ${isDragTarget ? 'ring-2 ring-[var(--color-brand)] bg-[var(--color-brand-glow)] z-20 scale-[1.01]' : ''} ${isSelected ? 'ring-2 ring-[var(--color-brand)] z-10' : ''}`}
                  style={{
                    background: isDragTarget ? 'var(--color-surface-3)' : d.isCurrentMonth ? 'var(--color-surface)' : 'var(--color-surface-2)',
                    opacity: d.isCurrentMonth ? 1 : 0.5,
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${d.isToday ? 'bg-[var(--color-brand)] text-slate-950 shadow-md font-bold' : ''}`}
                      style={{ color: d.isToday ? '#050c14' : 'var(--color-text-muted)' }}
                    >
                      {d.date}
                    </span>

                    <div className="flex items-center gap-1">
                      {dayItems.length > 0 && (
                        <span className="text-[10px] font-mono font-semibold" style={{ color: 'var(--color-text-dim)' }}>
                          {dayItems.length}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQuickAddForDate(d.fullDate) }}
                        title={`Tambah task pada tanggal ${d.fullDate}`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--color-brand)] hover:bg-[var(--color-surface-2)] transition-opacity cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5 overflow-y-auto">
                    {dayItems.map((item) => {
                      const color = getStatusColor(item.metadata.status, state.customStatuses)
                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT_FEATURE', payload: item.id }) }}
                          className="p-1.5 rounded-lg border text-left cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] shadow-sm group/card relative"
                          style={{
                            background: state.selectedFeatureId === item.id ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
                            borderColor: state.selectedFeatureId === item.id ? 'var(--color-brand)' : 'var(--color-border)',
                          }}
                        >
                          {calConfig.showImage && item.metadata.image && (
                            <div className="w-full h-12 rounded mb-1 overflow-hidden bg-slate-900/50">
                              <img
                                src={item.metadata.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none' }}
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <GripVertical size={10} className="text-[var(--color-text-dim)] opacity-40 group-hover/card:opacity-100 shrink-0" />
                            {calConfig.showStatus && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />}
                            <span className="text-[11px] font-semibold truncate flex-1" style={{ color: 'var(--color-text)' }}>
                              {item.title}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {calConfig.showType && (
                              <span className="text-[9px] font-mono text-[var(--color-text-dim)] font-semibold">H{item.level}</span>
                            )}
                            {calConfig.showPriority && item.metadata.priority && (
                              <span className="text-[9px] font-medium text-amber-500">{item.metadata.priority}</span>
                            )}
                            {calConfig.showPic && item.metadata.pic && (
                              <span className="text-[9px] text-sky-500 flex items-center gap-0.5">
                                <User size={8} /> {item.metadata.pic}
                              </span>
                            )}
                            {calConfig.showLink && item.metadata.link && (
                              <a
                                href={item.metadata.link}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[9px] text-rose-400 flex items-center gap-0.5 hover:underline"
                              >
                                <ExternalLink size={8} /> Link
                              </a>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {unscheduledItems.length > 0 && (
          <div className="w-72 border-l flex flex-col shrink-0 overflow-hidden" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-1.5">
                <Clock size={14} style={{ color: 'var(--color-progress)' }} />
                <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>Item Tanpa Deadline</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-dim)' }}>
                {unscheduledItems.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-[11px] leading-relaxed mb-2" style={{ color: 'var(--color-text-dim)' }}>
                Geser & lepas (Drag & drop) item ke sel kalender untuk mengatur deadline:
              </p>
              {unscheduledItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onClick={() => dispatch({ type: 'SELECT_FEATURE', payload: item.id })}
                  className="p-2.5 rounded-xl border text-left cursor-grab active:cursor-grabbing transition-all hover:border-[var(--color-brand)]/50 group"
                  style={{
                    background: state.selectedFeatureId === item.id ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
                    borderColor: state.selectedFeatureId === item.id ? 'var(--color-brand)' : 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center gap-1.5 justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <GripVertical size={11} className="text-[var(--color-text-dim)] opacity-40 group-hover:opacity-100 shrink-0" />
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getStatusColor(item.metadata.status, state.customStatuses) }} />
                      <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>{item.title}</span>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickSetToday(item) }}
                      title="Jadwalkan untuk hari ini"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all text-[10px] font-medium flex items-center gap-0.5 cursor-pointer"
                      style={{ color: 'var(--color-brand)' }}
                    >
                      <CheckCircle2 size={11} /> Hari Ini
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
                    <span className="font-mono">H{item.level}</span>
                    {item.metadata.status && (
                      <span style={{ color: getStatusColor(item.metadata.status, state.customStatuses) }}>{item.metadata.status}</span>
                    )}
                    {item.metadata.pic && (
                      <span className="text-sky-500 flex items-center gap-0.5">
                        <User size={9} /> {item.metadata.pic}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
