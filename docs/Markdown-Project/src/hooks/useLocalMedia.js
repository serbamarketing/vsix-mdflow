"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInitFileSystem = useInitFileSystem;
exports.useLocalMedia = useLocalMedia;
const react_1 = require("react");
const useAppStore_1 = require("./useAppStore");
const fileSystem_1 = require("@/utils/fileSystem");
const gallery_1 = require("@/models/gallery");
function useInitFileSystem() {
    const { dispatch } = (0, useAppStore_1.useAppStore)();
    (0, react_1.useEffect)(() => {
        (0, fileSystem_1.getAllDirectoryHandles)()
            .then((handles) => {
            dispatch({ type: 'SET_DIRECTORY_HANDLES', payload: handles });
        })
            .catch((err) => {
            console.warn('Failed to init filesystem handles', err);
        });
    }, [dispatch]);
}
function useLocalMedia(src) {
    const { state, dispatch } = (0, useAppStore_1.useAppStore)();
    const [resolvedUrl, setResolvedUrl] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        if (!src) {
            setResolvedUrl('');
            return;
        }
        // 1. If it's a web URL or data blob, just use it
        if (src.startsWith('http://') ||
            src.startsWith('https://') ||
            src.startsWith('data:') ||
            src.startsWith('blob:') ||
            src.startsWith('/@fs/')) {
            setResolvedUrl(src);
            return;
        }
        // 2. See if we can resolve it synchronously using normal candidates
        // For Netlify, only the exact matched bundle URLs from import.meta.glob will work
        const candidates = (0, gallery_1.resolveMediaSrcCandidates)(src);
        const bundleUrl = candidates.find(c => c.startsWith('/assets/'));
        if (bundleUrl) {
            setResolvedUrl(bundleUrl);
            return;
        }
        // 3. Try to load from File System Handles
        const loadFromFS = async () => {
            const handles = state.directoryHandles;
            const cleanSrc = (0, fileSystem_1.cleanPathForFS)(src);
            const blobUrl = await (0, fileSystem_1.getFileBlobUrlFromPath)(cleanSrc, handles);
            if (blobUrl) {
                setResolvedUrl(blobUrl);
                dispatch({ type: 'REMOVE_MISSING_LOCAL_PATH', payload: src });
            }
            else {
                // Mark as missing to trigger the LocalAccessBanner for workspace folder
                dispatch({ type: 'ADD_MISSING_LOCAL_PATH', payload: src });
                // Fallback to the first candidate (which will likely 404 in production)
                setResolvedUrl(candidates[0] || src);
            }
        };
        loadFromFS();
    }, [src, state.directoryHandles, dispatch]);
    return resolvedUrl;
}
//# sourceMappingURL=useLocalMedia.js.map