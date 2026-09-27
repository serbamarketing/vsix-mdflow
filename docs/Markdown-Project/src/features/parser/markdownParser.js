"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMarkdown = parseMarkdown;
const unified_1 = require("unified");
const remark_parse_1 = __importDefault(require("remark-parse"));
// Generate a slug from a heading title
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 40) || 'node';
}
// Extract plain text recursively from MDAST nodes
function extractText(node) {
    if (!node || typeof node !== 'object')
        return '';
    const n = node;
    if (n.type === 'text' || n.type === 'inlineCode')
        return n.value ?? '';
    if (Array.isArray(n.children)) {
        return n.children.map(extractText).join('');
    }
    return '';
}
const COMMON_METADATA_KEYS = [
    'status', 'priority', 'type', 'pic', 'deadline', 'owner', 'version',
    'tag', 'tags', 'platform', 'estimate', 'assignee', 'target', 'image',
    'img', 'thumbnail', 'cover', 'photo', 'link', 'url', 'href', 'website',
];
function isMetadataLine(line) {
    const trimmed = line.trim().replace(/^[-*+]\s+/, '');
    if (/^\*\*[a-zA-Z0-9_\s-]+:\*\*/.test(trimmed))
        return true;
    if (/^\*\*[a-zA-Z0-9_\s-]+\*\*:\s*/.test(trimmed))
        return true;
    const plainMatch = trimmed.match(/^([a-zA-Z0-9_\s-]+):\s*(.*)$/);
    if (plainMatch) {
        const potentialKey = plainMatch[1].trim().toLowerCase();
        if (COMMON_METADATA_KEYS.includes(potentialKey))
            return true;
    }
    return false;
}
// Check if a line is a metadata line: "**Key:** Value" or "Key: Value"
function parseMetadataFromText(rawText) {
    const metadata = {};
    const lines = rawText.split('\n');
    for (const line of lines) {
        const trimmed = line.trim().replace(/^[-*+]\s+/, ''); // remove list bullet if any
        // Pattern 1: **Key:** Value
        const boldMatch = trimmed.match(/^\*\*([a-zA-Z0-9_\s-]+):\*\*\s*(.*)$/);
        if (boldMatch) {
            const key = boldMatch[1].trim().toLowerCase();
            const val = boldMatch[2].trim();
            if (key && val)
                metadata[key] = val;
            continue;
        }
        // Pattern 2: **Key**: Value
        const boldMatch2 = trimmed.match(/^\*\*([a-zA-Z0-9_\s-]+)\*\*:\s*(.*)$/);
        if (boldMatch2) {
            const key = boldMatch2[1].trim().toLowerCase();
            const val = boldMatch2[2].trim();
            if (key && val)
                metadata[key] = val;
            continue;
        }
        // Pattern 3: Key: Value (for common keys like status, priority, type, pic, deadline, owner, version, image, link)
        const plainMatch = trimmed.match(/^([a-zA-Z0-9_\s-]+):\s*(.*)$/);
        if (plainMatch) {
            const potentialKey = plainMatch[1].trim().toLowerCase();
            if (COMMON_METADATA_KEYS.includes(potentialKey)) {
                metadata[potentialKey] = plainMatch[2].trim();
            }
        }
    }
    return metadata;
}
function parseMarkdown(content) {
    if (!content || !content.trim())
        return [];
    const processor = (0, unified_1.unified)().use(remark_parse_1.default);
    const ast = processor.parse(content);
    const children = ast.children;
    const blocks = [];
    let current = null;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.type === 'heading') {
            const h = node;
            if (current)
                blocks.push(current);
            current = {
                level: h.depth,
                title: extractText(h).trim(),
                description: [],
                metadata: {},
            };
        }
        else if (current) {
            if (node.type === 'paragraph') {
                const raw = extractText(node);
                const meta = parseMetadataFromText(raw);
                if (Object.keys(meta).length > 0) {
                    Object.assign(current.metadata, meta);
                    // Filter out lines that were metadata from description
                    const nonMetaLines = raw
                        .split('\n')
                        .filter((l) => !isMetadataLine(l))
                        .join('\n')
                        .trim();
                    if (nonMetaLines)
                        current.description.push(nonMetaLines);
                }
                else {
                    if (raw.trim())
                        current.description.push(raw.trim());
                }
            }
            else if (node.type === 'list') {
                const list = node;
                for (const item of list.children) {
                    const itemText = extractText(item).trim();
                    const meta = parseMetadataFromText(itemText);
                    if (Object.keys(meta).length > 0) {
                        Object.assign(current.metadata, meta);
                        const nonMeta = itemText
                            .split('\n')
                            .filter((l) => !isMetadataLine(l))
                            .join('\n')
                            .trim();
                        if (nonMeta)
                            current.description.push(`- ${nonMeta}`);
                    }
                    else if (itemText) {
                        current.description.push(`- ${itemText}`);
                    }
                }
            }
            else if (node.type === 'blockquote') {
                const quoteText = extractText(node).trim();
                if (quoteText) {
                    const meta = parseMetadataFromText(quoteText);
                    if (Object.keys(meta).length > 0) {
                        Object.assign(current.metadata, meta);
                        const nonMeta = quoteText
                            .split('\n')
                            .filter((l) => !isMetadataLine(l))
                            .join('\n')
                            .trim();
                        if (nonMeta)
                            current.description.push(`> ${nonMeta}`);
                    }
                    else {
                        current.description.push(`> ${quoteText}`);
                    }
                }
            }
        }
    }
    if (current)
        blocks.push(current);
    if (blocks.length === 0)
        return [];
    return buildHierarchy(blocks);
}
function buildHierarchy(blocks) {
    const roots = [];
    const stack = [];
    const idCount = {};
    for (const block of blocks) {
        const baseId = slugify(block.title);
        idCount[baseId] = (idCount[baseId] ?? 0) + 1;
        const id = idCount[baseId] === 1 ? baseId : `${baseId}-${idCount[baseId]}`;
        const node = {
            id,
            title: block.title,
            level: block.level,
            description: block.description.join('\n\n') || undefined,
            metadata: block.metadata,
            children: [],
        };
        while (stack.length > 0 && stack[stack.length - 1].level >= block.level) {
            stack.pop();
        }
        if (stack.length === 0) {
            roots.push(node);
        }
        else {
            stack[stack.length - 1].children.push(node);
        }
        stack.push(node);
    }
    return roots;
}
//# sourceMappingURL=markdownParser.js.map