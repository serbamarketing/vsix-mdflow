import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/hooks/useAppStore'
import { useInitFileSystem } from '@/hooks/useLocalMedia'
import { LandingPage } from '@/components/layout/LandingPage'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { DetailPanel } from '@/components/feature/DetailPanel'
import { NewFeatureModal } from '@/components/feature/NewFeatureModal'
import { SettingsModal } from '@/components/settings/SettingsModal'
import { SummaryView } from '@/components/summary/SummaryView'
import { MindmapView } from '@/components/mindmap/MindmapView'
import { TableView } from '@/components/table/TableView'
import { KanbanView } from '@/components/kanban/KanbanView'
import { CalendarView } from '@/components/calendar/CalendarView'
import { EditorView } from '@/components/editor/EditorView'
import { DocsView } from '@/components/docs/DocsView'
import { GalleryView } from '@/components/gallery/GalleryView'

const viewComponents = {
  summary: SummaryView,
  mindmap: MindmapView,
  table: TableView,
  kanban: KanbanView,
  calendar: CalendarView,
  editor: EditorView,
  docs: DocsView,
  gallery: GalleryView,
}

function AppLayout() {
  const { state, dispatch } = useAppStore()
  const ActiveView = viewComponents[state.activeView] || TableView

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* 1. Unified Full-Width Horizontal Header Bar (Garis 100% Lurus Sejajar) */}
      <Header />

      {/* 2. Body Area (Sidebar Left + Main Content Right) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Static Sidebar Body */}
        {state.isSidebarOpen && (
          <div className="hidden md:flex h-full">
            <Sidebar />
          </div>
        )}

        {/* Mobile Drawer Sidebar Overlay */}
        <AnimatePresence>
          {state.isMobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm md:hidden"
                onClick={() => dispatch({ type: 'SET_MOBILE_SIDEBAR_OPEN', payload: false })}
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                className="fixed inset-y-0 left-0 z-[160] md:hidden shadow-2xl flex"
              >
                <Sidebar
                  isMobile
                  onCloseMobile={() => dispatch({ type: 'SET_MOBILE_SIDEBAR_OPEN', payload: false })}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.activeView}
              initial={{ opacity: 0, scale: 0.995 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.995 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute inset-0 flex flex-col overflow-hidden"
            >
              <ActiveView />
            </motion.div>
          </AnimatePresence>

          {/* Detail Panel slide-in overlay */}
          <DetailPanel />
        </main>
      </div>

      {/* Global Modals */}
      <NewFeatureModal />
      <SettingsModal />
    </div>
  )
}

function App() {
  const { state } = useAppStore()
  useInitFileSystem()

  return (
    <AnimatePresence mode="wait">
      {state.fileName ? (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <AppLayout />
        </motion.div>
      ) : (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full w-full overflow-y-auto relative bg-slate-950"
        >
          <LandingPage />
          <SettingsModal />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default App
