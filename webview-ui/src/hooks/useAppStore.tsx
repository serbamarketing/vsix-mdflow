import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react'
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
} from '../models/feature'
import type { FeatureNode, StatusDefinition, ColumnVisibilityConfig } from '../models/feature'
import { parseMarkdown } from '../features/parser/markdownParser'
import { serializeMarkdown } from '../features/serializer/markdownSerializer'
import { vscode } from '../utils/vscode'

export interface AppFilters {
  status?: string
  priority?: string
}

export interface AppState {
  fileName: string | null
  features: FeatureNode[]
  selectedFeatureId: string | null
  isDetailOpen: boolean
  isNewFeatureModalOpen: boolean
  newFeatureParentId: string | null
  searchQuery: string
  filters: AppFilters
  customStatuses: StatusDefinition[]
  columnConfig: ColumnVisibilityConfig
  origin: 'external' | 'local'
}

export type AppAction =
  | { type: 'LOAD_CONTENT'; payload: { content: string; fileName: string } }
  | { type: 'SELECT_FEATURE'; payload: string | null }
  | { type: 'OPEN_DETAIL'; payload?: string | null }
  | { type: 'CLOSE_DETAIL' }
  | { type: 'OPEN_NEW_FEATURE_MODAL'; payload?: string | null }
  | { type: 'CLOSE_NEW_FEATURE_MODAL' }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER'; payload: AppFilters }
  | { type: 'UPDATE_FEATURE_NODE'; payload: { id: string; updates: Partial<FeatureNode> } }
  | { type: 'ADD_FEATURE_NODE'; payload: { parentId: string | null; node: FeatureNode } }
  | { type: 'DELETE_FEATURE_NODE'; payload: { id: string } }
  | { type: 'REPARENT_FEATURE_NODE'; payload: { sourceId: string; targetParentId: string | null } }
  | { type: 'BATCH_REPARENT_NODES'; payload: { sourceIds: string[]; targetParentId: string | null } }
  | { type: 'BATCH_DELETE_NODES'; payload: { ids: string[] } }
  | { type: 'BATCH_UPDATE_STATUS'; payload: { ids: string[]; status: string } }
  | { type: 'REORDER_FEATURE_NODE'; payload: { id: string; direction: 'up' | 'down' } }
  | { type: 'ADD_CUSTOM_COLUMN'; payload: { key: string } }
  | { type: 'DELETE_CUSTOM_COLUMN'; payload: { key: string } }
  | { type: 'SET_CUSTOM_STATUSES'; payload: StatusDefinition[] }
  | { type: 'SET_COLUMN_CONFIG'; payload: ColumnVisibilityConfig }

const initialState: AppState = {
  fileName: null,
  features: [],
  selectedFeatureId: null,
  isDetailOpen: false,
  isNewFeatureModalOpen: false,
  newFeatureParentId: null,
  searchQuery: '',
  filters: {},
  customStatuses: DEFAULT_STATUSES,
  columnConfig: DEFAULT_COLUMN_CONFIG,
  origin: 'external',
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'LOAD_CONTENT': {
      const features = parseMarkdown(action.payload.content)
      return {
        ...state,
        features,
        fileName: action.payload.fileName,
        origin: 'external',
      }
    }

    case 'SELECT_FEATURE':
      return {
        ...state,
        selectedFeatureId: action.payload,
        isDetailOpen: action.payload !== null,
      }

    case 'OPEN_DETAIL':
      return {
        ...state,
        selectedFeatureId: action.payload ?? state.selectedFeatureId,
        isDetailOpen: true,
      }

    case 'CLOSE_DETAIL':
      return {
        ...state,
        isDetailOpen: false,
        selectedFeatureId: null,
      }

    case 'OPEN_NEW_FEATURE_MODAL':
      return {
        ...state,
        isNewFeatureModalOpen: true,
        newFeatureParentId: action.payload ?? null,
      }

    case 'CLOSE_NEW_FEATURE_MODAL':
      return {
        ...state,
        isNewFeatureModalOpen: false,
        newFeatureParentId: null,
      }

    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload }

    case 'SET_FILTER':
      return { ...state, filters: action.payload }

    case 'UPDATE_FEATURE_NODE':
      return {
        ...state,
        features: updateNodeInTree(state.features, action.payload.id, action.payload.updates),
        origin: 'local',
      }

    case 'ADD_FEATURE_NODE':
      return {
        ...state,
        features: addChildNodeInTree(state.features, action.payload.parentId, action.payload.node),
        selectedFeatureId: action.payload.node.id,
        isDetailOpen: true,
        isNewFeatureModalOpen: false,
        newFeatureParentId: null,
        origin: 'local',
      }

    case 'DELETE_FEATURE_NODE':
      return {
        ...state,
        features: deleteNodeInTree(state.features, action.payload.id),
        selectedFeatureId: state.selectedFeatureId === action.payload.id ? null : state.selectedFeatureId,
        isDetailOpen: state.selectedFeatureId === action.payload.id ? false : state.isDetailOpen,
        origin: 'local',
      }

    case 'REPARENT_FEATURE_NODE':
      return {
        ...state,
        features: moveNodeToParentInTree(state.features, action.payload.sourceId, action.payload.targetParentId),
        origin: 'local',
      }

    case 'BATCH_REPARENT_NODES':
      return {
        ...state,
        features: moveMultipleNodesToParentInTree(state.features, action.payload.sourceIds, action.payload.targetParentId),
        origin: 'local',
      }

    case 'BATCH_DELETE_NODES': {
      let currentTree = state.features
      for (const id of action.payload.ids) {
        currentTree = deleteNodeInTree(currentTree, id)
      }
      return { ...state, features: currentTree, origin: 'local' }
    }

    case 'BATCH_UPDATE_STATUS': {
      let currentTree = state.features
      for (const id of action.payload.ids) {
        const existing = currentTree.find((f) => f.id === id)
        currentTree = updateNodeInTree(currentTree, id, {
          metadata: { ...existing?.metadata, status: action.payload.status },
        })
      }
      return { ...state, features: currentTree, origin: 'local' }
    }

    case 'REORDER_FEATURE_NODE':
      return {
        ...state,
        features: reorderNodeInTree(state.features, action.payload.id, action.payload.direction),
        origin: 'local',
      }

    case 'ADD_CUSTOM_COLUMN': {
      const colKey = action.payload.key.toLowerCase().trim()
      return {
        ...state,
        columnConfig: { ...state.columnConfig, table: { ...state.columnConfig.table, [colKey]: true } },
      }
    }

    case 'DELETE_CUSTOM_COLUMN': {
      const colKey = action.payload.key.toLowerCase().trim()
      const updatedTree = deleteMetadataKeyFromAll(state.features, colKey)
      const updatedTableConfig = { ...state.columnConfig.table }
      delete updatedTableConfig[colKey]
      return {
        ...state,
        features: updatedTree,
        columnConfig: { ...state.columnConfig, table: updatedTableConfig },
        origin: 'local',
      }
    }

    case 'SET_CUSTOM_STATUSES':
      return { ...state, customStatuses: action.payload }

    case 'SET_COLUMN_CONFIG':
      return { ...state, columnConfig: action.payload }

    default:
      return state
  }
}

interface AppStoreContextValue {
  state: AppState
  dispatch: React.Dispatch<AppAction>
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    if (state.origin !== 'local') return
    const text = serializeMarkdown(state.features)
    vscode.postMessage({ command: 'save', text })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.features])

  return <AppStoreContext.Provider value={{ state, dispatch }}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) {
    throw new Error('useAppStore must be used within an AppStoreProvider')
  }
  return ctx
}
