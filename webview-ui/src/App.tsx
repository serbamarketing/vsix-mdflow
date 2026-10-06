import { useEffect, useState } from 'react'
import { AppStoreProvider, useAppStore } from './hooks/useAppStore'
import { Header } from './components/Header'
import { MindmapView } from './views/MindmapView'
import { TableView } from './views/TableView'
import { KanbanView } from './views/KanbanView'
import { CalendarView } from './views/CalendarView'
import { DetailPanel } from './components/feature/DetailPanel'
import { NewFeatureModal } from './components/feature/NewFeatureModal'
import { vscode } from './utils/vscode'
import './App.css'

export type ViewMode = 'mindmap' | 'table' | 'kanban' | 'calendar'

function AppBody() {
  const { state, dispatch } = useAppStore()
  const [currentView, setCurrentView] = useState<ViewMode>('mindmap')

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data
      if (message?.command === 'updateContent') {
        dispatch({
          type: 'LOAD_CONTENT',
          payload: { content: message.text ?? '', fileName: message.fileName ?? '' },
        })
      }
    }
    window.addEventListener('message', handleMessage)
    vscode.postMessage({ command: 'ready' })
    return () => window.removeEventListener('message', handleMessage)
  }, [dispatch])

  const renderView = () => {
    if (state.features.length === 0) {
      return (
        <div className="view-stub flex-1 flex flex-col items-center justify-center p-8 gap-4 text-center">
          <p className="text-sm" style={{ color: 'var(--color-text-dim)' }}>
            {state.fileName
              ? `File "${state.fileName}" belum memiliki struktur item/heading Markdown.`
              : 'Buka file Markdown untuk melihat visualisasinya.'}
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'OPEN_NEW_FEATURE_MODAL' })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg hover:brightness-110 active:scale-95"
            style={{ background: 'var(--color-brand)', color: '#050c14' }}
          >
            + Buat Item Pertama
          </button>
        </div>
      )
    }
    switch (currentView) {
      case 'mindmap':
        return <MindmapView />
      case 'table':
        return <TableView />
      case 'kanban':
        return <KanbanView />
      case 'calendar':
        return <CalendarView />
      default:
        return <MindmapView />
    }
  }

  return (
    <div className="app-container relative overflow-hidden flex flex-col h-full w-full">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-hidden flex flex-col relative">{renderView()}</main>
      <DetailPanel />
      <NewFeatureModal />
    </div>
  )
}

function App() {
  return (
    <AppStoreProvider>
      <AppBody />
    </AppStoreProvider>
  )
}

export default App
