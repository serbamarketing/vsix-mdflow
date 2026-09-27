"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const vite_2 = __importDefault(require("@tailwindcss/vite"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Vite plugin to provide direct local file read/write API for seamless 2-way sync with Code Editor
function localFileServerPlugin() {
    return {
        name: 'local-file-server',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = new URL(req.url, `http://${req.headers.host}`);
                if (url.pathname === '/api/file' && req.method === 'GET') {
                    const fileName = url.searchParams.get('file') || 'docs/Fitur.md';
                    let filePath = path_1.default.isAbsolute(fileName)
                        ? fileName
                        : path_1.default.resolve(import.meta.dirname, fileName);
                    if (!fs_1.default.existsSync(filePath)) {
                        // Check in docs/
                        const altPath = path_1.default.resolve(import.meta.dirname, 'docs', fileName);
                        if (fs_1.default.existsSync(altPath))
                            filePath = altPath;
                    }
                    if (fs_1.default.existsSync(filePath)) {
                        const content = fs_1.default.readFileSync(filePath, 'utf-8');
                        const stat = fs_1.default.statSync(filePath);
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ content, fileName: path_1.default.basename(filePath), filePath, mtime: stat.mtimeMs }));
                    }
                    else {
                        res.statusCode = 404;
                        return res.end(JSON.stringify({ error: 'File not found' }));
                    }
                }
                if (url.pathname === '/api/file' && req.method === 'POST') {
                    let body = '';
                    req.on('data', (chunk) => { body += chunk; });
                    req.on('end', () => {
                        try {
                            const data = JSON.parse(body);
                            const fileName = data.file || 'docs/Fitur.md';
                            let filePath = path_1.default.isAbsolute(fileName)
                                ? fileName
                                : path_1.default.resolve(import.meta.dirname, fileName);
                            if (!fs_1.default.existsSync(filePath) && !path_1.default.isAbsolute(fileName)) {
                                const altPath = path_1.default.resolve(import.meta.dirname, 'docs', fileName);
                                if (fs_1.default.existsSync(altPath) || !fs_1.default.existsSync(path_1.default.dirname(filePath))) {
                                    filePath = altPath;
                                }
                            }
                            fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
                            fs_1.default.writeFileSync(filePath, data.content, 'utf-8');
                            const stat = fs_1.default.statSync(filePath);
                            res.setHeader('Content-Type', 'application/json');
                            return res.end(JSON.stringify({ success: true, mtime: stat.mtimeMs, filePath }));
                        }
                        catch (err) {
                            res.statusCode = 500;
                            return res.end(JSON.stringify({ error: err.message }));
                        }
                    });
                    return;
                }
                if (url.pathname === '/api/media' && req.method === 'GET') {
                    const fileParam = url.searchParams.get('file') || '';
                    if (!fileParam) {
                        res.statusCode = 400;
                        return res.end('File param required');
                    }
                    let filePath = path_1.default.isAbsolute(fileParam)
                        ? fileParam
                        : path_1.default.resolve(import.meta.dirname, fileParam);
                    if (!fs_1.default.existsSync(filePath)) {
                        const fileNameOnly = path_1.default.basename(fileParam);
                        const searchLocations = [
                            path_1.default.resolve(import.meta.dirname, 'docs', fileParam),
                            path_1.default.resolve(import.meta.dirname, 'docs', fileNameOnly),
                            path_1.default.resolve(import.meta.dirname, 'docs', 'Thumbnail', fileNameOnly),
                            path_1.default.resolve(import.meta.dirname, 'docs', 'SS', fileNameOnly),
                            path_1.default.resolve(import.meta.dirname, 'docs', 'ref', fileNameOnly),
                            path_1.default.resolve(import.meta.dirname, fileNameOnly),
                            // User local library locations
                            path_1.default.resolve('C:/Users/jehgr/Videos/Roblox', fileNameOnly),
                            path_1.default.resolve('C:/Users/jehgr/Pictures/Roblox', fileNameOnly),
                            path_1.default.resolve('C:/Users/jehgr/Videos', fileNameOnly),
                            path_1.default.resolve('C:/Users/jehgr/Pictures', fileNameOnly),
                            path_1.default.resolve('C:/Users/jehgr/Downloads', fileNameOnly),
                        ];
                        for (const loc of searchLocations) {
                            if (fs_1.default.existsSync(loc)) {
                                filePath = loc;
                                break;
                            }
                        }
                    }
                    if (!fs_1.default.existsSync(filePath)) {
                        console.warn('⚠️ [/api/media 404]: File not found at:', filePath, 'Requested:', fileParam);
                        res.statusCode = 404;
                        return res.end('Media not found');
                    }
                    const stat = fs_1.default.statSync(filePath);
                    const fileSize = stat.size;
                    const ext = path_1.default.extname(filePath).toLowerCase().replace('.', '');
                    const mimeTypes = {
                        mp4: 'video/mp4',
                        webm: 'video/webm',
                        ogg: 'video/ogg',
                        mov: 'video/quicktime',
                        png: 'image/png',
                        jpg: 'image/jpeg',
                        jpeg: 'image/jpeg',
                        webp: 'image/webp',
                        gif: 'image/gif',
                        svg: 'image/svg+xml',
                    };
                    const contentType = mimeTypes[ext] || 'application/octet-stream';
                    // Handle HTTP Range Request for Smooth Video Playback & Seeking
                    const range = req.headers.range;
                    if (range && contentType.startsWith('video/')) {
                        const parts = range.replace(/bytes=/, '').split('-');
                        const start = parseInt(parts[0], 10);
                        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                        const chunksize = end - start + 1;
                        const stream = fs_1.default.createReadStream(filePath, { start, end });
                        res.writeHead(206, {
                            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunksize,
                            'Content-Type': contentType,
                        });
                        return stream.pipe(res);
                    }
                    else {
                        res.writeHead(200, {
                            'Content-Length': fileSize,
                            'Content-Type': contentType,
                            'Accept-Ranges': 'bytes',
                        });
                        return fs_1.default.createReadStream(filePath).pipe(res);
                    }
                }
                if (url.pathname === '/api/resolve-path' && req.method === 'GET') {
                    const nameParam = url.searchParams.get('name') || '';
                    if (!nameParam) {
                        res.statusCode = 400;
                        return res.end(JSON.stringify({ error: 'Name param required' }));
                    }
                    const fileNameOnly = path_1.default.basename(nameParam);
                    const searchLocations = [
                        path_1.default.resolve(import.meta.dirname, 'docs', nameParam),
                        path_1.default.resolve(import.meta.dirname, 'docs', fileNameOnly),
                        path_1.default.resolve(import.meta.dirname, 'docs', 'Thumbnail', fileNameOnly),
                        path_1.default.resolve(import.meta.dirname, 'docs', 'SS', fileNameOnly),
                        path_1.default.resolve(import.meta.dirname, 'docs', 'ref', fileNameOnly),
                        path_1.default.resolve(import.meta.dirname, fileNameOnly),
                        path_1.default.resolve('C:/Users/jehgr/Videos/Roblox', fileNameOnly),
                        path_1.default.resolve('C:/Users/jehgr/Pictures/Roblox', fileNameOnly),
                        path_1.default.resolve('C:/Users/jehgr/Videos', fileNameOnly),
                        path_1.default.resolve('C:/Users/jehgr/Pictures', fileNameOnly),
                        path_1.default.resolve('C:/Users/jehgr/Downloads', fileNameOnly),
                    ];
                    let resolvedPath = '';
                    for (const loc of searchLocations) {
                        if (fs_1.default.existsSync(loc)) {
                            resolvedPath = loc.replace(/\\/g, '/');
                            break;
                        }
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        found: !!resolvedPath,
                        fullPath: resolvedPath || nameParam.replace(/\\/g, '/'),
                        fileName: fileNameOnly,
                    }));
                }
                if (url.pathname === '/api/file-stat' && req.method === 'GET') {
                    const fileName = url.searchParams.get('file') || 'docs/Fitur.md';
                    let filePath = path_1.default.isAbsolute(fileName)
                        ? fileName
                        : path_1.default.resolve(import.meta.dirname, fileName);
                    if (!fs_1.default.existsSync(filePath)) {
                        const altPath = path_1.default.resolve(import.meta.dirname, 'docs', fileName);
                        if (fs_1.default.existsSync(altPath))
                            filePath = altPath;
                    }
                    if (fs_1.default.existsSync(filePath)) {
                        const stat = fs_1.default.statSync(filePath);
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ exists: true, mtime: stat.mtimeMs }));
                    }
                    else {
                        res.setHeader('Content-Type', 'application/json');
                        return res.end(JSON.stringify({ exists: false, mtime: 0 }));
                    }
                }
                next();
            });
        },
    };
}
// https://vite.dev/config/
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)(), (0, vite_2.default)(), localFileServerPlugin()],
    resolve: {
        alias: {
            '@': path_1.default.resolve(import.meta.dirname, './src'),
        },
    },
    server: {
        fs: {
            allow: [
                path_1.default.resolve(import.meta.dirname, './'),
                path_1.default.resolve(import.meta.dirname, '../'),
            ],
            strict: false,
        },
    },
});
//# sourceMappingURL=vite.config.js.map