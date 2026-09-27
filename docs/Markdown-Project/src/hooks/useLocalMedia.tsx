import { useState, useEffect } from 'react'
import { useAppStore } from './useAppStore'
import { getFileBlobUrlFromPath, getAllDirectoryHandles, cleanPathForFS } from '@/utils/fileSystem'
import { resolveMediaSrcCandidates } from '@/models/gallery'

export function useInitFileSystem() {
  const { dispatch } = useAppStore()

  useEffect(() => {
    getAllDirectoryHandles()
      .then((handles) => {
        dispatch({ type: 'SET_DIRECTORY_HANDLES', payload: handles })
      })
      .catch((err) => {
        console.warn('Failed to init filesystem handles', err)
      })
  }, [dispatch])
}

export function useLocalMedia(src: string): string {
  const { state, dispatch } = useAppStore()
  const [resolvedUrl, setResolvedUrl] = useState<string>('')

  useEffect(() => {
    if (!src) {
      setResolvedUrl('')
      return
    }

    // 1. If it's a web URL or data blob, just use it
    if (
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.startsWith('data:') ||
      src.startsWith('blob:') ||
      src.startsWith('/@fs/')
    ) {
      setResolvedUrl(src)
      return
    }

    // 2. See if we can resolve it synchronously using normal candidates
    // For Netlify, only the exact matched bundle URLs from import.meta.glob will work
    const candidates = resolveMediaSrcCandidates(src)
    const bundleUrl = candidates.find(c => c.startsWith('/assets/'))
    if (bundleUrl) {
      setResolvedUrl(bundleUrl)
      return
    }

    // 3. Try to load from File System Handles
    const loadFromFS = async () => {
      const handles = state.directoryHandles
      const cleanSrc = cleanPathForFS(src)
      
      const blobUrl = await getFileBlobUrlFromPath(cleanSrc, handles)
      
      if (blobUrl) {
        setResolvedUrl(blobUrl)
        dispatch({ type: 'REMOVE_MISSING_LOCAL_PATH', payload: src })
      } else {
        // Mark as missing to trigger the LocalAccessBanner for workspace folder
        dispatch({ type: 'ADD_MISSING_LOCAL_PATH', payload: src })
        
        // Fallback to the first candidate (which will likely 404 in production)
        setResolvedUrl(candidates[0] || src)
      }
    }

    loadFromFS()
  }, [src, state.directoryHandles, dispatch])

  return resolvedUrl
}
