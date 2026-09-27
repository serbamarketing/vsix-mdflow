"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryView = GalleryView;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const useAppStore_1 = require("@/hooks/useAppStore");
const GalleryFolderTree_1 = require("./GalleryFolderTree");
const GalleryGrid_1 = require("./GalleryGrid");
const GalleryTable_1 = require("./GalleryTable");
const GalleryAddModal_1 = require("./GalleryAddModal");
const gallery_1 = require("@/models/gallery");
const translations_1 = require("@/data/translations");
const fileSystem_1 = require("@/utils/fileSystem");
const useGallerySync_1 = require("@/hooks/useGallerySync");
function BatchMoveModal({ selectedCount, allFolders, onConfirm, onClose, t }) {
    const flatFolders = (0, gallery_1.flattenFolders)(allFolders);
    const [selectedPath, setSelectedPath] = (0, react_1.useState)(flatFolders.length > 0 ? flatFolders[0].pathParts : []);
    function handleSave() {
        if (selectedPath.length > 0) {
            onConfirm(selectedPath);
        }
    }
    return (<div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border font-display" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-brand-glow)' }}>
              <lucide_react_1.FolderSymlink size={15} style={{ color: 'var(--color-brand)' }}/>
            </div>
            <div>
              <h4 className="font-bold text-xs" style={{ color: 'var(--color-text)' }}>
                {t.moveMedia} ({selectedCount})
              </h4>
              <p className="text-[10px] text-slate-400">{t.moveFolderSubtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <lucide_react_1.X size={16}/>
          </button>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {flatFolders.map(({ folder, pathParts, depth }) => {
            const pathStr = pathParts.join('/');
            const isSelected = selectedPath.join('/') === pathStr;
            return (<button key={folder.id} type="button" className="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all" style={{
                    paddingLeft: `${10 + depth * 12}px`,
                    background: isSelected ? 'var(--color-brand-glow)' : 'var(--color-surface-2)',
                    borderColor: isSelected ? 'var(--color-brand)' : 'var(--color-border)',
                    color: isSelected ? 'var(--color-brand)' : 'var(--color-text)',
                }} onClick={() => setSelectedPath(pathParts)}>
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] text-slate-500 font-mono">{depth > 0 ? '└' : '📁'}</span>
                  <span className={`truncate ${isSelected ? 'font-bold' : ''}`}>{folder.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono">({pathStr})</span>
                </div>
                {isSelected && <lucide_react_1.Check size={14} className="text-emerald-400 shrink-0 ml-1"/>}
              </button>);
        })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button type="button" className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-dim)' }} onClick={onClose}>
            Batal
          </button>
          <button type="button" className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-md" style={{ background: 'var(--color-brand)', color: '#050c14' }} onClick={handleSave}>
            Pindahkan Sekarang
          </button>
        </div>
      </div>
    </div>);
}
function getAllGalleryItems(folders) {
    const result = [];
    for (const f of folders) {
        result.push(...f.items);
        if (f.children && f.children.length > 0) {
            result.push(...getAllGalleryItems(f.children));
        }
    }
    return result;
}
function LocalAccessBanner() {
    const { state, dispatch } = (0, useAppStore_1.useAppStore)();
    if (state.missingLocalPaths.size === 0)
        return null;
    const handleGrantAccess = async () => {
        try {
            const handle = await window.showDirectoryPicker();
            await (0, fileSystem_1.saveDirectoryHandle)('ROOT_WORKSPACE', handle);
            const newHandles = await (0, fileSystem_1.getAllDirectoryHandles)();
            dispatch({ type: 'SET_DIRECTORY_HANDLES', payload: newHandles });
            dispatch({ type: 'CLEAR_MISSING_LOCAL_PATHS' });
        }
        catch (err) {
            console.warn('User aborted or error picking directory', err);
        }
    };
    return (<div className="flex flex-col gap-2 p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs shrink-0">
      <div className="flex items-center gap-2 text-amber-500 font-bold">
        <lucide_react_1.AlertTriangle size={14}/>
        Terdapat media lokal yang tidak dapat dimuat otomatis (terblokir/relative path).
      </div>
      <div className="flex items-center gap-3">
        <p className="text-amber-500/80 font-medium">
          Harap beri izin akses ke folder utama (Workspace Root) tempat file .md ini berada.
        </p>
        <button onClick={handleGrantAccess} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-amber-950 font-bold hover:bg-amber-400 transition-colors shadow-md cursor-pointer ml-auto">
          <lucide_react_1.Key size={12}/> Pilih Folder Utama (Workspace)
        </button>
      </div>
    </div>);
}
function GalleryView() {
    const { state, dispatch } = (0, useAppStore_1.useAppStore)();
    const t = translations_1.translations[state.language].gallery;
    // Trigger async folder syncing
    (0, useGallerySync_1.useGallerySync)();
    const [showAddModal, setShowAddModal] = (0, react_1.useState)(false);
    const [selectedItemIds, setSelectedItemIds] = (0, react_1.useState)(new Set());
    const [gallerySearchQuery, setGallerySearchQuery] = (0, react_1.useState)('');
    const [isBatchMoving, setIsBatchMoving] = (0, react_1.useState)(false);
    const { galleryFolders, activeGalleryFolderId, galleryViewMode, fileName, } = state;
    // Use global search if gallery local search is empty
    const globalSearchQuery = state.searchQuery || '';
    const activeSearch = gallerySearchQuery.trim() || globalSearchQuery.trim();
    // Auto-select first folder if no folder is active or active folder invalid
    (0, react_1.useEffect)(() => {
        if (activeGalleryFolderId) {
            const exists = (0, gallery_1.findFolderById)(galleryFolders, activeGalleryFolderId);
            if (!exists && galleryFolders.length > 0) {
                dispatch({ type: 'SET_ACTIVE_GALLERY_FOLDER', payload: galleryFolders[0].id });
            }
        }
        else if (galleryFolders.length > 0) {
            dispatch({ type: 'SET_ACTIVE_GALLERY_FOLDER', payload: galleryFolders[0].id });
        }
    }, [activeGalleryFolderId, galleryFolders, dispatch]);
    // Clear selection when active folder changes
    (0, react_1.useEffect)(() => {
        setSelectedItemIds(new Set());
    }, [activeGalleryFolderId]);
    // Get the active folder data
    const activeFolder = (0, react_1.useMemo)(() => {
        if (!activeGalleryFolderId)
            return null;
        return (0, gallery_1.findFolderById)(galleryFolders, activeGalleryFolderId);
    }, [galleryFolders, activeGalleryFolderId]);
    // Get folder path for breadcrumb
    const activeFolderPath = (0, react_1.useMemo)(() => {
        if (!activeGalleryFolderId)
            return [];
        return (0, gallery_1.getFolderPath)(galleryFolders, activeGalleryFolderId) ?? [];
    }, [galleryFolders, activeGalleryFolderId]);
    // Get active folder items (including items in subfolders recursively)
    const baseItems = (0, react_1.useMemo)(() => {
        if (activeSearch) {
            // When searching, search across all gallery items in the whole file
            return getAllGalleryItems(galleryFolders);
        }
        if (!activeFolder)
            return [];
        return (0, gallery_1.getRecursiveItems)(activeFolder);
    }, [activeFolder, galleryFolders, activeSearch]);
    // Filter items by search query
    const displayedItems = (0, react_1.useMemo)(() => {
        if (!activeSearch)
            return baseItems;
        const q = activeSearch.toLowerCase();
        return baseItems.filter((item) => {
            const caption = (item.caption || '').toLowerCase();
            const src = (item.src || '').toLowerCase();
            const filename = src.split('/').pop() || '';
            return caption.includes(q) || src.includes(q) || filename.includes(q);
        });
    }, [baseItems, activeSearch]);
    // Toggle selection for a single item
    function handleToggleSelect(itemId) {
        setSelectedItemIds((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            }
            else {
                next.add(itemId);
            }
            return next;
        });
    }
    // Toggle select all items currently displayed (only non-auto-synced)
    function handleToggleSelectAll() {
        const selectableItems = displayedItems.filter((it) => !it.isAutoSynced);
        const selectableIds = selectableItems.map((i) => i.id);
        const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedItemIds.has(id));
        if (allSelected) {
            setSelectedItemIds(new Set());
        }
        else {
            setSelectedItemIds(new Set(selectableIds));
        }
    }
    // Batch delete selected items
    function handleBatchDelete() {
        if (selectedItemIds.size === 0)
            return;
        const count = selectedItemIds.size;
        if (!confirm((t.confirmDeleteBatchMedia || 'Hapus {count} media yang dipilih?').replace('{count}', String(count))))
            return;
        dispatch({
            type: 'BATCH_DELETE_GALLERY_ITEMS',
            payload: { itemIds: Array.from(selectedItemIds) },
        });
        setSelectedItemIds(new Set());
    }
    function handleBatchMoveConfirm(targetPath) {
        if (selectedItemIds.size === 0)
            return;
        dispatch({
            type: 'BATCH_MOVE_GALLERY_ITEMS',
            payload: {
                itemIds: Array.from(selectedItemIds),
                targetFolderPath: targetPath,
            },
        });
        setSelectedItemIds(new Set());
        setIsBatchMoving(false);
    }
    const isAllSelected = displayedItems.filter((it) => !it.isAutoSynced).length > 0 &&
        displayedItems.filter((it) => !it.isAutoSynced).every((item) => selectedItemIds.has(item.id));
    function countAll(folders) {
        return folders.reduce((acc, f) => acc + f.items.length + countAll(f.children), 0);
    }
    const totalItems = countAll(galleryFolders);
    return (<div className="flex h-full overflow-hidden" style={{ background: 'var(--color-bg)' }}>

      {/* Folder Sidebar */}
      <div className="w-56 shrink-0 border-r flex flex-col h-full" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
        {/* Gallery section label */}
        <div className="h-14 px-3.5 border-b flex items-center justify-between shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center shadow-sm shrink-0" style={{ background: 'var(--color-brand-glow)' }}>
              <lucide_react_1.Images size={14} style={{ color: 'var(--color-brand)' }}/>
            </div>
            <div>
              <span className="text-xs font-bold font-display block leading-tight" style={{ color: 'var(--color-text)' }}>
                {t.menuLabel}
              </span>
              <span className="block text-[9px] font-mono" style={{ color: 'var(--color-text-dim)' }}>
                {totalItems} {t.mediaCount}
              </span>
            </div>
          </div>
        </div>

        {/* File info */}
        {fileName && (<div className="flex items-center gap-1.5 px-3 py-1.5 border-b shrink-0" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
            <lucide_react_1.FileText size={10} style={{ color: 'var(--color-brand)' }}/>
            <span className="text-[9px] font-mono truncate" style={{ color: 'var(--color-text-dim)' }}>
              {fileName}
            </span>
          </div>)}

        {/* Folder tree */}
        <div className="flex-1 overflow-hidden">
          <GalleryFolderTree_1.GalleryFolderTree folders={galleryFolders} activeFolderId={activeGalleryFolderId}/>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <LocalAccessBanner />

        {/* Toolbar */}
        <div className="h-14 px-5 border-b shrink-0 flex items-center justify-between gap-3" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          {/* Breadcrumb or Search Title */}
          <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0" style={{ color: 'var(--color-text-muted)' }}>
            <lucide_react_1.Images size={14} style={{ color: 'var(--color-brand)' }}/>
            {activeSearch ? (<span className="text-emerald-400 font-bold font-display">
                {t.searchResults}: "{activeSearch}" ({displayedItems.length} {t.mediaCount})
              </span>) : (<>
                <span style={{ color: 'var(--color-text-dim)' }}>{t.menuLabel}</span>
                {activeFolderPath.map((part, i) => (<span key={i} className="flex items-center gap-1">
                    <span style={{ color: 'var(--color-text-dim)' }}>/</span>
                    <span style={{ color: i === activeFolderPath.length - 1 ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {part}
                    </span>
                  </span>))}
                {activeFolder?.syncDir && (<div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      dir:{activeFolder.syncDir}
                    </span>
                    <button type="button" onClick={() => {
                    const confirmMsg = t.unlinkSyncConfirm
                        .replace('{folder}', activeFolder.name)
                        .replace('{dir}', activeFolder.syncDir || '');
                    if (confirm(confirmMsg)) {
                        dispatch({
                            type: 'UNLINK_FOLDER_SYNC',
                            payload: { folderId: activeFolder.id },
                        });
                    }
                }} className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/25" title={t.unlinkSync}>
                      <lucide_react_1.Unlink size={11}/>
                      {t.unlinkSync}
                    </button>
                  </div>)}
                {!activeGalleryFolderId && (<span style={{ color: 'var(--color-text-dim)' }}>{t.selectFolderHint}</span>)}
              </>)}
          </div>

          {/* Right actions (Search Bar + View Mode + Add Media) */}
          <div className="flex items-center gap-2.5">
            {/* Gallery Search Box */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-colors" style={{ background: 'var(--color-surface-2)', borderColor: activeSearch ? 'var(--color-brand)' : 'var(--color-border)' }}>
              <lucide_react_1.Search size={12} style={{ color: activeSearch ? 'var(--color-brand)' : 'var(--color-text-dim)' }}/>
              <input className="bg-transparent outline-none text-xs w-32 md:w-44 font-display" style={{ color: 'var(--color-text)' }} placeholder={t.searchGalleryPlaceholder} value={gallerySearchQuery || globalSearchQuery} onChange={(e) => setGallerySearchQuery(e.target.value)}/>
              {(gallerySearchQuery || globalSearchQuery) && (<button type="button" onClick={() => {
                setGallerySearchQuery('');
                if (globalSearchQuery) {
                    dispatch({ type: 'SET_SEARCH', payload: '' });
                }
            }} className="cursor-pointer text-slate-400 hover:text-white">
                  <lucide_react_1.X size={12}/>
                </button>)}
            </div>

            {/* Selection actions bar */}
            {displayedItems.length > 0 && (<div className="flex items-center gap-1.5">
                <button type="button" className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-colors cursor-pointer font-display" style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
            }} onClick={handleToggleSelectAll} title={isAllSelected ? t.deselectAll : t.selectAll}>
                  <lucide_react_1.CheckSquare size={13} className={isAllSelected ? 'text-emerald-400' : ''}/>
                  {isAllSelected ? t.deselectAll : t.selectAll}
                </button>

                {selectedItemIds.size > 0 && (<>
                    <button type="button" className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-colors cursor-pointer font-display" style={{
                    background: 'rgba(2,132,199,0.15)',
                    borderColor: 'rgba(2,132,199,0.3)',
                    color: '#38bdf8',
                }} onClick={() => setIsBatchMoving(true)}>
                      <lucide_react_1.FolderSymlink size={13}/>
                      {t.moveMedia} ({selectedItemIds.size})
                    </button>
                    <button type="button" className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-colors cursor-pointer font-display" style={{
                    background: 'rgba(239,68,68,0.15)',
                    borderColor: 'rgba(239,68,68,0.3)',
                    color: '#ef4444',
                }} onClick={handleBatchDelete} title={t.deleteSelectedMedia}>
                      <lucide_react_1.Trash2 size={13}/>
                      {t.deleteSelectedMedia} ({selectedItemIds.size})
                    </button>
                  </>)}
              </div>)}

            {/* View mode toggle */}
            <div className="flex items-center rounded-xl p-0.5 gap-0.5" style={{ background: 'var(--color-surface-2)' }}>
              <button type="button" className="p-1.5 rounded-lg transition-all cursor-pointer" style={{
            background: galleryViewMode === 'grid' ? 'var(--color-brand)' : 'transparent',
            color: galleryViewMode === 'grid' ? '#050c14' : 'var(--color-text-muted)',
        }} title="Grid View" onClick={() => dispatch({ type: 'SET_GALLERY_VIEW_MODE', payload: 'grid' })}>
                <lucide_react_1.LayoutGrid size={14}/>
              </button>
              <button type="button" className="p-1.5 rounded-lg transition-all cursor-pointer" style={{
            background: galleryViewMode === 'table' ? 'var(--color-brand)' : 'transparent',
            color: galleryViewMode === 'table' ? '#050c14' : 'var(--color-text-muted)',
        }} title="Table View" onClick={() => dispatch({ type: 'SET_GALLERY_VIEW_MODE', payload: 'table' })}>
                <lucide_react_1.Table2 size={14}/>
              </button>
            </div>

            {/* Add media button */}
            {activeGalleryFolderId && (<button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.03] shadow-md cursor-pointer font-display" style={{ background: 'var(--color-brand)', color: '#050c14' }} onClick={(e) => { e.preventDefault(); setShowAddModal(true); }}>
                <lucide_react_1.Plus size={13}/>
                {t.addMediaBtn}
              </button>)}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto relative">
          {!fileName && (<div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-2" style={{ background: 'var(--color-brand-glow)' }}>
                <lucide_react_1.Images size={32} style={{ color: 'var(--color-brand)' }}/>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold font-display mb-1" style={{ color: 'var(--color-text)' }}>
                  {t.noFileLoadedTitle}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-dim)' }}>
                  {t.noFileLoadedDesc}
                </p>
              </div>
            </div>)}

          {fileName && galleryFolders.length > 0 && !activeGalleryFolderId && !activeSearch && (<div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
              <lucide_react_1.FolderOpen size={36} style={{ color: 'var(--color-text-dim)' }}/>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-dim)' }}>
                {t.selectFolderHint}
              </p>
            </div>)}

          {fileName && galleryFolders.length === 0 && (<div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-center opacity-60">
                <lucide_react_1.Images size={36} className="mx-auto mb-3" style={{ color: 'var(--color-text-dim)' }}/>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-dim)' }}>
                  {t.noFoldersTitle}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-dim)' }}>
                  {t.noFoldersDesc}
                </p>
              </div>
            </div>)}

          {/* Active folder / Search results content */}
          {fileName && (activeFolder || activeSearch) && (galleryViewMode === 'grid' ? (<GalleryGrid_1.GalleryGrid items={displayedItems} selectedItemIds={selectedItemIds} onToggleSelect={handleToggleSelect}/>) : (<GalleryTable_1.GalleryTable items={displayedItems} folderPath={activeFolderPath.join(' / ') || 'Semua Folder'} selectedItemIds={selectedItemIds} onToggleSelect={handleToggleSelect} onToggleSelectAll={handleToggleSelectAll}/>))}
        </div>
      </div>

      {/* Add Media Modal */}
      {showAddModal && (<GalleryAddModal_1.GalleryAddModal onClose={() => setShowAddModal(false)} defaultFolderPath={activeFolderPath}/>)}

      {/* Batch Move Modal */}
      {isBatchMoving && (<BatchMoveModal selectedCount={selectedItemIds.size} allFolders={galleryFolders} onConfirm={handleBatchMoveConfirm} onClose={() => setIsBatchMoving(false)} t={t}/>)}
    </div>);
}
//# sourceMappingURL=GalleryView.js.map