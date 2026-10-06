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
import { flattenFeatures, generateFeatureId, type FeatureNode } from './models/feature'
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

  // Global Keyboard Shortcuts (Esc, N, D, ArrowUp, ArrowDown, ArrowLeft)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Tangani tombol Escape: tutup DetailPanel atau Modal
      if (e.key === 'Escape') {
        if (state.isNewFeatureModalOpen) {
          dispatch({ type: 'CLOSE_NEW_FEATURE_MODAL' })
          return
        }
        if (state.isDetailOpen || state.selectedFeatureId) {
          dispatch({ type: 'CLOSE_DETAIL' })
          return
        }
      }

      // 2. Proteksi shortcut form: jika user sedang mengetik di input, textarea, select, contenteditable -> JANGAN interupsi!
      const target = e.target as HTMLElement | null
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )
      if (isInput) return

      // 3. Proteksi shortcut sistem & editor: jika ada Ctrl / Alt / Meta -> JANGAN interupsi!
      if (e.ctrlKey || e.altKey || e.metaKey) return

      // Jika tidak ada item aktif yang terpilih, shortcut manipulasi node tidak aktif
      if (!state.selectedFeatureId) return

      // 4. Shortcut "N" atau "n": Tambah Sub-item ke item yang sedang aktif
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        const flat = flattenFeatures(state.features)
        const active = flat.find((f) => f.id === state.selectedFeatureId)
        if (active) {
          const newId = generateFeatureId('Sub-item')
          const newNode: FeatureNode = {
            id: newId,
            title: 'Sub-item',
            level: active.level + 1,
            description: '',
            metadata: {},
            children: [],
          }
          dispatch({
            type: 'ADD_FEATURE_NODE',
            payload: { parentId: active.id, node: newNode },
          })
        }
        return
      }

      // 5. Shortcut "D" atau "d": Hapus item yang sedang aktif
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        const flat = flattenFeatures(state.features)
        const active = flat.find((f) => f.id === state.selectedFeatureId)
        if (active) {
          if (confirm(`Hapus item "${active.title}"?`)) {
            dispatch({ type: 'DELETE_FEATURE_NODE', payload: { id: active.id } })
          }
        }
        return
      }

      // 6. Shortcut Panah Atas ("ArrowUp"): Geser posisi item ke atas (urutan naik)
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        dispatch({
          type: 'REORDER_FEATURE_NODE',
          payload: { id: state.selectedFeatureId, direction: 'up' },
        })
        return
      }

      // 7. Shortcut Panah Bawah ("ArrowDown"): Geser posisi item ke bawah (urutan turun)
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        dispatch({
          type: 'REORDER_FEATURE_NODE',
          payload: { id: state.selectedFeatureId, direction: 'down' },
        })
        return
      }

      // 8. Shortcut Panah Kiri ("ArrowLeft"): Outdent (memindahkan dari parent B jadi keluar dari B sehingga ke A)
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        dispatch({
          type: 'OUTDENT_FEATURE_NODE',
          payload: { id: state.selectedFeatureId },
        })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.selectedFeatureId, state.isDetailOpen, state.isNewFeatureModalOpen, state.features, dispatch])

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
