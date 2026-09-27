"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_COLUMN_CONFIG = exports.STATUS_TODO = exports.STATUS_PROGRESS = exports.STATUS_DONE = exports.DEFAULT_STATUSES = void 0;
exports.getStatusColor = getStatusColor;
exports.getStatusLabel = getStatusLabel;
exports.flattenFeatures = flattenFeatures;
exports.findFeatureById = findFeatureById;
exports.getAllMetadataKeys = getAllMetadataKeys;
exports.updateNodeInTree = updateNodeInTree;
exports.addChildNodeInTree = addChildNodeInTree;
exports.deleteNodeInTree = deleteNodeInTree;
exports.moveNodeToParentInTree = moveNodeToParentInTree;
exports.moveMultipleNodesToParentInTree = moveMultipleNodesToParentInTree;
exports.deleteMetadataKeyFromAll = deleteMetadataKeyFromAll;
exports.reorderNodeInTree = reorderNodeInTree;
exports.generateFeatureId = generateFeatureId;
exports.DEFAULT_STATUSES = [
    { id: 'todo', label: '🔴 Todo', color: '#ef4444' },
    { id: 'progress', label: '🟡 Progress', color: '#eab308' },
    { id: 'done', label: '🟢 Done', color: '#22c55e' },
    { id: 'review', label: '🔵 In Review', color: '#3b82f6' },
    { id: 'blocked', label: '🟣 Blocked', color: '#a855f7' },
];
exports.STATUS_DONE = '🟢 Done';
exports.STATUS_PROGRESS = '🟡 Progress';
exports.STATUS_TODO = '🔴 Todo';
exports.DEFAULT_COLUMN_CONFIG = {
    mindmap: {
        showStatus: true,
        showPriority: true,
        showPic: true,
        showType: true,
        showDeadline: true,
        showImage: true,
        showLink: true,
        showDescription: false,
        showSubCount: false,
        showCustomMeta: true,
    },
    table: {},
    kanban: {
        showStatus: true,
        showPriority: true,
        showPic: true,
        showType: true,
        showDeadline: true,
        showImage: true,
        showLink: true,
        showDescription: true,
        showSubCount: true,
        showCustomMeta: true,
    },
    calendar: {
        showStatus: true,
        showPriority: true,
        showPic: true,
        showType: true,
        showDeadline: true,
        showImage: true,
        showLink: true,
    },
};
function getStatusColor(status, customStatuses) {
    if (!status)
        return '#94a3b8';
    if (customStatuses) {
        const found = customStatuses.find((s) => s.label.toLowerCase() === status.toLowerCase() || s.id === status.toLowerCase());
        if (found)
            return found.color;
    }
    const s = status.toLowerCase();
    if (s.includes('done') || s.includes('✅') || s.includes('selesai'))
        return '#22c55e';
    if (s.includes('progress') || s.includes('🟡') || s.includes('proses') || s.includes('doing'))
        return '#eab308';
    if (s.includes('todo') || s.includes('🔴') || s.includes('to-do'))
        return '#ef4444';
    if (s.includes('review') || s.includes('🔵'))
        return '#3b82f6';
    if (s.includes('block') || s.includes('🟣') || s.includes('hold'))
        return '#a855f7';
    return '#94a3b8';
}
function getStatusLabel(status) {
    if (!status)
        return 'No Status';
    return status;
}
function flattenFeatures(nodes, parentId) {
    const result = [];
    for (const node of nodes) {
        result.push({ ...node, parentId });
        result.push(...flattenFeatures(node.children, node.id));
    }
    return result;
}
function findFeatureById(nodes, id) {
    for (const node of nodes) {
        if (node.id === id)
            return node;
        const found = findFeatureById(node.children, id);
        if (found)
            return found;
    }
    return null;
}
function getAllMetadataKeys(nodes) {
    const keys = new Set();
    const flat = flattenFeatures(nodes);
    for (const f of flat) {
        for (const key of Object.keys(f.metadata)) {
            if (key.trim()) {
                keys.add(key.toLowerCase());
            }
        }
    }
    const defaultKeys = ['status', 'priority', 'type', 'pic', 'deadline', 'image', 'link'];
    for (const dk of defaultKeys) {
        keys.add(dk);
    }
    return Array.from(keys);
}
// Tree mutation helpers
function updateNodeInTree(nodes, id, updates) {
    return nodes.map((node) => {
        if (node.id === id) {
            return {
                ...node,
                ...updates,
                metadata: updates.metadata ? { ...updates.metadata } : node.metadata,
            };
        }
        if (node.children.length > 0) {
            return {
                ...node,
                children: updateNodeInTree(node.children, id, updates),
            };
        }
        return node;
    });
}
function addChildNodeInTree(nodes, parentId, newNode) {
    if (!parentId) {
        return [...nodes, newNode];
    }
    return nodes.map((node) => {
        if (node.id === parentId) {
            return {
                ...node,
                children: [...node.children, { ...newNode, level: node.level + 1 }],
            };
        }
        if (node.children.length > 0) {
            return {
                ...node,
                children: addChildNodeInTree(node.children, parentId, newNode),
            };
        }
        return node;
    });
}
function deleteNodeInTree(nodes, id) {
    return nodes
        .filter((node) => node.id !== id)
        .map((node) => ({
        ...node,
        children: deleteNodeInTree(node.children, id),
    }));
}
// Recursively update node levels when parent changes
function adjustLevels(node, targetLevel) {
    return {
        ...node,
        level: targetLevel,
        children: node.children.map((c) => adjustLevels(c, targetLevel + 1)),
    };
}
// Move single node to a different parent
function moveNodeToParentInTree(nodes, sourceId, targetParentId) {
    if (sourceId === targetParentId)
        return nodes;
    const sourceNode = findFeatureById(nodes, sourceId);
    if (!sourceNode)
        return nodes;
    // Prevent dragging a parent into its own child/descendant
    const isDescendant = (parent, checkId) => {
        for (const child of parent.children) {
            if (child.id === checkId)
                return true;
            if (isDescendant(child, checkId))
                return true;
        }
        return false;
    };
    if (targetParentId && isDescendant(sourceNode, targetParentId)) {
        return nodes;
    }
    const treeWithoutSource = deleteNodeInTree(nodes, sourceId);
    if (!targetParentId) {
        const rootAdjusted = adjustLevels(sourceNode, 1);
        return [...treeWithoutSource, rootAdjusted];
    }
    else {
        const targetParent = findFeatureById(treeWithoutSource, targetParentId);
        const targetLevel = targetParent ? targetParent.level + 1 : 2;
        const adjustedNode = adjustLevels(sourceNode, targetLevel);
        return addChildNodeInTree(treeWithoutSource, targetParentId, adjustedNode);
    }
}
// Move multiple nodes to a different parent (Batch Re-parenting)
function moveMultipleNodesToParentInTree(nodes, sourceIds, targetParentId) {
    let currentTree = nodes;
    for (const sourceId of sourceIds) {
        currentTree = moveNodeToParentInTree(currentTree, sourceId, targetParentId);
    }
    return currentTree;
}
// Delete metadata key across all nodes in the tree
function deleteMetadataKeyFromAll(nodes, key) {
    const cleanKey = key.toLowerCase().trim();
    return nodes.map((node) => {
        const updatedMeta = { ...node.metadata };
        delete updatedMeta[cleanKey];
        return {
            ...node,
            metadata: updatedMeta,
            children: deleteMetadataKeyFromAll(node.children, cleanKey),
        };
    });
}
// Reorder a node by moving it up or down among its siblings
function reorderNodeInTree(nodes, id, direction) {
    console.log(`[reorderNodeInTree] checking level. Target ID: ${id}, Direction: ${direction}, Nodes in current level:`, nodes.map(n => n.id));
    const index = nodes.findIndex((n) => n.id === id);
    if (index !== -1) {
        console.log(`[reorderNodeInTree] FOUND target at index ${index}. Sibling IDs:`, nodes.map(n => n.id));
        const newNodes = [...nodes];
        if (direction === 'up' && index > 0) {
            const temp = newNodes[index];
            newNodes[index] = newNodes[index - 1];
            newNodes[index - 1] = temp;
            console.log(`[reorderNodeInTree] SWAPPED UP. New order:`, newNodes.map(n => n.id));
        }
        else if (direction === 'down' && index < newNodes.length - 1) {
            const temp = newNodes[index];
            newNodes[index] = newNodes[index + 1];
            newNodes[index + 1] = temp;
            console.log(`[reorderNodeInTree] SWAPPED DOWN. New order:`, newNodes.map(n => n.id));
        }
        return newNodes;
    }
    // Recurse into children
    return nodes.map((node) => {
        if (node.children.length > 0) {
            return {
                ...node,
                children: reorderNodeInTree(node.children, id, direction),
            };
        }
        return node;
    });
}
function generateFeatureId(title) {
    const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30) || 'item';
    return `${slug}-${Date.now().toString(36).slice(-4)}`;
}
//# sourceMappingURL=feature.js.map