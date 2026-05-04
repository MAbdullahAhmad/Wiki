# AGENTS.md

Markdown wiki. Source on `main`, built site on `gh-pages`. Live: https://mabdullahahmad.github.io/Wiki/

## Commands

```bash
cd project
npm install
npm run dev              # Vite dev (serves wiki/ + assets/ via middleware)
npm run generate-index   # Rebuild wiki/_index.json
npm run build            # generate-index + tsc + vite build
npm run deploy           # build + force-push dist/+wiki/+assets/ to gh-pages
npx tsc --noEmit         # Type check only
```

```bash
./publish.bash               # interactive
./publish.bash --all         # all drafts
./publish.bash <file>.md     # one file
```

## Layout

- `drafts/<Domain>/<Subject>/[<Topic>/]<slug>.md` — source. Tags derived from path.
- `wiki/*.md` — published, flat. `wiki/_index.json` (+ rotated `_index-N.json`) is regenerated each publish.
- `assets/` — images and binaries; markdown references as `assets/<path>`. Vite serves in dev; prod resolves relative to the deployed site.
- `authors.json` — `username → { name, links[] }`. Frontmatter uses `author:` + `co-authors:`.
- `project/` — Vite + React + TS + Tailwind. Routes are code-split via `React.lazy`.

## Conventions

- **Self-contained deploy.** `wiki/` and `assets/` are bundled into `gh-pages`. Don't reintroduce raw.githubusercontent.com URLs — the prod site uses relative paths.
- **Index rotation.** Cap is 10 MB per file. Base file holds taxonomy + authors + first slice + `chunks: N`. Stale chunk files are deleted on each regenerate. Readers in `wikiService.ts` (`fetchWikiIndex` + `ensureFullIndex`) and `publish-helper.js` (`loadWikiPages`) merge transparently.
- **Lazy index loading.** Home only fetches the base index. Search/Browse/Tag/Author pages call `useWikiIndex({ full: true })` to trigger chunk fetch.
- **HashRouter + SPA fallback.** `public/404.html` stashes the path in `sessionStorage` and redirects to base once; `index.html` restores it. Don't make the 404 redirect unconditional — it'll loop.
- **Publish validates.** Asset references and author usernames must resolve before `wiki/<slug>.md` is written.

## Adding a wiki page

1. Create `drafts/<Domain>/<Subject>/[<Topic>/]<slug>.md` with title + optional `author`/`co-authors`.
2. Run `./publish.bash` (interactive link suggestions; prompts for unknown authors).
3. `cd project && npm run deploy`.
