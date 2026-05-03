import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

/**
 * Dev-only plugin: serves wiki/ content from the repo root so the
 * app can fetch _index.json and individual .md pages during development.
 */
function wikiDevPlugin() {
  const wikiDir = path.resolve(__dirname, '../wiki')
  return {
    name: 'wiki-dev-server',
    configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use((req: { url?: string }, res: { setHeader: Function; end: Function }, next: Function) => {
        if (req.url === '/wiki-index.json') {
          const filePath = path.join(wikiDir, '_index.json')
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/json')
            res.end(fs.readFileSync(filePath, 'utf-8'))
            return
          }
        }
        if (req.url?.startsWith('/wiki/') && req.url.endsWith('.md')) {
          const slug = req.url.slice(6, -3) // strip /wiki/ and .md
          const filePath = path.join(wikiDir, `${slug}.md`)
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
            res.end(fs.readFileSync(filePath, 'utf-8'))
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
  base: '/Wiki/',
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
