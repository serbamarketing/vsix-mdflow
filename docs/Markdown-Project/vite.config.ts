import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

// Vite plugin to provide direct local file read/write API for seamless 2-way sync with Code Editor
function localFileServerPlugin() {
  return {
    name: 'local-file-server',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = new URL(req.url, `http://${req.headers.host}`)

        if (url.pathname === '/api/file' && req.method === 'GET') {
          const fileName = url.searchParams.get('file') || 'docs/Fitur.md'
          let filePath = path.isAbsolute(fileName)
            ? fileName
            : path.resolve(import.meta.dirname, fileName)

          if (!fs.existsSync(filePath)) {
            // Check in docs/
            const altPath = path.resolve(import.meta.dirname, 'docs', fileName)
            if (fs.existsSync(altPath)) filePath = altPath
          }

          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8')
            const stat = fs.statSync(filePath)
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ content, fileName: path.basename(filePath), filePath, mtime: stat.mtimeMs }))
          } else {
            res.statusCode = 404
            return res.end(JSON.stringify({ error: 'File not found' }))
          }
        }

        if (url.pathname === '/api/file' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => { body += chunk })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              const fileName = data.file || 'docs/Fitur.md'
              let filePath = path.isAbsolute(fileName)
                ? fileName
                : path.resolve(import.meta.dirname, fileName)

              if (!fs.existsSync(filePath) && !path.isAbsolute(fileName)) {
                const altPath = path.resolve(import.meta.dirname, 'docs', fileName)
                if (fs.existsSync(altPath) || !fs.existsSync(path.dirname(filePath))) {
                  filePath = altPath
                }
              }

              fs.mkdirSync(path.dirname(filePath), { recursive: true })
              fs.writeFileSync(filePath, data.content, 'utf-8')
              const stat = fs.statSync(filePath)
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: true, mtime: stat.mtimeMs, filePath }))
            } catch (err: any) {
              res.statusCode = 500
              return res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        if (url.pathname === '/api/media' && req.method === 'GET') {
          const fileParam = url.searchParams.get('file') || ''
          if (!fileParam) {
            res.statusCode = 400
            return res.end('File param required')
          }

          let filePath = path.isAbsolute(fileParam)
            ? fileParam
            : path.resolve(import.meta.dirname, fileParam)

          if (!fs.existsSync(filePath)) {
            const fileNameOnly = path.basename(fileParam)
            const searchLocations = [
              path.resolve(import.meta.dirname, 'docs', fileParam),
              path.resolve(import.meta.dirname, 'docs', fileNameOnly),
              path.resolve(import.meta.dirname, 'docs', 'Thumbnail', fileNameOnly),
              path.resolve(import.meta.dirname, 'docs', 'SS', fileNameOnly),
              path.resolve(import.meta.dirname, 'docs', 'ref', fileNameOnly),
              path.resolve(import.meta.dirname, fileNameOnly),
              // User local library locations
              path.resolve('C:/Users/jehgr/Videos/Roblox', fileNameOnly),
              path.resolve('C:/Users/jehgr/Pictures/Roblox', fileNameOnly),
              path.resolve('C:/Users/jehgr/Videos', fileNameOnly),
              path.resolve('C:/Users/jehgr/Pictures', fileNameOnly),
              path.resolve('C:/Users/jehgr/Downloads', fileNameOnly),
            ]

            for (const loc of searchLocations) {
              if (fs.existsSync(loc)) {
                filePath = loc
                break
              }
            }
          }

          if (!fs.existsSync(filePath)) {
            console.warn('⚠️ [/api/media 404]: File not found at:', filePath, 'Requested:', fileParam)
            res.statusCode = 404
            return res.end('Media not found')
          }

          const stat = fs.statSync(filePath)
          const fileSize = stat.size
          const ext = path.extname(filePath).toLowerCase().replace('.', '')
          const mimeTypes: Record<string, string> = {
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
          }
          const contentType = mimeTypes[ext] || 'application/octet-stream'

          // Handle HTTP Range Request for Smooth Video Playback & Seeking
          const range = req.headers.range
          if (range && contentType.startsWith('video/')) {
            const parts = range.replace(/bytes=/, '').split('-')
            const start = parseInt(parts[0], 10)
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
            const chunksize = end - start + 1
            const stream = fs.createReadStream(filePath, { start, end })

            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': contentType,
            })
            return stream.pipe(res)
          } else {
            res.writeHead(200, {
              'Content-Length': fileSize,
              'Content-Type': contentType,
              'Accept-Ranges': 'bytes',
            })
            return fs.createReadStream(filePath).pipe(res)
          }
        }

        if (url.pathname === '/api/resolve-path' && req.method === 'GET') {
          const nameParam = url.searchParams.get('name') || ''
          if (!nameParam) {
            res.statusCode = 400
            return res.end(JSON.stringify({ error: 'Name param required' }))
          }

          const fileNameOnly = path.basename(nameParam)
          const searchLocations = [
            path.resolve(import.meta.dirname, 'docs', nameParam),
            path.resolve(import.meta.dirname, 'docs', fileNameOnly),
            path.resolve(import.meta.dirname, 'docs', 'Thumbnail', fileNameOnly),
            path.resolve(import.meta.dirname, 'docs', 'SS', fileNameOnly),
            path.resolve(import.meta.dirname, 'docs', 'ref', fileNameOnly),
            path.resolve(import.meta.dirname, fileNameOnly),
            path.resolve('C:/Users/jehgr/Videos/Roblox', fileNameOnly),
            path.resolve('C:/Users/jehgr/Pictures/Roblox', fileNameOnly),
            path.resolve('C:/Users/jehgr/Videos', fileNameOnly),
            path.resolve('C:/Users/jehgr/Pictures', fileNameOnly),
            path.resolve('C:/Users/jehgr/Downloads', fileNameOnly),
          ]

          let resolvedPath = ''
          for (const loc of searchLocations) {
            if (fs.existsSync(loc)) {
              resolvedPath = loc.replace(/\\/g, '/')
              break
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({
            found: !!resolvedPath,
            fullPath: resolvedPath || nameParam.replace(/\\/g, '/'),
            fileName: fileNameOnly,
          }))
        }

        if (url.pathname === '/api/file-stat' && req.method === 'GET') {
          const fileName = url.searchParams.get('file') || 'docs/Fitur.md'
          let filePath = path.isAbsolute(fileName)
            ? fileName
            : path.resolve(import.meta.dirname, fileName)

          if (!fs.existsSync(filePath)) {
            const altPath = path.resolve(import.meta.dirname, 'docs', fileName)
            if (fs.existsSync(altPath)) filePath = altPath
          }

          if (fs.existsSync(filePath)) {
            const stat = fs.statSync(filePath)
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ exists: true, mtime: stat.mtimeMs }))
          } else {
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ exists: false, mtime: 0 }))
          }
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localFileServerPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: [
        path.resolve(import.meta.dirname, './'),
        path.resolve(import.meta.dirname, '../'),
      ],
      strict: false,
    },
  },
})
