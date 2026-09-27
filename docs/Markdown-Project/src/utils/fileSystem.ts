// src/utils/fileSystem.ts

const DB_NAME = 'MDFlowFileHandles'
const STORE_NAME = 'handles'
const DB_VERSION = 1

type FileSystemPermissionMode = 'read' | 'readwrite'

function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

export async function saveDirectoryHandle(path: string, handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(handle, path)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function getDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle | undefined> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(path)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllDirectoryHandles(): Promise<Record<string, FileSystemDirectoryHandle>> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    const keysRequest = store.getAllKeys()

    tx.oncomplete = () => {
      const keys = keysRequest.result as string[]
      const values = request.result as FileSystemDirectoryHandle[]
      const result: Record<string, FileSystemDirectoryHandle> = {}
      for (let i = 0; i < keys.length; i++) {
        result[keys[i]] = values[i]
      }
      resolve(result)
    }
    tx.onerror = () => reject(tx.error)
  })
}

export async function verifyPermission(fileHandle: FileSystemHandle, withWrite: boolean = false): Promise<boolean> {
  const opts = { mode: (withWrite ? 'readwrite' : 'read') as FileSystemPermissionMode }
  // Check if permission was already granted
  if ((await (fileHandle as any).queryPermission(opts)) === 'granted') {
    return true
  }
  // Request permission
  if ((await (fileHandle as any).requestPermission(opts)) === 'granted') {
    return true
  }
  return false
}

// Memory cache to prevent repeated File reads and Blob URL creations for the same path
const blobUrlCache = new Map<string, string>()

export function cleanPathForFS(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\//, '').trim()
}

/**
 * Attempts to resolve an absolute path using cached Directory Handles.
 * It finds the longest matching handle path, walks the directory tree, and returns a Blob URL.
 */
export async function getFileBlobUrlFromPath(
  absolutePath: string,
  handles: Record<string, FileSystemDirectoryHandle>
): Promise<string | null> {
  const cleanAbs = cleanPathForFS(absolutePath)
  
  if (blobUrlCache.has(cleanAbs)) {
    return blobUrlCache.get(cleanAbs)!
  }

  // Find the most specific handle (longest path match)
  let bestMatchPath = ''
  let bestHandle: FileSystemDirectoryHandle | null = null

  for (const [handlePath, handle] of Object.entries(handles)) {
    if (handlePath === 'ROOT_WORKSPACE') continue // Skip special root handle in normal absolute matching

    const cleanHandlePath = cleanPathForFS(handlePath)
    if (
      (cleanAbs === cleanHandlePath || cleanAbs.startsWith(cleanHandlePath + '/')) &&
      cleanHandlePath.length > bestMatchPath.length
    ) {
      bestMatchPath = cleanHandlePath
      bestHandle = handle
    }
  }

  // If no absolute path matched, but we have ROOT_WORKSPACE, assume it's a relative path inside ROOT_WORKSPACE
  if (!bestHandle && handles['ROOT_WORKSPACE']) {
    bestMatchPath = ''
    bestHandle = handles['ROOT_WORKSPACE']
  }

  if (!bestHandle) return null

  // Ensure we still have permission to this handle
  const hasPermission = await verifyPermission(bestHandle)
  if (!hasPermission) return null

  // Get the relative path inside the directory handle
  let relativePath = cleanAbs.slice(bestMatchPath.length)
  if (relativePath.startsWith('/')) relativePath = relativePath.slice(1)

  if (!relativePath) return null // Absolute path IS the directory, not a file

  const parts = relativePath.split('/')
  const fileName = parts.pop()!

  try {
    let currentDir = bestHandle
    for (const part of parts) {
      currentDir = await currentDir.getDirectoryHandle(part)
    }
    
    const fileHandle = await currentDir.getFileHandle(fileName)
    const file = await fileHandle.getFile()
    const url = URL.createObjectURL(file)
    
    blobUrlCache.set(cleanAbs, url)
    return url
  } catch (error) {
    console.warn('Failed to read file from handle:', cleanAbs, error)
    return null
  }
}

/**
 * Recursively scans a directory handle and returns all file paths relative to the handle.
 */
export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  currentPath: string = ''
): Promise<string[]> {
  let filePaths: string[] = []
  
  try {
    for await (const entry of (dirHandle as any).values()) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name
      
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop()?.toLowerCase()
        const isMedia = ext && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'webm'].includes(ext)
        if (isMedia) {
          filePaths.push(entryPath)
        }
      } else if (entry.kind === 'directory') {
        // Skip common hidden/build folders to save time
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
          continue
        }
        
        try {
          const subPaths = await scanDirectory(entry, entryPath)
          filePaths = filePaths.concat(subPaths)
        } catch (e) {
          console.warn('Failed to scan subdirectory:', entryPath, e)
        }
      }
    }
  } catch (e) {
    console.warn('Failed to scan directory:', currentPath, e)
  }
  
  return filePaths
}

