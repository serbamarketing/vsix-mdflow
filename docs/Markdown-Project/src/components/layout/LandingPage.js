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
exports.LandingPage = LandingPage;
const react_1 = require("react");
const framer_motion_1 = require("framer-motion");
const DropdownMenu = __importStar(require("@radix-ui/react-dropdown-menu"));
const lucide_react_1 = require("lucide-react");
const useFileOpen_1 = require("@/hooks/useFileOpen");
const useAppStore_1 = require("@/hooks/useAppStore");
const markdownParser_1 = require("@/features/parser/markdownParser");
const sampleRobloxProject_1 = require("@/data/sampleRobloxProject");
const sampleTechProject_1 = require("@/data/sampleTechProject");
const landingTranslations_1 = require("@/data/landingTranslations");
function LandingPage() {
    const { openFile } = (0, useFileOpen_1.useFileOpen)();
    const { state, dispatch } = (0, useAppStore_1.useAppStore)();
    // State
    const [isDragOver, setIsDragOver] = (0, react_1.useState)(false);
    const [openFaqIndex, setOpenFaqIndex] = (0, react_1.useState)(0);
    const lang = state.language;
    const setLang = (l) => dispatch({ type: 'SET_LANGUAGE', payload: l });
    const [themeMode, setThemeMode] = (0, react_1.useState)(() => {
        try {
            const stored = localStorage.getItem('mfm_theme_mode');
            if (stored === 'dark' || stored === 'light' || stored === 'auto')
                return stored;
        }
        catch { }
        return 'auto';
    });
    const t = landingTranslations_1.landingTranslations[lang];
    // Apply theme according to selected mode
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
    // Listen to system preference changes when mode is 'auto'
    (0, react_1.useEffect)(() => {
        applyThemeMode(themeMode);
        if (themeMode === 'auto' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                dispatch({ type: 'SET_THEME', payload: e.matches ? 'dark' : 'light' });
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [themeMode, applyThemeMode, dispatch]);
    const handleOpen = async () => {
        const result = await openFile();
        if (result) {
            dispatch({
                type: 'LOAD_FILE',
                payload: result,
            });
        }
    };
    const handleLoadRobloxDemo = () => {
        const featuresList = (0, markdownParser_1.parseMarkdown)(sampleRobloxProject_1.sampleRobloxMarkdown);
        dispatch({
            type: 'LOAD_FILE',
            payload: {
                content: sampleRobloxProject_1.sampleRobloxMarkdown,
                fileName: sampleRobloxProject_1.sampleRobloxFileName,
                features: featuresList,
                handle: null,
            },
        });
    };
    const handleLoadTechDemo = () => {
        const featuresList = (0, markdownParser_1.parseMarkdown)(sampleTechProject_1.sampleTechMarkdown);
        dispatch({
            type: 'LOAD_FILE',
            payload: {
                content: sampleTechProject_1.sampleTechMarkdown,
                fileName: sampleTechProject_1.sampleTechFileName,
                features: featuresList,
                handle: null,
            },
        });
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = () => {
        setIsDragOver(false);
    };
    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (!file)
            return;
        if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown') && !file.name.endsWith('.txt')) {
            alert(lang === 'id' ? 'Mohon masukkan file Markdown (.md atau .markdown)' : 'Please select a Markdown file (.md or .markdown)');
            return;
        }
        try {
            const content = await file.text();
            const featuresList = (0, markdownParser_1.parseMarkdown)(content);
            dispatch({
                type: 'LOAD_FILE',
                payload: {
                    content,
                    fileName: file.name,
                    features: featuresList,
                    handle: null,
                },
            });
        }
        catch (err) {
            console.error('Gagal membaca file drop:', err);
            alert(lang === 'id' ? 'Gagal membaca file Markdown.' : 'Failed to read Markdown file.');
        }
    };
    const features = [
        {
            icon: lucide_react_1.PieChart,
            label: t.features.summaryLabel,
            desc: t.features.summaryDesc,
            color: '#818cf8',
            badge: 'Executive Dashboard',
        },
        {
            icon: lucide_react_1.Network,
            label: t.features.mindmapLabel,
            desc: t.features.mindmapDesc,
            color: '#0ef38d',
            badge: 'Visual Tree',
        },
        {
            icon: lucide_react_1.LayoutDashboard,
            label: t.features.kanbanLabel,
            desc: t.features.kanbanDesc,
            color: '#a855f7',
            badge: 'Agile Workflow',
        },
        {
            icon: lucide_react_1.Table2,
            label: t.features.tableLabel,
            desc: t.features.tableDesc,
            color: '#3b82f6',
            badge: 'Database Grid',
        },
        {
            icon: lucide_react_1.Calendar,
            label: t.features.calendarLabel,
            desc: t.features.calendarDesc,
            color: '#ec4899',
            badge: 'Timeline View',
        },
        {
            icon: lucide_react_1.FileText,
            label: t.features.editorLabel,
            desc: t.features.editorDesc,
            color: '#f59e0b',
            badge: 'Raw Source',
        },
    ];
    const steps = [
        {
            step: '01',
            title: t.howItWorks.step1Title,
            desc: t.howItWorks.step1Desc,
            icon: lucide_react_1.FileText,
            accent: '#0ef38d',
        },
        {
            step: '02',
            title: t.howItWorks.step2Title,
            desc: t.howItWorks.step2Desc,
            icon: lucide_react_1.Sliders,
            accent: '#a855f7',
        },
        {
            step: '03',
            title: t.howItWorks.step3Title,
            desc: t.howItWorks.step3Desc,
            icon: lucide_react_1.RefreshCw,
            accent: '#3b82f6',
        },
    ];
    const highlights = [
        {
            icon: lucide_react_1.ShieldCheck,
            title: t.highlights.privacyTitle,
            desc: t.highlights.privacyDesc,
        },
        {
            icon: lucide_react_1.RefreshCw,
            title: t.highlights.syncTitle,
            desc: t.highlights.syncDesc,
        },
        {
            icon: lucide_react_1.Sliders,
            title: t.highlights.metaTitle,
            desc: t.highlights.metaDesc,
        },
    ];
    const useCases = [
        {
            title: t.useCases.case1Title,
            desc: t.useCases.case1Desc,
            icon: lucide_react_1.Rocket,
            color: '#6366f1',
        },
        {
            title: t.useCases.case2Title,
            desc: t.useCases.case2Desc,
            icon: lucide_react_1.Gamepad2,
            color: '#0ef38d',
        },
        {
            title: t.useCases.case3Title,
            desc: t.useCases.case3Desc,
            icon: lucide_react_1.FolderGit2,
            color: '#3b82f6',
        },
        {
            title: t.useCases.case4Title,
            desc: t.useCases.case4Desc,
            icon: lucide_react_1.Cpu,
            color: '#ec4899',
        },
    ];
    const testimonials = [
        {
            quote: t.testimonials.item1Quote,
            name: 'Reza Pratama',
            role: t.testimonials.item1Role,
            avatar: 'RP',
            color: '#0ef38d',
            stars: 5,
            project: 'SpawnEra Studio',
        },
        {
            quote: t.testimonials.item2Quote,
            name: 'Siti Rahma',
            role: t.testimonials.item2Role,
            avatar: 'SR',
            color: '#a855f7',
            stars: 5,
            project: 'SaaS App Engine',
        },
        {
            quote: t.testimonials.item3Quote,
            name: 'Budi Santoso',
            role: t.testimonials.item3Role,
            avatar: 'BS',
            color: '#3b82f6',
            stars: 5,
            project: 'Knowledge Hub',
        },
    ];
    const faqs = [
        { q: t.faq.q1, a: t.faq.a1 },
        { q: t.faq.q2, a: t.faq.a2 },
        { q: t.faq.q3, a: t.faq.a3 },
        { q: t.faq.q4, a: t.faq.a4 },
    ];
    return (<div className="w-full min-h-full flex flex-col relative selection:bg-[var(--color-brand)] selection:text-slate-950 bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-200 font-body">
      
      {/* STICKY HEADER NAVIGATION BAR (Full Width Section, Max-Width Inner Container) */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[var(--color-surface)]/90 border-b border-[var(--color-border)] shadow-lg transition-all">
        <div className="mx-auto flex max-w-6xl w-full items-center justify-between gap-6 px-6 py-4">
          
          {/* Left Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-brand-glow)]" style={{ background: 'linear-gradient(135deg, #0ef38d, #05c46b)' }}>
              <lucide_react_1.Layers size={22} className="text-slate-950 font-bold"/>
            </div>
            <div className="text-left">
              <h1 className="text-base font-extrabold tracking-tight leading-none flex items-center gap-2 font-display text-[var(--color-text)]">
                {t.nav.brand}
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-[var(--color-brand)]/15 text-[var(--color-brand)] border border-[var(--color-brand)]/30">
                  {t.nav.version}
                </span>
              </h1>
              <p className="text-[9px] text-[var(--color-text-dim)] mt-0.5 font-semibold tracking-wider uppercase">
                by <span className="text-[var(--color-brand)] font-bold">{t.nav.studio}</span> • {t.nav.subtitle}
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[var(--color-text-muted)]">
            <a href="#how-it-works" className="hover:text-[var(--color-brand)] transition-colors">
              {t.nav.howItWorks}
            </a>
            <a href="#features" className="hover:text-[var(--color-brand)] transition-colors">
              {t.nav.features}
            </a>
            <a href="#use-cases" className="hover:text-[var(--color-brand)] transition-colors">
              {t.nav.useCases}
            </a>
            <a href="#testimonials" className="hover:text-[var(--color-brand)] transition-colors">
              {t.nav.testimonials}
            </a>
            <a href="#faq" className="hover:text-[var(--color-brand)] transition-colors">
              {t.nav.faq}
            </a>
          </nav>

          {/* Right Action Button */}
          <div className="flex items-center gap-2">
            <button onClick={handleOpen} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] transition-all shadow-md cursor-pointer hover:scale-105">
              <lucide_react_1.Upload size={14}/>
              <span>{t.nav.btnOpen}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Ambient Background Light Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-full opacity-10 blur-[140px]" style={{ background: 'radial-gradient(circle, var(--color-brand) 0%, #3b82f6 50%, transparent 70%)' }}/>
        <div className="absolute top-[40%] -right-40 w-[600px] h-[600px] rounded-full opacity-10 blur-[130px]" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}/>
      </div>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 flex flex-col items-center relative z-10 w-full">
        
        {/* HERO SECTION: 2-COLUMN GRID LAYOUT (Left: Headline & Actions, Right: Interactive Drag & Drop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full max-w-6xl my-4 sm:my-8 text-left">
          
          {/* Left Column: Headline, Description & Actions */}
          <div className="space-y-6">
            <framer_motion_1.motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border glass-panel border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10">
              <lucide_react_1.Sparkles size={14} className="text-[var(--color-brand)] animate-pulse"/>
              <span className="text-xs font-bold text-[var(--color-brand)] tracking-wide font-display">
                {t.hero.badge}
              </span>
            </framer_motion_1.motion.div>

            <framer_motion_1.motion.h2 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-3xl sm:text-5xl font-black leading-[1.15] tracking-tight text-[var(--color-text)] font-display">
              {t.hero.titleLine1}{' '}
              <span style={{
            background: 'linear-gradient(135deg, var(--color-brand) 10%, #38bdf8 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        }}>
                {t.hero.titleLine2}
              </span>
            </framer_motion_1.motion.h2>

            <framer_motion_1.motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-muted)] max-w-lg">
              {t.hero.description}
            </framer_motion_1.motion.p>

            {/* Action Buttons */}
            <framer_motion_1.motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="flex flex-wrap gap-3 pt-2">
              <button onClick={handleOpen} className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs text-slate-950 cursor-pointer shadow-xl shadow-[var(--color-brand-glow)] transition-all hover:scale-[1.02] active:scale-[0.98] font-display" style={{ background: 'linear-gradient(135deg, #0ef38d, #05c46b)' }}>
                <lucide_react_1.Upload size={15}/>
                {t.hero.btnOpenLocal}
              </button>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs text-[var(--color-text)] border border-[var(--color-brand)]/40 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition-all cursor-pointer shadow-md font-display">
                    <lucide_react_1.Rocket size={15} className="text-[var(--color-brand)]"/>
                    <span>{t.cta.btnDemo}</span>
                    <lucide_react_1.ChevronDown size={13} className="text-[var(--color-text-dim)]"/>
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content sideOffset={6} align="start" className="z-[100] min-w-[210px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1.5 shadow-2xl animate-in fade-in-50 zoom-in-95">
                    <DropdownMenu.Item onClick={handleLoadRobloxDemo} className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] hover:text-[var(--color-brand)] outline-none transition-colors">
                      <lucide_react_1.Gamepad2 size={15} className="text-[var(--color-brand)]"/>
                      <span>{t.hero.btnDemoRoblox}</span>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={handleLoadTechDemo} className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] hover:text-indigo-400 outline-none transition-colors">
                      <lucide_react_1.Rocket size={15} className="text-indigo-400"/>
                      <span>{t.hero.btnDemoTech}</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </framer_motion_1.motion.div>
          </div>

          {/* Right Column: Drag-and-Drop Dropzone Card */}
          <framer_motion_1.motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25 }} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`w-full p-8 sm:p-10 rounded-3xl border border-dashed transition-all duration-300 text-center relative flex flex-col items-center justify-center min-h-[360px] group ${isDragOver
            ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/15 scale-[1.02] shadow-[0_0_50px_var(--color-brand-glow)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-brand)]/50 shadow-xl'} glass-panel`}>
            <div className="absolute inset-0 rounded-3xl pointer-events-none border border-white/5 opacity-10"/>

            {/* Cloud/File Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 ${isDragOver ? 'scale-110 bg-[var(--color-brand)]/20 text-[var(--color-brand)]' : 'bg-[var(--color-surface-2)] text-[var(--color-brand)] group-hover:scale-105'}`}>
              {isDragOver ? <lucide_react_1.Upload size={32} className="animate-bounce"/> : <lucide_react_1.FileText size={32}/>}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)] mb-2 font-display">
              {isDragOver ? t.hero.dropActive : t.hero.dropInactive}
            </h3>
            <p className="text-xs text-[var(--color-text-dim)] mb-6 max-w-xs leading-relaxed">
              {t.hero.dropSub}
            </p>

            <button onClick={handleOpen} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 cursor-pointer shadow-lg transition-all hover:scale-105 font-display" style={{ background: 'linear-gradient(135deg, #0ef38d, #05c46b)' }}>
              <lucide_react_1.Upload size={14}/>
              {t.hero.btnOpenLocal}
            </button>
          </framer_motion_1.motion.div>

        </div>

        {/* Section 1: How It Works / Cara Kerja 3 Langkah */}
        <section id="how-it-works" className="w-full mt-24 pt-4">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-brand)] mb-2 block font-display">
              {t.howItWorks.sectionTag}
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text)] font-display">
              {t.howItWorks.title}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-dim)] mt-2 max-w-xl mx-auto">
              {t.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {steps.map(({ step, title, desc, icon: StepIcon, accent }) => (<div key={step} className="p-7 rounded-3xl border glass-panel transition-all hover:-translate-y-1.5 relative overflow-hidden group bg-[var(--color-surface)] border-[var(--color-border)]">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity" style={{ background: accent }}/>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${accent}18`, color: accent }}>
                    <StepIcon size={22}/>
                  </div>
                  <span className="text-2xl font-black opacity-40 group-hover:opacity-100 transition-opacity font-mono" style={{ color: accent }}>
                    {step}
                  </span>
                </div>
                <h4 className="font-bold text-base text-[var(--color-text)] mb-2 font-display">{title}</h4>
                <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">{desc}</p>
              </div>))}
          </div>
        </section>

        {/* Section 2: Feature Views Showcase */}
        <section id="features" className="w-full mt-28 pt-4">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400 mb-2 block font-display">
              {t.features.sectionTag}
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text)] font-display">
              {t.features.title}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-dim)] mt-2 max-w-xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 w-full">
            {features.map(({ icon: Icon, label, desc, color, badge }) => (<div key={label} className="p-6 rounded-3xl border text-left glass-panel transition-all hover:-translate-y-1.5 flex flex-col justify-between bg-[var(--color-surface)] border-[var(--color-border)]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${color}18`, color }}>
                      <Icon size={20}/>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border" style={{ borderColor: `${color}40`, color, background: `${color}10` }}>
                      {badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-[var(--color-text)] mb-2 font-display">{label}</h4>
                  <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">{desc}</p>
                </div>
              </div>))}
          </div>

          {/* Highlights 3-Pillar Cards inside Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
            {highlights.map(({ icon: Icon, title, desc }) => (<div key={title} className="p-6 rounded-3xl border glass-panel flex items-start gap-4 text-left bg-[var(--color-surface)] border-[var(--color-border)]">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-[var(--color-brand)]/30" style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}>
                  <Icon size={18}/>
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-sm text-[var(--color-text)] font-display">{title}</h5>
                  <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">{desc}</p>
                </div>
              </div>))}
          </div>
        </section>

        {/* Section 3: Universal Use Cases Showcase */}
        <section id="use-cases" className="w-full mt-28 pt-4">
          <div className="p-8 sm:p-12 rounded-3xl border border-[var(--color-border)] glass-panel relative overflow-hidden bg-[var(--color-surface)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
              <div className="text-left max-w-xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/30 text-[var(--color-brand)] text-xs font-bold mb-4 font-display">
                  <lucide_react_1.Rocket size={14}/> {t.useCases.badge}
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-[var(--color-text)] leading-tight font-display">
                  {t.useCases.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-3 leading-relaxed">
                  {t.useCases.subtitle}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button onClick={handleLoadRobloxDemo} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-slate-950 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] shadow-lg transition-all cursor-pointer hover:scale-105 font-display">
                  <lucide_react_1.Gamepad2 size={15}/> {t.useCases.btnDemoRoblox}
                </button>
                <button onClick={handleLoadTechDemo} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg transition-all cursor-pointer hover:scale-105 font-display">
                  <lucide_react_1.Rocket size={15}/> {t.useCases.btnDemoTech}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {useCases.map(({ title, desc, icon: Icon, color }) => (<div key={title} className="p-5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-left transition-all hover:border-[var(--color-brand)]/40">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}18`, color }}>
                    <Icon size={18}/>
                  </div>
                  <h5 className="font-bold text-sm text-[var(--color-text)] mb-1.5 font-display">{title}</h5>
                  <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">{desc}</p>
                </div>))}
            </div>
          </div>
        </section>

        {/* Section 4: Testimonials / Kata Mereka */}
        <section id="testimonials" className="w-full mt-28 pt-4">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-brand)] mb-2 block font-display">
              {t.testimonials.sectionTag}
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-text)] font-display">
              {t.testimonials.title}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-dim)] mt-2 max-w-xl mx-auto">
              {t.testimonials.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {testimonials.map(({ quote, name, role, avatar, color, stars, project }) => (<div key={name} className="p-7 rounded-3xl border glass-panel flex flex-col justify-between text-left transition-all hover:-translate-y-1.5 bg-[var(--color-surface)] border-[var(--color-border)]">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-1 text-amber-400">
                      {Array.from({ length: stars }).map((_, i) => (<lucide_react_1.Star key={i} size={14} fill="currentColor"/>))}
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-dim)] border border-[var(--color-border)]">
                      {project}
                    </span>
                  </div>
                  <lucide_react_1.Quote size={20} className="text-[var(--color-brand)] opacity-60 mb-2"/>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed italic mb-6">"{quote}"</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-slate-950 shrink-0" style={{ background: color }}>
                    {avatar}
                  </div>
                  <div>
                    <h6 className="font-bold text-xs text-[var(--color-text)] font-display">{name}</h6>
                    <p className="text-[11px] text-[var(--color-text-dim)]">{role}</p>
                  </div>
                </div>
              </div>))}
          </div>
        </section>

        {/* Section 4.5: AI & Integrations */}
        <section id="ai-integration" className="w-full mt-28 pt-4">
          <div className="p-8 sm:p-12 rounded-3xl border border-[var(--color-border)] glass-panel bg-[var(--color-surface)]">
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
              <div className="flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/30 text-[var(--color-brand)] text-xs font-bold mb-2 font-display">
                  <lucide_react_1.Cpu size={14}/> AI Ready
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] font-display">
                  {lang === 'id' ? 'Integrasi AI & Format File' : 'AI Integration & File Format'}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-dim)] leading-relaxed">
                  {lang === 'id'
            ? 'MDFlow dirancang agar sangat mudah dipahami oleh AI. Unduh sampel file di bawah ini untuk memulai, atau salin prompt AI agar ChatGPT / Claude dapat men-generate struktur proyek dengan format yang 100% kompatibel dengan MDFlow.'
            : 'MDFlow is designed to be easily understood by AI. Download the sample file below to get started, or copy the AI prompt so ChatGPT / Claude can generate project structures that are 100% compatible with MDFlow.'}
                </p>
                <div className="pt-2">
                  <a href={`data:text/markdown;charset=utf-8,${encodeURIComponent(sampleTechProject_1.sampleTechMarkdown)}`} download="Sample_MDFlow_Project.md" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-brand)] text-slate-950 hover:bg-[var(--color-brand-hover)] transition-colors shadow-lg shadow-[var(--color-brand-glow)]">
                    <lucide_react_1.Download size={15}/> 
                    {lang === 'id' ? 'Download Sample .md' : 'Download Sample .md'}
                  </a>
                </div>
              </div>
              
              <div className="flex-1 w-full bg-[var(--color-surface-2)] p-5 rounded-2xl border border-[var(--color-border)]">
                {(() => {
            const aiPrompts = {
                id: `Saya menggunakan MDFlow untuk manajemen proyek saya. MDFlow adalah visual workspace yang mem-parsing Markdown standar menjadi mindmap, papan kanban, dan tabel. Saat membuat atau meng-generate struktur proyek, fitur, atau tugas, gunakan heading Markdown untuk hierarki (H1, H2, H3). Untuk setiap heading tugas/fitur, sertakan metadata dalam format berikut di baris tepat setelah heading:\n\n**Status:** Todo | Progress | Done\n**Priority:** High | Medium | Low\n**Pic:** @username\n**Deadline:** YYYY-MM-DD\n\nTolong hasilkan rencana proyek yang mematuhi format Markdown MDFlow ini.`,
                en: `I am using MDFlow for my project management. MDFlow is a visual workspace that parses standard Markdown into mindmaps, kanban boards, and tables. When generating project structures, features, or tasks, use headings for hierarchy (H1, H2, H3). For each task/feature heading, include metadata exactly in this format on the lines immediately following the heading:\n\n**Status:** Todo | Progress | Done\n**Priority:** High | Medium | Low\n**Pic:** @username\n**Deadline:** YYYY-MM-DD\n\nPlease output the project plan adhering to this MDFlow markdown format.`,
            };
            const activePrompt = aiPrompts[lang] || aiPrompts.en;
            return (<>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--color-text)] font-display">
                            {lang === 'id' ? 'System Prompt untuk AI' : 'AI System Prompt'}
                          </span>

                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-brand)]/40 text-[var(--color-brand)] font-bold cursor-pointer hover:bg-[var(--color-surface-3)] transition-colors focus:outline-none" title="Ganti bahasa prompt / Change prompt language">
                                <span>{lang === 'id' ? '🇮🇩 ID' : '🇺🇸 EN'}</span>
                                <lucide_react_1.ChevronDown size={11}/>
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content sideOffset={4} align="start" className="z-[100] min-w-[140px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-1 shadow-2xl animate-in fade-in-50 zoom-in-95 text-xs font-semibold">
                                <DropdownMenu.Item onClick={() => setLang('id')} className="flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--color-surface-2)] hover:text-[var(--color-brand)] outline-none text-[11px]">
                                  <span>🇮🇩 ID (Indonesia)</span>
                                  {lang === 'id' && <lucide_react_1.Check size={12} className="text-[var(--color-brand)]"/>}
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={() => setLang('en')} className="flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[var(--color-surface-2)] hover:text-[var(--color-brand)] outline-none text-[11px]">
                                  <span>🇺🇸 EN (English)</span>
                                  {lang === 'en' && <lucide_react_1.Check size={12} className="text-[var(--color-brand)]"/>}
                                </DropdownMenu.Item>
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                        </div>
                        <button onClick={() => {
                    navigator.clipboard.writeText(activePrompt);
                    alert(lang === 'id' ? 'Prompt AI tersalin ke clipboard!' : 'AI Prompt copied to clipboard!');
                }} className="text-[10px] px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors text-[var(--color-text-dim)] font-medium cursor-pointer">
                          {lang === 'id' ? 'Copy Prompt' : 'Copy Prompt'}
                        </button>
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)] font-mono leading-relaxed bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] h-44 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                        {activePrompt}
                      </div>
                    </>);
        })()}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ Accordion */}
        <section id="faq" className="w-full mt-28 pt-4">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--color-brand)] mb-2 block font-display">
              {t.faq.sectionTag}
            </span>
            <h3 className="text-3xl font-extrabold text-[var(--color-text)] font-display">{t.faq.title}</h3>
          </div>

          <div className="space-y-4 text-left w-full">
            {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (<div key={faq.q} className="rounded-2xl border glass-panel overflow-hidden transition-colors bg-[var(--color-surface)] border-[var(--color-border)]" style={{ borderColor: isOpen ? 'var(--color-brand)' : 'var(--color-border)' }}>
                  <button onClick={() => setOpenFaqIndex(isOpen ? null : idx)} className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-[var(--color-text)] cursor-pointer hover:text-[var(--color-brand)] transition-colors font-display">
                    <span className="flex items-center gap-2.5">
                      <lucide_react_1.HelpCircle size={17} className="text-[var(--color-brand)] shrink-0"/>
                      {faq.q}
                    </span>
                    <lucide_react_1.ChevronDown size={18} className={`text-[var(--color-text-dim)] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--color-brand)]' : ''}`}/>
                  </button>
                  <framer_motion_1.AnimatePresence>
                    {isOpen && (<framer_motion_1.motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-5 pb-5 text-xs text-[var(--color-text-muted)] leading-relaxed border-t border-[var(--color-border)] pt-3 whitespace-pre-line">
                        {faq.a}
                      </framer_motion_1.motion.div>)}
                  </framer_motion_1.AnimatePresence>
                </div>);
        })}
          </div>
        </section>

        {/* Section 6: CTA Above Footer */}
        <section className="w-full mt-28">
          <div className="w-full p-10 sm:p-14 rounded-3xl text-center relative overflow-hidden glass-panel border border-[var(--color-brand)]/40 bg-[var(--color-surface)]" style={{
            background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-2) 100%)',
        }}>
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--color-brand-glow)] blur-3xl pointer-events-none"/>

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[var(--color-brand)]/15 text-[var(--color-brand)] text-xs font-bold mb-4 backdrop-blur-md font-display">
                <lucide_react_1.Zap size={14} className="text-amber-300"/> {t.cta.badge}
              </span>
              <h3 className="text-3xl sm:text-5xl font-black text-[var(--color-text)] mb-4 tracking-tight font-display">
                {t.cta.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mb-8 leading-relaxed">
                {t.cta.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleOpen} className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs text-slate-950 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] shadow-xl hover:scale-105 transition-all cursor-pointer font-display">
                  <lucide_react_1.Upload size={16}/> {t.cta.btnOpen}
                </button>

                <button onClick={handleLoadRobloxDemo} className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs text-[var(--color-text)] border border-[var(--color-brand)]/40 bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] transition-all cursor-pointer hover:scale-105 font-display">
                  <lucide_react_1.Gamepad2 size={16} className="text-[var(--color-brand)]"/> {t.cta.btnDemo}
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FULL SPAWNERA STYLE FOOTER */}
      <footer id="footer" className="w-full border-t border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-colors">
        
        {/* Top 4-Column Grid Section */}
        <div className="mx-auto max-w-6xl w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 px-6 py-12 text-left">
          
          {/* Column 1: Brand & Studio Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-brand)] flex items-center justify-center text-slate-950 font-bold">
                <lucide_react_1.Layers size={18}/>
              </div>
              <p className="font-display text-xl font-bold text-[var(--color-text)]">MDFlow</p>
            </div>
            <p className="text-xs text-[var(--color-text-dim)] leading-relaxed">
              {t.footer.description}
            </p>
            <p className="text-xs text-[var(--color-text-dim)] font-semibold">
              Created by <strong className="text-[var(--color-brand)] font-display">SpawnEra Studio</strong> • Jakarta, Indonesia
            </p>
          </div>

          {/* Column 2: Tautan Navigasi */}
          <div className="space-y-2.5 text-xs">
            <p className="text-sm font-bold text-[var(--color-text)] font-display">{t.footer.navTitle}</p>
            <a href="#how-it-works" className="block text-[var(--color-text-dim)] hover:text-[var(--color-brand)] transition-colors">
              {t.footer.linkHowItWorks}
            </a>
            <a href="#features" className="block text-[var(--color-text-dim)] hover:text-[var(--color-brand)] transition-colors">
              {t.footer.linkFeatures}
            </a>
            <a href="#use-cases" className="block text-[var(--color-text-dim)] hover:text-[var(--color-brand)] transition-colors">
              {t.footer.linkUseCases}
            </a>
            <a href="#faq" className="block text-[var(--color-text-dim)] hover:text-[var(--color-brand)] transition-colors">
              {t.footer.linkFaq}
            </a>
          </div>

          {/* Column 3: Kontak & Komunitas */}
          <div className="space-y-2.5 text-xs">
            <p className="text-sm font-bold text-[var(--color-text)] font-display">{t.footer.commTitle}</p>
            <a href="https://discord.gg/4QUZzuUJzt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--color-text-dim)] hover:text-[#5865F2] transition-colors font-semibold">
              <span>💬 Discord Community</span>
              <lucide_react_1.ExternalLink size={12}/>
            </a>
            <a href="https://tiktok.com/@spawnera" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--color-text-dim)] hover:text-[#ff0050] transition-colors font-semibold">
              <span>🎵 TikTok @spawnera</span>
              <lucide_react_1.ExternalLink size={12}/>
            </a>
            <a href="https://checker.spawnera.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[var(--color-brand)] font-bold hover:underline pt-1">
              <span>SpawnEra Studio Suite</span>
              <lucide_react_1.ExternalLink size={12}/>
            </a>
          </div>

          {/* Column 4: Non-Native Dropdowns Controls */}
          <div className="space-y-4 text-xs">
            <p className="text-sm font-bold text-[var(--color-text)] font-display">{t.footer.settingsTitle}</p>

            {/* Custom Non-Native Language Dropdown (Radix UI) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[var(--color-text-dim)] block">{t.footer.languageLabel}:</span>
              
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="w-full flex items-center justify-between bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold rounded-xl px-3 py-2 hover:border-[var(--color-brand)] transition-colors cursor-pointer shadow-sm focus:outline-none">
                    <span className="flex items-center gap-2">
                      <lucide_react_1.Globe size={14} className="text-[var(--color-brand)]"/>
                      <span>{lang === 'id' ? '🇮🇩 ID (Indonesia)' : '🇺🇸 EN (English)'}</span>
                    </span>
                    <lucide_react_1.ChevronDown size={14} className="text-[var(--color-text-dim)]"/>
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content sideOffset={6} align="end" className="z-[100] min-w-[200px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1.5 shadow-2xl animate-in fade-in-50 zoom-in-95">
                    <DropdownMenu.Item onClick={() => setLang('id')} className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] hover:text-[var(--color-brand)] outline-none transition-colors">
                      <span className="flex items-center gap-2">
                        <span>🇮🇩</span> Bahasa Indonesia (ID)
                      </span>
                      {lang === 'id' && <lucide_react_1.Check size={14} className="text-[var(--color-brand)]"/>}
                    </DropdownMenu.Item>

                    <DropdownMenu.Item onClick={() => setLang('en')} className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] hover:text-[var(--color-brand)] outline-none transition-colors">
                      <span className="flex items-center gap-2">
                        <span>🇺🇸</span> English (EN)
                      </span>
                      {lang === 'en' && <lucide_react_1.Check size={14} className="text-[var(--color-brand)]"/>}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>

            {/* Custom Non-Native Theme Mode Dropdown (Radix UI) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[var(--color-text-dim)] block">{t.footer.themeLabel}:</span>
              
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="w-full flex items-center justify-between bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] text-xs font-semibold rounded-xl px-3 py-2 hover:border-[var(--color-brand)] transition-colors cursor-pointer shadow-sm focus:outline-none">
                    <span className="flex items-center gap-2">
                      {themeMode === 'auto' && <lucide_react_1.Monitor size={14} className="text-[var(--color-brand)]"/>}
                      {themeMode === 'dark' && <lucide_react_1.Moon size={14} className="text-[var(--color-brand)]"/>}
                      {themeMode === 'light' && <lucide_react_1.Sun size={14} className="text-[var(--color-brand)]"/>}
                      
                      <span>
                        {themeMode === 'auto' && t.footer.themeAuto}
                        {themeMode === 'dark' && t.footer.themeDark}
                        {themeMode === 'light' && t.footer.themeLight}
                      </span>
                    </span>
                    <lucide_react_1.ChevronDown size={14} className="text-[var(--color-text-dim)]"/>
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content sideOffset={6} align="end" className="z-[100] min-w-[210px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1.5 shadow-2xl animate-in fade-in-50 zoom-in-95">
                    <DropdownMenu.Item onClick={() => applyThemeMode('auto')} className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] hover:text-[var(--color-brand)] outline-none transition-colors">
                      <span className="flex items-center gap-2">
                        <lucide_react_1.Monitor size={14} className="text-[var(--color-brand)]"/>
                        {t.footer.themeAuto}
                      </span>
                      {themeMode === 'auto' && <lucide_react_1.Check size={14} className="text-[var(--color-brand)]"/>}
                    </DropdownMenu.Item>

                    <DropdownMenu.Item onClick={() => applyThemeMode('dark')} className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] hover:text-[var(--color-brand)] outline-none transition-colors">
                      <span className="flex items-center gap-2">
                        <lucide_react_1.Moon size={14} className="text-[var(--color-brand)]"/>
                        {t.footer.themeDark}
                      </span>
                      {themeMode === 'dark' && <lucide_react_1.Check size={14} className="text-[var(--color-brand)]"/>}
                    </DropdownMenu.Item>

                    <DropdownMenu.Item onClick={() => applyThemeMode('light')} className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] rounded-xl cursor-pointer hover:bg-[var(--color-surface-2)] hover:text-[var(--color-brand)] outline-none transition-colors">
                      <span className="flex items-center gap-2">
                        <lucide_react_1.Sun size={14} className="text-[var(--color-brand)]"/>
                        {t.footer.themeLight}
                      </span>
                      {themeMode === 'light' && <lucide_react_1.Check size={14} className="text-[var(--color-brand)]"/>}
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>

          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="border-t border-[var(--color-border)]">
          <div className="mx-auto max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-3 px-6 py-5 text-center md:text-left text-xs text-[var(--color-text-dim)]">
            <p>{t.footer.copyright}</p>
            <p>100% Client-Side Engine • Markdown Project Visualizer</p>
          </div>
        </div>
      </footer>

    </div>);
}
//# sourceMappingURL=LandingPage.js.map