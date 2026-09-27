"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = Sidebar;
const react_1 = require("react");
const DropdownMenu = __importStar(require("@radix-ui/react-dropdown-menu"));
const lucide_react_1 = require("lucide-react");
const useAppStore_1 = require("@/hooks/useAppStore");
const useFileOpen_1 = require("@/hooks/useFileOpen");
const translations_1 = require("@/data/translations");
const feature_1 = require("@/models/feature");
const framer_motion_1 = require("framer-motion");
const views = [
    { id: 'mindmap', icon: lucide_react_1.Network, labelKey: 'mindmapView' },
    { id: 'table', icon: lucide_react_1.Table2, labelKey: 'tableView' },
    { id: 'kanban', icon: lucide_react_1.LayoutDashboard, labelKey: 'kanbanView' },
    { id: 'calendar', icon: lucide_react_1.Calendar, labelKey: 'calendarView' },
    { id: 'editor', icon: lucide_react_1.Edit, labelKey: 'editorView' },
];
const galleryView = { id: 'gallery', icon: lucide_react_1.Images, labelKey: 'galleryView' };
function Sidebar({ isMobile = false, onCloseMobile }) {
    const { state, dispatch } = (0, useAppStore_1.useAppStore)();
    const { openFile } = (0, useFileOpen_1.useFileOpen)();
    const lang = state.language;
    const t = translations_1.translations[lang].sidebar;
    const [themeMode, setThemeMode] = (0, react_1.useState)(() => {
        try {
            const stored = localStorage.getItem('mfm_theme_mode');
            if (stored === 'dark' || stored === 'light' || stored === 'auto')
                return stored;
        }
        catch { }
        return 'auto';
    });
    const handleLanguageChange = (l) => {
        dispatch({ type: 'SET_LANGUAGE', payload: l });
    };
    const applyThemeMode = (0, react_1.useCallback)((mode) => {
        localStorage.setItem('mfm_theme_mode', mode);
        setThemeMode(mode);
        if (mode === 'auto') {
            const isSystemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            dispatch({ type: 'SET_THEME', payload: isSystemDark ? 'dark' : 'light' });
        }
        else {
            dispatch({ type: 'SET_THEME', payload: mode });
        }
    }, [dispatch]);
    (0, react_1.useEffect)(() => {
        if (themeMode === 'auto' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                dispatch({ type: 'SET_THEME', payload: e.matches ? 'dark' : 'light' });
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [themeMode, dispatch]);
    const allFlat = (0, feature_1.flattenFeatures)(state.features);
    const totalItems = allFlat.length;
    const done = allFlat.filter((f) => f.metadata.status?.toLowerCase().includes('done') || f.metadata.status?.toLowerCase().includes('selesai')).length;
    const progress = allFlat.filter((f) => f.metadata.status?.toLowerCase().includes('progress') || f.metadata.status?.toLowerCase().includes('proses')).length;
    const todo = allFlat.filter((f) => f.metadata.status?.toLowerCase().includes('todo')).length;
    const handleChangeFile = async () => {
        const result = await openFile();
        if (result) {
            dispatch({ type: 'LOAD_FILE', payload: result });
        }
    };
    function handleNavClick(viewId) {
        dispatch({ type: 'SET_VIEW', payload: viewId });
        if (isMobile && onCloseMobile) {
            onCloseMobile();
        }
    }
    return (<aside className={`flex flex-col ${isMobile ? 'w-72' : 'w-60'} h-full border-r shrink-0 glass-panel select-none`} style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      {/* Mobile-only Brand Header with Close button */}
      {isMobile && (<div className="h-14 px-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{ background: 'linear-gradient(135deg, #0ef38d, #05c46b)' }}>
              <lucide_react_1.Layers size={17} className="text-slate-950 font-bold"/>
            </div>
            <span className="font-bold text-base font-display block tracking-tight" style={{ color: 'var(--color-text)' }}>
              MDFlow
            </span>
          </div>

          <button type="button" onClick={onCloseMobile} className="p-1.5 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-white hover:bg-white/10" title="Tutup Menu">
            <lucide_react_1.X size={18}/>
          </button>
        </div>)}

      {/* Active File Switcher */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <button onClick={handleChangeFile} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors duration-150 cursor-pointer group" style={{ background: 'var(--color-surface-2)' }} title={t.selectFile}>
          <lucide_react_1.FileText size={15} style={{ color: 'var(--color-brand)' }} className="shrink-0"/>
          <span className="text-xs font-medium truncate flex-1" style={{ color: 'var(--color-text)' }}>
            {state.fileName ?? t.selectFile}
          </span>
          <lucide_react_1.ChevronDown size={13} style={{ color: 'var(--color-text-dim)' }} className="shrink-0"/>
        </button>
      </div>

      {/* Single Primary Add Item Button */}
      <div className="px-3 pt-3">
        <button onClick={() => {
            dispatch({ type: 'OPEN_NEW_FEATURE_MODAL' });
            if (isMobile && onCloseMobile)
                onCloseMobile();
        }} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all font-display hover:scale-[1.02]" style={{ background: 'var(--color-brand)', color: '#050c14' }}>
          <lucide_react_1.Plus size={14}/> {t.newItemBtn}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {/* SUMMARY MENU */}
        <div>
          <button onClick={() => handleNavClick('summary')} className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer" style={{
            color: state.activeView === 'summary' ? 'var(--color-text)' : 'var(--color-text-muted)',
        }}>
            {state.activeView === 'summary' && (<framer_motion_1.motion.div layoutId="active-nav-indicator" className="absolute inset-0 rounded-xl shadow-md" style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-brand)',
            }} transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}/>)}
            <lucide_react_1.PieChart size={17} className="relative z-10 shrink-0" style={{ color: state.activeView === 'summary' ? 'var(--color-brand)' : 'inherit' }}/>
            <div className="relative z-10 flex-1 flex items-center justify-between font-display">
              <span className="text-xs font-bold">{t.summaryView}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md font-semibold" style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>
                Overview
              </span>
            </div>
          </button>
        </div>

        {/* Views & Data Section */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 mb-1.5 block font-display" style={{ color: 'var(--color-text-dim)' }}>
            {t.viewsSection}
          </span>
          <div className="space-y-0.5">
            {views.map((view) => {
            const Icon = view.icon;
            const isActive = state.activeView === view.id;
            const label = t[view.labelKey];
            return (<button key={view.id} onClick={() => handleNavClick(view.id)} className="relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer group" style={{
                    color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                }}>
                  {isActive && (<framer_motion_1.motion.div layoutId="active-nav-indicator" className="absolute inset-0 rounded-xl shadow-md" style={{
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-brand)',
                    }} transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}/>)}
                  <Icon size={16} className="relative z-10 shrink-0 transition-transform group-hover:scale-110" style={{ color: isActive ? 'var(--color-brand)' : 'inherit' }}/>
                  <span className="relative z-10 text-xs font-semibold flex-1 font-display">
                    {label}
                  </span>
                </button>);
        })}
          </div>
        </div>

        {/* WORKSPACE & GALLERY SECTION */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 mb-1.5 block font-display" style={{ color: 'var(--color-text-dim)' }}>
            {t.workspaceSection}
          </span>
          <div className="space-y-0.5">
            <button onClick={() => handleNavClick(galleryView.id)} className="relative w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer group" style={{
            color: state.activeView === 'gallery' ? 'var(--color-text)' : 'var(--color-text-muted)',
        }}>
              {state.activeView === 'gallery' && (<framer_motion_1.motion.div layoutId="active-nav-indicator" className="absolute inset-0 rounded-xl shadow-md" style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-brand)',
            }} transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}/>)}
              <lucide_react_1.Images size={16} className="relative z-10 shrink-0 transition-transform group-hover:scale-110" style={{ color: state.activeView === 'gallery' ? 'var(--color-brand)' : 'inherit' }}/>
              <span className="relative z-10 text-xs font-semibold flex-1 font-display">
                {t.galleryView}
              </span>
              <span className="relative z-10 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold" style={{
            background: state.activeView === 'gallery' ? 'var(--color-brand)' : 'rgba(255,255,255,0.06)',
            color: state.activeView === 'gallery' ? '#050c14' : 'var(--color-text-dim)',
        }}>
                Ref
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Widget */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider px-1 text-slate-500 font-display">
          {t.progressOverview}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <StatChip label={t.totalItems} value={totalItems} color="var(--color-text-muted)"/>
          <StatChip label={t.done} value={done} color="var(--color-done)"/>
          <StatChip label={t.progress} value={progress} color="var(--color-progress)"/>
          <StatChip label={t.todo} value={todo} color="var(--color-todo)"/>
        </div>
      </div>

      {/* Theme Mode & Language Selector Controls at Bottom of Sidebar */}
      <div className="p-2.5 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--color-border)' }}>
        
        {/* Custom Non-Native Language Selector */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer transition-colors" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} title="Ganti Bahasa / Switch Language">
              <span className="flex items-center gap-1.5 truncate">
                <lucide_react_1.Globe size={13} style={{ color: 'var(--color-brand)' }}/>
                <span>{lang === 'id' ? 'ID' : 'EN'}</span>
              </span>
              <lucide_react_1.ChevronDown size={12} style={{ color: 'var(--color-text-dim)' }}/>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content sideOffset={5} align="start" className="z-[100] min-w-[160px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1.5 shadow-2xl animate-in fade-in-50 zoom-in-95">
              <DropdownMenu.Item onClick={() => handleLanguageChange('id')} className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] outline-none" style={{ color: 'var(--color-text)' }}>
                <span>🇮🇩 Indonesia</span>
                {lang === 'id' && <lucide_react_1.Check size={13} style={{ color: 'var(--color-brand)' }}/>}
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => handleLanguageChange('en')} className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] outline-none" style={{ color: 'var(--color-text)' }}>
                <span>🇺🇸 English</span>
                {lang === 'en' && <lucide_react_1.Check size={13} style={{ color: 'var(--color-brand)' }}/>}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Custom Non-Native Theme Mode Selector */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer transition-colors" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} title="Ganti Mode Tema (Auto / Dark / Light)">
              <span className="flex items-center gap-1.5 truncate font-display">
                {themeMode === 'auto' && <lucide_react_1.Monitor size={13} style={{ color: 'var(--color-brand)' }}/>}
                {themeMode === 'dark' && <lucide_react_1.Moon size={13} style={{ color: 'var(--color-brand)' }}/>}
                {themeMode === 'light' && <lucide_react_1.Sun size={13} style={{ color: 'var(--color-brand)' }}/>}
                <span className="capitalize">{themeMode}</span>
              </span>
              <lucide_react_1.ChevronDown size={12} style={{ color: 'var(--color-text-dim)' }}/>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content sideOffset={5} align="end" className="z-[100] min-w-[170px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1.5 shadow-2xl animate-in fade-in-50 zoom-in-95">
              <DropdownMenu.Item onClick={() => applyThemeMode('auto')} className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] outline-none font-display" style={{ color: 'var(--color-text)' }}>
                <span className="flex items-center gap-2">
                  <lucide_react_1.Monitor size={13} style={{ color: 'var(--color-brand)' }}/> Auto
                </span>
                {themeMode === 'auto' && <lucide_react_1.Check size={13} style={{ color: 'var(--color-brand)' }}/>}
              </DropdownMenu.Item>

              <DropdownMenu.Item onClick={() => applyThemeMode('dark')} className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] outline-none font-display" style={{ color: 'var(--color-text)' }}>
                <span className="flex items-center gap-2">
                  <lucide_react_1.Moon size={13} style={{ color: 'var(--color-brand)' }}/> Dark
                </span>
                {themeMode === 'dark' && <lucide_react_1.Check size={13} style={{ color: 'var(--color-brand)' }}/>}
              </DropdownMenu.Item>

              <DropdownMenu.Item onClick={() => applyThemeMode('light')} className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] outline-none font-display" style={{ color: 'var(--color-text)' }}>
                <span className="flex items-center gap-2">
                  <lucide_react_1.Sun size={13} style={{ color: 'var(--color-brand)' }}/> Light
                </span>
                {themeMode === 'light' && <lucide_react_1.Check size={13} style={{ color: 'var(--color-brand)' }}/>}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

    </aside>);
}
function StatChip({ label, value, color }) {
    return (<div className="flex flex-col px-2.5 py-1.5 rounded-xl border" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
      <span className="text-xs font-bold font-display" style={{ color }}>{value}</span>
      <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>{label}</span>
    </div>);
}
//# sourceMappingURL=Sidebar.js.map