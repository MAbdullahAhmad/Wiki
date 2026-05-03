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
- **Publish tool**: `publish.bash` calls `project/scripts/publish-helper.js` for link detection, frontmatter management, and tag derivation
- **Index**: `project/scripts/generate-index.js` builds `wiki/_index.json` with pages, taxonomy (auto-built from drafts/ directory structure), excerpts, keywords, word counts
- **React app**: `project/src/` (Vite + React + TypeScript + Tailwind)
- **Routing**: HashRouter for GitHub Pages compatibility
- **Data fetching**: Runtime fetch from GitHub raw content URLs (prod) or local files (dev)
- **Tag hierarchy**: Domain > Subject > Topic > Sub-topic (auto-derived from drafts/ dirs)

## Adding Wiki Pages
1. Create markdown file in `drafts/<Domain>/<Subject>/` (topic) or `drafts/<Domain>/<Subject>/<Topic>/` (subtopic)
2. Run `./publish.bash` to publish with interactive link detection
3. Tags are auto-derived from directory path; taxonomy auto-updates from drafts/ structure
