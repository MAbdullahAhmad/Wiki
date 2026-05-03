import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.zip': 'application/zip',
}

function mimeFor(file: string) {
  const dot = file.lastIndexOf('.')
  if (dot < 0) return 'application/octet-stream'
  return MIME[file.slice(dot).toLowerCase()] || 'application/octet-stream'
}

/**
 * Dev-only plugin: serves wiki/ content (incl. rotated index chunks) and
 * the repo-root assets/ directory so markdown referencing assets/<name>
 * works locally just as it does in production.
 */
function wikiDevPlugin() {
  const repoRoot = path.resolve(__dirname, '..')
  const wikiDir = path.join(repoRoot, 'wiki')
  const assetsDir = path.join(repoRoot, 'assets')
  return {
    name: 'wiki-dev-server',
    configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use((req: { url?: string }, res: { setHeader: Function; end: Function; statusCode?: number }, next: Function) => {
        const url = req.url || ''

        if (url === '/wiki-index.json') {
          const filePath = path.join(wikiDir, '_index.json')
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/json')
            res.end(fs.readFileSync(filePath, 'utf-8'))
            return
          }
        }

        const chunkMatch = url.match(/^\/wiki-index-(\d+)\.json$/)
        if (chunkMatch) {
          const filePath = path.join(wikiDir, `_index-${chunkMatch[1]}.json`)
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/json')
            res.end(fs.readFileSync(filePath, 'utf-8'))
            return
          }
        }

        if (url.startsWith('/wiki/') && url.endsWith('.md')) {
          const slug = url.slice(6, -3)
          const filePath = path.join(wikiDir, `${slug}.md`)
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.end(fs.readFileSync(filePath, 'utf-8'))
            return
          }
        }

        if (url.startsWith('/assets/')) {
          const rel = decodeURIComponent(url.slice('/assets/'.length).split('?')[0])
          // Block path traversal.
          const filePath = path.join(assetsDir, rel)
          if (filePath.startsWith(assetsDir + path.sep) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Content-Type', mimeFor(filePath))
            res.end(fs.readFileSync(filePath))
            return
          }
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), wikiDevPlugin()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
