import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Trash2, Plus, Check, X, Pencil, FolderSymlink, Home, Unlink } from 'lucide-react'
import type { GalleryFolder } from '@/models/gallery'
import { flattenFolders } from '@/models/gallery'
import { useAppStore } from '@/hooks/useAppStore'
import { translations } from '@/data/translations'

interface GalleryFolderTreeProps {
  folders: GalleryFolder[]
  activeFolderId: string | null
}

interface MoveFolderModalProps {
  folder: GalleryFolder
  currentPath: string[]
  allFolders: GalleryFolder[]
  onClose: () => void
}

function MoveFolderModal({ folder, currentPath, allFolders, onClose }: MoveFolderModalProps) {
  const { state, dispatch } = useAppStore()
  const t = translations[state.language].gallery
  const [targetParentPath, setTargetParentPath] = useState<string[]>([])
  const [isRootSelected, setIsRootSelected] = useState(false)

  const flatList = flattenFolders(allFolders)
  // Filter out self and any descendants to prevent cyclic parenting
  const currentPathPrefix = currentPath.join('/')
  const validParents = flatList.filter((f) => {
    const pStr = f.pathParts.join('/')
    return pStr !== currentPathPrefix && !pStr.startsWith(currentPathPrefix + '/')
  })

  function handleConfirm() {
    dispatch({
      type: 'MOVE_GALLERY_FOLDER',
      payload: {
        folderId: folder.id,
        newParentFolderPath: isRootSelected ? [] : targetParentPath,
      },
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 border font-display"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-brand-glow)' }}>
              <FolderSymlink size={15} style={{ color: 'var(--color-brand)' }} />
            </div>
            <div>
              <h4 className="font-bold text-xs" style={{ color: 'var(--color-text)' }}>
                {t.moveFolderTitle}
              </h4>
              <p className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
                {t.moveFolderSubtitle}: <span className="text-emerald-400 font-bold">"{folder.name}"</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg cursor-pointer transition-colors" style={{ color: 'var(--color-text-dim)' }}>
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-[11px] font-bold block" style={{ color: 'var(--color-text-muted)' }}>
            {t.folderLocation}:
          </label>

          {/* Root Folder Option */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs cursor-pointer transition-all"
            style={{
              background: isRootSelected ? 'var(--color-brand-glow)' : 'var(--color-surface-2)',
              borderColor: isRootSelected ? 'var(--color-brand)' : 'var(--color-border)',
              color: isRootSelected ? 'var(--color-brand)' : 'var(--color-text)',
            }}
            onClick={() => {
              setIsRootSelected(true)
              setTargetParentPath([])
            }}
          >
            <div className="flex items-center gap-2 font-bold">
              <Home size={14} />
              <span>{t.makeRootFolder}</span>
            </div>
            {isRootSelected && <Check size={14} className="text-emerald-400" />}
          </button>

          {/* Parent folders list */}
          {validParents.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {validParents.map(({ folder: parentF, pathParts, depth }) => {
                const pathStr = pathParts.join('/')
                const isSelected = !isRootSelected && targetParentPath.join('/') === pathStr

                return (
                  <button
                    key={parentF.id}
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all"
                    style={{
                      paddingLeft: `${10 + depth * 12}px`,
                      background: isSelected ? 'var(--color-brand-glow)' : 'var(--color-surface-2)',
                      borderColor: isSelected ? 'var(--color-brand)' : 'var(--color-border)',
                      color: isSelected ? 'var(--color-brand)' : 'var(--color-text)',
                    }}
                    onClick={() => {
                      setIsRootSelected(false)
                      setTargetParentPath(pathParts)
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-slate-500 font-mono">{depth > 0 ? '└' : '📁'}</span>
                      <span className={`truncate ${isSelected ? 'font-bold' : ''}`}>{parentF.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono">({pathStr})</span>
                    </div>
                    {isSelected && <Check size={14} className="text-emerald-400 shrink-0 ml-1" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-dim)' }}
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-md"
            style={{ background: 'var(--color-brand)', color: '#050c14' }}
            onClick={handleConfirm}
          >
            Pindahkan Folder
          </button>
        </div>
      </div>
    </div>
  )
}

interface FolderNodeProps {
  folder: GalleryFolder
  depth: number
  currentPath: string[]
  activeFolderId: string | null
  allFolders: GalleryFolder[]
  addingFolderParentPath: string[] | null
  onConfirmAddSub: (name: string) => void
  onCancelAddSub: () => void
  onAddSub: (parentPath: string[]) => void
  onDelete: (folderId: string) => void
  onSelect: (folderId: string) => void
  t: typeof translations.id.gallery
}

function FolderNode({
  folder,
  depth,
  currentPath,
  activeFolderId,
  allFolders,
  addingFolderParentPath,
  onConfirmAddSub,
  onCancelAddSub,
  onAddSub,
  onDelete,
  onSelect,
  t,
}: FolderNodeProps) {
  const { dispatch } = useAppStore()
  const [open, setOpen] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(folder.name)

  const [isMoving, setIsMoving] = useState(false)

  const isActive = activeFolderId === folder.id
  const hasChildren = folder.children.length > 0
  const totalItems = countAllItems(folder)
  const isAddingUnderMe = addingFolderParentPath !== null && addingFolderParentPath.join('/') === currentPath.join('/')

  function handleSelect() {
    onSelect(folder.id)
  }

  function handleAddSub(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen(true)
    onAddSub(currentPath)
  }

  function handleStartRename(e: React.MouseEvent) {
    e.stopPropagation()
    setEditName(folder.name)
    setIsEditing(true)
  }

  function handleConfirmRename() {
    if (editName.trim() && editName.trim() !== folder.name) {
      dispatch({
        type: 'RENAME_GALLERY_FOLDER',
        payload: { folderId: folder.id, newName: editName.trim() },
      })
    }
    setIsEditing(false)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete(folder.id)
  }

  return (
    <div>
      {isMoving && (
        <MoveFolderModal
          folder={folder}
          currentPath={currentPath}
          allFolders={allFolders}
          onClose={() => setIsMoving(false)}
        />
      )}

      {isEditing ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleConfirmRename() }}
          className="flex items-center gap-1.5 px-2.5 py-1 border rounded-xl my-1 mx-1 overflow-hidden shadow-md"
          style={{
            background: 'var(--color-surface-2)',
            borderColor: 'var(--color-brand)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Folder size={13} style={{ color: 'var(--color-brand)' }} className="shrink-0" />
          <input
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold outline-none"
            style={{ color: 'var(--color-text)' }}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleConfirmRename()
              }
              if (e.key === 'Escape') setIsEditing(false)
            }}
          />
          <button
            type="button"
            className="shrink-0 p-1 rounded-md cursor-pointer transition-transform hover:scale-105"
            style={{ background: 'var(--color-brand)', color: '#050c14' }}
            onClick={(e) => { e.preventDefault(); handleConfirmRename() }}
            title="Simpan (Enter)"
          >
            <Check size={11} />
          </button>
          <button
            type="button"
            className="shrink-0 p-1 rounded-md cursor-pointer transition-transform hover:scale-105"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-dim)' }}
            onClick={(e) => { e.preventDefault(); setIsEditing(false) }}
            title="Batal (Esc)"
          >
            <X size={11} />
          </button>
        </form>
      ) : (
        <div
          className="group flex items-center justify-between px-2 py-1.5 rounded-xl cursor-pointer transition-all duration-150 select-none my-0.5"
          style={{
            background: isActive ? 'var(--color-surface-2)' : 'transparent',
            border: isActive ? '1px solid var(--color-brand)' : '1px solid transparent',
            color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
          }}
          onClick={handleSelect}
        >
          {/* Left: Collapse toggle + Folder icon + Name */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Collapse toggle */}
            <button
              type="button"
              className="shrink-0 p-0.5 rounded transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setOpen((v) => !v)
              }}
              style={{ opacity: hasChildren || isAddingUnderMe ? 1 : 0, pointerEvents: hasChildren || isAddingUnderMe ? 'auto' : 'none' }}
            >
              {open
                ? <ChevronDown size={12} style={{ color: 'var(--color-text-dim)' }} />
                : <ChevronRight size={12} style={{ color: 'var(--color-text-dim)' }} />
              }
            </button>

            {/* Folder icon */}
            {isActive || open
              ? <FolderOpen size={14} style={{ color: 'var(--color-brand)', flexShrink: 0 }} />
              : <Folder size={14} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />
            }

            {/* Folder Name */}
            <span className={`text-[11px] truncate font-display ${isActive ? 'font-bold' : 'font-medium'}`}>
              {folder.name}
            </span>
          </div>

          {/* Right: Actions on hover + Right-aligned Count Badge */}
          <div className="flex items-center gap-1 shrink-0 ml-auto pl-1">
            {/* Actions (visible on group hover) */}
            <div className="hidden group-hover:flex items-center gap-0.5">
              {folder.syncDir && (
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-amber-500/20 transition-colors"
                  title={`${t.unlinkSync} (dir:${folder.syncDir})`}
                  onClick={(e) => {
                    e.stopPropagation()
                    const confirmMsg = t.unlinkSyncConfirm
                      .replace('{folder}', folder.name)
                      .replace('{dir}', folder.syncDir || '')
                    if (confirm(confirmMsg)) {
                      dispatch({
                        type: 'UNLINK_FOLDER_SYNC',
                        payload: { folderId: folder.id },
                      })
                    }
                  }}
                >
                  <Unlink size={11} className="text-amber-400" />
                </button>
              )}
              <button
                type="button"
                className="p-0.5 rounded hover:bg-white/10 transition-colors"
                title={t.renameFolder}
                onClick={handleStartRename}
              >
                <Pencil size={11} style={{ color: 'var(--color-text-dim)' }} />
              </button>
              <button
                type="button"
                className="p-0.5 rounded hover:bg-sky-500/20 transition-colors"
                title={t.moveFolder}
                onClick={(e) => { e.stopPropagation(); setIsMoving(true) }}
              >
                <FolderSymlink size={11} className="text-sky-400" />
              </button>
              <button
                type="button"
                className="p-0.5 rounded hover:bg-green-500/20 transition-colors"
                title={t.addSubFolder}
                onClick={handleAddSub}
              >
                <Plus size={11} style={{ color: 'var(--color-brand)' }} />
              </button>
              <button
                type="button"
                className="p-0.5 rounded hover:bg-red-500/20 transition-colors"
                title={t.deleteFolder}
                onClick={handleDelete}
              >
                <Trash2 size={11} className="text-red-400" />
              </button>
            </div>

            {/* Rata Kanan Badge Count */}
            {totalItems > 0 && (
              <span
                className="min-w-[18px] h-4 px-1.5 flex items-center justify-center rounded-full text-[9px] font-mono font-bold shrink-0 shadow-sm"
                style={{
                  background: isActive ? 'var(--color-brand)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#050c14' : 'var(--color-brand)',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {totalItems}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Children & Inline Add with real hierarchical tree guide lines */}
      {open && (
        <div className="relative pl-3.5 ml-2.5 border-l-2 border-slate-700/40 space-y-0.5 my-0.5">
          {folder.children.map((child) => (
            <div key={child.id} className="relative">
              {/* Branch connecting horizontal line */}
              <div className="absolute -left-3.5 top-3.5 w-3 h-[2px] bg-slate-700/40 pointer-events-none" />
              <FolderNode
                folder={child}
                depth={depth + 1}
                currentPath={[...currentPath, child.name]}
                activeFolderId={activeFolderId}
                allFolders={allFolders}
                addingFolderParentPath={addingFolderParentPath}
                onConfirmAddSub={onConfirmAddSub}
                onCancelAddSub={onCancelAddSub}
                onAddSub={onAddSub}
                onDelete={onDelete}
                onSelect={onSelect}
                t={t}
              />
            </div>
          ))}

          {/* Inline add subfolder under this node */}
          {isAddingUnderMe && (
            <div className="relative">
              <div className="absolute -left-3.5 top-3.5 w-3 h-[2px] bg-emerald-500/50 pointer-events-none" />
              <AddFolderInline
                parentPath={currentPath}
                onConfirm={onConfirmAddSub}
                onCancel={onCancelAddSub}
                t={t}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function countAllItems(folder: GalleryFolder): number {
  return folder.items.length + folder.children.reduce((acc, c) => acc + countAllItems(c), 0)
}

interface AddFolderInlineProps {
  parentPath: string[]
  onConfirm: (name: string) => void
  onCancel: () => void
  t: typeof translations.id.gallery
}

function AddFolderInline({ parentPath, onConfirm, onCancel, t }: AddFolderInlineProps) {
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(name)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-1.5 px-2.5 py-1.5 border rounded-xl my-1 mx-1.5 overflow-hidden shadow-md"
      style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-brand)' }}
    >
      <Folder size={12} style={{ color: 'var(--color-brand)' }} className="shrink-0" />
      <input
        autoFocus
        className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold outline-none"
        style={{ color: 'var(--color-text)' }}
        placeholder={parentPath.length > 0 ? `${t.folderSubNamePlaceholder} "${parentPath.at(-1)}"` : t.folderNamePlaceholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onConfirm(name)
          }
          if (e.key === 'Escape') onCancel()
        }}
      />
      <button
        type="button"
        className="shrink-0 p-1 rounded-md cursor-pointer transition-transform hover:scale-105"
        style={{ background: 'var(--color-brand)', color: '#050c14' }}
        onClick={(e) => { e.preventDefault(); onConfirm(name) }}
        title="Simpan (Enter)"
      >
        <Check size={11} />
      </button>
      <button
        type="button"
        className="shrink-0 p-1 rounded-md cursor-pointer transition-transform hover:scale-105"
        style={{ background: 'var(--color-surface)', color: 'var(--color-text-dim)' }}
        onClick={(e) => { e.preventDefault(); onCancel() }}
        title="Batal (Esc)"
      >
        <X size={11} />
      </button>
    </form>
  )
}

export function GalleryFolderTree({ folders, activeFolderId }: GalleryFolderTreeProps) {
  const { state, dispatch } = useAppStore()
  const t = translations[state.language].gallery
  const [addingFolderParentPath, setAddingFolderParentPath] = useState<string[] | null>(null)

  function handleSelect(folderId: string) {
    dispatch({ type: 'SET_ACTIVE_GALLERY_FOLDER', payload: folderId })
  }

  function handleAddSub(parentPath: string[]) {
    setAddingFolderParentPath(parentPath)
  }

  function handleAddRootFolder() {
    setAddingFolderParentPath([])
  }

  function handleConfirmAdd(name: string) {
    if (!name.trim() || addingFolderParentPath === null) {
      setAddingFolderParentPath(null)
      return
    }
    dispatch({
      type: 'ADD_GALLERY_FOLDER',
      payload: { parentFolderPath: addingFolderParentPath, name: name.trim() },
    })
    setAddingFolderParentPath(null)
  }

  function handleDelete(folderId: string) {
    if (!confirm(t.confirmDeleteFolder)) return
    dispatch({ type: 'DELETE_GALLERY_FOLDER', payload: { folderId } })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Folder tree header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-display">
          {t.foldersHeader}
        </span>
        <button
          type="button"
          className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
          style={{ background: 'var(--color-brand-glow)', color: 'var(--color-brand)' }}
          title={t.addRootFolder}
          onClick={handleAddRootFolder}
        >
          <Plus size={11} /> {t.addFolderBtn}
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5">
        {folders.length === 0 && addingFolderParentPath === null && (
          <div className="px-3 py-4 text-center">
            <Folder size={24} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--color-text-dim)' }} />
            <p className="text-[10px]" style={{ color: 'var(--color-text-dim)' }}>
              {t.emptyFolderTreeNotice}
            </p>
          </div>
        )}

        {/* Add root folder inline */}
        {addingFolderParentPath !== null && addingFolderParentPath.length === 0 && (
          <AddFolderInline
            parentPath={[]}
            onConfirm={handleConfirmAdd}
            onCancel={() => setAddingFolderParentPath(null)}
            t={t}
          />
        )}

        {folders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            depth={0}
            currentPath={[folder.name]}
            activeFolderId={activeFolderId}
            allFolders={folders}
            addingFolderParentPath={addingFolderParentPath}
            onConfirmAddSub={handleConfirmAdd}
            onCancelAddSub={() => setAddingFolderParentPath(null)}
            onAddSub={handleAddSub}
            onDelete={handleDelete}
            onSelect={handleSelect}
            t={t}
          />
        ))}
      </div>
    </div>
  )
}
