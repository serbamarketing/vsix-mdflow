"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = Header;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const useAppStore_1 = require("@/hooks/useAppStore");
const translations_1 = require("@/data/translations");
const markdownParser_1 = require("@/features/parser/markdownParser");
const exportUtils_1 = require("@/utils/exportUtils");
const feature_1 = require("@/models/feature");
function Header() {
    const { state, dispatch, saveNow } = (0, useAppStore_1.useAppStore)();
    const [isExportOpen, setIsExportOpen] = (0, react_1.useState)(false);
    const [isHistoryOpen, setIsHistoryOpen] = (0, react_1.useState)(false);
    const [isReloading, setIsReloading] = (0, react_1.useState)(false);
    const [isSearchFocused, setIsSearchFocused] = (0, react_1.useState)(false);
    const t = translations_1.translations[state.language].header;
    const allFlat = (0, react_1.useMemo)(() => (0, feature_1.flattenFeatures)(state.features), [state.features]);
    // Compute live search autocomplete suggestions
    const searchSuggestions = (0, react_1.useMemo)(() => {
        if (!state.searchQuery || state.searchQuery.trim().length < 1)
            return [];
        const q = state.searchQuery.toLowerCase().trim();
        return allFlat
            .filter((f) => {
            const titleMatch = f.title.toLowerCase().includes(q);
            const picMatch = f.metadata.pic?.toLowerCase().includes(q);
            const typeMatch = f.metadata.type?.toLowerCase().includes(q);
            const statusMatch = f.metadata.status?.toLowerCase().includes(q);
            const tagMatch = f.metadata.tag?.toLowerCase().includes(q);
            return titleMatch || picMatch || typeMatch || statusMatch || tagMatch;
        })
            .slice(0, 6);
    }, [allFlat, state.searchQuery]);
    // Handle Search input change: Auto switch to Table View
    const handleSearchChange = (q) => {
        dispatch({ type: 'SET_SEARCH', payload: q });
        if (q.trim()) {
            if (state.activeView !== 'table') {
                dispatch({ type: 'SET_VIEW', payload: 'table' });
            }
        }
    };
    // Handle suggestion item click: Auto switch to Table View and Open Detail Panel
    const handleSelectSuggestion = (item) => {
        dispatch({ type: 'SET_SEARCH', payload: item.title });
        dispatch({ type: 'SET_VIEW', payload: 'table' });
        dispatch({ type: 'SELECT_FEATURE', payload: item.id });
        setIsSearchFocused(false);
    };
    // Reload file from disk handle (for external edits by VS Code / AI)
    const handleReloadFromDisk = async () => {
        try {
            setIsReloading(true);
            const activeFile = state.fileName || 'Fitur.md';
            // 1. Try local dev server API first
            try {
                const res = await fetch(`/api/file?file=${encodeURIComponent(activeFile)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.content) {
                        dispatch({
                            type: 'SYNC_FROM_DISK',
                            payload: {
                                content: data.content,
                                fileName: data.fileName,
                            },
                        });
                        return;
                    }
                }
            }
            catch {
                // Dev server API not available, proceed to fallback
            }
            // 2. Fallback to fileHandle
            if (state.fileHandle) {
                const file = await state.fileHandle.getFile();
                const content = await file.text();
                const features = (0, markdownParser_1.parseMarkdown)(content);
                dispatch({
                    type: 'LOAD_FILE',
                    payload: {
                        content,
                        fileName: file.name,
                        features,
                        handle: state.fileHandle,
                    },
                });
            }
        }
        catch (err) {
            console.error('Failed to reload file from disk:', err);
        }
        finally {
            setIsReloading(false);
        }
    };
    const handleExport = (type) => {
        setIsExportOpen(false);
        const baseName = state.fileName || 'Project-Doc';
        if (type === 'html') {
            (0, exportUtils_1.exportToHTML)(state.features, baseName);
        }
        else if (type === 'pdf') {
            (0, exportUtils_1.exportToPDF)(state.features, baseName);
        }
        else if (type === 'csv') {
            (0, exportUtils_1.exportToCSV)(state.features, baseName);
        }
    };
    const canUndo = state.pastRawMarkdown.length > 0;
    const canRedo = state.futureRawMarkdown.length > 0;
    return (<header className="flex items-center h-14 border-b shrink-0 glass-panel select-none relative z-30 w-full" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      {/* Brand Header Section di Sisi Kiri (Sejajar presisi vertikal dengan lebar sidebar w-60) */}
      <div className={`h-full border-r px-4 flex items-center justify-between shrink-0 transition-all ${state.isSidebarOpen ? 'w-60' : 'w-14 justify-center px-0'}`} style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, #0ef38d, #05c46b)' }}>
            <lucide_react_1.Layers size={17} className="text-slate-950 font-bold"/>
          </div>
          {state.isSidebarOpen && (<span className="font-bold text-base font-display block tracking-tight truncate" style={{ color: 'var(--color-text)' }}>
              MDFlow
            </span>)}
        </div>

        {/* Desktop Collapse / Expand Toggle */}
        <button type="button" onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })} className="hidden md:flex p-1.5 rounded-xl border transition-colors cursor-pointer" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }} title={t.toggleSidebarTooltip}>
          {state.isSidebarOpen ? <lucide_react_1.PanelLeftClose size={16}/> : <lucide_react_1.PanelLeftOpen size={16}/>}
        </button>

        {/* Mobile Hamburger Menu Toggle */}
        <button type="button" onClick={() => dispatch({ type: 'SET_MOBILE_SIDEBAR_OPEN', payload: true })} className="md:hidden p-1.5 rounded-xl border transition-colors cursor-pointer" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} title={t.openMenuTooltip}>
          <lucide_react_1.Menu size={17}/>
        </button>
      </div>

      {/* Main Header Content di Sisi Kanan (Sejajar vertikal dengan section content) */}
      <div className="flex-1 h-full flex items-center justify-between px-4 md:px-6 gap-3 overflow-hidden">
        {/* View Title */}
        <h2 className="text-sm font-bold whitespace-nowrap flex items-center gap-2 font-display capitalize" style={{ color: 'var(--color-text)' }}>
          {state.activeView === 'summary' && '📊 '}
          {state.activeView === 'mindmap' && '🧠 '}
          {state.activeView === 'table' && '📊 '}
          {state.activeView === 'kanban' && '📋 '}
          {state.activeView === 'calendar' && '📅 '}
          {state.activeView === 'editor' && '📝 '}
          {state.activeView === 'docs' && '📖 '}
          {state.activeView === 'gallery' && '🖼️ '}
          <span className="capitalize">
            {state.activeView === 'summary' && translations_1.translations[state.language].sidebar.summaryView}
            {state.activeView === 'mindmap' && translations_1.translations[state.language].sidebar.mindmapView}
            {state.activeView === 'table' && translations_1.translations[state.language].sidebar.tableView}
            {state.activeView === 'kanban' && translations_1.translations[state.language].sidebar.kanbanView}
            {state.activeView === 'calendar' && translations_1.translations[state.language].sidebar.calendarView}
            {state.activeView === 'editor' && 'Raw Editor'}
            {state.activeView === 'docs' && 'Dokumentasi'}
            {state.activeView === 'gallery' && 'Gallery'}
          </span>
        </h2>

        {/* Search Bar with Auto-Complete & Auto-Switch */}
        {state.activeView !== 'docs' && (<div className="flex-1 max-w-xs relative hidden sm:block">
            <lucide_react_1.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-dim)' }}/>
            <input type="text" placeholder={t.searchPlaceholder} value={state.searchQuery} onFocus={() => setIsSearchFocused(true)} onChange={(e) => handleSearchChange(e.target.value)} className="w-full pl-9 pr-7 py-1.5 text-xs font-medium rounded-xl border outline-none transition-colors" style={{
                background: 'var(--color-surface-2)',
                borderColor: state.searchQuery ? 'var(--color-brand)' : 'var(--color-border)',
                color: 'var(--color-text)',
            }}/>
            {state.searchQuery && (<button type="button" onClick={() => dispatch({ type: 'SET_SEARCH', payload: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer opacity-60 hover:opacity-100" style={{ color: 'var(--color-text-dim)' }}>
                <lucide_react_1.X size={12}/>
              </button>)}

            {/* Search Auto-Complete & Suggestion Dropdown */}
            {isSearchFocused && searchSuggestions.length > 0 && (<>
                <div className="fixed inset-0 z-20" onClick={() => setIsSearchFocused(false)}/>
                <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border shadow-2xl p-1.5 z-30 space-y-1 glass-panel animate-in fade-in-50 zoom-in-95" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider font-display" style={{ color: 'var(--color-text-dim)' }}>
                    {t.searchSuggestions} ({searchSuggestions.length})
                  </div>
                  {searchSuggestions.map((item) => (<button key={item.id} type="button" onClick={() => handleSelectSuggestion(item)} className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors group">
                      <div className="truncate flex-1 pr-2">
                        <span className="font-bold block text-[var(--color-text)] group-hover:text-[var(--color-brand)] font-display">
                          {item.title}
                        </span>
                        {item.metadata.pic && <span className="text-[10px] text-sky-400 font-mono">{item.metadata.pic}</span>}
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold shrink-0" style={{ background: 'var(--color-surface-2)', color: 'var(--color-brand)' }}>
                        H{item.level}
                      </span>
                    </button>))}
                </div>
              </>)}
          </div>)}

        {/* Table Filters */}
        {state.activeView === 'table' && (<div className="flex items-center gap-1.5">
            <FilterSelect id="filter-status" label="Status" value={state.filters.status ?? ''} options={['', ...state.customStatuses.map((s) => s.label)]} onChange={(v) => dispatch({ type: 'SET_FILTER', payload: { ...state.filters, status: v || undefined } })}/>
            <FilterSelect id="filter-priority" label="Priority" value={state.filters.priority ?? ''} options={['', '🔴 High', '🟡 Medium', '🟢 Low']} onChange={(v) => dispatch({ type: 'SET_FILTER', payload: { ...state.filters, priority: v || undefined } })}/>
          </div>)}

        <div className="flex-1"/>

        {/* Action Controls (Icon-Only dengan Tooltip Teks saat Hover) */}
        <div className="flex items-center gap-1.5">
          {/* History / Undo / Redo Menu Dropdown */}
          <div className="relative">
            <button type="button" onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="p-2 rounded-xl border cursor-pointer transition-colors font-display" style={{
            background: isHistoryOpen ? 'var(--color-brand-glow)' : 'var(--color-surface-2)',
            borderColor: isHistoryOpen ? 'var(--color-brand)' : 'var(--color-border)',
            color: isHistoryOpen ? 'var(--color-brand)' : 'var(--color-text)',
        }} title={t.historyTooltip}>
              <lucide_react_1.History size={15} style={{ color: 'var(--color-brand)' }}/>
            </button>

            {isHistoryOpen && (<>
                <div className="fixed inset-0 z-20" onClick={() => setIsHistoryOpen(false)}/>
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-2 z-30 space-y-2 glass-panel font-display" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>History & Rollback</span>
                    <span className="text-[9px] font-mono text-emerald-400">Ctrl+Z / Ctrl+Y</span>
                  </div>

                  {/* Undo / Redo Buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" disabled={!canUndo} onClick={() => dispatch({ type: 'UNDO' })} className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      <lucide_react_1.Undo2 size={13} style={{ color: canUndo ? 'var(--color-brand)' : undefined }}/>
                      Undo
                    </button>
                    <button type="button" disabled={!canRedo} onClick={() => dispatch({ type: 'REDO' })} className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                      <lucide_react_1.Redo2 size={13} style={{ color: canRedo ? 'var(--color-brand)' : undefined }}/>
                      Redo
                    </button>
                  </div>

                  {/* Rollback Snapshots Timeline */}
                  <div className="space-y-1 pt-1 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <lucide_react_1.Clock size={10}/> Auto-Saved Snapshots
                    </div>

                    {state.pastRawMarkdown.length === 0 ? (<div className="text-[11px] text-slate-500 px-2 py-1 text-center">
                        Belum ada riwayat snapshot
                      </div>) : (<div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {state.pastRawMarkdown.slice(-5).reverse().map((snapshot, idx) => (<div key={idx} className="flex items-center justify-between p-1.5 rounded-lg border text-[11px] transition-colors" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                            <span className="truncate flex-1 font-mono text-[10px] text-slate-400">
                              Snapshot #{state.pastRawMarkdown.length - idx} ({snapshot.length} chars)
                            </span>
                            <button type="button" onClick={() => {
                        dispatch({ type: 'RESTORE_SNAPSHOT', payload: { rawMarkdown: snapshot } });
                        setIsHistoryOpen(false);
                    }} className="px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-transform hover:scale-105" style={{ background: 'var(--color-brand)', color: '#050c14' }}>
                              Rollback
                            </button>
                          </div>))}
                      </div>)}
                  </div>
                </div>
              </>)}
          </div>

          {/* Reload from Disk Button (Icon-Only) */}
          <button type="button" onClick={handleReloadFromDisk} disabled={isReloading} className="p-2 rounded-xl border cursor-pointer transition-colors" style={{
            background: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
        }} title={t.reloadTooltip}>
            <lucide_react_1.RotateCcw size={15} className={`text-emerald-400 ${isReloading ? 'animate-spin' : ''}`}/>
          </button>

          {/* Live Sync Status / Manual Save Button (Icon-Only) */}
          <button type="button" onClick={() => saveNow()} title={t.syncTooltip} className="p-2 rounded-xl border cursor-pointer transition-all" style={{
            background: 'var(--color-surface-2)',
            borderColor: state.saveStatus === 'error' ? '#ef4444' : 'var(--color-border)',
        }}>
            {state.saveStatus === 'saving' && <lucide_react_1.Loader2 size={15} className="animate-spin text-amber-400"/>}
            {state.saveStatus === 'saved' && <lucide_react_1.CheckCircle2 size={15} style={{ color: 'var(--color-brand)' }}/>}
            {state.saveStatus === 'error' && <lucide_react_1.AlertCircle size={15} className="text-red-400"/>}
            {state.saveStatus === 'idle' && <lucide_react_1.Save size={15} style={{ color: 'var(--color-text-dim)' }}/>}
          </button>

          {/* Export / Download Menu Dropdown (Icon-Only) */}
          <div className="relative">
            <button type="button" onClick={() => setIsExportOpen(!isExportOpen)} className="p-2 rounded-xl border cursor-pointer transition-colors font-display" style={{
            background: isExportOpen ? 'var(--color-brand)' : 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: isExportOpen ? '#050c14' : 'var(--color-text)',
        }} title={t.exportTooltip}>
              <lucide_react_1.Download size={15}/>
            </button>

            {isExportOpen && (<>
                <div className="fixed inset-0 z-20" onClick={() => setIsExportOpen(false)}/>
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border shadow-2xl p-1.5 z-30 space-y-0.5 glass-panel font-display" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Pilihan Unduh / Export
                  </div>
                  <button type="button" onClick={() => handleExport('html')} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left cursor-pointer hover:bg-[var(--color-surface-2)]" style={{ color: 'var(--color-text)' }}>
                    <lucide_react_1.FileCode size={14} style={{ color: 'var(--color-brand)' }}/> Interaktif Web (.html)
                  </button>
                  <button type="button" onClick={() => handleExport('pdf')} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left cursor-pointer hover:bg-[var(--color-surface-2)]" style={{ color: 'var(--color-text)' }}>
                    <lucide_react_1.FileText size={14} className="text-rose-400"/> Unduh Dokumen (.pdf)
                  </button>
                  <button type="button" onClick={() => handleExport('csv')} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left cursor-pointer hover:bg-[var(--color-surface-2)]" style={{ color: 'var(--color-text)' }}>
                    <lucide_react_1.Table size={14} style={{ color: 'var(--color-brand)' }}/> Spreadsheet (.csv)
                  </button>
                </div>
              </>)}
          </div>

          {/* Docs Button */}
          <button type="button" onClick={() => dispatch({ type: 'SET_VIEW', payload: 'docs' })} title={t.docsTooltip} className="p-2 rounded-xl border cursor-pointer transition-colors" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            <lucide_react_1.BookOpen size={15}/>
          </button>

          {/* Settings Button */}
          <button type="button" onClick={() => dispatch({ type: 'OPEN_SETTINGS' })} title={t.settingsTooltip} className="p-2 rounded-xl border cursor-pointer transition-colors hover:bg-[var(--color-surface-2)]" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
            <lucide_react_1.Settings size={15} style={{ color: 'var(--color-brand)' }}/>
          </button>

          {/* Close File Button */}
          <button type="button" onClick={() => dispatch({ type: 'CLOSE_FILE' })} title={t.closeFileTooltip} className="p-2 rounded-xl border cursor-pointer transition-colors hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}>
            <lucide_react_1.X size={15}/>
          </button>
        </div>
      </div>
    </header>);
}
function FilterSelect({ id, label, value, options, onChange, }) {
    return (<select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="text-xs px-2.5 py-1.5 rounded-xl border outline-none cursor-pointer" style={{
            background: 'var(--color-surface-2)',
            borderColor: value ? 'var(--color-brand)' : 'var(--color-border)',
            color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
        }} aria-label={label}>
      <option value="">Semua {label}</option>
      {options.filter(Boolean).map((o) => (<option key={o} value={o}>
          {o}
        </option>))}
    </select>);
}
//# sourceMappingURL=Header.js.map