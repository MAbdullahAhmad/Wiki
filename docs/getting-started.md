# Getting started

## Prerequisites

- Node 20+
- npm (bundled with Node)
- Bash (for `publish.bash`)
- Git (for `npm run deploy`)

## Install

```bash
git clone https://github.com/MAbdullahAhmad/Wiki.git
cd Wiki/project
npm install
```

## Run the dev server

```bash
cd project
npm run dev
```

Vite serves the React app on `http://localhost:5173/`. A custom middleware also serves `wiki/` and `assets/` from the repo root, so the app fetches local content as it would in production.

## Publish your first page

1. Create `drafts/Internal/hello.md`:

   ```markdown
   ---
   title: "Hello"
   author: abdullah
   ---

   # Hello

   This is my first page.
   ```

2. Run the publish tool:

   ```bash
   ./publish.bash hello.md
   ```

   It validates assets and authors, asks about link suggestions, then writes `wiki/hello.md` and regenerates `wiki/_index.json`.

3. Refresh the dev server. The page is at `http://localhost:5173/#/page/hello`.

## Deploy

```bash
cd project && npm run deploy
```

This builds, bundles `wiki/` and `assets/` with the dist, and force-pushes to `gh-pages`. The live site updates within ~30 seconds (CDN propagation).

See [deployment.md](deployment.md) for first-time GitHub Pages setup.
