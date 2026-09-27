"use strict";
// Gallery Serializer — writes GalleryFolder[] back to [Gallery] section in .md
// Output format:
//   [Gallery]
//   #[FolderName][src]
//   #[FolderName][src][caption]
//   #[Folder/Subfolder][src][caption]
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeGallerySection = serializeGallerySection;
exports.mergeGalleryIntoMarkdown = mergeGalleryIntoMarkdown;
function serializeFolder(folder, pathParts) {
    const lines = [];
    const currentPath = [...pathParts, folder.name];
    const pathStr = currentPath.join('/');
    if (folder.syncDir) {
        lines.push(`#[${pathStr}][dir:${folder.syncDir}]`);
    }
    const manualItems = folder.items.filter((i) => !i.isAutoSynced);
    if (manualItems.length === 0 && folder.children.length === 0 && !folder.syncDir) {
        lines.push(`#[${pathStr}]`);
    }
    else {
        for (const item of manualItems) {
            if (item.caption) {
                lines.push(`#[${pathStr}][${item.src}][${item.caption}]`);
            }
            else {
                lines.push(`#[${pathStr}][${item.src}]`);
            }
        }
        for (const child of folder.children) {
            lines.push(...serializeFolder(child, currentPath));
        }
    }
    return lines;
}
/**
 * Serialize gallery folders to [Gallery] section string
 */
function serializeGallerySection(folders) {
    if (folders.length === 0)
        return '';
    const lines = ['[Gallery]'];
    for (const folder of folders) {
        lines.push(...serializeFolder(folder, []));
    }
    return lines.join('\n');
}
/**
 * Merge non-gallery content with new gallery section
 * This replaces the old [Gallery] block (if any) with the freshly serialized one
 */
function mergeGalleryIntoMarkdown(nonGalleryContent, folders) {
    const gallerySection = serializeGallerySection(folders);
    if (!gallerySection) {
        return nonGalleryContent;
    }
    const parts = [];
    if (nonGalleryContent.trim()) {
        parts.push(nonGalleryContent.trimEnd());
        parts.push('');
        parts.push('');
    }
    parts.push(gallerySection);
    return parts.join('\n');
}
//# sourceMappingURL=gallerySerializer.js.map