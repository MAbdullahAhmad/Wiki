# Architecture

## Repository layout

```
Wiki/
├── drafts/                 Source — directory tree drives the taxonomy
├── wiki/                   Published — flat .md files + auto-generated _index.json
├── assets/                 Images and binaries
├── authors.json            Username → author metadata
├── publish.bash            Interactive publish entry point
├── scripts/
│   ├── wikipedia-search.sh
│   └── patterns.txt
└── project/
    ├── src/                React app
    ├── scripts/
    │   ├── generate-index.js   Builds wiki/_index.json (+ rotated chunks)
    │   ├── publish-helper.js   Backend for publish.bash
    │   └── deploy.js           Force-pushes built site to gh-pages
    ├── public/             404.html and favicon
    ├── index.html
    └── vite.config.ts
```

## Build vs. content separation

Two separate concerns:

| Concern | Lives on    | Updated by         |
| ------- | ----------- | ------------------ |
| Source  | `main`      | regular commits    |
| Content | `main` + `gh-pages` | `./publish.bash` |
| Live site | `gh-pages` | `npm run deploy`  |

The deploy is self-contained: `gh-pages` has everything the browser needs, so the live site never reaches into `main` at runtime. See [deployment.md](deployment.md).

## Index rotation

`wiki/_index.json` is the entry point for everything in the UI — search, browse, taxonomy, related pages, author resolution. As content grows, the writer caps every output file at 10 MB and spills overflow into rotated chunks.

```
_index.json        base — taxonomy, authors map, first slice of pages, chunks: N
_index-1.json      { pages: [...] }
_index-2.json      { pages: [...] }
...
_index-N.json      { pages: [...] }
```

The base file always has the full taxonomy and authors map regardless of how many chunks exist — those are needed by every route and would be silly to rotate.

### Reader contract

Both readers behave identically:

1. Fetch the base file. Read `chunks: N`.
2. If `N == 0`, you're done.
3. Otherwise, fetch all `_index-i.json` and concatenate their `pages` into the base.

Implementations:

- Frontend: [project/src/services/wikiService.ts](../project/src/services/wikiService.ts) (`fetchWikiIndex` returns base only; `ensureFullIndex` triggers chunk fetch on demand).
- Publish helper: [project/scripts/publish-helper.js](../project/scripts/publish-helper.js) (`loadWikiPages` loads everything synchronously — only used for link detection during publish).

### Writer contract

[project/scripts/generate-index.js](../project/scripts/generate-index.js):

1. Reads every `wiki/*.md`. Builds the page list.
2. Builds taxonomy from the `drafts/` directory.
3. Reads `authors.json`.
4. Greedily fills the base file up to `CHUNK_BYTES`, then spills into chunks.
5. Deletes any pre-existing `_index-N.json` to avoid stale chunks from a smaller corpus.

`CHUNK_BYTES` is a single constant at the top of the file. Tune it if you ever care.

## Lazy loading

### Routes

[project/src/App.tsx](../project/src/App.tsx) splits every non-home route via `React.lazy`:

```tsx
const SearchPage = lazy(() => import('@/components/SearchPage')...);
const WikiPageView = lazy(() => import('@/components/WikiPageView')...);
const TagView = lazy(() => import('@/components/TagView')...);
const BrowsePage = lazy(() => import('@/components/BrowsePage')...);
const AuthorPage = lazy(() => import('@/components/AuthorPage')...);
```

Initial JS for the home page is ~218 KB. The heaviest chunk (WikiPageView, with the full markdown stack) is ~336 KB and only loaded when the user opens a page.

### Index chunks

The home page calls `useWikiIndex()` (base only). Every other route calls `useWikiIndex({ full: true })`, which triggers `ensureFullIndex()` on first mount. The promise is cached — concurrent navigations share the in-flight request.

This matters at scale: a 10k-page wiki spills into multiple ~1 MB chunks. The home page never pays for them.

### List rendering

[BrowsePage](../project/src/components/BrowsePage.tsx) and [SearchPage](../project/src/components/SearchPage.tsx) render at most 60 rows at a time, with a "Load more" button. Without this, a filtered result of thousands of pages produces visible jank during scroll.

Search input is debounced (120 ms) so filtering doesn't run on every keystroke.

## Frontmatter parsing

There are **two** YAML parsers — intentionally minimal, written by hand because the spec subset we use is small (key: value, key: list, tag-objects with type+name).

- Publish-side: [project/scripts/publish-helper.js#parseFrontmatter](../project/scripts/publish-helper.js) — reads drafts. Round-trips through `serializeFrontmatter` to produce the published file.
- Render-side: [project/src/services/wikiService.ts#parseFrontmatter](../project/src/services/wikiService.ts) — reads published files in the browser.

The serializer always emits fields in canonical order (title, description, author, co-authors, tags, related, then anything else), so render-side parsing has fewer edge cases to handle.

If you ever need full YAML support (anchors, multi-line strings, etc.), swap both parsers for `js-yaml` or similar. The interface is parse() → meta + body, so the swap is local.

## Data flow

```
Author writes drafts/Foo/Bar.md
                │
                ▼
./publish.bash
   │
   ├─ check-authors  →  prompts for missing usernames; writes authors.json
   ├─ asset-validate →  fails if any assets/* reference is missing
   ├─ link-detect    →  generates .publish/local-links.json + wikipedia-links.json
   ├─ apply-links    →  user opts in via JSON edit + Enter
   ├─ derive-tags    →  add tag from path
   └─ write          →  wiki/<slug>.md
                │
                ▼
generate-index.js  →  wiki/_index.json (+ rotated chunks)
                │
                ▼
npm run deploy     →  force-push dist/+wiki/+assets/ to gh-pages
                │
                ▼
GitHub Pages serves /Wiki/...
                │
                ▼
React app fetches wiki/_index.json relative to document
   ├─ HomePage:    base only
   ├─ Search/Browse/Tag/Author:  base + ensureFullIndex (chunks)
   └─ WikiPageView: fetches wiki/<slug>.md
```

## Routing

Single-page app with `HashRouter`. Routes:

- `/` — home (taxonomy + recent pages)
- `/search` — search with sort and tag-type filter
- `/browse` — paginated grid/list of all pages
- `/page/:slug` — page view (markdown + byline + related)
- `/tag/:tagName` — pages with a given tag
- `/author/:username` — author profile + their pages

GitHub Pages 404s any path under `/Wiki/` that's not a file. `404.html` redirects to base, `index.html` restores the path as a hash route. See [deployment.md](deployment.md).
