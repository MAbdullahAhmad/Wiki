# Wiki

A markdown wiki served from GitHub Pages. Source on `main`, built site on `gh-pages`.

**Live:** [mabdullahahmad.github.io/Wiki/](https://mabdullahahmad.github.io/Wiki/) · **Docs:** [docs/](docs/README.md)

## Layout

```
drafts/      # Source — organize by directory hierarchy
wiki/        # Published markdown + _index.json (regenerated)
assets/      # Images and other binaries referenced by markdown
authors.json # Username → { name, links }
project/     # Vite + React + TypeScript app
publish.bash # Interactive publish tool
```

## Add a page

1. **Draft.** Drop a markdown file under `drafts/`. The path becomes the tags:

   ```
   drafts/<Domain>/<Subject>/<slug>.md           → topic
   drafts/<Domain>/<Subject>/<Topic>/<slug>.md   → subtopic
   ```

2. **Frontmatter.** Title is required. Author and co-authors reference usernames in `authors.json`.

   ```yaml
   ---
   title: "Machine Learning"
   description: "A subset of AI that learns from data"
   author: abdullah
   co-authors:
     - jane
   related:
     - artificial-intelligence
   ---
   ```

3. **Publish.**

   ```bash
   ./publish.bash               # interactive picker
   ./publish.bash --all         # everything
   ./publish.bash <file>.md     # one file
   ```

   The tool detects mentions of existing pages and Wikipedia terms and lets you opt in to linking each. Unknown authors prompt you to register them inline. Missing `assets/*` references abort the publish.

4. **Deploy.**

   ```bash
   cd project && npm run deploy
   ```

   Builds, bundles `wiki/` and `assets/` with the dist, and force-pushes to `gh-pages`.

## Assets

Drop files into `assets/` and reference them by relative path:

```markdown
![diagram](assets/architecture.png)
[whitepaper](assets/foo.pdf)
```

Dev: served by Vite middleware. Prod: resolved relative to the deployed site (no GitHub raw fetches). Publishing fails fast if any referenced file is missing.

## Authors

`authors.json` is a flat map. `name` is the only required field; `links` is optional.

```json
{
  "abdullah": {
    "name": "Abdullah Ahmad",
    "links": [
      { "url": "https://github.com/MAbdullahAhmad" },
      { "url": "https://devabdullah.com" }
    ]
  }
}
```

The byline under each page title links to `/#/author/<username>`. Link icons are auto-detected from hostname (GitHub, LinkedIn, X, Instagram, YouTube, Facebook, Upwork) — anything else gets a globe or generic link icon. Schema is open; extend with bios, avatars, etc. as you need them.

When a draft references an unknown username, `publish.bash` prompts:

```
Warning: author 'jane' is not registered.
Create author 'jane'? [Y/n] y
Full name for 'jane': Jane Doe
Created: jane → Jane Doe
```

Decline and that file's publish is aborted; the rest of the batch continues.

## How it works

- **Tags.** `Domain → Subject → Topic → Subtopic`, auto-derived from the draft's directory. Color-coded badges throughout the UI.
- **Index.** [project/scripts/generate-index.js](project/scripts/generate-index.js) builds `wiki/_index.json` containing taxonomy, the authors map, and per-page metadata (excerpt, sections, keywords, word count). Capped at 10 MB per file — overflow spills into `_index-1.json`, `_index-2.json`, … and readers concat them transparently.
- **Self-contained deploy.** `npm run deploy` ships `dist/` + `wiki/` + `assets/` to `gh-pages`. The site fetches content via relative paths, so it never depends on `main` being merged or the user-pages CDN being warm.
- **SPA fallback.** [project/public/404.html](project/public/404.html) stashes the requested path in `sessionStorage` and redirects to the base **once** (a sentinel prevents reload loops); [project/index.html](project/index.html) restores it as a hash route.
- **Performance.** Routes are code-split via `React.lazy`. The home page only fetches the base index; search/browse/tag pages fetch the rotated chunks lazily on first visit. Browse and Search paginate at 60 rows.

## Develop

```bash
cd project
npm install
npm run dev              # Vite dev server (serves wiki/ and assets/)
npm run generate-index   # Rebuild wiki/_index.json
npm run build            # generate-index + tsc + vite build
npm run deploy           # build + push to gh-pages
```

The canonical URL is `/Wiki/` (case-sensitive). The lowercase variant `/wiki/` cannot be served by this repo — it would have to live on `mabdullahahmad.github.io`.
