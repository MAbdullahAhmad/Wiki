# Project: Wiki - Personal Knowledge Base

## Build Commands
```bash
cd project
npm install                  # Install dependencies
npm run generate-index       # Generate wiki/_index.json from markdown files
npm run dev                  # Start Vite dev server
npm run build                # Generate index + TypeScript check + Vite build
npm run deploy               # Full deploy to pages branch
```

## Publishing
```bash
./publish.bash               # Interactive publish from drafts/ to wiki/
./publish.bash --all         # Publish all drafts at once
./publish.bash myfile.md     # Publish a specific file by name
```

## Verification
```bash
cd project
npx tsc --noEmit             # Type check
npx vite build               # Production build
```

## Key Architecture
- **Drafts**: `drafts/` organized as `<Domain>/<Subject>/<file>.md` (topics) or `<Domain>/<Subject>/<Topic>/<file>.md` (subtopics)
- **Published wiki**: `wiki/*.md` flat directory with YAML frontmatter (title, description, tags, related)
- **Assets**: `assets/` at repo root holds images and binaries; markdown references them as `assets/<path>`. Renderer rewrites to raw GitHub URL in prod; vite middleware serves them in dev. Publish step fails if any reference is missing.
- **Publish tool**: `publish.bash` calls `project/scripts/publish-helper.js` for asset validation, link detection, frontmatter management, and tag derivation
- **Index rotation**: `project/scripts/generate-index.js` writes `wiki/_index.json` (base, with taxonomy + first slice + `chunks: N`) plus `_index-1.json`, `_index-2.json`, … each capped at 10 MB. Both the frontend (`wikiService.ts`) and the publish helper (`loadWikiPages`) merge chunks transparently.
- **React app**: `project/src/` (Vite + React + TypeScript + Tailwind)
- **Routing**: HashRouter for GitHub Pages compatibility; `public/404.html` + inline script in `index.html` provide a session-stashed SPA fallback that redirects only once to avoid reload loops.
- **Data fetching**: Runtime fetch from GitHub raw content URLs (prod) or local files (dev)
- **Tag hierarchy**: Domain > Subject > Topic > Sub-topic (auto-derived from drafts/ dirs)

## Adding Wiki Pages
1. Create markdown file in `drafts/<Domain>/<Subject>/` (topic) or `drafts/<Domain>/<Subject>/<Topic>/` (subtopic)
2. Run `./publish.bash` to publish with interactive link detection
3. Tags are auto-derived from directory path; taxonomy auto-updates from drafts/ structure
