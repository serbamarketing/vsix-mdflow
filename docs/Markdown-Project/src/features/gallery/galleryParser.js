"use strict";
// Gallery Parser — reads [Gallery] section from .md files
// Format:
//   [Gallery]
//   #[FolderName][src]
//   #[FolderName][src][caption]
//   #[Folder/Subfolder][src]
//   #[Folder/Sub1/Sub2][src][caption]
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGallerySection = parseGallerySection;
exports.extractNonGalleryContent = extractNonGalleryContent;
const gallery_1 = require("@/models/gallery");
function parseGalleryLine(line) {
    const trimmed = line.trim();
    // Must start with #[
    if (!trimmed.startsWith('#['))
        return null;
    // Extract all [...] groups
    const bracketRegex = /\[([^\]]*)\]/g;
    const matches = [];
    let m;
    while ((m = bracketRegex.exec(trimmed)) !== null) {
        matches.push(m[1]);
    }
    if (matches.length < 1)
        return null;
    const pathStr = matches[0]; // e.g. "Game A/Jump"
    const srcOrDir = matches[1]?.trim() || '';
    const caption = matches[2]?.trim() || undefined;
    const pathParts = pathStr
        .split('/')
        .map((p) => p.trim())
        .filter(Boolean);
    if (pathParts.length === 0)
        return null;
    if (srcOrDir.startsWith('dir:')) {
        const syncDir = srcOrDir.slice(4).trim();
        return { pathParts, syncDir };
    }
    return { pathParts, src: srcOrDir, caption };
}
function ensureFolderPath(roots, pathParts) {
    let current = roots;
    let targetFolder = null;
    for (let i = 0; i < pathParts.length; i++) {
        const name = pathParts[i];
        let folder = current.find((f) => f.name === name);
        if (!folder) {
            const fullPathSlug = pathParts.slice(0, i + 1).join('/');
            folder = {
                id: (0, gallery_1.generateGalleryFolderId)(fullPathSlug),
                name,
                items: [],
                children: [],
            };
            current.push(folder);
        }
        if (i === pathParts.length - 1) {
            targetFolder = folder;
        }
        else {
            current = folder.children;
        }
    }
    return { roots, targetFolder: targetFolder };
}
/**
 * Parse the [Gallery] section from raw markdown content
 * Returns parsed folders and the line index where [Gallery] section starts
 */
function parseGallerySection(rawMarkdown) {
    if (!rawMarkdown)
        return { folders: [], gallerySectionStart: -1 };
    const lines = rawMarkdown.split('\n');
    let gallerySectionStart = -1;
    // Find [Gallery] marker
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '[Gallery]') {
            gallerySectionStart = i;
            break;
        }
    }
    if (gallerySectionStart === -1) {
        return { folders: [], gallerySectionStart: -1 };
    }
    const roots = [];
    const idSeen = new Set();
    for (let i = gallerySectionStart + 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim())
            continue;
        const parsed = parseGalleryLine(line);
        if (!parsed)
            continue;
        const { targetFolder } = ensureFolderPath(roots, parsed.pathParts);
        // Handle Folder Auto-Sync Mode
        if (parsed.syncDir) {
            targetFolder.syncDir = parsed.syncDir;
            const syncedItems = (0, gallery_1.getAutoSyncedItemsForDir)(parsed.syncDir);
            for (const item of syncedItems) {
                if (!targetFolder.items.some((existing) => existing.src === item.src)) {
                    targetFolder.items.push(item);
                }
            }
            continue;
        }
        if (!parsed.src)
            continue;
        const folderPathStr = parsed.pathParts.join('/');
        const rawId = (0, gallery_1.generateGalleryItemId)(parsed.src, folderPathStr);
        let itemId = rawId;
        let count = 0;
        while (idSeen.has(itemId)) {
            count++;
            itemId = `${rawId}-${count}`;
        }
        idSeen.add(itemId);
        const item = {
            id: itemId,
            src: parsed.src,
            caption: parsed.caption,
            type: (0, gallery_1.detectMediaType)(parsed.src),
        };
        // Add item (deduplicate by ID)
        if (!targetFolder.items.some((existing) => existing.id === item.id)) {
            targetFolder.items.push(item);
        }
    }
    return { folders: roots, gallerySectionStart };
}
/**
 * Extract only the non-gallery part of the markdown (above [Gallery] section)
 */
function extractNonGalleryContent(rawMarkdown) {
    if (!rawMarkdown)
        return '';
    const lines = rawMarkdown.split('\n');
    const galleryIdx = lines.findIndex((l) => l.trim() === '[Gallery]');
    if (galleryIdx === -1)
        return rawMarkdown;
    // Strip trailing blank lines from the non-gallery portion
    const nonGallery = lines.slice(0, galleryIdx);
    while (nonGallery.length > 0 && nonGallery[nonGallery.length - 1].trim() === '') {
        nonGallery.pop();
    }
    return nonGallery.join('\n');
}
//# sourceMappingURL=galleryParser.js.map