"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const framer_motion_1 = require("framer-motion");
const useAppStore_1 = require("@/hooks/useAppStore");
const useLocalMedia_1 = require("@/hooks/useLocalMedia");
const LandingPage_1 = require("@/components/layout/LandingPage");
const Sidebar_1 = require("@/components/layout/Sidebar");
const Header_1 = require("@/components/layout/Header");
const DetailPanel_1 = require("@/components/feature/DetailPanel");
const NewFeatureModal_1 = require("@/components/feature/NewFeatureModal");
const SettingsModal_1 = require("@/components/settings/SettingsModal");
const SummaryView_1 = require("@/components/summary/SummaryView");
const MindmapView_1 = require("@/components/mindmap/MindmapView");
const TableView_1 = require("@/components/table/TableView");
const KanbanView_1 = require("@/components/kanban/KanbanView");
const CalendarView_1 = require("@/components/calendar/CalendarView");
const EditorView_1 = require("@/components/editor/EditorView");
const DocsView_1 = require("@/components/docs/DocsView");
const GalleryView_1 = require("@/components/gallery/GalleryView");
const viewComponents = {
    summary: SummaryView_1.SummaryView,
    mindmap: MindmapView_1.MindmapView,
    table: TableView_1.TableView,
    kanban: KanbanView_1.KanbanView,
    calendar: CalendarView_1.CalendarView,
    editor: EditorView_1.EditorView,
    docs: DocsView_1.DocsView,
    gallery: GalleryView_1.GalleryView,
};
function AppLayout() {
    const { state, dispatch } = (0, useAppStore_1.useAppStore)();
    const ActiveView = viewComponents[state.activeView] || TableView_1.TableView;
    return (<div className="flex flex-col h-full overflow-hidden relative">
      {/* 1. Unified Full-Width Horizontal Header Bar (Garis 100% Lurus Sejajar) */}
      <Header_1.Header />

      {/* 2. Body Area (Sidebar Left + Main Content Right) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Static Sidebar Body */}
        {state.isSidebarOpen && (<div className="hidden md:flex h-full">
            <Sidebar_1.Sidebar />
          </div>)}

        {/* Mobile Drawer Sidebar Overlay */}
        <framer_motion_1.AnimatePresence>
          {state.isMobileSidebarOpen && (<>
              {/* Backdrop */}
              <framer_motion_1.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => dispatch({ type: 'SET_MOBILE_SIDEBAR_OPEN', payload: false })}/>
              {/* Drawer */}
              <framer_motion_1.motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', damping: 25, stiffness: 280 }} className="fixed inset-y-0 left-0 z-[160] md:hidden shadow-2xl flex">
                <Sidebar_1.Sidebar isMobile onCloseMobile={() => dispatch({ type: 'SET_MOBILE_SIDEBAR_OPEN', payload: false })}/>
              </framer_motion_1.motion.div>
            </>)}
        </framer_motion_1.AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          <framer_motion_1.AnimatePresence mode="wait">
            <framer_motion_1.motion.div key={state.activeView} initial={{ opacity: 0, scale: 0.995 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.995 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute inset-0 flex flex-col overflow-hidden">
              <ActiveView />
            </framer_motion_1.motion.div>
          </framer_motion_1.AnimatePresence>

          {/* Detail Panel slide-in overlay */}
          <DetailPanel_1.DetailPanel />
        </main>
      </div>

      {/* Global Modals */}
      <NewFeatureModal_1.NewFeatureModal />
      <SettingsModal_1.SettingsModal />
    </div>);
}
function App() {
    const { state } = (0, useAppStore_1.useAppStore)();
    (0, useLocalMedia_1.useInitFileSystem)();
    return (<framer_motion_1.AnimatePresence mode="wait">
      {state.fileName ? (<framer_motion_1.motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
          <AppLayout />
        </framer_motion_1.motion.div>) : (<framer_motion_1.motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full w-full overflow-y-auto relative bg-slate-950">
          <LandingPage_1.LandingPage />
          <SettingsModal_1.SettingsModal />
        </framer_motion_1.motion.div>)}
    </framer_motion_1.AnimatePresence>);
}
exports.default = App;
//# sourceMappingURL=App.js.map