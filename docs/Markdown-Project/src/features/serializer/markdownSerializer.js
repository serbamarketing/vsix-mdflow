"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMarkdown = serializeMarkdown;
function repeat(char, n) {
    return char.repeat(Math.max(1, n));
}
function serializeNode(node, level) {
    const chunks = [];
    // Heading
    chunks.push(`${repeat('#', level)} ${node.title.trim()}`);
    // Description
    if (node.description && node.description.trim()) {
        chunks.push(node.description.trim());
    }
    // Metadata
    const metaEntries = Object.entries(node.metadata);
    if (metaEntries.length > 0) {
        const metaLines = metaEntries
            .filter(([_, val]) => val && String(val).trim().length > 0)
            .map(([key, val]) => {
            const capitalKey = key.charAt(0).toUpperCase() + key.slice(1);
            return `**${capitalKey}:** ${String(val).trim()}`;
        });
        if (metaLines.length > 0) {
            chunks.push(metaLines.join('\n'));
        }
    }
    let result = chunks.join('\n\n');
    // Recursively serialize children
    if (node.children && node.children.length > 0) {
        const childrenMarkdown = node.children
            .map((child) => serializeNode(child, level + 1))
            .join('\n\n');
        result += '\n\n' + childrenMarkdown;
    }
    return result;
}
function serializeMarkdown(features) {
    if (!features || features.length === 0)
        return '';
    return features.map((f) => serializeNode(f, f.level || 1)).join('\n\n') + '\n';
}
//# sourceMappingURL=markdownSerializer.js.map