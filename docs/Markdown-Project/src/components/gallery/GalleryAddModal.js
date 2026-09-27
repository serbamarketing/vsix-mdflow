"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryAddModal = GalleryAddModal;
const react_1 = require("react");
const lucide_react_1 = require("lucide-react");
const gallery_1 = require("@/models/gallery");
const useAppStore_1 = require("@/hooks/useAppStore");
const translations_1 = require("@/data/translations");
function GalleryAddModal({ onClose, defaultFolderPath }) {
    const { state, dispatch } = (0, useAppStore_1.useAppStore)();
    const t = translations_1.translations[state.language].gallery;
    const [selectedItems, setSelectedItems] = (0, react_1.useState)([]);
    const [manualInput, setManualInput] = (0, react_1.useState)('');
    const [manualCaption, setManualCaption] = (0, react_1.useState)('');
    const [newFolderName, setNewFolderName] = (0, react_1.useState)('');
    const [isCreatingNewFolder, setIsCreatingNewFolder] = (0, react_1.useState)(false);
    const [noFolderError, setNoFolderError] = (0, react_1.useState)(false);
    const [isDropdownOpen, setIsDropdownOpen] = (0, react_1.useState)(false);
    const dropdownRef = (0, react_1.useRef)(null);
    // Folder sync mode state
    const [isSyncFolderMode, setIsSyncFolderMode] = (0, react_1.useState)(false);
    const [syncDirName, setSyncDirName] = (0, react_1.useState)('');
    // Clean path helper (without hardcoded prefix)
    function cleanPath(raw) {
        return raw.replace(/\\/g, '/').trim();
    }
    // Determine initial folder path from active gallery folder or props
    const initialFolderPath = (0, react_1.useMemo)(() => {
        if (defaultFolderPath && defaultFolderPath.length > 0)
            return defaultFolderPath;
        if (state.activeGalleryFolderId) {
            const path = (0, gallery_1.getFolderPath)(state.galleryFolders, state.activeGalleryFolderId);
            if (path && path.length > 0)
                return path;
        }
        if (state.galleryFolders.length > 0)
            return [state.galleryFolders[0].name];
        return [];
    }, [defaultFolderPath, state.activeGalleryFolderId, state.galleryFolders]);
    const [selectedFolderPath, setSelectedFolderPath] = (0, react_1.useState)(initialFolderPath);
    (0, react_1.useEffect)(() => {
        if (initialFolderPath.length > 0 && selectedFolderPath.length === 0) {
            setSelectedFolderPath(initialFolderPath);
        }
    }, [initialFolderPath, selectedFolderPath.length]);
    // Close custom dropdown on click outside
    (0, react_1.useEffect)(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const fileInputRef = (0, react_1.useRef)(null);
    const folderInputRef = (0, react_1.useRef)(null);
    // Resolve full absolute path from local server API
    async function resolveRealFilePath(rawNameOrPath) {
        try {
            const res = await fetch(`/api/resolve-path?name=${encodeURIComponent(rawNameOrPath)}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.fullPath) {
                    return cleanPath(data.fullPath);
                }
            }
        }
        catch { }
        return cleanPath(rawNameOrPath);
    }
    // Handle native / fallback multi file selection
    async function handlePickFiles() {
        setIsSyncFolderMode(false);
        if ('showOpenFilePicker' in window) {
            try {
                const handles = await window.showOpenFilePicker({
                    types: [
                        {
                            description: 'Media Files',
                            accept: {
                                'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.avif'],
                                'video/*': ['.mp4', '.webm', '.mov', '.ogg'],
                            },
                        },
                    ],
                    multiple: true,
                });
                const items = [];
                for (const h of handles) {
                    const file = await h.getFile();
                    const rawSrc = file.path || file.name;
                    const realSrc = await resolveRealFilePath(rawSrc);
                    const type = (0, gallery_1.detectMediaType)(file.name);
                    items.push({
                        src: realSrc,
                        caption: file.name.replace(/\.[^/.]+$/, ''),
                        type,
                    });
                }
                if (items.length === 1) {
                    setManualInput(items[0].src);
                    setManualCaption(items[0].caption);
                    setSelectedItems([]);
                }
                else if (items.length > 1) {
                    setSelectedItems(items);
                    setManualInput('');
                    setManualCaption('');
                }
                return;
            }
            catch (err) {
                if (err instanceof Error && err.name === 'AbortError')
                    return;
            }
        }
        fileInputRef.current?.click();
    }
    async function handleStandardFileSelect(e) {
        setIsSyncFolderMode(false);
        const files = e.target.files;
        if (!files || files.length === 0)
            return;
        const items = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const rawSrc = file.path || file.name;
            const realSrc = await resolveRealFilePath(rawSrc);
            const type = (0, gallery_1.detectMediaType)(file.name);
            items.push({
                src: realSrc,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                type,
            });
        }
        if (items.length === 1) {
            setManualInput(items[0].src);
            setManualCaption(items[0].caption);
            setSelectedItems([]);
        }
        else if (items.length > 1) {
            setSelectedItems(items);
            setManualInput('');
            setManualCaption('');
        }
        e.target.value = '';
    }
    // Handle native / fallback folder selection
    async function handlePickFolder() {
        if ('showDirectoryPicker' in window) {
            try {
                const dirHandle = await window.showDirectoryPicker();
                setSyncDirName(dirHandle.name);
                if (!newFolderName && isCreatingNewFolder) {
                    setNewFolderName(dirHandle.name);
                }
                const items = [];
                async function scanDir(handle, currentPath) {
                    for await (const entry of handle.values()) {
                        if (entry.kind === 'file') {
                            const file = await entry.getFile();
                            const relPath = cleanPath(`${currentPath}/${file.name}`);
                            const realSrc = await resolveRealFilePath(relPath);
                            const type = (0, gallery_1.detectMediaType)(file.name);
                            if (type === 'image' || type === 'video') {
                                items.push({
                                    src: realSrc,
                                    caption: file.name.replace(/\.[^/.]+$/, ''),
                                    type,
                                });
                            }
                        }
                        else if (entry.kind === 'directory') {
                            await scanDir(entry, `${currentPath}/${entry.name}`);
                        }
                    }
                }
                await scanDir(dirHandle, dirHandle.name);
                if (items.length > 0) {
                    setSelectedItems(items);
                    setManualInput('');
                    setManualCaption('');
                }
                return;
            }
            catch (err) {
                if (err instanceof Error && err.name === 'AbortError')
                    return;
            }
        }
        folderInputRef.current?.click();
    }
    async function handleStandardFolderSelect(e) {
        const files = e.target.files;
        if (!files || files.length === 0)
            return;
        let detectedFolderName = '';
        let absoluteDirPath = '';
        const items = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const relPath = cleanPath(file.webkitRelativePath || file.name);
            if (!detectedFolderName && relPath.includes('/')) {
                detectedFolderName = relPath.split('/')[0];
            }
            const rawSrc = file.path || relPath;
            const realSrc = await resolveRealFilePath(rawSrc);
            if (!absoluteDirPath && realSrc && realSrc !== relPath) {
                if (realSrc.endsWith('/' + relPath.split('/').slice(1).join('/'))) {
                    absoluteDirPath = realSrc.slice(0, realSrc.length - relPath.split('/').slice(1).join('/').length - 1);
                }
                else {
                    absoluteDirPath = realSrc.substring(0, realSrc.lastIndexOf('/'));
                }
            }
            const type = (0, gallery_1.detectMediaType)(file.name);
            if (type === 'image' || type === 'video') {
                items.push({
                    src: realSrc,
                    caption: file.name.replace(/\.[^/.]+$/, ''),
                    type,
                });
            }
        }
        if (absoluteDirPath) {
            setSyncDirName(absoluteDirPath);
        }
        else if (detectedFolderName) {
            setSyncDirName(detectedFolderName);
        }
        if (items.length > 0) {
            setSelectedItems(items);
            setManualInput('');
            setManualCaption('');
        }
        e.target.value = '';
    }
    // Remove a single item from the selected list
    function handleRemoveItem(index) {
        setSelectedItems((prev) => prev.filter((_, i) => i !== index));
    }
    const flatFolders = (0, gallery_1.flattenFolders)(state.galleryFolders);
    // Submit Handler
    function handleSubmit(e) {
        e?.preventDefault();
        let targetPath = selectedFolderPath.length > 0 ? selectedFolderPath : initialFolderPath;
        // Create new folder if specified
        if (isCreatingNewFolder && newFolderName.trim()) {
            dispatch({
                type: 'ADD_GALLERY_FOLDER',
                payload: { parentFolderPath: [], name: newFolderName.trim() },
            });
            targetPath = [newFolderName.trim()];
        }
        if (targetPath.length === 0 && state.galleryFolders.length > 0) {
            targetPath = [state.galleryFolders[0].name];
        }
        if (targetPath.length === 0) {
            setNoFolderError(true);
            return;
        }
        // 1. Auto-Sync Folder Mode
        if (isSyncFolderMode && syncDirName.trim()) {
            dispatch({
                type: 'SET_FOLDER_SYNC_DIR',
                payload: {
                    folderPath: targetPath,
                    syncDir: syncDirName.trim(),
                },
            });
            onClose();
            return;
        }
        // 2. Single item from manual input
        if (selectedItems.length === 0 && manualInput.trim()) {
            dispatch({
                type: 'ADD_GALLERY_ITEM',
                payload: {
                    folderPath: targetPath,
                    src: cleanPath(manualInput.trim()),
                    caption: manualCaption.trim() || undefined,
                },
            });
            onClose();
            return;
        }
        // 3. Batch items
        if (selectedItems.length > 0) {
            dispatch({
                type: 'BATCH_ADD_GALLERY_ITEMS',
                payload: {
                    folderPath: targetPath,
                    items: selectedItems.map((it) => ({
                        src: it.src,
                        caption: it.caption,
                    })),
                },
            });
            onClose();
        }
    }
    const hasValidInput = (isSyncFolderMode && syncDirName.trim().length > 0) ||
        selectedItems.length > 0 ||
        manualInput.trim().length > 0;
    const selectedFolderLabel = (0, react_1.useMemo)(() => {
        if (selectedFolderPath.length === 0)
            return 'Pilih Folder Tujuan...';
        const pathStr = selectedFolderPath.join('/');
        const found = flatFolders.find((f) => f.pathParts.join('/') === pathStr);
        if (found) {
            return `${found.folder.name} (${pathStr})`;
        }
        return pathStr;
    }, [selectedFolderPath, flatFolders]);
    return (<div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleStandardFileSelect}/>
      <input ref={folderInputRef} type="file" 
    //@ts-ignore
    webkitdirectory="" directory="" multiple className="hidden" onChange={handleStandardFolderSelect}/>

      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'var(--color-brand-glow)' }}>
              <lucide_react_1.Images size={16} style={{ color: 'var(--color-brand)' }}/>
            </div>
            <div>
              <h3 className="font-bold text-sm font-display" style={{ color: 'var(--color-text)' }}>
                {t.addMediaTitle}
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--color-text-dim)' }}>
                Tambahkan gambar atau video ke galeri
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-white">
            <lucide_react_1.X size={18}/>
          </button>
        </div>

        {/* Body Content */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {/* Quick Select Buttons */}
          <div className="grid grid-cols-2 gap-2.5 font-display">
            <button type="button" onClick={handlePickFiles} className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] shadow-sm" style={{
            background: !isSyncFolderMode && selectedItems.length > 0 ? 'var(--color-brand-glow)' : 'var(--color-surface-2)',
            borderColor: !isSyncFolderMode && selectedItems.length > 0 ? 'var(--color-brand)' : 'var(--color-border)',
            color: !isSyncFolderMode && selectedItems.length > 0 ? 'var(--color-brand)' : 'var(--color-text)',
        }}>
              <lucide_react_1.FileImage size={16}/>
              <span>Pilih File Media</span>
            </button>

            <button type="button" onClick={handlePickFolder} className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border text-xs font-bold cursor-pointer transition-all hover:scale-[1.02] shadow-sm" style={{
            background: isSyncFolderMode || (selectedItems.length > 0 && syncDirName) ? 'var(--color-brand-glow)' : 'var(--color-surface-2)',
            borderColor: isSyncFolderMode || (selectedItems.length > 0 && syncDirName) ? 'var(--color-brand)' : 'var(--color-border)',
            color: isSyncFolderMode || (selectedItems.length > 0 && syncDirName) ? 'var(--color-brand)' : 'var(--color-text)',
        }}>
              <lucide_react_1.Folder size={16} style={{ color: 'var(--color-brand)' }}/>
              <span>Pilih Folder</span>
            </button>
          </div>

          {/* Sync Folder Mode Toggle */}
          {syncDirName && (<div className="p-3 rounded-2xl border flex flex-col font-display text-xs gap-3" style={{
                background: isSyncFolderMode ? 'rgba(14,243,141,0.08)' : 'var(--color-surface-2)',
                borderColor: isSyncFolderMode ? 'var(--color-brand)' : 'var(--color-border)',
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <lucide_react_1.RefreshCw size={15} className={isSyncFolderMode ? 'text-emerald-400 animate-spin-slow' : 'text-slate-400'}/>
                  <div>
                    <span className="font-bold block" style={{ color: isSyncFolderMode ? 'var(--color-brand)' : 'var(--color-text)' }}>
                      Mode Auto-Sync Folder
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
                      {isSyncFolderMode
                ? 'Otomatis mendeteksi semua file di folder ini'
                : 'Mencatat file-file terpilih satu per satu'}
                    </span>
                  </div>
                </div>
                <button type="button" className="text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all" style={{
                background: isSyncFolderMode ? 'var(--color-brand)' : 'var(--color-surface)',
                color: isSyncFolderMode ? '#050c14' : 'var(--color-text-muted)',
                borderColor: isSyncFolderMode ? 'var(--color-brand)' : 'var(--color-border)',
            }} onClick={() => setIsSyncFolderMode(!isSyncFolderMode)}>
                  {isSyncFolderMode ? 'Aktif' : 'Aktifkan'}
                </button>
              </div>

              {isSyncFolderMode && (<div className="space-y-1.5 mt-2">
                  <label className="text-[10px] font-bold" style={{ color: 'var(--color-text-muted)' }}>
                    Path Folder (Dapat diedit menjadi Full Path)
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 border" style={{ borderColor: 'var(--color-brand)' }}>
                     <lucide_react_1.Folder size={12} style={{ color: 'var(--color-brand)', flexShrink: 0 }}/>
                     <input className="flex-1 bg-transparent outline-none text-xs font-mono" style={{ color: 'var(--color-brand)' }} value={syncDirName} onChange={(e) => setSyncDirName(e.target.value)} placeholder="Contoh: D:/Projects/Game/Thumbnails"/>
                  </div>
                </div>)}
            </div>)}

          {/* If Multiple items selected */}
          {!isSyncFolderMode && selectedItems.length > 0 ? (<div className="p-3 rounded-2xl border space-y-2" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-display">
                  <lucide_react_1.CheckCircle2 size={14}/> {selectedItems.length} media dipilih
                </span>
                <span className="text-[10px] text-slate-400">
                  Klik ikon silang (✕) pada item untuk membuang dari daftar
                </span>
              </div>

              {/* Scrollable list with individual delete buttons */}
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                {selectedItems.map((item, idx) => (<div key={idx} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/30 text-slate-200 group border border-transparent hover:border-white/10">
                    <div className="flex items-center gap-2 truncate flex-1 mr-2">
                      <span className="text-slate-400 text-[10px]">{idx + 1}.</span>
                      <span className="truncate text-xs font-semibold">{item.caption || item.src.split('/').pop()}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-white/10 text-slate-300">
                        {item.type}
                      </span>
                      <button type="button" className="p-1 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer transition-colors" title="Hapus dari daftar pilihan" onClick={() => handleRemoveItem(idx)}>
                        <lucide_react_1.Trash2 size={13}/>
                      </button>
                    </div>
                  </div>))}
              </div>
            </div>) : !isSyncFolderMode ? (
        /* Single File / URL Input */
        <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold font-display" style={{ color: 'var(--color-text-muted)' }}>
                  Path File Lokal atau URL Media
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors" style={{
                background: 'var(--color-surface-2)',
                borderColor: manualInput.trim() ? 'var(--color-brand)' : 'var(--color-border)',
            }}>
                  <lucide_react_1.Link size={14} style={{ color: 'var(--color-brand)', flexShrink: 0 }}/>
                  <input className="flex-1 bg-transparent text-xs outline-none font-mono" style={{ color: 'var(--color-text)' }} placeholder="Contoh: C:/Users/Videos/clip.mp4, docs/hero.png, atau URL" value={manualInput} onChange={(e) => setManualInput(e.target.value)}/>
                  {manualInput && (<button type="button" onClick={() => setManualInput('')} className="cursor-pointer">
                      <lucide_react_1.X size={13} style={{ color: 'var(--color-text-dim)' }}/>
                    </button>)}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold font-display" style={{ color: 'var(--color-text-muted)' }}>
                  Judul / Caption (Opsional)
                </label>
                <input className="w-full px-3 py-2 rounded-xl border text-xs outline-none font-display" style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
            }} placeholder="Keterangan singkat media..." value={manualCaption} onChange={(e) => setManualCaption(e.target.value)}/>
              </div>
            </div>) : null}

          {/* Folder Target Selection (Custom Non-Native Dropdown) */}
          <div className="space-y-2 border-t pt-3.5" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold font-display" style={{ color: noFolderError ? '#ef4444' : 'var(--color-text-muted)' }}>
                Simpan ke Folder Galeri *
              </label>
              <button type="button" className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer" onClick={() => setIsCreatingNewFolder(!isCreatingNewFolder)}>
                {isCreatingNewFolder ? '← Pilih Folder yang Ada' : '+ Buat Folder Baru'}
              </button>
            </div>

            {isCreatingNewFolder ? (<input autoFocus className="w-full px-3 py-2.5 rounded-xl border text-xs outline-none font-display" style={{
                background: 'var(--color-surface-2)',
                borderColor: 'var(--color-brand)',
                color: 'var(--color-text)',
            }} placeholder="Nama folder baru..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}/>) : flatFolders.length === 0 ? (<div className="px-3 py-2.5 rounded-xl border text-xs font-display text-slate-400" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}>
                Belum ada folder di galeri. Folder baru akan dibuat otomatis.
              </div>) : (
        /* Custom Non-Native Dropdown Selector */
        <div className="relative font-display" ref={dropdownRef}>
                <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs cursor-pointer transition-all shadow-sm select-none" style={{
                background: 'var(--color-surface-2)',
                borderColor: noFolderError ? '#ef4444' : isDropdownOpen ? 'var(--color-brand)' : 'var(--color-border)',
                color: 'var(--color-text)',
            }}>
                  <div className="flex items-center gap-2 truncate pr-2">
                    <lucide_react_1.Folder size={15} style={{ color: 'var(--color-brand)', flexShrink: 0 }}/>
                    <span className="font-bold truncate">{selectedFolderLabel}</span>
                  </div>
                  <lucide_react_1.ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`}/>
                </button>

                {/* Dropdown Options Popover (Drop-Up so no modal scroll is needed) */}
                {isDropdownOpen && (<div className="absolute left-0 right-0 bottom-full mb-2 rounded-2xl shadow-2xl border p-1.5 max-h-60 overflow-y-auto z-[100] space-y-0.5" style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-brand)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 -8px 30px rgba(0,0,0,0.6)',
                }}>
                    {flatFolders.map(({ folder, pathParts, depth }) => {
                    const value = pathParts.join('/');
                    const isSelected = selectedFolderPath.join('/') === value;
                    return (<button key={folder.id} type="button" className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left cursor-pointer transition-colors" style={{
                            paddingLeft: `${12 + depth * 14}px`,
                            background: isSelected ? 'var(--color-brand-glow)' : 'transparent',
                            color: isSelected ? 'var(--color-brand)' : 'var(--color-text)',
                        }} onClick={() => {
                            setSelectedFolderPath(pathParts);
                            setIsDropdownOpen(false);
                            setNoFolderError(false);
                        }}>
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-slate-500 font-mono text-[10px]">
                              {depth > 0 ? '└' : '📁'}
                            </span>
                            <span className={`truncate ${isSelected ? 'font-bold' : 'font-medium'}`}>
                              {folder.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              ({value})
                            </span>
                          </div>
                          {isSelected && <lucide_react_1.Check size={14} className="text-emerald-400 shrink-0 ml-2 font-bold"/>}
                        </button>);
                })}
                  </div>)}
              </div>)}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t shrink-0 font-display" style={{ borderColor: 'var(--color-border)' }}>
          <button type="button" className="px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }} onClick={onClose}>
            {t.cancelBtn}
          </button>

          <button type="submit" disabled={!hasValidInput || (selectedFolderPath.length === 0 && !isCreatingNewFolder && flatFolders.length === 0)} className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md" style={{ background: 'var(--color-brand)', color: '#050c14' }}>
            <lucide_react_1.Plus size={14}/>
            <span>
              {isSyncFolderMode
            ? `Simpan Auto-Sync Folder`
            : selectedItems.length > 1
                ? `Import ${selectedItems.length} Media`
                : 'Tambahkan ke Galeri'}
            </span>
          </button>
        </div>
      </form>
    </div>);
}
//# sourceMappingURL=GalleryAddModal.js.map