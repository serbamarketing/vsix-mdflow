import { Search, X, Network, Table as TableIcon, Columns, Calendar as CalendarIcon, Plus } from 'lucide-react'
import { useAppStore } from '../hooks/useAppStore'
import type { ViewMode } from '../App'

interface HeaderProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

const viewTabs: { key: ViewMode; label: string; icon: typeof Network }[] = [
  { key: 'mindmap', label: 'Mindmap', icon: Network },
  { key: 'table', label: 'Table', icon: TableIcon },
  { key: 'kanban', label: 'Kanban', icon: Columns },
  { key: 'calendar', label: 'Calendar', icon: CalendarIcon },
]

export function Header({ currentView, onViewChange }: HeaderProps) {
  const { state, dispatch } = useAppStore()

  return (
    <header
      className="flex items-center h-12 border-b shrink-0 glass-panel select-none w-full px-3 gap-3"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-1">
        {viewTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onViewChange(key)}
            title={label}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            style={{
              background: currentView === key ? 'var(--color-brand-glow)' : 'transparent',
              color: currentView === key ? 'var(--color-brand)' : 'var(--color-text-dim)',
            }}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 max-w-xs relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-dim)' }} />
        <input
          type="text"
          placeholder="Cari item..."
          value={state.searchQuery}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
          className="w-full pl-8 pr-7 py-1.5 text-xs font-medium rounded-xl border outline-none transition-colors"
          style={{
            background: 'var(--color-surface-2)',
            borderColor: state.searchQuery ? 'var(--color-brand)' : 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
        {state.searchQuery && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_SEARCH', payload: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer opacity-60 hover:opacity-100"
            style={{ color: 'var(--color-text-dim)' }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="flex-1" />

      {/* Button Tambah Fitur Baru */}
      <button
        type="button"
        onClick={() => dispatch({ type: 'OPEN_NEW_FEATURE_MODAL' })}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm hover:brightness-110 active:scale-95"
        style={{ background: 'var(--color-brand)', color: '#050c14' }}
        title="Tambah Fitur Baru"
      >
        <Plus size={14} />
        <span>Tambah Fitur</span>
      </button>

      {state.fileName && (
        <span className="text-[11px] truncate max-w-[160px] hidden md:inline" style={{ color: 'var(--color-text-dim)' }} title={state.fileName}>
          {state.fileName}
        </span>
      )}
    </header>
  )
}
