# Configuration

Most behavior is controlled by a few small files. None of them require a build step beyond the usual `npm run build`.

## `project/src/config.ts`

The runtime config the React app uses. The most likely fields you'll edit:

```ts
REPO_OWNER: 'MAbdullahAhmad',
REPO_NAME:  'Wiki',
BRANCH:     'main',
WIKI_DIR:   'wiki',
ASSETS_DIR: 'assets',
```

`REPO_OWNER` / `REPO_NAME` / `BRANCH` are not used by the app at runtime anymore (the deployed site fetches content via relative paths) — they remain for any future feature that links back to GitHub.

`WIKI_DIR` and `ASSETS_DIR` are the prefixes the renderer uses for relative URLs. Change them only if you also rename the corresponding directories on disk and update [`project/scripts/deploy.js`](../project/scripts/deploy.js) and [`project/vite.config.ts`](../project/vite.config.ts) to match.

The dev URLs live at `/wiki-index.json`, `/wiki-index-N.json`, `/wiki/<slug>.md`, `/assets/<path>` — these are intercepted by the Vite middleware in `vite.config.ts`.

## `project/scripts/generate-index.js`

```js
const CHUNK_BYTES = 10 * 1024 * 1024;
```

Cap for each index file. Reduce for testing the rotation path with small content; increase if your hosting can serve large files cheaply (default is conservative for GitHub raw + CDN behavior).

The taxonomy fallback (`FALLBACK_TAXONOMY`) is only used when `drafts/` doesn't exist on disk. If you want a different default for cold starts, edit it; otherwise it never fires.

## `project/scripts/deploy.js`

The deploy target branch is hardcoded:

```js
run('git checkout -b gh-pages', { cwd: tempDir });
run('git push --force origin gh-pages', { cwd: tempDir });
```

Change to `pages` or any other name if your GitHub Pages source is configured differently.

The temp directory pattern (`wiki-deploy-${Date.now()}`) makes it safe to run from any working state — your CWD never changes.

## `project/vite.config.ts`

Two extension points:

- **MIME map** (`MIME` const at the top): add file extensions for asset types that browsers need a content-type for.
- **Middleware** (`wikiDevPlugin`): the `/wiki/`, `/wiki-index*.json`, and `/assets/` routes mirror the production paths. If you add new content directories, mirror them here too.

## `project/src/components/AuthorByline.tsx`

```ts
const COAUTHOR_VISIBLE_LIMIT = 3;
```

How many co-authors to show inline before collapsing into "and N more".

## `project/src/components/AuthorPage.tsx` and `AuthorByline.tsx`

```ts
const HOST_ICONS: Array<{ match: RegExp; icon: ...; label: string }> = [
  { match: /(^|\.)github\.com$/i, icon: Github, label: 'GitHub' },
  ...
];
```

Add entries to extend platform-icon detection. The `match` regex runs against the URL hostname.

## `project/src/index.css`

CSS variables for the theme:

```css
:root {
  --primary: 142 71% 35%;     /* light mode primary (HSL) */
  --background: 0 0% 100%;
}
.dark {
  --primary: 142 70% 50%;     /* dark mode primary */
  --background: 0 0% 0%;      /* black, not blue-tinted */
}
```

Tag colors are Tailwind classes in [project/src/types/wiki.ts](../project/src/types/wiki.ts) — `TAG_COLORS`. Edit there to recolor tag badges.

## `scripts/patterns.txt`

The list of search terms used by `wikipedia-search.sh` to look for Wikipedia matches in drafts. One pattern per line. Add or remove lines to tune the suggestions.

## `.gitignore`

Already excludes `.publish/` (interactive workspace), `dist/`, `node_modules/`. Be careful adding rules for `wiki/` or `assets/` — those need to ship with the deploy.
