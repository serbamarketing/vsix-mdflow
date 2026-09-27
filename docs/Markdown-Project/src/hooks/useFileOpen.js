"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFileOpen = useFileOpen;
const react_1 = require("react");
const markdownParser_1 = require("@/features/parser/markdownParser");
function useFileOpen() {
    const openFile = (0, react_1.useCallback)(async () => {
        try {
            // Check if File System Access API is supported
            if ('showOpenFilePicker' in window) {
                const [handle] = await window.showOpenFilePicker({
                    types: [
                        {
                            description: 'Markdown Files',
                            accept: { 'text/markdown': ['.md', '.markdown', '.txt'] },
                        },
                    ],
                    multiple: false,
                });
                const file = await handle.getFile();
                const content = await file.text();
                const features = (0, markdownParser_1.parseMarkdown)(content);
                return { content, fileName: file.name, features, handle };
            }
            else {
                // Fallback for browsers without File System Access API
                return new Promise((resolve) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.md,.markdown,.txt';
                    input.onchange = async (e) => {
                        const file = e.target.files?.[0];
                        if (!file)
                            return resolve(null);
                        const content = await file.text();
                        const features = (0, markdownParser_1.parseMarkdown)(content);
                        resolve({ content, fileName: file.name, features, handle: null });
                    };
                    input.click();
                });
            }
        }
        catch (err) {
            if (err instanceof Error && err.name === 'AbortError')
                return null;
            console.error('Failed to open file:', err);
            return null;
        }
    }, []);
    const saveFile = (0, react_1.useCallback)(async (handle, content, fileName = 'Fitur.md') => {
        try {
            // 1. Try local dev server API first (instant direct physical disk write)
            try {
                const res = await fetch('/api/file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file: fileName, content }),
                });
                if (res.ok) {
                    const data = await res.json();
                    return { success: true, mtime: data.mtime };
                }
            }
            catch {
                // Dev server API not available, proceed to fallback
            }
            // 2. Browser File System Access API
            if (handle) {
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
                return { success: true, mtime: Date.now() };
            }
            return { success: true, mtime: Date.now() };
        }
        catch (err) {
            console.error('Failed to save file:', err);
            return { success: false };
        }
    }, []);
    const downloadMarkdown = (fileName, content) => {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
        link.click();
        URL.revokeObjectURL(link.href);
    };
    return { openFile, saveFile, downloadMarkdown };
}
//# sourceMappingURL=useFileOpen.js.map