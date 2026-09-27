// Gallery Serializer — writes GalleryFolder[] back to [Gallery] section in .md
// Output format:
//   [Gallery]
//   #[FolderName][src]
//   #[FolderName][src][caption]
//   #[Folder/Subfolder][src][caption]

import type { GalleryFolder } from '@/models/gallery'

function serializeFolder(
  folder: GalleryFolder,
  pathParts: string[]
): string[] {
  const lines: string[] = []
  const currentPath = [...pathParts, folder.name]
  const pathStr = currentPath.join('/')

  if (folder.syncDir) {
    lines.push(`#[${pathStr}][dir:${folder.syncDir}]`)
  }

  const manualItems = folder.items.filter((i) => !i.isAutoSynced)

  if (manualItems.length === 0 && folder.children.length === 0 && !folder.syncDir) {
    lines.push(`#[${pathStr}]`)
  } else {
    for (const item of manualItems) {
      if (item.caption) {
        lines.push(`#[${pathStr}][${item.src}][${item.caption}]`)
      } else {
        lines.push(`#[${pathStr}][${item.src}]`)
      }
    }

    for (const child of folder.children) {
      lines.push(...serializeFolder(child, currentPath))
    }
  }

  return lines
}

/**
 * Serialize gallery folders to [Gallery] section string
 */
export function serializeGallerySection(folders: GalleryFolder[]): string {
  if (folders.length === 0) return ''

  const lines: string[] = ['[Gallery]']

  for (const folder of folders) {
    lines.push(...serializeFolder(folder, []))
  }

  return lines.join('\n')
}

/**
 * Merge non-gallery content with new gallery section
 * This replaces the old [Gallery] block (if any) with the freshly serialized one
 */
export function mergeGalleryIntoMarkdown(
  nonGalleryContent: string,
  folders: GalleryFolder[]
): string {
  const gallerySection = serializeGallerySection(folders)

  if (!gallerySection) {
    return nonGalleryContent
  }

  const parts: string[] = []
  if (nonGalleryContent.trim()) {
    parts.push(nonGalleryContent.trimEnd())
    parts.push('')
    parts.push('')
  }
  parts.push(gallerySection)

  return parts.join('\n')
}
