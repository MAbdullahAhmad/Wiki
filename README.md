# Wiki — Personal Knowledge Base

A markdown-based personal wiki built with React, TypeScript, and Tailwind CSS. Content lives on `main`, the built site is force-pushed to `gh-pages` and served by GitHub Pages.

**Live:** [mabdullahahmad.github.io/Wiki/](https://mabdullahahmad.github.io/Wiki/)

The canonical URL is case-sensitive (`/Wiki/`, not `/wiki/`). GitHub user-pages routing is owned by the `mabdullahahmad.github.io` repo, so the lowercase variant cannot be redirected from this repo alone.

## Features

- Markdown content with YAML frontmatter
- Hierarchical tags (Domain → Subject → Topic → Sub-topic), color-coded
- Full-screen search across titles, descriptions, tags, excerpts, keywords
- Hover link previews for in-wiki links
- Wikipedia link detection in published markdown
- Image and asset support via `assets/` directory
- Index rotation: index file is auto-split into ≤ 10 MB chunks as it grows
- Interactive publish CLI with link suggestions and asset validation
- SPA-safe 404 handler for GitHub Pages

## Repository structure

```
Wiki/
├── drafts/                    # Source — organize by hierarchy
│   └── <Domain>/<Subject>/[<Topic>/]<file>.md
├── wiki/                      # Published — flat
│   ├── _index.json            # Base index (taxonomy + first chunk of pages)
│   ├── _index-1.json          # Rotated chunk (only if pages spill over 10 MB)
│   ├── _index-2.json          # …
│   └── *.md                   # Published markdown
├── assets/                    # Images and binaries referenced by markdown
├── project/                   # React app (Vite + TS + Tailwind)
│   ├── src/
│   ├── scripts/
│   │   ├── generate-index.js  # Builds _index.json (+ rotated chunks)
│   │   ├── publish-helper.js  # Backend for publish.bash
│   │   └── deploy.js          # Force-pushes built dist/ to `gh-pages` branch
│   └── package.json
├── publish.bash               # Interactive publish tool
└── README.md
```

## Workflow

### 1. Create a draft

Place a markdown file under `drafts/`:

```
drafts/<Domain>/<Subject>/<file>.md           → tagged as topic
drafts/<Domain>/<Subject>/<Topic>/<file>.md   → tagged as subtopic
```

Tags are derived from the directory path; the filename becomes the slug. The taxonomy shown on the home page is built directly from the `drafts/` directory tree.

### 2. Add assets (optional)

Drop images and any other files into `assets/` at the repo root. Reference them from markdown by **relative path**:

```markdown
![diagram](assets/architecture.png)
[whitepaper PDF](assets/foo.pdf)
```

Path resolution:

- **Dev** — Vite middleware serves the local `assets/` directory at `/assets/…`.
- **Prod** — the renderer rewrites `assets/<path>` to `https://raw.githubusercontent.com/<owner>/<repo>/main/assets/<path>`.

The path you write in the markdown stays as-is in the published file (`assets/foo.png`). The renderer is the only thing that rewrites it.

If your draft references a file that doesn't exist under `assets/`, **publishing fails** with a list of missing paths. Add the file (or fix the path) and re-publish.

### 3. Publish

```bash
./publish.bash               # Interactive picker
./publish.bash --all         # Publish everything
./publish.bash myfile.md     # Publish a specific file
```

The tool will:

1. Validate that every `assets/*` reference resolves.
2. Detect mentions of existing wiki page titles → let you opt-in to convert them to `[text](slug)` wiki links.
3. Search Wikipedia for related terms → let you opt-in to add `W`-marked external links.
4. Apply the selected links and write `wiki/<slug>.md` with derived tag frontmatter.
5. Regenerate `wiki/_index.json` and any rotated chunks.

### 4. Deploy

```bash
cd project
npm run deploy
```

This builds, then force-pushes `dist/` to the `gh-pages` branch. The shell CWD never changes — deploy runs in a temp directory.

## Page format

```markdown
---
title: "Machine Learning"
description: "A subset of AI that enables systems to learn from data"
tags:
  - type: subtopic
    name: Machine Learning
related:
  - artificial-intelligence
  - deep-learning
---

# Machine Learning

Content here, with optional ![image](assets/ml.png).
```

### Tag types

| Type     | Color  | Description                                                  |
| -------- | ------ | ------------------------------------------------------------ |
| domain   | Purple | Top-level category (Technology, Science, Internal, …)        |
| subject  | Blue   | Subject within a domain (Computer Science, Physics, …)       |
| topic    | Green  | Specific topic (Artificial Intelligence, Calculus, …)        |
| subtopic | Amber  | Sub-topic within a topic (Machine Learning, Deep Learning, …) |

## Index rotation

`wiki/_index.json` is the search-and-navigation index. As content grows, the writer ([project/scripts/generate-index.js](project/scripts/generate-index.js)) caps every output file at 10 MB:

- Base file `_index.json` always holds the taxonomy, generation timestamp, a `chunks: N` field, and as many pages as fit.
- Remaining pages spill into `_index-1.json`, `_index-2.json`, … — each `{ "pages": [...] }` only.
- Stale chunk files are deleted at the start of every regenerate.

Both readers — the frontend ([project/src/services/wikiService.ts](project/src/services/wikiService.ts)) and the publish tool ([project/scripts/publish-helper.js](project/scripts/publish-helper.js)) — read the base, then fetch and concatenate `chunks` follow-on files. Code that consumes the index sees a single flat `pages[]`.

## Routing & GitHub Pages SPA fallback

The app uses HashRouter, so canonical URLs look like `https://mabdullahahmad.github.io/Wiki/#/page/<slug>`.

If a user lands on a non-existent path under `/Wiki/`, GitHub serves [project/public/404.html](project/public/404.html). It stashes the requested path in `sessionStorage` and redirects to the base path **once** (a session sentinel prevents reload loops). [project/index.html](project/index.html) reads the stash on load and applies it as a hash route. If the stash isn't there or the redirect already fired this session, the 404 simply renders a "Page not found" message instead of looping.

## Development

```bash
cd project
npm install
npm run generate-index   # Build wiki/_index.json (+ chunks if needed)
npm run dev              # Start Vite dev server (serves wiki/ and assets/)
npm run build            # Generate index + tsc + vite build
npm run deploy           # Full deploy to pages branch
```

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- react-markdown, remark-gfm, rehype-raw, rehype-slug
- react-router-dom (HashRouter)
