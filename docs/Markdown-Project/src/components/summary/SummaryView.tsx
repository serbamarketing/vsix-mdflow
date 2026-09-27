import { useMemo } from 'react'
import {
  PieChart,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  User,
  Calendar,
  Layers,
} from 'lucide-react'
import { useAppStore } from '@/hooks/useAppStore'
import { translations } from '@/data/translations'
import { flattenFeatures, getStatusColor } from '@/models/feature'
import type { FeatureNode } from '@/models/feature'

export function SummaryView() {
  const { state, dispatch } = useAppStore()
  const t = translations[state.language].summary

  const allFlat = useMemo(() => flattenFeatures(state.features), [state.features])
  const total = allFlat.length

  // Calculate status breakdown
  const statusStats = useMemo(() => {
    const counts: Record<string, { count: number; color: string; items: FeatureNode[] }> = {}

    // Initialize with standard statuses
    for (const st of state.customStatuses) {
      counts[st.label] = { count: 0, color: st.color, items: [] }
    }

    let unassignedCount = 0
    const unassignedItems: FeatureNode[] = []

    for (const item of allFlat) {
      const st = item.metadata.status
      if (!st || !st.trim()) {
        unassignedCount++
        unassignedItems.push(item)
      } else {
        const foundKey = Object.keys(counts).find((k) => k.toLowerCase() === st.toLowerCase())
        if (foundKey) {
          counts[foundKey].count++
          counts[foundKey].items.push(item)
        } else {
          const color = getStatusColor(st, state.customStatuses)
          counts[st] = { count: 1, color, items: [item] }
        }
      }
    }

    return { counts, unassignedCount, unassignedItems }
  }, [allFlat, state.customStatuses])

  // Done vs In Progress vs Todo counts
  const doneItems = useMemo(
    () => allFlat.filter((f) => f.metadata.status?.toLowerCase().includes('done') || f.metadata.status?.toLowerCase().includes('selesai')),
    [allFlat]
  )
  const progressItems = useMemo(
    () => allFlat.filter((f) => f.metadata.status?.toLowerCase().includes('progress') || f.metadata.status?.toLowerCase().includes('proses') || f.metadata.status?.toLowerCase().includes('doing')),
    [allFlat]
  )
  const todoItems = useMemo(
    () => allFlat.filter((f) => f.metadata.status?.toLowerCase().includes('todo') || f.metadata.status?.toLowerCase().includes('to-do')),
    [allFlat]
  )

  const completionRate = total > 0 ? Math.round((doneItems.length / total) * 100) : 0

  // Deadlines & Overdue analysis
  const { overdueItems, upcomingItems } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const overdue: FeatureNode[] = []
    const upcoming: FeatureNode[] = []

    for (const item of allFlat) {
      const isDone = item.metadata.status?.toLowerCase().includes('done') || item.metadata.status?.toLowerCase().includes('selesai')
      if (isDone) continue

      const deadline = item.metadata.deadline?.trim()
      if (deadline) {
        const d = new Date(deadline)
        if (!isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0)
          if (d < today) {
            overdue.push(item)
          } else if (d <= nextWeek) {
            upcoming.push(item)
          }
        }
      }
    }

    return { overdueItems: overdue, upcomingItems: upcoming }
  }, [allFlat])

  // PIC workload matrix
  const picStats = useMemo(() => {
    const map: Record<string, { total: number; done: number; inProgress: number; items: FeatureNode[] }> = {}
    for (const item of allFlat) {
      const pic = item.metadata.pic?.trim()
      if (pic) {
        if (!map[pic]) map[pic] = { total: 0, done: 0, inProgress: 0, items: [] }
        map[pic].total++
        map[pic].items.push(item)
        const isDone = item.metadata.status?.toLowerCase().includes('done') || item.metadata.status?.toLowerCase().includes('selesai')
        const isProg = item.metadata.status?.toLowerCase().includes('progress') || item.metadata.status?.toLowerCase().includes('proses')
        if (isDone) map[pic].done++
        if (isProg) map[pic].inProgress++
      }
    }
    return map
  }, [allFlat])

  // Priority Stats
  const priorityStats = useMemo(() => {
    const high = allFlat.filter((f) => f.metadata.priority?.toLowerCase().includes('high'))
    const medium = allFlat.filter((f) => f.metadata.priority?.toLowerCase().includes('medium'))
    const low = allFlat.filter((f) => f.metadata.priority?.toLowerCase().includes('low'))
    return { high, medium, low }
  }, [allFlat])

  // Hierarchy Level counts
  const levelStats = useMemo(() => {
    const root = allFlat.filter((f) => f.level === 1)
    const level2 = allFlat.filter((f) => f.level === 2)
    const level3Plus = allFlat.filter((f) => f.level >= 3)
    return { root, level2, level3Plus }
  }, [allFlat])

  return (
    <div className="w-full h-full overflow-y-auto select-none">
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full pb-16">
        {/* Top Banner: Executive Progress Card */}
        <div
          className="p-6 rounded-3xl border shadow-xl relative overflow-hidden glass-panel"
          style={{
            background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-2) 100%)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--color-brand)' }}>
                {t.title}
              </span>
              <h1 className="text-2xl font-black mt-1 font-display" style={{ color: 'var(--color-text)' }}>
                {state.fileName ? state.fileName.replace(/\.md$/, '') : 'Project Overview'}
              </h1>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Pemantauan progress, status tugas, tenggat waktu (deadline), dan distribusi beban kerja tim.
              </p>
            </div>

            {/* Large Circular Progress Metric */}
            <div className="flex items-center gap-6">
              <div className="text-right font-display">
                <div className="text-3xl font-black" style={{ color: 'var(--color-text)' }}>{completionRate}%</div>
                <span className="text-[11px] font-semibold text-emerald-500">Tingkat Penyelesaian</span>
              </div>
              <div className="w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg" style={{ background: 'var(--color-brand-glow)', borderColor: 'var(--color-brand)' }}>
                <PieChart size={32} style={{ color: 'var(--color-brand)' }} />
              </div>
            </div>
          </div>

          {/* Global Segmented Progress Bar */}
          <div className="mt-6 space-y-2 font-display">
            <div className="w-full h-3 rounded-full overflow-hidden flex shadow-inner" style={{ background: 'var(--color-surface-3)' }}>
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${total > 0 ? (doneItems.length / total) * 100 : 0}%` }}
                title={`Selesai: ${doneItems.length}`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${total > 0 ? (progressItems.length / total) * 100 : 0}%` }}
                title={`Sedang Berjalan: ${progressItems.length}`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${total > 0 ? (todoItems.length / total) * 100 : 0}%` }}
                title={`Todo: ${todoItems.length}`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Selesai: {doneItems.length} ({completionRate}%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Berjalan: {progressItems.length} ({total > 0 ? Math.round((progressItems.length / total) * 100) : 0}%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Todo: {todoItems.length} ({total > 0 ? Math.round((todoItems.length / total) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* 4 Summary Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Item & Fitur"
            value={total}
            sub={`Hierarki: ${levelStats.root.length} Modul Utama`}
            icon={Layers}
            color="#818cf8"
          />
          <SummaryCard
            title="Sedang Dikerjakan"
            value={progressItems.length}
            sub={`${progressItems.length > 0 ? 'Fokus pengerjaan saat ini' : 'Tidak ada tugas aktif'}`}
            icon={Flame}
            color="#eab308"
          />
          <SummaryCard
            title="Mendekati Deadline"
            value={upcomingItems.length}
            sub="Tenggat dalam 7 hari ke depan"
            icon={Clock}
            color="#38bdf8"
          />
          <SummaryCard
            title="Lewat Deadline"
            value={overdueItems.length}
            sub={overdueItems.length > 0 ? 'Perlu tindakan segera!' : 'Semua tenggat aman'}
            icon={AlertTriangle}
            color="#ef4444"
          />
        </div>

        {/* Two Column Grid: Status Breakdown & Deadline Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Distribution List (2 Cols) */}
          <div
            className="lg:col-span-2 p-6 rounded-3xl border glass-panel space-y-4"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-bold flex items-center gap-2 font-display" style={{ color: 'var(--color-text)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--color-brand)' }} /> Rincian Status ({Object.keys(statusStats.counts).length})
              </h3>
              <span className="text-xs" style={{ color: 'var(--color-text-dim)' }}>Klik item untuk membuka detail edit</span>
            </div>

            <div className="space-y-3">
              {Object.entries(statusStats.counts).map(([label, data]) => {
                const pct = total > 0 ? Math.round((data.count / total) * 100) : 0
                return (
                  <div key={label} className="p-3 rounded-2xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold flex items-center gap-2 font-display" style={{ color: 'var(--color-text)' }}>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: data.color }} />
                        {label}
                      </span>
                      <span className="text-xs font-mono font-bold" style={{ color: data.color }}>
                        {data.count} items ({pct}%)
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--color-surface-3)' }}>
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: data.color }} />
                    </div>

                    {/* Top 3 preview items */}
                    {data.items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {data.items.slice(0, 4).map((it) => (
                          <button
                            key={it.id}
                            onClick={() => dispatch({ type: 'SELECT_FEATURE', payload: it.id })}
                            className="px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer truncate max-w-xs font-medium"
                            style={{ background: 'var(--color-surface-3)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                          >
                            {it.title}
                          </button>
                        ))}
                        {data.items.length > 4 && (
                          <span className="text-[10px] self-center" style={{ color: 'var(--color-text-dim)' }}>
                            +{data.items.length - 4} lainnya
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Urgent Deadlines & Overdue Alerts (1 Col) */}
          <div
            className="p-6 rounded-3xl border glass-panel space-y-4"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-bold flex items-center gap-2 font-display" style={{ color: 'var(--color-text)' }}>
                <Calendar size={16} className="text-rose-500" /> Perhatian Deadline
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 font-bold border border-rose-500/30">
                {overdueItems.length + upcomingItems.length} task
              </span>
            </div>

            <div className="space-y-3">
              {/* Overdue items */}
              {overdueItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1 font-display">
                    <AlertTriangle size={11} /> Sudah Lewat Tenggat
                  </span>
                  {overdueItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => dispatch({ type: 'SELECT_FEATURE', payload: item.id })}
                      className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate" style={{ color: 'var(--color-text)' }}>{item.title}</span>
                        <span className="text-[10px] font-mono text-rose-500 shrink-0 ml-2 font-bold">
                          {item.metadata.deadline}
                        </span>
                      </div>
                      {item.metadata.pic && (
                        <span className="text-[10px] text-sky-500 flex items-center gap-1 mt-1">
                          <User size={10} /> {item.metadata.pic}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upcoming items */}
              {upcomingItems.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1 font-display">
                    <Clock size={11} /> Segera Tiba (7 Hari)
                  </span>
                  {upcomingItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => dispatch({ type: 'SELECT_FEATURE', payload: item.id })}
                      className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="truncate" style={{ color: 'var(--color-text)' }}>{item.title}</span>
                        <span className="text-[10px] font-mono text-amber-500 shrink-0 ml-2 font-bold">
                          {item.metadata.deadline}
                        </span>
                      </div>
                      {item.metadata.pic && (
                        <span className="text-[10px] text-sky-500 flex items-center gap-1 mt-1">
                          <User size={10} /> {item.metadata.pic}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {overdueItems.length === 0 && upcomingItems.length === 0 && (
                <div className="p-8 text-center text-xs space-y-1" style={{ color: 'var(--color-text-dim)' }}>
                  <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                  <p className="font-semibold font-display" style={{ color: 'var(--color-text)' }}>Semua deadline terkontrol dengan baik!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Grid: Priority & Team PIC Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Matrix */}
          <div
            className="p-6 rounded-3xl border glass-panel space-y-4"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-bold flex items-center gap-2 font-display" style={{ color: 'var(--color-text)' }}>
                <Flame size={16} className="text-amber-500" /> Distribusi Prioritas
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10">
                <span className="text-xs font-bold text-rose-500 font-display">🔴 High</span>
                <div className="text-2xl font-black mt-1 font-display" style={{ color: 'var(--color-text)' }}>{priorityStats.high.length}</div>
                <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>Mendesak</span>
              </div>
              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10">
                <span className="text-xs font-bold text-amber-500 font-display">🟡 Medium</span>
                <div className="text-2xl font-black mt-1 font-display" style={{ color: 'var(--color-text)' }}>{priorityStats.medium.length}</div>
                <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>Standar</span>
              </div>
              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
                <span className="text-xs font-bold text-emerald-500 font-display">🟢 Low</span>
                <div className="text-2xl font-black mt-1 font-display" style={{ color: 'var(--color-text)' }}>{priorityStats.low.length}</div>
                <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>Santai</span>
              </div>
            </div>
          </div>

          {/* Team / PIC Workload Matrix */}
          <div
            className="p-6 rounded-3xl border glass-panel space-y-4"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-bold flex items-center gap-2 font-display" style={{ color: 'var(--color-text)' }}>
                <User size={16} className="text-sky-500" /> Beban Kerja Tim / PIC ({Object.keys(picStats).length})
              </h3>
            </div>

            <div className="space-y-2.5 max-h-52 overflow-y-auto">
              {Object.entries(picStats).map(([pic, data]) => {
                const picPct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0
                return (
                  <div key={pic} className="p-3 rounded-2xl border flex items-center justify-between" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-500 flex items-center justify-center font-bold text-xs border border-sky-500/30">
                        {pic.replace(/^@/, '').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold block font-display" style={{ color: 'var(--color-text)' }}>{pic}</span>
                        <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
                          {data.done} selesai · {data.inProgress} progress · {data.total} total
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-500 font-display">{picPct}%</span>
                      <span className="text-[10px] block" style={{ color: 'var(--color-text-dim)' }}>selesai</span>
                    </div>
                  </div>
                )
              })}

              {Object.keys(picStats).length === 0 && (
                <div className="p-6 text-center text-xs" style={{ color: 'var(--color-text-dim)' }}>
                  Belum ada PIC yang di-assign pada tugas-tugas.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  sub: string
  icon: typeof Layers
  color: string
}) {
  return (
    <div
      className="p-5 rounded-3xl border glass-panel space-y-2"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-dim)' }}>
          {title}
        </span>
        <div className="p-2 rounded-xl" style={{ background: `${color}20`, color }}>
          <Icon size={16} />
        </div>
      </div>
      <div className="text-3xl font-black font-display" style={{ color: 'var(--color-text)' }}>{value}</div>
      <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
        {sub}
      </p>
    </div>
  )
}
