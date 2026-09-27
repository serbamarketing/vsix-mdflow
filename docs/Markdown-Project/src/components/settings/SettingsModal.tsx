import { useState, useMemo } from 'react'
import { X, Moon, Sun, Monitor, Plus, Trash2, Check, Download, Copy, Layout, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/hooks/useAppStore'
import { translations } from '@/data/translations'
import { getAllMetadataKeys } from '@/models/feature'
import type { ThemeType, StatusDefinition } from '@/models/feature'
import { useFileOpen } from '@/hooks/useFileOpen'

type SettingsTab = 'theme' | 'columns' | 'statuses' | 'file'

export function SettingsModal() {
  const { state, dispatch } = useAppStore()
  const t = translations[state.language].settings
  const { downloadMarkdown } = useFileOpen()
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme')
  const [newStatusLabel, setNewStatusLabel] = useState('')
  const [newStatusColor, setNewStatusColor] = useState('#38bdf8')
  const [copiedRaw, setCopiedRaw] = useState(false)

  const allMetaKeys = useMemo(() => getAllMetadataKeys(state.features), [state.features])

  if (!state.isSettingsOpen) return null

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatusLabel.trim()) return
    const id = newStatusLabel.toLowerCase().replace(/[^\w-]/g, '') || 'status'
    const newStatus: StatusDefinition = {
      id,
      label: newStatusLabel.trim(),
      color: newStatusColor,
    }
    dispatch({
      type: 'SET_CUSTOM_STATUSES',
      payload: [...state.customStatuses, newStatus],
    })
    setNewStatusLabel('')
  }

  const handleDeleteStatus = (id: string) => {
    dispatch({
      type: 'SET_CUSTOM_STATUSES',
      payload: state.customStatuses.filter((s) => s.id !== id),
    })
  }

  const handleToggleTableCol = (key: string) => {
    const current = state.columnConfig.table[key] ?? true
    dispatch({
      type: 'SET_COLUMN_CONFIG',
      payload: {
        ...state.columnConfig,
        table: { ...state.columnConfig.table, [key]: !current },
      },
    })
  }

  const handleCopyRaw = () => {
    if (!state.rawMarkdown) return
    navigator.clipboard.writeText(state.rawMarkdown)
    setCopiedRaw(true)
    setTimeout(() => setCopiedRaw(false), 2000)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => dispatch({ type: 'CLOSE_SETTINGS' })}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="relative rounded-3xl border shadow-2xl flex flex-col overflow-hidden glass-panel"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', width: '50vw', height: '80vh', minWidth: '480px' }}
        >
          {/* Modal Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b shrink-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h2 className="text-base font-bold flex items-center gap-2 font-display" style={{ color: 'var(--color-text)' }}>
              <Layout size={18} style={{ color: 'var(--color-brand)' }} /> {t.title}
            </h2>
            <button
              onClick={() => dispatch({ type: 'CLOSE_SETTINGS' })}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: 'var(--color-text-dim)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div
            className="flex items-center gap-2 px-6 pt-3 border-b shrink-0 text-xs font-semibold font-display"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}
          >
            {[
              { id: 'theme' as SettingsTab, label: t.themeTab },
              { id: 'columns' as SettingsTab, label: t.columnTab },
              { id: 'statuses' as SettingsTab, label: t.statusTab },
              { id: 'file' as SettingsTab, label: t.fileTab },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-all ${
                  activeTab === id
                    ? 'border-[var(--color-brand)] font-bold'
                    : 'border-transparent text-slate-400 hover:text-[var(--color-text)]'
                }`}
                style={{
                  color: activeTab === id ? 'var(--color-brand)' : undefined,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Tab 1: Theme */}
            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold mb-1 font-display" style={{ color: 'var(--color-text)' }}>{t.themeTitle}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t.themeDesc}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'dark' as ThemeType, label: t.darkLabel, desc: t.darkDesc, icon: Moon, color: '#0ef38d' },
                    { id: 'midnight' as ThemeType, label: t.midnightLabel, desc: t.midnightDesc, icon: Monitor, color: '#38bdf8' },
                    { id: 'light' as ThemeType, label: t.lightLabel, desc: t.lightDesc, icon: Sun, color: '#05c46b' },
                  ].map((tTheme) => {
                    const isSelected = state.theme === tTheme.id
                    const Icon = tTheme.icon
                    return (
                      <button
                        key={tTheme.id}
                        onClick={() => dispatch({ type: 'SET_THEME', payload: tTheme.id })}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-[var(--color-brand)]' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          background: 'var(--color-surface-2)',
                          borderColor: isSelected ? 'var(--color-brand)' : 'var(--color-border)',
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                          style={{ background: isSelected ? 'var(--color-brand)' : 'var(--color-surface)', color: isSelected ? '#050c14' : 'var(--color-text-dim)' }}
                        >
                          <Icon size={16} />
                        </div>
                        <p className="text-xs font-bold font-display" style={{ color: 'var(--color-text)' }}>{tTheme.label}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-dim)' }}>
                          {tTheme.desc}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Column Visibility */}
            {activeTab === 'columns' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold mb-1 font-display" style={{ color: 'var(--color-text)' }}>{t.colTitle}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t.colDesc}
                  </p>
                </div>

                {/* Table Columns */}
                <div className="p-4 rounded-2xl border space-y-3" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider font-display" style={{ color: 'var(--color-text)' }}>{t.tableColTitle}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allMetaKeys.map((key) => {
                      const isVisible = state.columnConfig.table[key] ?? true
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-2 p-2 rounded-xl cursor-pointer select-none border transition-colors"
                          style={{
                            background: isVisible ? 'var(--color-surface)' : 'transparent',
                            borderColor: isVisible ? 'var(--color-brand)' : 'var(--color-border)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => handleToggleTableCol(key)}
                            className="rounded accent-[var(--color-brand)]"
                          />
                          <span className="text-xs capitalize font-medium" style={{ color: 'var(--color-text)' }}>{key}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Kanban Badges */}
                <div className="p-4 rounded-2xl border space-y-3" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider font-display" style={{ color: 'var(--color-text)' }}>{t.kanbanColTitle}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'showDescription', label: t.showDescPreview },
                      { key: 'showPriority', label: t.showPriorityBadge },
                      { key: 'showType', label: t.showTypeBadge },
                      { key: 'showPic', label: t.showPicBadge },
                      { key: 'showDeadline', label: t.showDeadlineBadge },
                      { key: 'showSubCount', label: t.showSubCount },
                      { key: 'showImage', label: t.showImageBadge },
                      { key: 'showLink', label: t.showLinkBadge },
                    ].map((item) => {
                      const isChecked = (state.columnConfig.kanban as Record<string, boolean>)[item.key] ?? false
                      return (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 p-2 rounded-xl cursor-pointer select-none border"
                          style={{
                            background: isChecked ? 'var(--color-surface)' : 'transparent',
                            borderColor: isChecked ? 'var(--color-brand)' : 'var(--color-border)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              dispatch({
                                type: 'SET_COLUMN_CONFIG',
                                payload: {
                                  ...state.columnConfig,
                                  kanban: {
                                    ...state.columnConfig.kanban,
                                    [item.key]: !isChecked,
                                  },
                                },
                              })
                            }}
                            className="rounded accent-[var(--color-brand)]"
                          />
                          <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{item.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Mindmap Badges */}
                <div className="p-4 rounded-2xl border space-y-3" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider font-display" style={{ color: 'var(--color-text)' }}>{t.mindmapColTitle}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'showStatus', label: t.showStatusBadge },
                      { key: 'showPriority', label: t.showPriorityBadge },
                      { key: 'showPic', label: t.showPicBadge },
                      { key: 'showDeadline', label: t.showDeadlineBadge },
                      { key: 'showImage', label: t.showImageBadge },
                      { key: 'showLink', label: t.showLinkBadge },
                    ].map((item) => {
                      const isChecked = (state.columnConfig.mindmap as Record<string, boolean>)[item.key] ?? false
                      return (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 p-2 rounded-xl cursor-pointer select-none border"
                          style={{
                            background: isChecked ? 'var(--color-surface)' : 'transparent',
                            borderColor: isChecked ? 'var(--color-brand)' : 'var(--color-border)',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              dispatch({
                                type: 'SET_COLUMN_CONFIG',
                                payload: {
                                  ...state.columnConfig,
                                  mindmap: {
                                    ...state.columnConfig.mindmap,
                                    [item.key]: !isChecked,
                                  },
                                },
                              })
                            }}
                            className="rounded accent-[var(--color-brand)]"
                          />
                          <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{item.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Custom Statuses */}
            {activeTab === 'statuses' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold mb-1 font-display" style={{ color: 'var(--color-text)' }}>{t.statusTitle}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t.statusDesc}
                  </p>
                </div>

                {/* Existing statuses list */}
                <div className="space-y-2">
                  {state.customStatuses.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-3 rounded-2xl border"
                      style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: st.color }} />
                        <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{st.label}</span>
                      </div>
                      {state.customStatuses.length > 2 && (
                        <button
                          onClick={() => handleDeleteStatus(st.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
                          title="Hapus status"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Form Tambah Status */}
                <form
                  onSubmit={handleAddStatus}
                  className="p-4 rounded-2xl border space-y-3"
                  style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                >
                  <p className="text-xs font-bold font-display" style={{ color: 'var(--color-text)' }}>{t.newStatusTitle}</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={t.newStatusPlaceholder}
                      value={newStatusLabel}
                      onChange={(e) => setNewStatusLabel(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border outline-none"
                      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    />
                    <input
                      type="color"
                      value={newStatusColor}
                      onChange={(e) => setNewStatusColor(e.target.value)}
                      className="w-9 h-8 p-0.5 rounded-xl border cursor-pointer shrink-0"
                      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                      title="Pilih warna status"
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer font-display"
                      style={{ background: 'var(--color-brand)', color: '#050c14' }}
                    >
                      <Plus size={13} /> {t.addStatusBtn}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 4: File & Auto-Save */}
            {activeTab === 'file' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold mb-1 font-display" style={{ color: 'var(--color-text)' }}>{t.fileTitle}</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {t.fileDesc}
                  </p>
                </div>

                {/* Auto Save Toggle */}
                <div
                  className="flex items-center justify-between p-4 rounded-2xl border"
                  style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold flex items-center gap-1.5 font-display" style={{ color: 'var(--color-text)' }}>
                      <ShieldCheck size={15} style={{ color: 'var(--color-brand)' }} /> {t.autosaveTitle}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
                      {t.autosaveDesc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.autoSave}
                    onChange={(e) => dispatch({ type: 'SET_AUTO_SAVE', payload: e.target.checked })}
                    className="w-5 h-5 rounded accent-[var(--color-brand)] cursor-pointer"
                  />
                </div>

                {/* Backup & Export Actions */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider font-display" style={{ color: 'var(--color-text)' }}>{t.exportTitle}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => downloadMarkdown(state.fileName || 'FEATURES.md', state.rawMarkdown || '')}
                      className="flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-colors font-display"
                      style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                      <Download size={14} style={{ color: 'var(--color-brand)' }} /> {t.downloadMdBtn}
                    </button>
                    <button
                      onClick={handleCopyRaw}
                      className="flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-colors font-display"
                      style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                      {copiedRaw ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-sky-500" />}
                      {copiedRaw ? t.copiedText : t.copyRawBtn}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div
            className="flex items-center justify-end px-6 py-3.5 border-t shrink-0"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <button
              onClick={() => dispatch({ type: 'CLOSE_SETTINGS' })}
              className="px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer font-display"
              style={{ background: 'var(--color-brand)', color: '#050c14' }}
            >
              {t.closeBtn}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
