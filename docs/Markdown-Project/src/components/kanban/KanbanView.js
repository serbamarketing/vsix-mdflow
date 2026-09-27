"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbanView = KanbanView;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const useAppStore_1 = require("@/hooks/useAppStore");
const translations_1 = require("@/data/translations");
const feature_1 = require("@/models/feature");
function KanbanView() {
    const { state, dispatch } = (0, useAppStore_1.useAppStore)();
    const t = translations_1.translations[state.language].kanban;
    const [groupBy, setGroupBy] = (0, react_1.useState)('status');
    const [draggedId, setDraggedId] = (0, react_1.useState)(null);
    const [dragOverColumn, setDragOverColumn] = (0, react_1.useState)(null);
    const [newStatusName, setNewStatusName] = (0, react_1.useState)('');
    const [isAddingStatus, setIsAddingStatus] = (0, react_1.useState)(false);
    const [isBadgeDropdownOpen, setIsBadgeDropdownOpen] = (0, react_1.useState)(false);
    // Context Menu State for Kanban Cards
    const [contextMenu, setContextMenu] = (0, react_1.useState)(null);
    const allFlat = (0, react_1.useMemo)(() => (0, feature_1.flattenFeatures)(state.features), [state.features]);
    // Close context menu on any global click
    (0, react_1.useEffect)(() => {
        const closeMenu = () => setContextMenu(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);
    // Get unique PIC list for dynamic grouping
    const uniquePics = (0, react_1.useMemo)(() => {
        const pics = new Set();
        for (const f of allFlat) {
            const pic = f.metadata.pic?.trim();
            if (pic)
                pics.add(pic);
        }
        return Array.from(pics);
    }, [allFlat]);
    // Get unique Type list for dynamic grouping
    const uniqueTypes = (0, react_1.useMemo)(() => {
        const types = new Set();
        for (const f of allFlat) {
            const t = f.metadata.type?.trim();
            if (t)
                types.add(t);
        }
        return Array.from(types);
    }, [allFlat]);
    // Generate dynamic columns based on groupBy select
    const columns = (0, react_1.useMemo)(() => {
        if (groupBy === 'priority') {
            return [
                { id: '🔴 High', label: '🔴 High', color: '#ef4444' },
                { id: '🟡 Medium', label: '🟡 Medium', color: '#eab308' },
                { id: '🟢 Low', label: '🟢 Low', color: '#22c55e' },
                { id: 'no-priority', label: '— Tanpa Prioritas', color: '#64748b' },
            ];
        }
        if (groupBy === 'pic') {
            const cols = uniquePics.map((pic) => ({
                id: pic,
                label: pic,
                color: '#38bdf8',
            }));
            cols.push({ id: 'no-pic', label: '— Tanpa PIC', color: '#64748b' });
            return cols;
        }
        if (groupBy === 'type') {
            const cols = uniqueTypes.map((t) => ({
                id: t,
                label: t,
                color: '#a78bfa',
            }));
            cols.push({ id: 'no-type', label: '— Tanpa Tipe', color: '#64748b' });
            return cols;
        }
        // Default Status Column Grouping
        const list = [...state.customStatuses];
        list.push({ id: 'no-status', label: '— Tanpa Status', color: '#64748b' });
        return list;
    }, [groupBy, state.customStatuses, uniquePics, uniqueTypes]);
    // Map features to the dynamic columns
    const byColumn = (0, react_1.useMemo)(() => {
        const map = {};
        for (const col of columns) {
            map[col.id] = [];
        }
        for (const f of allFlat) {
            if (groupBy === 'priority') {
                const p = f.metadata.priority?.trim();
                if (p && map[p]) {
                    map[p].push(f);
                }
                else {
                    map['no-priority'].push(f);
                }
            }
            else if (groupBy === 'pic') {
                const pic = f.metadata.pic?.trim();
                if (pic && map[pic]) {
                    map[pic].push(f);
                }
                else {
                    map['no-pic'].push(f);
                }
            }
            else if (groupBy === 'type') {
                const t = f.metadata.type?.trim();
                if (t && map[t]) {
                    map[t].push(f);
                }
                else {
                    map['no-type'].push(f);
                }
            }
            else {
                // Default: Status
                const statusText = f.metadata.status?.trim();
                let matched = false;
                if (statusText) {
                    for (const col of state.customStatuses) {
                        if (col.label.toLowerCase() === statusText.toLowerCase() ||
                            statusText.toLowerCase().includes(col.id.toLowerCase()) ||
                            col.label.toLowerCase().includes(statusText.toLowerCase())) {
                            map[col.id].push(f);
                            matched = true;
                            break;
                        }
                    }
                }
                if (!matched) {
                    map['no-status'].push(f);
                }
            }
        }
        return map;
    }, [allFlat, columns, groupBy, state.customStatuses]);
    const handleDragStart = (e, id) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedId(id);
    };
    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverColumn(null);
    };
    const handleDragOver = (e, colId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverColumn !== colId) {
            setDragOverColumn(colId);
        }
    };
    const handleDragLeave = (colId) => {
        if (dragOverColumn === colId) {
            setDragOverColumn(null);
        }
    };
    const handleDrop = (e, targetCol) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain') || draggedId;
        setDraggedId(null);
        setDragOverColumn(null);
        if (!id)
            return;
        const item = allFlat.find((f) => f.id === id);
        if (!item)
            return;
        const updatedMeta = { ...item.metadata };
        if (groupBy === 'priority') {
            updatedMeta.priority = targetCol.id === 'no-priority' ? '' : targetCol.label;
        }
        else if (groupBy === 'pic') {
            updatedMeta.pic = targetCol.id === 'no-pic' ? '' : targetCol.label;
        }
        else if (groupBy === 'type') {
            updatedMeta.type = targetCol.id === 'no-type' ? '' : targetCol.label;
        }
        else {
            // Default: Status
            updatedMeta.status = targetCol.id === 'no-status' ? '' : targetCol.label;
        }
        dispatch({
            type: 'UPDATE_FEATURE_NODE',
            payload: { id, updates: { metadata: updatedMeta } },
        });
    };
    const handleAddStatus = (e) => {
        e.preventDefault();
        if (!newStatusName.trim())
            return;
        const id = newStatusName.toLowerCase().replace(/[^\w-]/g, '') || 'status';
        const newStatus = {
            id,
            label: newStatusName.trim(),
            color: '#38bdf8',
        };
        dispatch({
            type: 'SET_CUSTOM_STATUSES',
            payload: [...state.customStatuses, newStatus],
        });
        setNewStatusName('');
        setIsAddingStatus(false);
    };
    const handleQuickAddCard = (col) => {
        const newId = (0, feature_1.generateFeatureId)('Item Baru');
        const initialMeta = {};
        if (groupBy === 'priority') {
            if (col.id !== 'no-priority')
                initialMeta.priority = col.label;
        }
        else if (groupBy === 'pic') {
            if (col.id !== 'no-pic')
                initialMeta.pic = col.label;
        }
        else if (groupBy === 'type') {
            if (col.id !== 'no-type')
                initialMeta.type = col.label;
        }
        else {
            if (col.id !== 'no-status')
                initialMeta.status = col.label;
        }
        const newNode = {
            id: newId,
            title: 'Item Baru',
            level: 2,
            description: '',
            metadata: initialMeta,
            children: [],
        };
        dispatch({
            type: 'ADD_FEATURE_NODE',
            payload: { parentId: null, node: newNode },
        });
    };
    // Right Click Menu Actions
    const handleSetStatus = (feature, status) => {
        dispatch({
            type: 'UPDATE_FEATURE_NODE',
            payload: { id: feature.id, updates: { metadata: { ...feature.metadata, status } } },
        });
    };
    const handleSetPriority = (feature, priority) => {
        dispatch({
            type: 'UPDATE_FEATURE_NODE',
            payload: { id: feature.id, updates: { metadata: { ...feature.metadata, priority } } },
        });
    };
    const handleSetPic = (feature) => {
        const name = prompt('Masukkan nama PIC (@username):', feature.metadata.pic || '');
        if (name !== null) {
            dispatch({
                type: 'UPDATE_FEATURE_NODE',
                payload: { id: feature.id, updates: { metadata: { ...feature.metadata, pic: name.trim() } } },
            });
        }
    };
    const handleDeleteCard = (feature) => {
        if (confirm(`Hapus kartu "${feature.title}"?`)) {
            dispatch({
                type: 'DELETE_FEATURE_NODE',
                payload: { id: feature.id },
            });
        }
    };
    if (state.features.length === 0) {
        return (<div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-dim)' }}>
          Belum ada item di dokumen ini.
        </p>
        <button onClick={() => dispatch({ type: 'OPEN_NEW_FEATURE_MODAL' })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-primary)', color: 'white' }}>
          <lucide_react_1.Plus size={16}/>
          Buat Item Pertama
        </button>
      </div>);
    }
    return (<div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b shrink-0 text-xs animate-in fade-in" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="flex items-center gap-4">
          {/* Dynamic Group By Dropdown */}
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--color-text-dim)' }}>{t.groupByLabel}</span>
            <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="px-2.5 py-1 rounded-lg border outline-none font-semibold cursor-pointer" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="pic">PIC</option>
              <option value="type">Type</option>
            </select>
          </div>

          <span style={{ color: 'var(--color-text-dim)' }}>
            {t.totalCardsLabel} <strong style={{ color: 'var(--color-text)' }}>{allFlat.length}</strong>
          </span>
          <span className="hidden sm:inline text-slate-400 text-[10px]">
            🖱️ <em>Klik kanan kartu untuk menu tindakan cepat & ubah urutan (order)</em>
          </span>
        </div>

        {/* Toolbar Action: Card Badges Manager */}
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <button onClick={() => setIsBadgeDropdownOpen(!isBadgeDropdownOpen)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors" style={{
            background: isBadgeDropdownOpen ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
        }}>
              <lucide_react_1.LayoutGrid size={13} style={{ color: 'var(--color-brand)' }}/>
              <span>Tampilan Kolom</span>
            </button>

            {isBadgeDropdownOpen && (<>
                <div className="fixed inset-0 z-20" onClick={() => setIsBadgeDropdownOpen(false)}/>
                <div className="absolute right-0 mt-2 w-60 rounded-2xl border shadow-2xl p-2.5 z-30 space-y-1 glass-panel" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-display border-b pb-1.5 mb-1" style={{ color: 'var(--color-text-dim)', borderColor: 'var(--color-border)' }}>
                    TAMPILKAN KOLOM & BADGE
                  </div>
                  {[
                { key: 'showStatus', label: 'Status Dot' },
                { key: 'showPriority', label: 'Priority' },
                { key: 'showType', label: 'Type' },
                { key: 'showPic', label: 'PIC' },
                { key: 'showDeadline', label: 'Deadline' },
                { key: 'showImage', label: '🖼 Gambar Cover' },
                { key: 'showLink', label: '🔗 Tautan Link' },
                { key: 'showDescription', label: 'Deskripsi Singkat' },
                { key: 'showSubCount', label: 'Jumlah Sub-item' },
            ].map((item) => {
                const isChecked = state.columnConfig.kanban[item.key] !== false;
                return (<button key={item.key} onClick={() => {
                        dispatch({
                            type: 'SET_COLUMN_CONFIG',
                            payload: {
                                ...state.columnConfig,
                                kanban: {
                                    ...state.columnConfig.kanban,
                                    [item.key]: !isChecked,
                                },
                            },
                        });
                    }} className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-left font-medium cursor-pointer transition-colors" style={{ color: 'var(--color-text)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <span>{item.label}</span>
                        {isChecked && <lucide_react_1.Check size={14} style={{ color: 'var(--color-brand)' }}/>}
                      </button>);
            })}
                </div>
              </>)}
          </div>

          {/* Add Status Button */}
          {groupBy === 'status' && (<>
              {isAddingStatus ? (<form onSubmit={handleAddStatus} className="flex items-center gap-1.5">
                  <input type="text" placeholder="Misal: 🔵 In Review" value={newStatusName} onChange={(e) => setNewStatusName(e.target.value)} autoFocus className="px-2.5 py-1 text-xs rounded-lg border outline-none" style={{
                    background: 'var(--color-surface-2)',
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-text)',
                }}/>
                  <button type="submit" className="px-2.5 py-1 rounded-lg text-xs font-medium text-white cursor-pointer" style={{ background: 'var(--color-primary)' }}>
                    Simpan
                  </button>
                  <button type="button" onClick={() => setIsAddingStatus(false)} className="px-2 py-1 text-xs cursor-pointer transition-colors" style={{ color: 'var(--color-text-dim)' }}>
                    Batal
                  </button>
                </form>) : (<button onClick={() => setIsAddingStatus(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors" style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-surface-2)',
                    color: 'var(--color-text-muted)',
                }}>
                  <lucide_react_1.Plus size={13}/>
                  <span>Tambah Kolom Status</span>
                </button>)}
            </>)}
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max items-start">
          {columns.map((col) => {
            const cards = byColumn[col.id] ?? [];
            const isOver = dragOverColumn === col.id;
            const colColor = col.color || (0, feature_1.getStatusColor)(col.label, state.customStatuses);
            return (<div key={col.id} onDragOver={(e) => handleDragOver(e, col.id)} onDragLeave={() => handleDragLeave(col.id)} onDrop={(e) => handleDrop(e, col)} className={`flex flex-col w-72 max-h-full rounded-2xl border transition-all duration-200 ${isOver ? 'ring-2 shadow-xl scale-[1.01]' : ''}`} style={{
                    background: 'var(--color-surface)',
                    borderColor: isOver ? 'var(--color-primary)' : 'var(--color-border)',
                    boxShadow: isOver ? '0 0 24px var(--color-primary-glow)' : 'none',
                }}>
                {/* Column Header */}
                <div className="px-4 py-3 border-b flex items-center justify-between gap-2 shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colColor }}/>
                    <h3 className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{col.label}</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold shrink-0" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                    {cards.length}
                  </span>
                </div>

                {/* Card List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {cards.map((feature) => (<KanbanCard key={feature.id} feature={feature} isSelected={state.selectedFeatureId === feature.id} isBeingDragged={draggedId === feature.id} onDragStart={(e) => handleDragStart(e, feature.id)} onDragEnd={handleDragEnd} onClick={() => dispatch({ type: 'SELECT_FEATURE', payload: feature.id })} onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            feature,
                        });
                    }} customStatuses={state.customStatuses} config={state.columnConfig.kanban}/>))}

                  {cards.length === 0 && (<div className="text-xs text-center py-10 rounded-xl border border-dashed flex flex-col items-center justify-center gap-1" style={{
                        color: 'var(--color-text-dim)',
                        borderColor: isOver ? 'var(--color-primary)' : 'var(--color-border)',
                        background: isOver ? 'var(--color-surface-2)' : 'transparent',
                    }}>
                      <span>Geser kartu ke sini</span>
                    </div>)}
                </div>

                {/* Quick Add Button */}
                <div className="p-2 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                  <button onClick={() => handleQuickAddCard(col)} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer" style={{ color: 'var(--color-text-dim)', background: 'var(--color-surface-2)' }} onMouseEnter={(e) => {
                    ;
                    e.currentTarget.style.color = 'var(--color-text)';
                    e.currentTarget.style.background = 'var(--color-surface-3)';
                }} onMouseLeave={(e) => {
                    ;
                    e.currentTarget.style.color = 'var(--color-text-dim)';
                    e.currentTarget.style.background = 'var(--color-surface-2)';
                }}>
                    <lucide_react_1.Plus size={13}/>
                    Tambah Item
                  </button>
                </div>
              </div>);
        })}
        </div>
      </div>

      {/* Custom Right-Click Context Menu for Kanban Cards */}
      {contextMenu && (<>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)}/>
          <div className="fixed w-56 rounded-2xl border shadow-2xl p-1.5 z-50 glass-panel space-y-0.5 select-none text-xs" style={{
                left: contextMenu.x,
                top: contextMenu.y,
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
            }}>
            <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">
              {contextMenu.feature.title}
            </div>

            <button onClick={() => {
                dispatch({ type: 'SELECT_FEATURE', payload: contextMenu.feature.id });
                setContextMenu(null);
            }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors" style={{ color: 'var(--color-text)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <lucide_react_1.Edit3 size={13} className="text-indigo-400"/> Edit Detail Panel
            </button>

            {/* Sibling Reordering (Naik / Turun) */}
            <div className="h-px my-1" style={{ background: 'var(--color-border)' }}/>
            <div className="px-3 py-1 text-[9px] font-bold uppercase" style={{ color: 'var(--color-text-dim)' }}>Urutan / Posisi</div>
            <div className="grid grid-cols-2 gap-1 px-2.5 pb-1">
              <button onClick={() => {
                dispatch({ type: 'REORDER_FEATURE_NODE', payload: { id: contextMenu.feature.id, direction: 'up' } });
                setContextMenu(null);
            }} className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] text-center cursor-pointer font-bold border transition-colors" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                <lucide_react_1.ChevronUp size={11}/> Naik
              </button>
              <button onClick={() => {
                dispatch({ type: 'REORDER_FEATURE_NODE', payload: { id: contextMenu.feature.id, direction: 'down' } });
                setContextMenu(null);
            }} className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] text-center cursor-pointer font-bold border transition-colors" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                <lucide_react_1.ChevronDown size={11}/> Turun
              </button>
            </div>

            <div className="h-px my-1" style={{ background: 'var(--color-border)' }}/>
            <div className="px-3 py-0.5 text-[9px] font-bold uppercase" style={{ color: 'var(--color-text-dim)' }}>Ubah Status</div>
            {state.customStatuses.map((st) => (<button key={st.id} onClick={() => {
                    handleSetStatus(contextMenu.feature, st.label);
                    setContextMenu(null);
                }} className="w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] text-left cursor-pointer transition-colors" style={{ color: 'var(--color-text)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }}/>
                <span>{st.label}</span>
              </button>))}

            <div className="h-px my-1" style={{ background: 'var(--color-border)' }}/>
            <div className="px-3 py-0.5 text-[9px] font-bold uppercase" style={{ color: 'var(--color-text-dim)' }}>Ubah Prioritas</div>
            {['🔴 High', '🟡 Medium', '🟢 Low'].map((p) => (<button key={p} onClick={() => {
                    handleSetPriority(contextMenu.feature, p);
                    setContextMenu(null);
                }} className="w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] text-left cursor-pointer transition-colors" style={{ color: 'var(--color-text)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <span>{p}</span>
              </button>))}
            <button onClick={() => {
                handleSetPriority(contextMenu.feature, '');
                setContextMenu(null);
            }} className="w-full flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] text-left cursor-pointer transition-colors" style={{ color: 'var(--color-text-dim)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              — Hapus Prioritas
            </button>

            <div className="h-px my-1" style={{ background: 'var(--color-border)' }}/>
            <button onClick={() => {
                handleSetPic(contextMenu.feature);
                setContextMenu(null);
            }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-colors" style={{ color: 'var(--color-text)' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              <lucide_react_1.User size={13} className="text-sky-400"/> Assign PIC...
            </button>

            <div className="h-px bg-slate-800 my-1"/>
            <button onClick={() => {
                handleDeleteCard(contextMenu.feature);
                setContextMenu(null);
            }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer hover:bg-red-500/10 text-red-400">
              <lucide_react_1.Trash2 size={13}/> Hapus Kartu
            </button>
          </div>
        </>)}
    </div>);
}
function KanbanCard({ feature, isSelected, isBeingDragged, onDragStart, onDragEnd, onClick, onContextMenu, customStatuses, config, }) {
    const statusColor = (0, feature_1.getStatusColor)(feature.metadata.status, customStatuses);
    return (<div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick} onContextMenu={onContextMenu} className={`group relative p-3.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-150 select-none ${isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:border-slate-500'}`} style={{
            opacity: isBeingDragged ? 0.4 : 1,
            background: isSelected ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
            borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
        }}>
      {/* Cover Image Thumbnail */}
      {(config.showImage !== false) && (feature.metadata.image || feature.metadata.images || feature.metadata.thumbnail || feature.metadata.cover) && (<div className="mb-2.5 rounded-lg overflow-hidden border border-[var(--color-border)] shadow-sm">
          <img src={feature.metadata.image || feature.metadata.images || feature.metadata.thumbnail || feature.metadata.cover} alt={feature.title} className="w-full h-28 object-cover group-hover:scale-105 transition-transform" onError={(e) => {
                e.currentTarget.style.display = 'none';
            }}/>
        </div>)}

      {/* Title */}
      <div className="flex items-start gap-2">
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: statusColor }}/>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-snug break-words" style={{ color: 'var(--color-text)' }}>{feature.title}</p>
        </div>
      </div>

      {/* Description Preview */}
      {config.showDescription && feature.description && (<p className="text-[11px] mt-2 line-clamp-2 leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
          {feature.description}
        </p>)}

      {/* Metadata Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
        {config.showPriority && feature.metadata.priority && (<span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'var(--color-surface)', color: '#f59e0b' }}>
            {feature.metadata.priority}
          </span>)}

        {config.showType && feature.metadata.type && (<span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'var(--color-surface)', color: '#a78bfa' }}>
            <lucide_react_1.Tag size={9} className="inline mr-1"/>
            {feature.metadata.type}
          </span>)}

        {config.showPic && feature.metadata.pic && (<span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1" style={{ background: 'var(--color-surface)', color: '#38bdf8' }}>
            <lucide_react_1.User size={9}/>
            {feature.metadata.pic}
          </span>)}

        {config.showDeadline && feature.metadata.deadline && (<span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1" style={{ background: 'var(--color-surface)', color: '#f43f5e' }}>
            <lucide_react_1.Calendar size={9}/>
            {feature.metadata.deadline}
          </span>)}

        {(config.showLink !== false) && (feature.metadata.link || feature.metadata.url || feature.metadata.href || feature.metadata.website) && (<a href={(feature.metadata.link || feature.metadata.url || feature.metadata.href || feature.metadata.website)?.startsWith('http') ? (feature.metadata.link || feature.metadata.url || feature.metadata.href || feature.metadata.website) : `https://${feature.metadata.link || feature.metadata.url || feature.metadata.href || feature.metadata.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors font-display" style={{
                background: 'var(--color-brand-glow)',
                borderColor: 'var(--color-brand)',
                color: 'var(--color-brand)',
            }}>
            <span>Buka Link</span>
            <lucide_react_1.ExternalLink size={9}/>
          </a>)}

        {/* Other custom metadata */}
        {Object.entries(feature.metadata)
            .filter(([k]) => !['status', 'priority', 'type', 'pic', 'deadline', 'image', 'images', 'thumbnail', 'cover', 'link', 'url', 'href', 'website'].includes(k.toLowerCase()))
            .map(([k, v]) => (<span key={k} className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--color-surface)', color: 'var(--color-text-dim)' }}>
              {k}: {v}
            </span>))}
      </div>

      {/* Sub-items footer */}
      {config.showSubCount && feature.children.length > 0 && (<div className="mt-2.5 pt-2 flex items-center justify-between border-t text-[10px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-dim)' }}>
          <span className="flex items-center gap-1">
            <lucide_react_1.Layers size={11}/>
            {feature.children.length} Sub-items
          </span>
          <lucide_react_1.ChevronRight size={11}/>
        </div>)}
    </div>);
}
//# sourceMappingURL=KanbanView.js.map