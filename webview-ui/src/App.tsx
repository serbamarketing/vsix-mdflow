import { useState } from 'react';
import Header from './components/Header';
import MindmapView from './views/MindmapView';
import TableView from './views/TableView';
import KanbanView from './views/KanbanView';
import CalendarView from './views/CalendarView';
import './App.css';

export type ViewMode = 'mindmap' | 'table' | 'kanban' | 'calendar';

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('mindmap');

  const renderView = () => {
    switch (currentView) {
      case 'mindmap':
        return <MindmapView />;
      case 'table':
        return <TableView />;
      case 'kanban':
        return <KanbanView />;
      case 'calendar':
        return <CalendarView />;
      default:
        return <MindmapView />;
    }
  };

  return (
    <div className="app-container">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="view-container">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
