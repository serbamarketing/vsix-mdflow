import { useEffect, useState } from 'react'
import { AppStoreProvider, useAppStore } from './hooks/useAppStore'
import { Header } from './components/Header'
import { MindmapView } from './views/MindmapView'
import { TableView } from './views/TableView'
import { KanbanView } from './views/KanbanView'
import { CalendarView } from './views/CalendarView'
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
        <div className="view-stub">
          <p>Buka file Markdown untuk melihat visualisasinya.</p>
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
    <div className="app-container">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-hidden flex flex-col">{renderView()}</main>
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
