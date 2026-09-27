// Gallery Model — MDFlow Gallery feature
// Stores UI design references (images/videos) in .md files

export interface GalleryItem {
  id: string
  src: string
  caption?: string
  type: 'image' | 'video' | 'unknown'
  isAutoSynced?: boolean
}

export interface GalleryFolder {
  id: string
  name: string
  items: GalleryItem[]
  children: GalleryFolder[]
  syncDir?: string
}

const IMAGE_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'avif', 'ico',
]

const VIDEO_EXTENSIONS = [
  'mp4', 'webm', 'ogg', 'ogv', 'mov', 'avi', 'mkv', 'm4v', 'flv',
]

export function detectMediaType(src: string): 'image' | 'video' | 'unknown' {
  if (!src) return 'unknown'
  const cleaned = src.split('?')[0].split('#')[0].toLowerCase()
  const ext = cleaned.split('.').pop() ?? ''

  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'

  // Check URL patterns for known video hosts
  if (
    cleaned.includes('youtube.com') ||
    cleaned.includes('youtu.be') ||
    cleaned.includes('vimeo.com') ||
    cleaned.includes('.mp4') ||
    cleaned.includes('.webm') ||
    cleaned.includes('.mov')
  ) {
    return 'video'
  }

  // If web URL (http://, https://, data:, blob:) and not a video, default to image
  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:') ||
    src.startsWith('blob:')
  ) {
    return 'image'
  }

  return 'unknown'
}

export function getAutoSyncedItemsForDir(syncDir: string): GalleryItem[] {
  if (!syncDir) return []
  const normDir = syncDir.replace(/\\/g, '/').replace(/^\//, '').replace(/\/$/, '').toLowerCase()

  const items: GalleryItem[] = []
  const seenSrc = new Set<string>()
  const keys: string[] = []

  for (const rawKey of keys) {
    // rawKey looks like "/docs/Screenshot_10.png" or "/docs/ref/sub.png"
    const cleanKey = rawKey.startsWith('/') ? rawKey.slice(1) : rawKey
    const cleanLower = cleanKey.toLowerCase()

    const isMatched =
      normDir === '.' ||
      normDir === '' ||
      cleanLower.startsWith(`${normDir}/`) ||
      cleanLower === normDir ||
      cleanLower.includes(`/${normDir}/`) ||
      cleanLower.startsWith(`docs/${normDir}/`) ||
      cleanLower.endsWith(`/${normDir}`)

    if (isMatched) {
      if (seenSrc.has(cleanKey)) continue
      seenSrc.add(cleanKey)

      const fileName = cleanKey.split('/').pop() || cleanKey
      const caption = fileName.replace(/\.[^/.]+$/, '')
      const type = detectMediaType(cleanKey)

      if (type === 'image' || type === 'video') {
        items.push({
          id: `auto-${cleanKey.replace(/[^a-z0-9]/gi, '-')}`,
          src: cleanKey,
          caption,
          type,
          isAutoSynced: true,
        })
      }
    }
  }

  return items
}

/**
 * Resolve local/relative media src to browser accessible URLs or Vite /@fs/ URLs
 * Returns a list of candidate URLs to try in sequence if image fails to load.
 */
export function resolveMediaSrcCandidates(src: string): string[] {
  if (!src) return ['']
  let trimmed = src.trim()

  // Remove surrounding quotes if present
  trimmed = trimmed.replace(/^["']|["']$/g, '').trim()

  // Web URLs / Data URI / Blob URI returned directly
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return [trimmed]
  }

  // Normalize: remove file:// prefix and replace backslashes with forward slashes
  let clean = trimmed.replace(/^file:\/\/\/?/i, '').replace(/\\/g, '/')
  clean = clean.replace(/^\.\//, '')

  const seen = new Set<string>()
  const candidates: string[] = []

  function addCandidate(url: string) {
    if (!url) return
    if (!seen.has(url)) {
      seen.add(url)
      candidates.push(url)
    }
    // Also try URI-encoded format for spaces and special symbols
    const encoded = encodeURI(url)
    if (!seen.has(encoded)) {
      seen.add(encoded)
      candidates.push(encoded)
    }
  }

  const ROOT = 'D:/Network-Agit/Roblox/2026/5-App/Markdown-Project'
  const rootLower = 'd:/Network-Agit/Roblox/2026/5-App/Markdown-Project'

  // Primary: Local media streaming API
  addCandidate(`/api/media?file=${encodeURIComponent(clean)}`)

  // Direct Vite FS URL
  if (clean.startsWith('/@fs/')) {
    addCandidate(clean)
  }

  // Absolute Windows path (e.g. D:/... or C:/...)
  if (/^[a-zA-Z]:\//.test(clean)) {
    const driveLower = clean.charAt(0).toLowerCase() + clean.slice(1)
    const driveUpper = clean.charAt(0).toUpperCase() + clean.slice(1)
    addCandidate(`/@fs/${driveUpper}`)
    addCandidate(`/@fs/${driveLower}`)
    addCandidate(`file:///${driveUpper}`)
    addCandidate(`file:///${driveLower}`)
    addCandidate(clean)
  }

  // Absolute Unix path
  if (clean.startsWith('/')) {
    addCandidate(`/@fs${clean}`)
    addCandidate(clean)
  }

  // Relative path resolution strategies:
  // 1. Direct workspace root + relative path
  addCandidate(`/@fs/${ROOT}/${clean}`)
  addCandidate(`/@fs/${rootLower}/${clean}`)

  // 2. docs/ folder relative path resolution
  if (!clean.toLowerCase().startsWith('docs/')) {
    addCandidate(`/@fs/${ROOT}/docs/${clean}`)
    addCandidate(`/@fs/${rootLower}/docs/${clean}`)
  } else {
    const withoutDocs = clean.slice(5)
    addCandidate(`/@fs/${ROOT}/docs/${withoutDocs}`)
    addCandidate(`/@fs/${ROOT}/${withoutDocs}`)
  }

  // 3. Extract bare filename
  const filenameOnly = clean.split('/').pop() || clean

  // 4. docs/ with bare filename
  addCandidate(`/@fs/${ROOT}/docs/${filenameOnly}`)
  addCandidate(`/@fs/${rootLower}/docs/${filenameOnly}`)
  addCandidate(`/@fs/${ROOT}/docs/Thumbnail/${filenameOnly}`)
  addCandidate(`/@fs/${ROOT}/docs/SS/${filenameOnly}`)

  // 5. Public folder
  addCandidate(`/@fs/${ROOT}/public/${clean}`)
  addCandidate(`/@fs/${ROOT}/public/${filenameOnly}`)

  // 6. Web relative fallback
  addCandidate(`/${clean}`)
  addCandidate(`/${filenameOnly}`)
  addCandidate(clean)

  return candidates
}


export function generateGalleryItemId(src: string, folderPath?: string, index?: number): string {
  const cleanSrc = src
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-') || 'item'
  const prefix = folderPath
    ? folderPath.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-'
    : ''
  const idxSuffix = index !== undefined ? `-${index}` : ''
  return `gi-${prefix}${cleanSrc}${idxSuffix}`
}

export function generateGalleryFolderId(pathOrName: string): string {
  const slug = pathOrName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-') || 'folder'
  return `gf-${slug}`
}

/**
 * Get all items from a folder and all its subfolders recursively
 */
export function getRecursiveItems(folder: GalleryFolder): GalleryItem[] {
  const result = [...folder.items]
  for (const child of folder.children) {
    result.push(...getRecursiveItems(child))
  }
  return result
}

/**
 * Find a folder by path parts (array of folder names)
 */
export function findFolderByPath(
  folders: GalleryFolder[],
  pathParts: string[]
): GalleryFolder | null {
  if (pathParts.length === 0) return null
  const [first, ...rest] = pathParts
  const folder = folders.find((f) => f.name === first)
  if (!folder) return null
  if (rest.length === 0) return folder
  return findFolderByPath(folder.children, rest)
}

/**
 * Find folder by ID recursively
 */
export function findFolderById(
  folders: GalleryFolder[],
  id: string
): GalleryFolder | null {
  for (const folder of folders) {
    if (folder.id === id) return folder
    const found = findFolderById(folder.children, id)
    if (found) return found
  }
  return null
}

/**
 * Get full path parts for a folder by its ID
 */
export function getFolderPath(
  folders: GalleryFolder[],
  targetId: string,
  currentPath: string[] = []
): string[] | null {
  for (const folder of folders) {
    const newPath = [...currentPath, folder.name]
    if (folder.id === targetId) return newPath
    const found = getFolderPath(folder.children, targetId, newPath)
    if (found) return found
  }
  return null
}

/**
 * Flatten all folders with their full paths for display
 */
export interface FlatGalleryFolder {
  folder: GalleryFolder
  pathParts: string[]
  depth: number
}

export function flattenFolders(
  folders: GalleryFolder[],
  pathParts: string[] = [],
  depth: number = 0
): FlatGalleryFolder[] {
  const result: FlatGalleryFolder[] = []
  for (const folder of folders) {
    const newPath = [...pathParts, folder.name]
    result.push({ folder, pathParts: newPath, depth })
    result.push(...flattenFolders(folder.children, newPath, depth + 1))
  }
  return result
}

/**
 * Add a folder at given path, creating intermediate folders if needed
 */
export function addFolderAtPath(
  folders: GalleryFolder[],
  pathParts: string[],
  newFolderName: string,
  currentPath: string[] = []
): GalleryFolder[] {
  if (pathParts.length === 0) {
    const exists = folders.find((f) => f.name.toLowerCase() === newFolderName.toLowerCase())
    if (exists) return folders
    const fullSlug = [...currentPath, newFolderName].join('/')
    return [
      ...folders,
      {
        id: generateGalleryFolderId(fullSlug),
        name: newFolderName,
        items: [],
        children: [],
      },
    ]
  }

  const [first, ...rest] = pathParts
  const nextCurrentPath = [...currentPath, first]
  let found = false

  const updated = folders.map((f) => {
    if (f.name.toLowerCase() === first.toLowerCase()) {
      found = true
      return {
        ...f,
        children: addFolderAtPath(f.children, rest, newFolderName, nextCurrentPath),
      }
    }
    return f
  })

  if (!found) {
    const intermediateSlug = nextCurrentPath.join('/')
    const intermediateFolder: GalleryFolder = {
      id: generateGalleryFolderId(intermediateSlug),
      name: first,
      items: [],
      children: addFolderAtPath([], rest, newFolderName, nextCurrentPath),
    }
    return [...folders, intermediateFolder]
  }

  return updated
}

/**
 * Add item to folder at given path
 */
export function addItemAtPath(
  folders: GalleryFolder[],
  pathParts: string[],
  item: GalleryItem,
  currentPath: string[] = []
): GalleryFolder[] {
  if (pathParts.length === 0) return folders

  const [first, ...rest] = pathParts
  const nextCurrentPath = [...currentPath, first]
  let found = false

  const updated = folders.map((f) => {
    if (f.name.toLowerCase() === first.toLowerCase()) {
      found = true
      if (rest.length === 0) {
        const existingIdx = f.items.findIndex((i) => i.id === item.id || i.src === item.src)
        if (existingIdx >= 0) {
          const newItems = [...f.items]
          newItems[existingIdx] = item
          return { ...f, items: newItems }
        }
        return { ...f, items: [...f.items, item] }
      }
      return { ...f, children: addItemAtPath(f.children, rest, item, nextCurrentPath) }
    }
    return f
  })

  if (!found) {
    const fullSlug = nextCurrentPath.join('/')
    const newFolder: GalleryFolder = {
      id: generateGalleryFolderId(fullSlug),
      name: first,
      items: [],
      children: [],
    }
    if (rest.length === 0) {
      newFolder.items.push(item)
    } else {
      newFolder.children = addItemAtPath([], rest, item, nextCurrentPath)
    }
    return [...folders, newFolder]
  }

  return updated
}

export function setFolderSyncDirAtPath(
  folders: GalleryFolder[],
  pathParts: string[],
  syncDir: string,
  currentPath: string[] = []
): GalleryFolder[] {
  if (pathParts.length === 0) return folders

  const [first, ...rest] = pathParts
  const nextCurrentPath = [...currentPath, first]
  let found = false

  const updated = folders.map((f) => {
    if (f.name.toLowerCase() === first.toLowerCase()) {
      found = true
      if (rest.length === 0) {
        const syncedItems = getAutoSyncedItemsForDir(syncDir)
        return { ...f, syncDir, items: syncedItems }
      }
      return { ...f, children: setFolderSyncDirAtPath(f.children, rest, syncDir, nextCurrentPath) }
    }
    return f
  })

  if (!found) {
    const fullSlug = nextCurrentPath.join('/')
    const syncedItems = getAutoSyncedItemsForDir(syncDir)
    const newFolder: GalleryFolder = {
      id: generateGalleryFolderId(fullSlug),
      name: first,
      items: rest.length === 0 ? syncedItems : [],
      children: rest.length > 0 ? setFolderSyncDirAtPath([], rest, syncDir, nextCurrentPath) : [],
      syncDir: rest.length === 0 ? syncDir : undefined,
    }
    return [...folders, newFolder]
  }

  return updated
}

export function unlinkFolderSyncDir(
  folders: GalleryFolder[],
  folderId: string
): GalleryFolder[] {
  return folders.map((f) => {
    if (f.id === folderId) {
      return {
        ...f,
        syncDir: undefined,
        items: f.items.filter((it) => !it.isAutoSynced),
      }
    }
    return {
      ...f,
      children: unlinkFolderSyncDir(f.children, folderId),
    }
  })
}

/**
 * Rename item by ID in all folders (updates caption and optionally src)
 */
export function renameItemInFolders(
  folders: GalleryFolder[],
  itemId: string,
  newCaption: string,
  newSrc?: string
): GalleryFolder[] {
  return folders.map((f) => ({
    ...f,
    items: f.items.map((it) => {
      if (it.id === itemId) {
        const finalSrc = newSrc ? newSrc.trim() : it.src
        return {
          ...it,
          caption: newCaption.trim() || undefined,
          src: finalSrc,
          type: detectMediaType(finalSrc),
        }
      }
      return it
    }),
    children: renameItemInFolders(f.children, itemId, newCaption, newSrc),
  }))
}

/**
 * Delete item by ID from all folders
 */
export function deleteItemById(
  folders: GalleryFolder[],
  itemId: string
): GalleryFolder[] {
  return folders.map((f) => ({
    ...f,
    items: f.items.filter((i) => i.id !== itemId),
    children: deleteItemById(f.children, itemId),
  }))
}

/**
 * Delete folder by ID recursively
 */
export function deleteFolderById(
  folders: GalleryFolder[],
  folderId: string
): GalleryFolder[] {
  return folders
    .filter((f) => f.id !== folderId)
    .map((f) => ({
      ...f,
      children: deleteFolderById(f.children, folderId),
    }))
}

/**
 * Rename folder by ID and re-index all child IDs
 */
export function renameFolderById(
  folders: GalleryFolder[],
  folderId: string,
  newName: string,
  parentPath: string[] = []
): GalleryFolder[] {
  const trimmed = newName.trim()
  if (!trimmed) return folders

  return folders.map((f) => {
    if (f.id === folderId) {
      const newPath = [...parentPath, trimmed]
      const newSlug = newPath.join('/')

      function reIdChildren(children: GalleryFolder[], currentParentPath: string[]): GalleryFolder[] {
        return children.map((child) => {
          const childPath = [...currentParentPath, child.name]
          return {
            ...child,
            id: generateGalleryFolderId(childPath.join('/')),
            children: reIdChildren(child.children, childPath),
          }
        })
      }

      return {
        ...f,
        id: generateGalleryFolderId(newSlug),
        name: trimmed,
        children: reIdChildren(f.children, newPath),
      }
    }
    const currentPath = [...parentPath, f.name]
    return {
      ...f,
      children: renameFolderById(f.children, folderId, trimmed, currentPath),
    }
  })
}

/**
 * Delete multiple items by ID set from all folders
 */
export function deleteItemsByIds(
  folders: GalleryFolder[],
  itemIds: Set<string>
): GalleryFolder[] {
  return folders.map((f) => ({
    ...f,
    items: f.items.filter((i) => !itemIds.has(i.id)),
    children: deleteItemsByIds(f.children, itemIds),
  }))
}

/**
 * Find item and its current folder path
 */
export function findItemWithFolderPath(
  folders: GalleryFolder[],
  itemId: string,
  currentPath: string[] = []
): { item: GalleryItem; folderPath: string[] } | null {
  for (const f of folders) {
    const nextPath = [...currentPath, f.name]
    const found = f.items.find((i) => i.id === itemId)
    if (found) return { item: found, folderPath: nextPath }
    const childFound = findItemWithFolderPath(f.children, itemId, nextPath)
    if (childFound) return childFound
  }
  return null
}

/**
 * Move a single item to a different folder
 */
export function moveItemToFolder(
  folders: GalleryFolder[],
  itemId: string,
  targetFolderPath: string[]
): GalleryFolder[] {
  const itemInfo = findItemWithFolderPath(folders, itemId)
  if (!itemInfo || itemInfo.item.isAutoSynced) return folders

  // 1. Remove from previous folder
  const withoutItem = deleteItemById(folders, itemId)

  // 2. Add to target folder
  return addItemAtPath(withoutItem, targetFolderPath, itemInfo.item)
}

/**
 * Move multiple items to a different folder
 */
export function batchMoveItemsToFolder(
  folders: GalleryFolder[],
  itemIds: Set<string>,
  targetFolderPath: string[]
): GalleryFolder[] {
  // Collect all eligible items
  const itemsToMove: GalleryItem[] = []
  function collect(fList: GalleryFolder[]) {
    for (const f of fList) {
      for (const item of f.items) {
        if (itemIds.has(item.id) && !item.isAutoSynced) {
          itemsToMove.push(item)
        }
      }
      collect(f.children)
    }
  }
  collect(folders)

  if (itemsToMove.length === 0) return folders

  // Remove from old locations
  let currentFolders = deleteItemsByIds(folders, itemIds)

  // Add to target folder
  for (const item of itemsToMove) {
    currentFolders = addItemAtPath(currentFolders, targetFolderPath, item)
  }

  return currentFolders
}

/**
 * Move a folder to become a child of newParentFolderPath (or root if empty)
 */
export function moveFolderToParent(
  folders: GalleryFolder[],
  folderIdToMove: string,
  newParentFolderPath: string[]
): GalleryFolder[] {
  // 1. Find the target folder object to move
  let folderToMove: GalleryFolder | null = null
  function extractFolder(fList: GalleryFolder[]): GalleryFolder[] {
    const result: GalleryFolder[] = []
    for (const f of fList) {
      if (f.id === folderIdToMove) {
        folderToMove = f
      } else {
        result.push({
          ...f,
          children: extractFolder(f.children),
        })
      }
    }
    return result
  }

  const treeWithoutFolder = extractFolder(folders)
  if (!folderToMove) return folders

  const targetFolderObj: GalleryFolder = folderToMove

  // Re-id folder and its children with new path
  function reIndexFolder(folder: GalleryFolder, parentPath: string[]): GalleryFolder {
    const newPath = [...parentPath, folder.name]
    const newSlug = newPath.join('/')
    return {
      ...folder,
      id: generateGalleryFolderId(newSlug),
      children: folder.children.map((ch) => reIndexFolder(ch, newPath)),
    }
  }

  const indexedFolder = reIndexFolder(targetFolderObj, newParentFolderPath)

  // 2. If newParentFolderPath is empty, add to root
  if (newParentFolderPath.length === 0) {
    return [...treeWithoutFolder, indexedFolder]
  }

  // 3. Otherwise add into target parent folder's children
  function insertIntoParent(
    fList: GalleryFolder[],
    pathParts: string[]
  ): GalleryFolder[] {
    const [first, ...rest] = pathParts
    return fList.map((f) => {
      if (f.name.toLowerCase() === first.toLowerCase()) {
        if (rest.length === 0) {
          return {
            ...f,
            children: [...f.children, indexedFolder],
          }
        }
        return {
          ...f,
          children: insertIntoParent(f.children, rest),
        }
      }
      return f
    })
  }

  return insertIntoParent(treeWithoutFolder, newParentFolderPath)
}
