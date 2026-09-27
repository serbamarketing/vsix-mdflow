import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react'
import type { FeatureNode, ViewType, ThemeType, StatusDefinition, ColumnVisibilityConfig } from '@/models/feature'
import {
  DEFAULT_STATUSES,
  DEFAULT_COLUMN_CONFIG,
  updateNodeInTree,
  addChildNodeInTree,
  deleteNodeInTree,
  moveNodeToParentInTree,
  moveMultipleNodesToParentInTree,
  deleteMetadataKeyFromAll,
  reorderNodeInTree,
} from '@/models/feature'
import type { GalleryFolder, GalleryItem } from '@/models/gallery'
import {
  addFolderAtPath,
  addItemAtPath,
  deleteItemById,
  deleteFolderById,
  renameFolderById,
  deleteItemsByIds,
  generateGalleryItemId,
  generateGalleryFolderId,
  getFolderPath,
  detectMediaType,
  setFolderSyncDirAtPath,
  unlinkFolderSyncDir,
  renameItemInFolders,
  moveItemToFolder,
  batchMoveItemsToFolder,
  moveFolderToParent,
} from '@/models/gallery'
import { parseGallerySection, extractNonGalleryContent } from '@/features/gallery/galleryParser'
import { serializeGallerySection } from '@/features/gallery/gallerySerializer'
import { parseMarkdown } from '@/features/parser/markdownParser'
import { serializeMarkdown } from '@/features/serializer/markdownSerializer'
import { useFileOpen } from './useFileOpen'

export interface AppFilters {
  status?: string
  priority?: string
  type?: string
  pic?: string
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export type Language = 'id' | 'en'

export type GalleryViewMode = 'grid' | 'table'

export interface HistorySnapshot {
  id: string
  timestamp: string
  label: string
  rawMarkdown: string
}

export interface AppState {
  rawMarkdown: string | null
  fileName: string | null
  fileHandle: FileSystemFileHandle | null
  features: FeatureNode[]
  selectedFeatureId: string | null
  activeView: ViewType
  searchQuery: string
  filters: AppFilters
  isDetailOpen: boolean
  isSettingsOpen: boolean
  isNewFeatureModalOpen: boolean
  newFeatureParentId: string | null
  isSidebarOpen: boolean
  isMobileSidebarOpen: boolean

  // Customization & Config
  language: Language
  theme: ThemeType
  customStatuses: StatusDefinition[]
  columnConfig: ColumnVisibilityConfig
  autoSave: boolean
  saveStatus: SaveStatus
  lastSavedAt: Date | null

  // Gallery
  galleryFolders: GalleryFolder[]
  galleryNonGalleryContent: string
  activeGalleryFolderId: string | null
  galleryViewMode: GalleryViewMode

  // History & Undo/Redo
  pastRawMarkdown: string[]
  futureRawMarkdown: string[]
  historySnapshots: HistorySnapshot[]
  
  // Local File System Access
  directoryHandles: Record<string, any> // FileSystemDirectoryHandle
  missingLocalPaths: Set<string>
}

type AppAction =
  | { type: 'LOAD_FILE'; payload: { content: string; fileName: string; features: FeatureNode[]; handle: FileSystemFileHandle | null } }
  | { type: 'CLOSE_FILE' }
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'SELECT_FEATURE'; payload: string | null }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER'; payload: AppFilters }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'OPEN_SETTINGS' }
  | { type: 'CLOSE_SETTINGS' }
  | { type: 'OPEN_NEW_FEATURE_MODAL'; payload?: string | null }
  | { type: 'CLOSE_NEW_FEATURE_MODAL' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_MOBILE_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'UPDATE_FEATURES'; payload: { features: FeatureNode[]; content: string } }
  | { type: 'UPDATE_FEATURE_NODE'; payload: { id: string; updates: Partial<FeatureNode> } }
  | { type: 'ADD_FEATURE_NODE'; payload: { parentId: string | null; node: FeatureNode } }
  | { type: 'DELETE_FEATURE_NODE'; payload: { id: string } }
  | { type: 'MOVE_FEATURE_STATUS'; payload: { id: string; status: string } }
  | { type: 'REPARENT_FEATURE_NODE'; payload: { sourceId: string; targetParentId: string | null } }
  | { type: 'BATCH_REPARENT_NODES'; payload: { sourceIds: string[]; targetParentId: string | null } }
  | { type: 'BATCH_DELETE_NODES'; payload: { ids: string[] } }
  | { type: 'BATCH_UPDATE_STATUS'; payload: { ids: string[]; status: string } }
  | { type: 'ADD_CUSTOM_COLUMN'; payload: { key: string; defaultValue?: string } }
  | { type: 'DELETE_CUSTOM_COLUMN'; payload: { key: string } }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_THEME'; payload: ThemeType }
  | { type: 'SET_CUSTOM_STATUSES'; payload: StatusDefinition[] }
  | { type: 'SET_COLUMN_CONFIG'; payload: ColumnVisibilityConfig }
  | { type: 'SET_AUTO_SAVE'; payload: boolean }
  | { type: 'SET_FILE_HANDLE'; payload: { handle: FileSystemFileHandle; fileName?: string } }
  | { type: 'SYNC_FROM_DISK'; payload: { content: string; fileName?: string; handle?: FileSystemFileHandle | null } }
  | { type: 'SET_SAVE_STATUS'; payload: { status: SaveStatus; time?: Date } }
  | { type: 'REORDER_FEATURE_NODE'; payload: { id: string; direction: 'up' | 'down' } }
  // History Actions
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESTORE_SNAPSHOT'; payload: { rawMarkdown: string } }
  | { type: 'RELOAD_GALLERY_FROM_MARKDOWN'; payload: { rawMarkdown: string } }
  | { type: 'SET_AUTO_SYNCED_ITEMS'; payload: { folderId: string; items: GalleryItem[] } }
  | { type: 'SET_ACTIVE_GALLERY_FOLDER'; payload: string | null }
  | { type: 'SET_GALLERY_VIEW_MODE'; payload: GalleryViewMode }
  | { type: 'ADD_GALLERY_FOLDER'; payload: { parentFolderPath: string[]; name: string } }
  | { type: 'RENAME_GALLERY_FOLDER'; payload: { folderId: string; newName: string } }
  | { type: 'DELETE_GALLERY_FOLDER'; payload: { folderId: string } }
  | { type: 'ADD_GALLERY_ITEM'; payload: { folderPath: string[]; src: string; caption?: string } }
  | { type: 'RENAME_GALLERY_ITEM'; payload: { itemId: string; newCaption: string; newSrc?: string } }
  | { type: 'MOVE_GALLERY_ITEM'; payload: { itemId: string; targetFolderPath: string[] } }
  | { type: 'BATCH_MOVE_GALLERY_ITEMS'; payload: { itemIds: string[]; targetFolderPath: string[] } }
  | { type: 'MOVE_GALLERY_FOLDER'; payload: { folderId: string; newParentFolderPath: string[] } }
  | { type: 'BATCH_ADD_GALLERY_ITEMS'; payload: { folderPath: string[]; items: { src: string; caption?: string }[] } }
  | { type: 'DELETE_GALLERY_ITEM'; payload: { itemId: string } }
  | { type: 'BATCH_DELETE_GALLERY_ITEMS'; payload: { itemIds: string[] } }
  | { type: 'SET_FOLDER_SYNC_DIR'; payload: { folderPath: string[]; syncDir: string } }
  | { type: 'UNLINK_FOLDER_SYNC'; payload: { folderId: string } }
  // File System Actions
  | { type: 'SET_DIRECTORY_HANDLES'; payload: Record<string, any> }
  | { type: 'ADD_MISSING_LOCAL_PATH'; payload: string }
  | { type: 'REMOVE_MISSING_LOCAL_PATH'; payload: string }
  | { type: 'CLEAR_MISSING_LOCAL_PATHS' }

function combineMarkdown(featuresContent: string, galleryFolders: GalleryFolder[]): string {
  const gallerySection = serializeGallerySection(galleryFolders)
  const nonGallery = extractNonGalleryContent(featuresContent)
  if (!gallerySection) return nonGallery
  if (!nonGallery.trim()) return gallerySection
  return `${nonGallery.trimEnd()}\n\n${gallerySection}`
}

function recordHistoryChange(
  state: AppState,
  newRawMarkdown: string,
  label: string
): { pastRawMarkdown: string[]; futureRawMarkdown: string[]; historySnapshots: HistorySnapshot[] } {
  if (!state.rawMarkdown || state.rawMarkdown === newRawMarkdown) {
    return {
      pastRawMarkdown: state.pastRawMarkdown,
      futureRawMarkdown: state.futureRawMarkdown,
      historySnapshots: state.historySnapshots,
    }
  }
  const past = [...state.pastRawMarkdown, state.rawMarkdown].slice(-30)
  const newSnapshot: HistorySnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(-4)}`,
    timestamp: new Date().toLocaleTimeString(),
    label,
    rawMarkdown: newRawMarkdown,
  }
  const snapshots = [newSnapshot, ...state.historySnapshots].slice(0, 20)
  return {
    pastRawMarkdown: past,
    futureRawMarkdown: [],
    historySnapshots: snapshots,
  }
}

const MFM_ACTIVE_FILENAME_KEY = 'mfm_active_filename'
const MFM_ACTIVE_CONTENT_KEY = 'mfm_active_content'
const MFM_ACTIVE_CLOSED_KEY = 'mfm_active_closed'

function getInitialLanguage(): Language {
  try {
    const item = localStorage.getItem('mfm_lang')
    return item === 'en' ? 'en' : 'id'
  } catch {
    return 'id'
  }
}

function getInitialStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : fallback
  } catch {
    return fallback
  }
}

function getViewFromHash(): ViewType {
  const hash = window.location.hash.replace(/^#\/?/, '').split('/')[0].split('?')[0].trim().toLowerCase()
  if (['summary', 'mindmap', 'table', 'kanban', 'calendar', 'editor', 'docs', 'gallery'].includes(hash)) {
    return hash as ViewType
  }
  return 'mindmap'
}

interface InitialSessionData {
  rawMarkdown: string | null
  fileName: string | null
  features: FeatureNode[]
  galleryFolders: GalleryFolder[]
  galleryNonGalleryContent: string
  saveStatus: SaveStatus
  historySnapshots: HistorySnapshot[]
}

function getInitialSession(): InitialSessionData {
  try {
    const isClosed = localStorage.getItem(MFM_ACTIVE_CLOSED_KEY) === 'true'
    if (isClosed) {
      return {
        rawMarkdown: null,
        fileName: null,
        features: [],
        galleryFolders: [],
        galleryNonGalleryContent: '',
        saveStatus: 'idle',
        historySnapshots: [],
      }
    }

    const savedContent = localStorage.getItem(MFM_ACTIVE_CONTENT_KEY)
    const savedFileName = localStorage.getItem(MFM_ACTIVE_FILENAME_KEY)

    if (savedContent && savedFileName) {
      const features = parseMarkdown(savedContent)
      const { folders } = parseGallerySection(savedContent)
      const nonGallery = extractNonGalleryContent(savedContent)
      const initialSnap: HistorySnapshot = {
        id: `snap-session-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        label: `Sesi: ${savedFileName}`,
        rawMarkdown: savedContent,
      }
      return {
        rawMarkdown: savedContent,
        fileName: savedFileName,
        features,
        galleryFolders: folders,
        galleryNonGalleryContent: nonGallery,
        saveStatus: 'saved',
        historySnapshots: [initialSnap],
      }
    }
  } catch (err) {
    console.warn('Failed to restore active project session:', err)
  }

  return {
    rawMarkdown: null,
    fileName: null,
    features: [],
    galleryFolders: [],
    galleryNonGalleryContent: '',
    saveStatus: 'idle',
    historySnapshots: [],
  }
}

const sessionData = getInitialSession()

const initialState: AppState = {
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
  isSidebarOpen: getInitialStorage<boolean>('mfm_sidebar_open', true),
  isMobileSidebarOpen: false,

  language: getInitialLanguage(),
  theme: getInitialStorage<ThemeType>('mfm_theme', 'dark'),
  customStatuses: getInitialStorage<StatusDefinition[]>('mfm_statuses', DEFAULT_STATUSES),
  columnConfig: getInitialStorage<ColumnVisibilityConfig>('mfm_columns', DEFAULT_COLUMN_CONFIG),
  autoSave: getInitialStorage<boolean>('mfm_autosave', true),
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
}

function reducer(state: AppState, action: AppAction): AppState {
  console.log('⚡ [AppStore Action]:', action.type, action)
  switch (action.type) {
    case 'LOAD_FILE': {
      const { folders } = parseGallerySection(action.payload.content)
      const nonGallery = extractNonGalleryContent(action.payload.content)
      const initialSnap: HistorySnapshot = {
        id: `snap-init-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        label: `Loaded: ${action.payload.fileName}`,
        rawMarkdown: action.payload.content,
      }
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
      }
    }
    case 'SET_FILE_HANDLE': {
      return {
        ...state,
        fileHandle: action.payload.handle,
        fileName: action.payload.fileName || state.fileName,
        saveStatus: 'saved',
        lastSavedAt: new Date(),
      }
    }

    case 'SYNC_FROM_DISK': {
      const features = parseMarkdown(action.payload.content)
      const { folders } = parseGallerySection(action.payload.content)
      const nonGallery = extractNonGalleryContent(action.payload.content)
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
      }
    }

    case 'UNDO': {
      if (state.pastRawMarkdown.length === 0) return state
      const previousRaw = state.pastRawMarkdown[state.pastRawMarkdown.length - 1]
      const newPast = state.pastRawMarkdown.slice(0, -1)
      const newFuture = [state.rawMarkdown || '', ...state.futureRawMarkdown]
      const features = parseMarkdown(previousRaw)
      const { folders } = parseGallerySection(previousRaw)
      const nonGallery = extractNonGalleryContent(previousRaw)
      return {
        ...state,
        pastRawMarkdown: newPast,
        futureRawMarkdown: newFuture,
        rawMarkdown: previousRaw,
        features,
        galleryFolders: folders,
        galleryNonGalleryContent: nonGallery,
        saveStatus: 'saving',
      }
    }

    case 'REDO': {
      if (state.futureRawMarkdown.length === 0) return state
      const nextRaw = state.futureRawMarkdown[0]
      const newFuture = state.futureRawMarkdown.slice(1)
      const newPast = [...state.pastRawMarkdown, state.rawMarkdown || '']
      const features = parseMarkdown(nextRaw)
      const { folders } = parseGallerySection(nextRaw)
      const nonGallery = extractNonGalleryContent(nextRaw)
      return {
        ...state,
        pastRawMarkdown: newPast,
        futureRawMarkdown: newFuture,
        rawMarkdown: nextRaw,
        features,
        galleryFolders: folders,
        galleryNonGalleryContent: nonGallery,
        saveStatus: 'saving',
      }
    }

    case 'RESTORE_SNAPSHOT': {
      const targetRaw = action.payload.rawMarkdown
      if (!targetRaw || targetRaw === state.rawMarkdown) return state
      const historyUpdate = recordHistoryChange(state, targetRaw, 'Rollback Snapshot')
      const features = parseMarkdown(targetRaw)
      const { folders } = parseGallerySection(targetRaw)
      const nonGallery = extractNonGalleryContent(targetRaw)
      return {
        ...state,
        ...historyUpdate,
        rawMarkdown: targetRaw,
        features,
        galleryFolders: folders,
        galleryNonGalleryContent: nonGallery,
        saveStatus: 'saving',
      }
    }
    case 'CLOSE_FILE': {
      try {
        localStorage.removeItem(MFM_ACTIVE_CONTENT_KEY)
        localStorage.removeItem(MFM_ACTIVE_FILENAME_KEY)
        localStorage.setItem(MFM_ACTIVE_CLOSED_KEY, 'true')
      } catch (err) {
        console.warn('Failed to clear active session storage:', err)
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
      }
    }
    case 'SET_VIEW': {
      window.location.hash = `#/${action.payload}`
      return { ...state, activeView: action.payload }
    }
    case 'SELECT_FEATURE':
      return {
        ...state,
        selectedFeatureId: action.payload,
        isDetailOpen: action.payload !== null,
      }
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload }
    case 'SET_FILTER':
      return { ...state, filters: action.payload }
    case 'CLOSE_DETAIL':
      return { ...state, isDetailOpen: false, selectedFeatureId: null }
    case 'OPEN_SETTINGS':
      return { ...state, isSettingsOpen: true }
    case 'CLOSE_SETTINGS':
      return { ...state, isSettingsOpen: false }
    case 'OPEN_NEW_FEATURE_MODAL':
      return { ...state, isNewFeatureModalOpen: true, newFeatureParentId: action.payload ?? null }
    case 'CLOSE_NEW_FEATURE_MODAL':
      return { ...state, isNewFeatureModalOpen: false, newFeatureParentId: null }

    case 'UPDATE_FEATURES': {
      const { folders } = parseGallerySection(action.payload.content)
      const nonGallery = extractNonGalleryContent(action.payload.content)
      return {
        ...state,
        features: action.payload.features,
        rawMarkdown: action.payload.content,
        galleryFolders: folders,
        galleryNonGalleryContent: nonGallery,
        saveStatus: 'saving',
      }
    }

    case 'UPDATE_FEATURE_NODE': {
      const updated = updateNodeInTree(state.features, action.payload.id, action.payload.updates)
      const serialized = combineMarkdown(serializeMarkdown(updated), state.galleryFolders)
      return {
        ...state,
        features: updated,
        rawMarkdown: serialized,
        saveStatus: 'saving',
      }
    }

    case 'ADD_FEATURE_NODE': {
      const updated = addChildNodeInTree(state.features, action.payload.parentId, action.payload.node)
      const serialized = combineMarkdown(serializeMarkdown(updated), state.galleryFolders)
      return {
        ...state,
        features: updated,
        rawMarkdown: serialized,
        selectedFeatureId: action.payload.node.id,
        isDetailOpen: true,
        isNewFeatureModalOpen: false,
        saveStatus: 'saving',
      }
    }

    case 'DELETE_FEATURE_NODE': {
      const updated = deleteNodeInTree(state.features, action.payload.id)
      const serialized = combineMarkdown(serializeMarkdown(updated), state.galleryFolders)
      return {
        ...state,
        features: updated,
        rawMarkdown: serialized,
        selectedFeatureId: state.selectedFeatureId === action.payload.id ? null : state.selectedFeatureId,
        isDetailOpen: state.selectedFeatureId === action.payload.id ? false : state.isDetailOpen,
        saveStatus: 'saving',
      }
    }

    case 'REPARENT_FEATURE_NODE': {
      const updated = moveNodeToParentInTree(state.features, action.payload.sourceId, action.payload.targetParentId)
      const serialized = combineMarkdown(serializeMarkdown(updated), state.galleryFolders)
      return {
        ...state,
        features: updated,
        rawMarkdown: serialized,
        saveStatus: 'saving',
      }
    }

    case 'BATCH_REPARENT_NODES': {
      const updated = moveMultipleNodesToParentInTree(state.features, action.payload.sourceIds, action.payload.targetParentId)
      const serialized = combineMarkdown(serializeMarkdown(updated), state.galleryFolders)
      return {
        ...state,
        features: updated,
        rawMarkdown: serialized,
        saveStatus: 'saving',
      }
    }

    case 'BATCH_DELETE_NODES': {
      let currentTree = state.features
      for (const id of action.payload.ids) {
        currentTree = deleteNodeInTree(currentTree, id)
      }
      const serialized = combineMarkdown(serializeMarkdown(currentTree), state.galleryFolders)
      return {
        ...state,
        features: currentTree,
        rawMarkdown: serialized,
        saveStatus: 'saving',
      }
    }

    case 'BATCH_UPDATE_STATUS': {
      let currentTree = state.features
      for (const id of action.payload.ids) {
        currentTree = updateNodeInTree(currentTree, id, {
          metadata: {
            ...currentTree.find((f) => f.id === id)?.metadata,
            status: action.payload.status,
          },
        })
      }
      const serialized = combineMarkdown(serializeMarkdown(currentTree), state.galleryFolders)
      return {
        ...state,
        features: currentTree,
        rawMarkdown: serialized,
        saveStatus: 'saving',
      }
    }

    case 'MOVE_FEATURE_STATUS': {
      const updated = updateNodeInTree(state.features, action.payload.id, {
        metadata: {
          ...state.features.find((f) => f.id === action.payload.id)?.metadata,
          status: action.payload.status,
        },
      })
      const serialized = combineMarkdown(serializeMarkdown(updated), state.galleryFolders)
      return {
        ...state,
        features: updated,
        rawMarkdown: serialized,
        saveStatus: 'saving',
      }
    }

    case 'ADD_CUSTOM_COLUMN': {
      const colKey = action.payload.key.toLowerCase().trim()
      const newConfig = {
        ...state.columnConfig,
        table: { ...state.columnConfig.table, [colKey]: true },
      }
      localStorage.setItem('mfm_columns', JSON.stringify(newConfig))
      return {
        ...state,
        columnConfig: newConfig,
      }
    }

    case 'DELETE_CUSTOM_COLUMN': {
      const colKey = action.payload.key.toLowerCase().trim()
      const updatedTree = deleteMetadataKeyFromAll(state.features, colKey)
      const serialized = serializeMarkdown(updatedTree)
      const updatedTableConfig = { ...state.columnConfig.table }
      delete updatedTableConfig[colKey]

      const newConfig = {
        ...state.columnConfig,
        table: updatedTableConfig,
      }
      localStorage.setItem('mfm_columns', JSON.stringify(newConfig))

      return {
        ...state,
        features: updatedTree,
        rawMarkdown: serialized,
        columnConfig: newConfig,
        saveStatus: 'saving',
      }
    }

    case 'SET_LANGUAGE':
      localStorage.setItem('mfm_lang', action.payload)
      return { ...state, language: action.payload }

    case 'SET_THEME':
      localStorage.setItem('mfm_theme', JSON.stringify(action.payload))
      return { ...state, theme: action.payload }

    case 'SET_CUSTOM_STATUSES':
      localStorage.setItem('mfm_statuses', JSON.stringify(action.payload))
      return { ...state, customStatuses: action.payload }

    case 'SET_COLUMN_CONFIG':
      localStorage.setItem('mfm_columns', JSON.stringify(action.payload))
      return { ...state, columnConfig: action.payload }

    case 'SET_AUTO_SAVE':
      localStorage.setItem('mfm_autosave', JSON.stringify(action.payload))
      return { ...state, autoSave: action.payload }

    case 'SET_SAVE_STATUS':
      return {
        ...state,
        saveStatus: action.payload.status,
        lastSavedAt: action.payload.time ?? state.lastSavedAt,
      }

    case 'REORDER_FEATURE_NODE': {
      const updated = reorderNodeInTree(state.features, action.payload.id, action.payload.direction)
      const serialized = combineMarkdown(serializeMarkdown(updated), state.galleryFolders)
      return {
        ...state,
        features: updated,
        rawMarkdown: serialized,
        saveStatus: 'saving',
      }
    }

    // ===================== GALLERY ACTIONS =====================

    case 'RELOAD_GALLERY_FROM_MARKDOWN': {
      const { rawMarkdown } = action.payload
      const { folders } = parseGallerySection(rawMarkdown)
      const nonGallery = extractNonGalleryContent(rawMarkdown)
      return {
        ...state,
        galleryFolders: folders,
        galleryNonGalleryContent: nonGallery,
      }
    }

    case 'SET_AUTO_SYNCED_ITEMS': {
      const { folderId, items } = action.payload
      
      const updateFolders = (folders: GalleryFolder[]): GalleryFolder[] => {
        return folders.map(f => {
          if (f.id === folderId) {
            const manualItems = f.items.filter(i => !i.isAutoSynced)
            return { ...f, items: [...manualItems, ...items] }
          }
          if (f.children && f.children.length > 0) {
            return { ...f, children: updateFolders(f.children) }
          }
          return f
        })
      }
      
      return { ...state, galleryFolders: updateFolders(state.galleryFolders) }
    }

    case 'SET_ACTIVE_GALLERY_FOLDER':
      return { ...state, activeGalleryFolderId: action.payload }

    case 'SET_GALLERY_VIEW_MODE':
      return { ...state, galleryViewMode: action.payload }

    case 'ADD_GALLERY_FOLDER': {
      const newFolderName = action.payload.name.trim()
      if (!newFolderName) return state
      const updatedFolders = addFolderAtPath(
        state.galleryFolders,
        action.payload.parentFolderPath,
        newFolderName
      )
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const newFolderId = generateGalleryFolderId(
        [...action.payload.parentFolderPath, newFolderName].join('/')
      )
      const hist = recordHistoryChange(state, newRaw, `Created folder: ${newFolderName}`)
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        activeGalleryFolderId: newFolderId,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'RENAME_GALLERY_FOLDER': {
      const { folderId, newName } = action.payload
      if (!newName.trim()) return state
      const updatedFolders = renameFolderById(state.galleryFolders, folderId, newName.trim())
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, `Renamed folder: ${newName.trim()}`)
      // Recompute the new folder ID from new path (deterministic: based on folder name path)
      let newActiveId = state.activeGalleryFolderId
      if (state.activeGalleryFolderId === folderId) {
        // Get old path and replace last segment with new name
        const oldPath = getFolderPath(state.galleryFolders, folderId) ?? []
        const newPath = [...oldPath.slice(0, -1), newName.trim()]
        newActiveId = generateGalleryFolderId(newPath.join('/'))
      }
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        activeGalleryFolderId: newActiveId,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'DELETE_GALLERY_FOLDER': {
      const updatedFolders = deleteFolderById(state.galleryFolders, action.payload.folderId)
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, 'Deleted folder')
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        activeGalleryFolderId:
          state.activeGalleryFolderId === action.payload.folderId
            ? null
            : state.activeGalleryFolderId,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'ADD_GALLERY_ITEM': {
      const { folderPath, src, caption } = action.payload
      const item: GalleryItem = {
        id: generateGalleryItemId(src, folderPath.join('/')),
        src,
        caption,
        type: detectMediaType(src),
      }
      const updatedFolders = addItemAtPath(state.galleryFolders, folderPath, item)
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, 'Added media item')
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    // ===================== FILE SYSTEM ACTIONS =====================
    case 'SET_DIRECTORY_HANDLES':
      return { ...state, directoryHandles: action.payload }
    case 'ADD_MISSING_LOCAL_PATH': {
      const newSet = new Set(state.missingLocalPaths)
      newSet.add(action.payload)
      return { ...state, missingLocalPaths: newSet }
    }
    case 'REMOVE_MISSING_LOCAL_PATH': {
      const newSet = new Set(state.missingLocalPaths)
      newSet.delete(action.payload)
      return { ...state, missingLocalPaths: newSet }
    }
    case 'CLEAR_MISSING_LOCAL_PATHS':
      return { ...state, missingLocalPaths: new Set() }

    case 'BATCH_ADD_GALLERY_ITEMS': {
      const { folderPath, items } = action.payload
      let currentFolders = state.galleryFolders
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx]
        const itemObj: GalleryItem = {
          id: generateGalleryItemId(it.src, folderPath.join('/'), idx),
          src: it.src,
          caption: it.caption,
          type: detectMediaType(it.src),
        }
        currentFolders = addItemAtPath(currentFolders, folderPath, itemObj)
      }
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, currentFolders)
      const hist = recordHistoryChange(state, newRaw, `Imported ${items.length} media items`)
      return {
        ...state,
        ...hist,
        galleryFolders: currentFolders,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'DELETE_GALLERY_ITEM': {
      const updatedFolders = deleteItemById(state.galleryFolders, action.payload.itemId)
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, 'Deleted media item')
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'RENAME_GALLERY_ITEM': {
      const { itemId, newCaption, newSrc } = action.payload
      const updatedFolders = renameItemInFolders(state.galleryFolders, itemId, newCaption, newSrc)
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, 'Renamed media item')
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'BATCH_DELETE_GALLERY_ITEMS': {
      const idsSet = new Set(action.payload.itemIds)
      const updatedFolders = deleteItemsByIds(state.galleryFolders, idsSet)
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, `Deleted ${action.payload.itemIds.length} media items`)
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'MOVE_GALLERY_ITEM': {
      const { itemId, targetFolderPath } = action.payload
      const updatedFolders = moveItemToFolder(state.galleryFolders, itemId, targetFolderPath)
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, 'Moved media item')
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'BATCH_MOVE_GALLERY_ITEMS': {
      const { itemIds, targetFolderPath } = action.payload
      const idsSet = new Set(itemIds)
      const updatedFolders = batchMoveItemsToFolder(state.galleryFolders, idsSet, targetFolderPath)
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, `Moved ${itemIds.length} media items`)
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'MOVE_GALLERY_FOLDER': {
      const { folderId, newParentFolderPath } = action.payload
      const updatedFolders = moveFolderToParent(state.galleryFolders, folderId, newParentFolderPath)
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, 'Moved gallery folder')
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'SET_FOLDER_SYNC_DIR': {
      const { folderPath, syncDir } = action.payload
      const updatedFolders = setFolderSyncDirAtPath(state.galleryFolders, folderPath, syncDir)
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, `Set sync directory "${syncDir}"`)
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    case 'TOGGLE_SIDEBAR': {
      const next = !state.isSidebarOpen
      localStorage.setItem('mfm_sidebar_open', JSON.stringify(next))
      return { ...state, isSidebarOpen: next }
    }

    case 'SET_SIDEBAR_OPEN': {
      localStorage.setItem('mfm_sidebar_open', JSON.stringify(action.payload))
      return { ...state, isSidebarOpen: action.payload }
    }

    case 'SET_MOBILE_SIDEBAR_OPEN':
      return { ...state, isMobileSidebarOpen: action.payload }

    case 'UNLINK_FOLDER_SYNC': {
      const updatedFolders = unlinkFolderSyncDir(state.galleryFolders, action.payload.folderId)
      const featuresText = state.features.length > 0
        ? serializeMarkdown(state.features)
        : state.galleryNonGalleryContent
      const newRaw = combineMarkdown(featuresText, updatedFolders)
      const hist = recordHistoryChange(state, newRaw, 'Unlinked folder sync')
      return {
        ...state,
        ...hist,
        galleryFolders: updatedFolders,
        rawMarkdown: newRaw,
        saveStatus: 'saving',
      }
    }

    default:
      return state
  }
}

const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
  saveNow: () => Promise<boolean>
  reconnectFileHandle: () => Promise<boolean>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { saveFile } = useFileOpen()
  const autoSaveTimeout = useRef<number | null>(null)

  // Listen to hashchange for unique URLs (including calendar)
  useEffect(() => {
    const onHashChange = () => {
      const view = getViewFromHash()
      if (view !== state.activeView) {
        dispatch({ type: 'SET_VIEW', payload: view })
      }
    }

    window.addEventListener('hashchange', onHashChange)
    if (!window.location.hash) {
      window.location.hash = `#/${state.activeView}`
    }

    return () => window.removeEventListener('hashchange', onHashChange)
  }, [state.activeView])

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-midnight', 'theme-light')
    document.documentElement.classList.add(`theme-${state.theme}`)
  }, [state.theme])

  // Global Undo / Redo Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (isInput) return
        if (e.shiftKey) {
          e.preventDefault()
          dispatch({ type: 'REDO' })
        } else {
          e.preventDefault()
          dispatch({ type: 'UNDO' })
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (isInput) return
        e.preventDefault()
        dispatch({ type: 'REDO' })
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [dispatch])

  // Reconnect File Handle — BACA FILE DISK TERBARU dari Code Editor sebagai Source of Truth (JANGAN MENIMPA!)
  const reconnectFileHandle = async (): Promise<boolean> => {
    try {
      if (!('showOpenFilePicker' in window)) return false
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'Markdown Files', accept: { 'text/markdown': ['.md', '.markdown', '.txt'] } }],
        multiple: false,
      })
      const file = await handle.getFile()
      const diskContent = await file.text()

      console.log('📖 [Reconnect]: Reading latest content from disk as Source of Truth...')
      // Synchronize Web App state WITH THE FRESH DISK CONTENT from Code Editor
      dispatch({
        type: 'SYNC_FROM_DISK',
        payload: {
          content: diskContent,
          fileName: file.name,
          handle,
        },
      })
      return true
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return false
      console.error('Failed to reconnect file handle:', err)
      return false
    }
  }

  const lastDiskWriteTime = useRef<number>(0)

  // Explicit Save function (Ctrl+S)
  const saveNow = async (): Promise<boolean> => {
    if (!state.rawMarkdown || !state.fileName) return false
    dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saving' } })
    const result = await saveFile(state.fileHandle, state.rawMarkdown, state.fileName)
    if (result.success) {
      lastDiskWriteTime.current = result.mtime || Date.now()
      dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saved', time: new Date() } })
      return true
    } else {
      dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'error' } })
      return false
    }
  }

  // Auto-Save Effect (Debounced 600ms)
  useEffect(() => {
    if (!state.autoSave || state.saveStatus !== 'saving' || !state.rawMarkdown) {
      return
    }

    if (autoSaveTimeout.current) {
      window.clearTimeout(autoSaveTimeout.current)
    }

    autoSaveTimeout.current = window.setTimeout(async () => {
      try {
        const result = await saveFile(state.fileHandle, state.rawMarkdown!, state.fileName || 'Fitur.md')
        if (result.success) {
          lastDiskWriteTime.current = result.mtime || Date.now()
          dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'saved', time: new Date() } })
        } else {
          dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'error' } })
        }
      } catch {
        dispatch({ type: 'SET_SAVE_STATUS', payload: { status: 'error' } })
      }
    }, 600)

    return () => {
      if (autoSaveTimeout.current) {
        window.clearTimeout(autoSaveTimeout.current)
      }
    }
  }, [state.rawMarkdown, state.saveStatus, state.autoSave, state.fileHandle, state.fileName, saveFile])

  // Sync Active Project Session to LocalStorage (Source of Truth persistence)
  useEffect(() => {
    if (state.fileName && state.rawMarkdown) {
      try {
        localStorage.setItem(MFM_ACTIVE_FILENAME_KEY, state.fileName)
        localStorage.setItem(MFM_ACTIVE_CONTENT_KEY, state.rawMarkdown)
        localStorage.removeItem(MFM_ACTIVE_CLOSED_KEY)
      } catch (err) {
        console.warn('Failed to persist active project session to localStorage:', err)
      }
    }
  }, [state.fileName, state.rawMarkdown])

  // 2-Way Sync: Listen to external disk file changes (e.g. from VS Code) instantly via API & Window Focus
  useEffect(() => {
    // DO NOT SYNC IF USER HAS CLOSED THE FILE OR NO ACTIVE FILE
    if (!state.fileName || !state.rawMarkdown) {
      return
    }

    let isChecking = false
    const activeFile = state.fileName

    const checkExternalDiskChanges = async () => {
      if (isChecking || state.saveStatus === 'saving' || !state.fileName) return
      try {
        isChecking = true
        // Check disk file state via dev server API
        const statRes = await fetch(`/api/file-stat?file=${encodeURIComponent(activeFile)}`)
        if (statRes.ok) {
          const statData = await statRes.json()
          if (statData.exists && statData.mtime > lastDiskWriteTime.current + 800) {
            const fileRes = await fetch(`/api/file?file=${encodeURIComponent(activeFile)}`)
            if (fileRes.ok) {
              const fileData = await fileRes.json()
              if (fileData.content && fileData.content !== state.rawMarkdown) {
                console.log('🔄 [2-Way Sync]: External edit detected from Code Editor, updating Web App...')
                lastDiskWriteTime.current = fileData.mtime
                dispatch({
                  type: 'SYNC_FROM_DISK',
                  payload: { content: fileData.content, fileName: fileData.fileName },
                })
              }
            }
          }
          return
        }

        // Fallback: Check via browser fileHandle if available
        if (state.fileHandle) {
          const file = await state.fileHandle.getFile()
          if (file.lastModified && file.lastModified > lastDiskWriteTime.current + 800) {
            const diskContent = await file.text()
            if (diskContent && diskContent !== state.rawMarkdown) {
              console.log('🔄 [2-Way Sync (Handle)]: External edit detected from Code Editor, updating Web App...')
              lastDiskWriteTime.current = file.lastModified
              dispatch({
                type: 'SYNC_FROM_DISK',
                payload: { content: diskContent, fileName: file.name },
              })
            }
          }
        }
      } catch {
        // Access or network error
      } finally {
        isChecking = false
      }
    }

    // Check on window focus and periodic background sync (every 1.5s)
    window.addEventListener('focus', checkExternalDiskChanges)
    const interval = window.setInterval(checkExternalDiskChanges, 1500)

    return () => {
      window.removeEventListener('focus', checkExternalDiskChanges)
      window.clearInterval(interval)
    }
  }, [state.fileName, state.rawMarkdown, state.saveStatus, state.fileHandle])

  return (
    <AppContext.Provider value={{ state, dispatch, saveNow, reconnectFileHandle }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppStore() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppStore must be used within AppProvider')
  return ctx
}
