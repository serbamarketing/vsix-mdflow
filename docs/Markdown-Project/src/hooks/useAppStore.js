"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppProvider = AppProvider;
exports.useAppStore = useAppStore;
const react_1 = require("react");
const feature_1 = require("@/models/feature");
const gallery_1 = require("@/models/gallery");
const galleryParser_1 = require("@/features/gallery/galleryParser");
const gallerySerializer_1 = require("@/features/gallery/gallerySerializer");
const markdownParser_1 = require("@/features/parser/markdownParser");
const markdownSerializer_1 = require("@/features/serializer/markdownSerializer");
const useFileOpen_1 = require("./useFileOpen");
function combineMarkdown(featuresContent, galleryFolders) {
    const gallerySection = (0, gallerySerializer_1.serializeGallerySection)(galleryFolders);
    const nonGallery = (0, galleryParser_1.extractNonGalleryContent)(featuresContent);
    if (!gallerySection)
        return nonGallery;
    if (!nonGallery.trim())
        return gallerySection;
    return `${nonGallery.trimEnd()}\n\n${gallerySection}`;
}
function recordHistoryChange(state, newRawMarkdown, label) {
    if (!state.rawMarkdown || state.rawMarkdown === newRawMarkdown) {
        return {
            pastRawMarkdown: state.pastRawMarkdown,
            futureRawMarkdown: state.futureRawMarkdown,
            historySnapshots: state.historySnapshots,
        };
    }
    const past = [...state.pastRawMarkdown, state.rawMarkdown].slice(-30);
    const newSnapshot = {
        id: `snap-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
        timestamp: new Date().toLocaleTimeString(),
        label,
        rawMarkdown: newRawMarkdown,
    };
    const snapshots = [newSnapshot, ...state.historySnapshots].slice(0, 20);
    return {
        pastRawMarkdown: past,
        futureRawMarkdown: [],
        historySnapshots: snapshots,
    };
}
const MFM_ACTIVE_FILENAME_KEY = 'mfm_active_filename';
const MFM_ACTIVE_CONTENT_KEY = 'mfm_active_content';
const MFM_ACTIVE_CLOSED_KEY = 'mfm_active_closed';
function getInitialLanguage() {
    try {
        const item = localStorage.getItem('mfm_lang');
        return item === 'en' ? 'en' : 'id';
    }
    catch {
        return 'id';
    }
}
function getInitialStorage(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    }
    catch {
        return fallback;
    }
}
function getViewFromHash() {
    const hash = window.location.hash.replace(/^#\/?/, '').split('/')[0].split('?')[0].trim().toLowerCase();
    if (['summary', 'mindmap', 'table', 'kanban', 'calendar', 'editor', 'docs', 'gallery'].includes(hash)) {
        return hash;
    }
    return 'mindmap';
}
function getInitialSession() {
    try {
        const isClosed = localStorage.getItem(MFM_ACTIVE_CLOSED_KEY) === 'true';
        if (isClosed) {
            return {
                rawMarkdown: null,
                fileName: null,
                features: [],
                galleryFolders: [],
                galleryNonGalleryContent: '',
                saveStatus: 'idle',
                historySnapshots: [],
            };
        }
        const savedContent = localStorage.getItem(MFM_ACTIVE_CONTENT_KEY);
        const savedFileName = localStorage.getItem(MFM_ACTIVE_FILENAME_KEY);
        if (savedContent && savedFileName) {
            const features = (0, markdownParser_1.parseMarkdown)(savedContent);
            const { folders } = (0, galleryParser_1.parseGallerySection)(savedContent);
            const nonGallery = (0, galleryParser_1.extractNonGalleryContent)(savedContent);
            const initialSnap = {
                id: `snap-session-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                label: `Sesi: ${savedFileName}`,
                rawMarkdown: savedContent,
            };
            return {
                rawMarkdown: savedContent,
                fileName: savedFileName,
                features,
                galleryFolders: folders,
                galleryNonGalleryContent: nonGallery,
                saveStatus: 'saved',
                historySnapshots: [initialSnap],
            };
        }
    }
    catch (err) {
        console.warn('Failed to restore active project session:', err);
    }
    return {
        rawMarkdown: null,
        fileName: null,
        features: [],
        galleryFolders: [],
        galleryNonGalleryContent: '',
        saveStatus: 'idle',
        historySnapshots: [],
    };
}
const sessionData = getInitialSession();
const initialState = {
    rawMarkdown: sessionData.rawMarkdown,
    fileName: sessionData.fileName,
    fileHandle: null,
    features: sessionData.features,
    selectedFeatureId: null,
    activeView: getViewFromHash(),
    searchQuery: '',
    filters: {},
    isDetailOpen: false,
    isSettingsOpen: false,
    isNewFeatureModalOpen: false,
    newFeatureParentId: null,
    isSidebarOpen: getInitialStorage('mfm_sidebar_open', true),
    isMobileSidebarOpen: false,
    language: getInitialLanguage(),
    theme: getInitialStorage('mfm_theme', 'dark'),
    customStatuses: getInitialStorage('mfm_statuses', feature_1.DEFAULT_STATUSES),
    columnConfig: getInitialStorage('mfm_columns', feature_1.DEFAULT_COLUMN_CONFIG),
    autoSave: getInitialStorage('mfm_autosave', true),
    saveStatus: sessionData.saveStatus,
    lastSavedAt: sessionData.rawMarkdown ? new Date() : null,
    // Gallery initial state
    galleryFolders: sessionData.galleryFolders,
    galleryNonGalleryContent: sessionData.galleryNonGalleryContent,
    activeGalleryFolderId: null,
    galleryViewMode: 'grid',
    // History & Undo/Redo initial state
    pastRawMarkdown: [],
    futureRawMarkdown: [],
    historySnapshots: sessionData.historySnapshots,
    directoryHandles: {},
    missingLocalPaths: new Set(),
};
function reducer(state, action) {
    console.log('⚡ [AppStore Action]:', action.type, action);
    switch (action.type) {
        case 'LOAD_FILE': {
            const { folders } = (0, galleryParser_1.parseGallerySection)(action.payload.content);
            const nonGallery = (0, galleryParser_1.extractNonGalleryContent)(action.payload.content);
            const initialSnap = {
                id: `snap-init-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                label: `Loaded: ${action.payload.fileName}`,
                rawMarkdown: action.payload.content,
            };
            return {
                ...state,
                rawMarkdown: action.payload.content,
                fileName: action.payload.fileName,
                fileHandle: action.payload.handle,
                features: action.payload.features,
                galleryFolders: folders,
                galleryNonGalleryContent: nonGallery,
                selectedFeatureId: null,
                isDetailOpen: false,
                searchQuery: '',
                filters: {},
                saveStatus: 'saved',
                lastSavedAt: new Date(),
                pastRawMarkdown: [],
                futureRawMarkdown: [],
                historySnapshots: [initialSnap],
            };
        }
        case 'SET_FILE_HANDLE': {
            return {
                ...state,
                fileHandle: action.payload.handle,
                fileName: action.payload.fileName || state.fileName,
                saveStatus: 'saved',
                lastSavedAt: new Date(),
            };
        }
        case 'SYNC_FROM_DISK': {
            const features = (0, markdownParser_1.parseMarkdown)(action.payload.content);
            const { folders } = (0, galleryParser_1.parseGallerySection)(action.payload.content);
            const nonGallery = (0, galleryParser_1.extractNonGalleryContent)(action.payload.content);
            return {
                ...state,
                rawMarkdown: action.payload.content,
                fileName: action.payload.fileName || state.fileName,
                fileHandle: action.payload.handle !== undefined ? action.payload.handle : state.fileHandle,
                features,
                galleryFolders: folders,
                galleryNonGalleryContent: nonGallery,
                saveStatus: 'saved',
                lastSavedAt: new Date(),
            };
        }
        case 'UNDO': {
            if (state.pastRawMarkdown.length === 0)
                return state;
            const previousRaw = state.pastRawMarkdown[state.pastRawMarkdown.length - 1];
            const newPast = state.pastRawMarkdown.slice(0, -1);
            const newFuture = [state.rawMarkdown || '', ...state.futureRawMarkdown];
            const features = (0, markdownParser_1.parseMarkdown)(previousRaw);
            const { folders } = (0, galleryParser_1.parseGallerySection)(previousRaw);
            const nonGallery = (0, galleryParser_1.extractNonGalleryContent)(previousRaw);
            return {
                ...state,
                pastRawMarkdown: newPast,
                futureRawMarkdown: newFuture,
                rawMarkdown: previousRaw,
                features,
                galleryFolders: folders,
                galleryNonGalleryContent: nonGallery,
                saveStatus: 'saving',
            };
        }
        case 'REDO': {
            if (state.futureRawMarkdown.length === 0)
                return state;
            const nextRaw = state.futureRawMarkdown[0];
            const newFuture = state.futureRawMarkdown.slice(1);
            const newPast = [...state.pastRawMarkdown, state.rawMarkdown || ''];
            const features = (0, markdownParser_1.parseMarkdown)(nextRaw);
            const { folders } = (0, galleryParser_1.parseGallerySection)(nextRaw);
            const nonGallery = (0, galleryParser_1.extractNonGalleryContent)(nextRaw);
            return {
                ...state,
                pastRawMarkdown: newPast,
                futureRawMarkdown: newFuture,
                rawMarkdown: nextRaw,
                features,
                galleryFolders: folders,
                galleryNonGalleryContent: nonGallery,
                saveStatus: 'saving',
            };
        }
        case 'RESTORE_SNAPSHOT': {
            const targetRaw = action.payload.rawMarkdown;
            if (!targetRaw || targetRaw === state.rawMarkdown)
                return state;
            const historyUpdate = recordHistoryChange(state, targetRaw, 'Rollback Snapshot');
            const features = (0, markdownParser_1.parseMarkdown)(targetRaw);
            const { folders } = (0, galleryParser_1.parseGallerySection)(targetRaw);
            const nonGallery = (0, galleryParser_1.extractNonGalleryContent)(targetRaw);
            return {
                ...state,
                ...historyUpdate,
                rawMarkdown: targetRaw,
                features,
                galleryFolders: folders,
                galleryNonGalleryContent: nonGallery,
                saveStatus: 'saving',
            };
        }
        case 'CLOSE_FILE': {
            try {
                localStorage.removeItem(MFM_ACTIVE_CONTENT_KEY);
                localStorage.removeItem(MFM_ACTIVE_FILENAME_KEY);
                localStorage.setItem(MFM_ACTIVE_CLOSED_KEY, 'true');
            }
            catch (err) {
                console.warn('Failed to clear active session storage:', err);
            }
            return {
                ...initialState,
                rawMarkdown: null,
                fileName: null,
                fileHandle: null,
                features: [],
                galleryFolders: [],
                galleryNonGalleryContent: '',
                saveStatus: 'idle',
                historySnapshots: [],
                language: state.language,
                theme: state.theme,
                customStatuses: state.customStatuses,
                columnConfig: state.columnConfig,
                autoSave: state.autoSave,
                directoryHandles: state.directoryHandles,
                missingLocalPaths: new Set(),
            };
        }
        case 'SET_VIEW': {
            window.location.hash = `#/${action.payload}`;
            return { ...state, activeView: action.payload };
        }
        case 'SELECT_FEATURE':
            return {
                ...state,
                selectedFeatureId: action.payload,
                isDetailOpen: action.payload !== null,
            };
        case 'SET_SEARCH':
            return { ...state, searchQuery: action.payload };
        case 'SET_FILTER':
            return { ...state, filters: action.payload };
        case 'CLOSE_DETAIL':
            return { ...state, isDetailOpen: false, selectedFeatureId: null };
        case 'OPEN_SETTINGS':
            return { ...state, isSettingsOpen: true };
        case 'CLOSE_SETTINGS':
            return { ...state, isSettingsOpen: false };
        case 'OPEN_NEW_FEATURE_MODAL':
            return { ...state, isNewFeatureModalOpen: true, newFeatureParentId: action.payload ?? null };
        case 'CLOSE_NEW_FEATURE_MODAL':
            return { ...state, isNewFeatureModalOpen: false, newFeatureParentId: null };
        case 'UPDATE_FEATURES': {
            const { folders } = (0, galleryParser_1.parseGallerySection)(action.payload.content);
            const nonGallery = (0, galleryParser_1.extractNonGalleryContent)(action.payload.content);
            return {
                ...state,
                features: action.payload.features,
                rawMarkdown: action.payload.content,
                galleryFolders: folders,
                galleryNonGalleryContent: nonGallery,
                saveStatus: 'saving',
            };
        }
        case 'UPDATE_FEATURE_NODE': {
            const updated = (0, feature_1.updateNodeInTree)(state.features, action.payload.id, action.payload.updates);
            const serialized = combineMarkdown((0, markdownSerializer_1.serializeMarkdown)(updated), state.galleryFolders);
            return {
                ...state,
                features: updated,
                rawMarkdown: serialized,
                saveStatus: 'saving',
            };
        }
        case 'ADD_FEATURE_NODE': {
            const updated = (0, feature_1.addChildNodeInTree)(state.features, action.payload.parentId, action.payload.node);
            const serialized = combineMarkdown((0, markdownSerializer_1.serializeMarkdown)(updated), state.galleryFolders);
            return {
                ...state,
                features: updated,
                rawMarkdown: serialized,
                selectedFeatureId: action.payload.node.id,
                isDetailOpen: true,
                isNewFeatureModalOpen: false,
                saveStatus: 'saving',
            };
        }
        case 'DELETE_FEATURE_NODE': {
            const updated = (0, feature_1.deleteNodeInTree)(state.features, action.payload.id);
            const serialized = combineMarkdown((0, markdownSerializer_1.serializeMarkdown)(updated), state.galleryFolders);
            return {
                ...state,
                features: updated,
                rawMarkdown: serialized,
                selectedFeatureId: state.selectedFeatureId === action.payload.id ? null : state.selectedFeatureId,
                isDetailOpen: state.selectedFeatureId === action.payload.id ? false : state.isDetailOpen,
                saveStatus: 'saving',
            };
        }
        case 'REPARENT_FEATURE_NODE': {
            const updated = (0, feature_1.moveNodeToParentInTree)(state.features, action.payload.sourceId, action.payload.targetParentId);
            const serialized = combineMarkdown((0, markdownSerializer_1.serializeMarkdown)(updated), state.galleryFolders);
            return {
                ...state,
                features: updated,
                rawMarkdown: serialized,
                saveStatus: 'saving',
            };
        }
        case 'BATCH_REPARENT_NODES': {
            const updated = (0, feature_1.moveMultipleNodesToParentInTree)(state.features, action.payload.sourceIds, action.payload.targetParentId);
            const serialized = combineMarkdown((0, markdownSerializer_1.serializeMarkdown)(updated), state.galleryFolders);
            return {
                ...state,
                features: updated,
                rawMarkdown: serialized,
                saveStatus: 'saving',
            };
        }
        case 'BATCH_DELETE_NODES': {
            let currentTree = state.features;
            for (const id of action.payload.ids) {
                currentTree = (0, feature_1.deleteNodeInTree)(currentTree, id);
            }
            const serialized = combineMarkdown((0, markdownSerializer_1.serializeMarkdown)(currentTree), state.galleryFolders);
            return {
                ...state,
                features: currentTree,
                rawMarkdown: serialized,
                saveStatus: 'saving',
            };
        }
        case 'BATCH_UPDATE_STATUS': {
            let currentTree = state.features;
            for (const id of action.payload.ids) {
                currentTree = (0, feature_1.updateNodeInTree)(currentTree, id, {
                    metadata: {
                        ...currentTree.find((f) => f.id === id)?.metadata,
                        status: action.payload.status,
                    },
                });
            }
            const serialized = combineMarkdown((0, markdownSerializer_1.serializeMarkdown)(currentTree), state.galleryFolders);
            return {
                ...state,
                features: currentTree,
                rawMarkdown: serialized,
                saveStatus: 'saving',
            };
        }
        case 'MOVE_FEATURE_STATUS': {
            const updated = (0, feature_1.updateNodeInTree)(state.features, action.payload.id, {
                metadata: {
                    ...state.features.find((f) => f.id === action.payload.id)?.metadata,
                    status: action.payload.status,
                },
            });
            const serialized = combineMarkdown((0, markdownSerializer_1.serializeMarkdown)(updated), state.galleryFolders);
            return {
                ...state,
                features: updated,
                rawMarkdown: serialized,
                saveStatus: 'saving',
            };
        }
        case 'ADD_CUSTOM_COLUMN': {
            const colKey = action.payload.key.toLowerCase().trim();
            const newConfig = {
                ...state.columnConfig,
                table: { ...state.columnConfig.table, [colKey]: true },
            };
            localStorage.setItem('mfm_columns', JSON.stringify(newConfig));
            return {
                ...state,
                columnConfig: newConfig,
            };
        }
        case 'DELETE_CUSTOM_COLUMN': {
            const colKey = action.payload.key.toLowerCase().trim();
            const updatedTree = (0, feature_1.deleteMetadataKeyFromAll)(state.features, colKey);
            const serialized = (0, markdownSerializer_1.serializeMarkdown)(updatedTree);
            const updatedTableConfig = { ...state.columnConfig.table };
            delete updatedTableConfig[colKey];
            const newConfig = {
                ...state.columnConfig,
                table: updatedTableConfig,
            };
            localStorage.setItem('mfm_columns', JSON.stringify(newConfig));
            return {
                ...state,
                features: updatedTree,
                rawMarkdown: serialized,
                columnConfig: newConfig,
                saveStatus: 'saving',
            };
        }
        case 'SET_LANGUAGE':
            localStorage.setItem('mfm_lang', action.payload);
            return { ...state, language: action.payload };
        case 'SET_THEME':
            localStorage.setItem('mfm_theme', JSON.stringify(action.payload));
            return { ...state, theme: action.payload };
        case 'SET_CUSTOM_STATUSES':
            localStorage.setItem('mfm_statuses', JSON.stringify(action.payload));
            return { ...state, customStatuses: action.payload };
        case 'SET_COLUMN_CONFIG':
            localStorage.setItem('mfm_columns', JSON.stringify(action.payload));
            return { ...state, columnConfig: action.payload };
        case 'SET_AUTO_SAVE':
            localStorage.setItem('mfm_autosave', JSON.stringify(action.payload));
            return { ...state, autoSave: action.payload };
        case 'SET_SAVE_STATUS':
            return {
                ...state,
                saveStatus: action.payload.status,
                lastSavedAt: action.payload.time ?? state.lastSavedAt,
            };
        case 'REORDER_FEATURE_NODE': {
            const updated = (0, feature_1.reorderNodeInTree)(state.features, action.payload.id, action.payload.direction);
            const serialized = combineMarkdown((0, markdownSerializer_1.serializeMarkdown)(updated), state.galleryFolders);
            return {
                ...state,
                features: updated,
                rawMarkdown: serialized,
                saveStatus: 'saving',
            };
        }
        // ===================== GALLERY ACTIONS =====================
        case 'RELOAD_GALLERY_FROM_MARKDOWN': {
            const { rawMarkdown } = action.payload;
            const { folders } = (0, galleryParser_1.parseGallerySection)(rawMarkdown);
            const nonGallery = (0, galleryParser_1.extractNonGalleryContent)(rawMarkdown);
            return {
                ...state,
                galleryFolders: folders,
                galleryNonGalleryContent: nonGallery,
            };
        }
        case 'SET_AUTO_SYNCED_ITEMS': {
            const { folderId, items } = action.payload;
            const updateFolders = (folders) => {
                return folders.map(f => {
                    if (f.id === folderId) {
                        const manualItems = f.items.filter(i => !i.isAutoSynced);
                        return { ...f, items: [...manualItems, ...items] };
                    }
                    if (f.children && f.children.length > 0) {
                        return { ...f, children: updateFolders(f.children) };
                    }
                    return f;
                });
            };
            return { ...state, galleryFolders: updateFolders(state.galleryFolders) };
        }
        case 'SET_ACTIVE_GALLERY_FOLDER':
            return { ...state, activeGalleryFolderId: action.payload };
        case 'SET_GALLERY_VIEW_MODE':
            return { ...state, galleryViewMode: action.payload };
        case 'ADD_GALLERY_FOLDER': {
            const newFolderName = action.payload.name.trim();
            if (!newFolderName)
                return state;
            const updatedFolders = (0, gallery_1.addFolderAtPath)(state.galleryFolders, action.payload.parentFolderPath, newFolderName);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const newFolderId = (0, gallery_1.generateGalleryFolderId)([...action.payload.parentFolderPath, newFolderName].join('/'));
            const hist = recordHistoryChange(state, newRaw, `Created folder: ${newFolderName}`);
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                activeGalleryFolderId: newFolderId,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'RENAME_GALLERY_FOLDER': {
            const { folderId, newName } = action.payload;
            if (!newName.trim())
                return state;
            const updatedFolders = (0, gallery_1.renameFolderById)(state.galleryFolders, folderId, newName.trim());
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, `Renamed folder: ${newName.trim()}`);
            // Recompute the new folder ID from new path (deterministic: based on folder name path)
            let newActiveId = state.activeGalleryFolderId;
            if (state.activeGalleryFolderId === folderId) {
                // Get old path and replace last segment with new name
                const oldPath = (0, gallery_1.getFolderPath)(state.galleryFolders, folderId) ?? [];
                const newPath = [...oldPath.slice(0, -1), newName.trim()];
                newActiveId = (0, gallery_1.generateGalleryFolderId)(newPath.join('/'));
            }
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                activeGalleryFolderId: newActiveId,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'DELETE_GALLERY_FOLDER': {
            const updatedFolders = (0, gallery_1.deleteFolderById)(state.galleryFolders, action.payload.folderId);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, 'Deleted folder');
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                activeGalleryFolderId: state.activeGalleryFolderId === action.payload.folderId
                    ? null
                    : state.activeGalleryFolderId,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'ADD_GALLERY_ITEM': {
            const { folderPath, src, caption } = action.payload;
            const item = {
                id: (0, gallery_1.generateGalleryItemId)(src, folderPath.join('/')),
                src,
                caption,
                type: (0, gallery_1.detectMediaType)(src),
            };
            const updatedFolders = (0, gallery_1.addItemAtPath)(state.galleryFolders, folderPath, item);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, 'Added media item');
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        // ===================== FILE SYSTEM ACTIONS =====================
        case 'SET_DIRECTORY_HANDLES':
            return { ...state, directoryHandles: action.payload };
        case 'ADD_MISSING_LOCAL_PATH': {
            const newSet = new Set(state.missingLocalPaths);
            newSet.add(action.payload);
            return { ...state, missingLocalPaths: newSet };
        }
        case 'REMOVE_MISSING_LOCAL_PATH': {
            const newSet = new Set(state.missingLocalPaths);
            newSet.delete(action.payload);
            return { ...state, missingLocalPaths: newSet };
        }
        case 'CLEAR_MISSING_LOCAL_PATHS':
            return { ...state, missingLocalPaths: new Set() };
        case 'BATCH_ADD_GALLERY_ITEMS': {
            const { folderPath, items } = action.payload;
            let currentFolders = state.galleryFolders;
            for (let idx = 0; idx < items.length; idx++) {
                const it = items[idx];
                const itemObj = {
                    id: (0, gallery_1.generateGalleryItemId)(it.src, folderPath.join('/'), idx),
                    src: it.src,
                    caption: it.caption,
                    type: (0, gallery_1.detectMediaType)(it.src),
                };
                currentFolders = (0, gallery_1.addItemAtPath)(currentFolders, folderPath, itemObj);
            }
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, currentFolders);
            const hist = recordHistoryChange(state, newRaw, `Imported ${items.length} media items`);
            return {
                ...state,
                ...hist,
                galleryFolders: currentFolders,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'DELETE_GALLERY_ITEM': {
            const updatedFolders = (0, gallery_1.deleteItemById)(state.galleryFolders, action.payload.itemId);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, 'Deleted media item');
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'RENAME_GALLERY_ITEM': {
            const { itemId, newCaption, newSrc } = action.payload;
            const updatedFolders = (0, gallery_1.renameItemInFolders)(state.galleryFolders, itemId, newCaption, newSrc);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, 'Renamed media item');
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'BATCH_DELETE_GALLERY_ITEMS': {
            const idsSet = new Set(action.payload.itemIds);
            const updatedFolders = (0, gallery_1.deleteItemsByIds)(state.galleryFolders, idsSet);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, `Deleted ${action.payload.itemIds.length} media items`);
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'MOVE_GALLERY_ITEM': {
            const { itemId, targetFolderPath } = action.payload;
            const updatedFolders = (0, gallery_1.moveItemToFolder)(state.galleryFolders, itemId, targetFolderPath);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, 'Moved media item');
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'BATCH_MOVE_GALLERY_ITEMS': {
            const { itemIds, targetFolderPath } = action.payload;
            const idsSet = new Set(itemIds);
            const updatedFolders = (0, gallery_1.batchMoveItemsToFolder)(state.galleryFolders, idsSet, targetFolderPath);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, `Moved ${itemIds.length} media items`);
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'MOVE_GALLERY_FOLDER': {
            const { folderId, newParentFolderPath } = action.payload;
            const updatedFolders = (0, gallery_1.moveFolderToParent)(state.galleryFolders, folderId, newParentFolderPath);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, 'Moved gallery folder');
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'SET_FOLDER_SYNC_DIR': {
            const { folderPath, syncDir } = action.payload;
            const updatedFolders = (0, gallery_1.setFolderSyncDirAtPath)(state.galleryFolders, folderPath, syncDir);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, `Set sync directory "${syncDir}"`);
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        case 'TOGGLE_SIDEBAR': {
            const next = !state.isSidebarOpen;
            localStorage.setItem('mfm_sidebar_open', JSON.stringify(next));
            return { ...state, isSidebarOpen: next };
        }
        case 'SET_SIDEBAR_OPEN': {
            localStorage.setItem('mfm_sidebar_open', JSON.stringify(action.payload));
            return { ...state, isSidebarOpen: action.payload };
        }
        case 'SET_MOBILE_SIDEBAR_OPEN':
            return { ...state, isMobileSidebarOpen: action.payload };
        case 'UNLINK_FOLDER_SYNC': {
            const updatedFolders = (0, gallery_1.unlinkFolderSyncDir)(state.galleryFolders, action.payload.folderId);
            const featuresText = state.features.length > 0
                ? (0, markdownSerializer_1.serializeMarkdown)(state.features)
                : state.galleryNonGalleryContent;
            const newRaw = combineMarkdown(featuresText, updatedFolders);
            const hist = recordHistoryChange(state, newRaw, 'Unlinked folder sync');
            return {
                ...state,
                ...hist,
                galleryFolders: updatedFolders,
                rawMarkdown: newRaw,
                saveStatus: 'saving',
            };
        }
        default:
            return state;
    }
}
const AppContext = (0, react_1.createContext)(null);
function AppProvider({ children }) {
    const [state, dispatch] = (0, react_1.useReducer)(reducer, initialState);
    const { saveFile } = (0, useFileOpen_1.useFileOpen)();
    const autoSaveTimeout = (0, react_1.useRef)(null);
    // Listen to hashchange for unique URLs (including calendar)
    (0, react_1.useEffect)(() => {
        const onHashChange = () => {
            const view = getViewFromHash();
            if (view !== state.activeView) {
                dispatch({ type: 'SET_VIEW', payload: view });
            }
        };
        window.addEventListener('hashchange', onHashChange);
        if (!window.location.hash) {
            window.location.hash = `#/${state.activeView}`;
        }
        return () => window.removeEventListener('hashchange', onHashChange);
    }, [state.activeView]);
    // Apply theme class to document
    (0, react_1.useEffect)(() => {
        document.documentElement.classList.remove('theme-dark', 'theme-midnight', 'theme-light');
        document.documentElement.classList.add(`theme-${state.theme}`);
    }, [state.theme]);
    // Global Undo / Redo Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
    (0, react_1.useEffect)(() => {
        function handleGlobalKeyDown(e) {
            const target = e.target;
            const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (isInput)
                    return;
                if (e.shiftKey) {
                    e.preventDefault();
                    dispatch({ type: 'REDO' });
                }
                else {
                    e.preventDefault();
                    dispatch({ type: 'UNDO' });
                }
            }
            else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                if (isInput)
                    return;
                e.preventDefault();
                dispatch({ type: 'REDO' });
            }
        }
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [dispatch]);
    // Reconnect File Handle — BACA FILE DISK TERBARU dari Code Editor sebagai Source of Truth (JANGAN MENIMPA!)
    const reconnectFileHandle = async () => {
        try {
            if (!('showOpenFilePicker' in window))
                return false;
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: 'Markdown Files', accept: { 'text/markdown': ['.md', '.markdown', '.txt'] } }],
                multiple: false,
            });
            const file = await handle.getFile();
            const diskContent = await file.text();
            console.log('📖 [Reconnect]: Reading latest content from disk as Source of Truth...');
            // Synchronize Web App state WITH THE FRESH DISK CONTENT from Code Editor
            dispatch({
                type: 'SYNC_FROM_DISK',
                payload: {
                    content: diskContent,
                    fileName: file.name,
                    handle,
                },
            });
            return true;
        }
        catch (err) {
            if (err instanceof Error && err.name === 'AbortError')
                return false;
            console.error('Failed to reconnect file handle:', err);
            return false;
        }
    };
    const lastDiskWriteTime = (0, react_1.useRef)(0);
    // Explicit Save function (Ctrl+S)
    const saveNow = async () => {
        if (!state.rawMarkdown || !state.fileName)
            return false;
        dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saving' } });
        const result = await saveFile(state.fileHandle, state.rawMarkdown, state.fileName);
        if (result.success) {
            lastDiskWriteTime.current = result.mtime || Date.now();
            dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saved', time: new Date() } });
            return true;
        }
        else {
            dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'error' } });
            return false;
        }
    };
    // Auto-Save Effect (Debounced 600ms)
    (0, react_1.useEffect)(() => {
        if (!state.autoSave || state.saveStatus !== 'saving' || !state.rawMarkdown) {
            return;
        }
        if (autoSaveTimeout.current) {
            window.clearTimeout(autoSaveTimeout.current);
        }
        autoSaveTimeout.current = window.setTimeout(async () => {
            try {
                const result = await saveFile(state.fileHandle, state.rawMarkdown, state.fileName || 'Fitur.md');
                if (result.success) {
                    lastDiskWriteTime.current = result.mtime || Date.now();
                    dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saved', time: new Date() } });
                }
                else {
                    dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'error' } });
                }
            }
            catch {
                dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'error' } });
            }
        }, 600);
        return () => {
            if (autoSaveTimeout.current) {
                window.clearTimeout(autoSaveTimeout.current);
            }
        };
    }, [state.rawMarkdown, state.saveStatus, state.autoSave, state.fileHandle, state.fileName, saveFile]);
    // Sync Active Project Session to LocalStorage (Source of Truth persistence)
    (0, react_1.useEffect)(() => {
        if (state.fileName && state.rawMarkdown) {
            try {
                localStorage.setItem(MFM_ACTIVE_FILENAME_KEY, state.fileName);
                localStorage.setItem(MFM_ACTIVE_CONTENT_KEY, state.rawMarkdown);
                localStorage.removeItem(MFM_ACTIVE_CLOSED_KEY);
            }
            catch (err) {
                console.warn('Failed to persist active project session to localStorage:', err);
            }
        }
    }, [state.fileName, state.rawMarkdown]);
    // 2-Way Sync: Listen to external disk file changes (e.g. from VS Code) instantly via API & Window Focus
    (0, react_1.useEffect)(() => {
        // DO NOT SYNC IF USER HAS CLOSED THE FILE OR NO ACTIVE FILE
        if (!state.fileName || !state.rawMarkdown) {
            return;
        }
        let isChecking = false;
        const activeFile = state.fileName;
        const checkExternalDiskChanges = async () => {
            if (isChecking || state.saveStatus === 'saving' || !state.fileName)
                return;
            try {
                isChecking = true;
                // Check disk file state via dev server API
                const statRes = await fetch(`/api/file-stat?file=${encodeURIComponent(activeFile)}`);
                if (statRes.ok) {
                    const statData = await statRes.json();
                    if (statData.exists && statData.mtime > lastDiskWriteTime.current + 800) {
                        const fileRes = await fetch(`/api/file?file=${encodeURIComponent(activeFile)}`);
                        if (fileRes.ok) {
                            const fileData = await fileRes.json();
                            if (fileData.content && fileData.content !== state.rawMarkdown) {
                                console.log('🔄 [2-Way Sync]: External edit detected from Code Editor, updating Web App...');
                                lastDiskWriteTime.current = fileData.mtime;
                                dispatch({
                                    type: 'SYNC_FROM_DISK',
                                    payload: { content: fileData.content, fileName: fileData.fileName },
                                });
                            }
                        }
                    }
                    return;
                }
                // Fallback: Check via browser fileHandle if available
                if (state.fileHandle) {
                    const file = await state.fileHandle.getFile();
                    if (file.lastModified && file.lastModified > lastDiskWriteTime.current + 800) {
                        const diskContent = await file.text();
                        if (diskContent && diskContent !== state.rawMarkdown) {
                            console.log('🔄 [2-Way Sync (Handle)]: External edit detected from Code Editor, updating Web App...');
                            lastDiskWriteTime.current = file.lastModified;
                            dispatch({
                                type: 'SYNC_FROM_DISK',
                                payload: { content: diskContent, fileName: file.name },
                            });
                        }
                    }
                }
            }
            catch {
                // Access or network error
            }
            finally {
                isChecking = false;
            }
        };
        // Check on window focus and periodic background sync (every 1.5s)
        window.addEventListener('focus', checkExternalDiskChanges);
        const interval = window.setInterval(checkExternalDiskChanges, 1500);
        return () => {
            window.removeEventListener('focus', checkExternalDiskChanges);
            window.clearInterval(interval);
        };
    }, [state.fileName, state.rawMarkdown, state.saveStatus, state.fileHandle]);
    return (<AppContext.Provider value={{ state, dispatch, saveNow, reconnectFileHandle }}>
      {children}
    </AppContext.Provider>);
}
function useAppStore() {
    const ctx = (0, react_1.useContext)(AppContext);
    if (!ctx)
        throw new Error('useAppStore must be used within AppProvider');
    return ctx;
}
//# sourceMappingURL=useAppStore.js.map