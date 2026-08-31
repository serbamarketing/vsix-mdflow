import React from 'react';
import type { ViewMode } from '../App';
import { Network, Table as TableIcon, Columns, Calendar, Settings, MoreHorizontal } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="header-container">
      <div className="view-modes">
        <button 
          className={`icon-button ${currentView === 'mindmap' ? 'active' : ''}`} 
          onClick={() => onViewChange('mindmap')}
          title="Mindmap"
        >
          <Network size={20} />
        </button>
        <button 
          className={`icon-button ${currentView === 'table' ? 'active' : ''}`} 
          onClick={() => onViewChange('table')}
          title="Table"
        >
          <TableIcon size={20} />
        </button>
        <button 
          className={`icon-button ${currentView === 'kanban' ? 'active' : ''}`} 
          onClick={() => onViewChange('kanban')}
          title="Kanban"
        >
          <Columns size={20} />
        </button>
        <button 
          className={`icon-button ${currentView === 'calendar' ? 'active' : ''}`} 
          onClick={() => onViewChange('calendar')}
          title="Calendar"
        >
          <Calendar size={20} />
        </button>
      </div>

      <div className="actions">
        <button className="icon-button" title="Settings">
          <Settings size={20} />
        </button>
        <button className="icon-button" title="More">
          <MoreHorizontal size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
