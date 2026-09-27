import { useEffect } from 'react'
import { useAppStore } from './useAppStore'
import { scanDirectory } from '@/utils/fileSystem'
import { detectMediaType } from '@/models/gallery'
import type { GalleryFolder, GalleryItem } from '@/models/gallery'

export function useGallerySync() {
  const { state, dispatch } = useAppStore()

  useEffect(() => {
    const rootHandle = state.directoryHandles['ROOT_WORKSPACE']
    if (!rootHandle) return

    // Collect all folders that need syncing
    const foldersToSync: GalleryFolder[] = []
    
    function collectSyncFolders(folders: GalleryFolder[]) {
      for (const f of folders) {
        if (f.syncDir) {
          foldersToSync.push(f)
        }
        if (f.children && f.children.length > 0) {
          collectSyncFolders(f.children)
        }
      }
    }
    
    collectSyncFolders(state.galleryFolders)
    
    if (foldersToSync.length === 0) return

    // To prevent infinite re-renders or excessive scanning, we should ideally track if a folder was already synced in this session.
    // However, since we want it dynamic, we'll scan once when rootHandle or galleryFolders (length/structure) changes.
    let isMounted = true

    async function syncFolders() {
      try {
        const filePaths = await scanDirectory(rootHandle)
        if (!isMounted) return
        
        for (const folder of foldersToSync) {
          const normDir = folder.syncDir!.replace(/\\/g, '/').replace(/^\//, '').replace(/\/$/, '').toLowerCase()
          
          const items: GalleryItem[] = []
          const seenSrc = new Set<string>()

          for (const rawKey of filePaths) {
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

              items.push({
                id: `sync_${folder.id}_${cleanKey}`,
                src: cleanKey,
                caption,
                type,
                isAutoSynced: true,
              })
            }
          }
          
          // Compare if items actually changed to avoid unnecessary dispatches
          const existingAutoSynced = folder.items.filter(i => i.isAutoSynced)
          const isSame = 
            existingAutoSynced.length === items.length && 
            existingAutoSynced.every((item, idx) => item.src === items[idx].src)
            
          if (!isSame) {
            dispatch({
              type: 'SET_AUTO_SYNCED_ITEMS',
              payload: { folderId: folder.id, items }
            })
          }
        }
      } catch (e) {
        console.warn('Auto sync failed:', e)
      }
    }

    syncFolders()

    return () => {
      isMounted = false
    }
    // We intentionally don't put state.galleryFolders deep dependency to prevent infinite loops when we update it.
    // We only trigger when directory handles change, or when root folder count changes (structural).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.directoryHandles, state.galleryFolders.length, dispatch])
}
