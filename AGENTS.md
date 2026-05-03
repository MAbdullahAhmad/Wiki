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

## Verification
```bash
cd project
npx tsc --noEmit             # Type check
npx vite build               # Production build
```

## Key Architecture
- Wiki content: `wiki/*.md` with YAML frontmatter (title, description, tags, related)
- React app: `project/src/` (Vite + React + TypeScript + Tailwind)
- Index generation: `project/scripts/generate-index.js` parses frontmatter from wiki files
- Deploy: `project/scripts/deploy.js` builds and pushes to `pages` branch
- Routing: HashRouter for GitHub Pages compatibility
- Data fetching: Runtime fetch from GitHub raw content URLs (prod) or local files (dev)
- Tag hierarchy: Domain > Subject > Topic > Sub-topic (defined in generate-index.js TAXONOMY)

## Adding Wiki Pages
1. Create `wiki/<slug>.md` with frontmatter
2. Run `npm run generate-index` in project/
3. Update TAXONOMY in `project/scripts/generate-index.js` if adding new categories
