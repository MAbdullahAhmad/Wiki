# Deployment

The site is deployed to GitHub Pages from the `gh-pages` branch. Source code lives on `main`. The two are independent — you can deploy whatever's currently in your local working tree without merging anything to `main` first.

## One-time GitHub Pages setup

1. Open `https://github.com/<you>/<repo>/settings/pages`.
2. **Source:** "Deploy from a branch".
3. **Branch:** `gh-pages`, folder `/ (root)`.
4. **Save.**

The first deploy after enabling Pages can take 1–2 minutes to propagate. Subsequent deploys are usually live within ~30 seconds.

## How to deploy

```bash
cd project
npm run deploy
```

[scripts/deploy.js](../project/scripts/deploy.js) does:

1. **Build** — runs `npm run build` (regenerates the index + tsc + vite build).
2. **Stage** — copies `dist/`, `wiki/`, and `assets/` into a temp directory outside the repo. Adds `.nojekyll` to disable Jekyll processing.
3. **Push** — inits a fresh git repo in the temp dir, commits, force-pushes to `gh-pages`.
4. **Clean up** — removes the temp dir.

The script never switches branches in your working tree, so your shell CWD and any uncommitted work stay intact.

## Self-contained deploy

`gh-pages` contains everything the live site needs:

```
gh-pages/
├── .nojekyll
├── 404.html
├── index.html
├── favicon.svg
├── assets/                 # vite build chunks + user assets/
│   ├── index-XXXX.js
│   ├── index-XXXX.css
│   ├── WikiPageView-XXXX.js
│   ├── ...
│   └── (user-uploaded files)
└── wiki/                   # markdown content + index
    ├── _index.json
    ├── _index-1.json (+ rotated chunks if needed)
    └── *.md
```

The frontend ([config.ts](../project/src/config.ts)) fetches content via paths relative to the document — no `raw.githubusercontent.com` calls. This means:

- The live site doesn't depend on `main` being merged with your latest source.
- Content updates are pushed atomically with code updates.
- You can roll back the entire site by reverting `gh-pages`.

## SPA fallback

GitHub Pages serves [404.html](../project/public/404.html) for any path under `/Wiki/` that doesn't match a file. The 404 script:

1. Stashes the requested path in `sessionStorage`.
2. Sets a "redirect-in-flight" sentinel in `sessionStorage`.
3. Redirects to the base path (`/Wiki/`) once.

[index.html](../project/index.html) reads the stash on load and applies it as a hash route, so deep links work:

```
User visits  /Wiki/page/welcome
404.html     stashes "page/welcome" + sentinel; redirects → /Wiki/
index.html   reads stash; sets location.hash = "#page/welcome"
HashRouter   navigates to that route
```

The sentinel prevents reload loops: if the redirect lands on another 404 (e.g., the base path itself isn't found yet during a fresh deploy), the second 404 sees the sentinel, clears it, and renders "Page not found" instead of redirecting again.

## Deploying without GitHub

The deploy script just builds and copies — it doesn't depend on anything GitHub-specific other than the `gh-pages` branch convention. To deploy elsewhere:

1. Run `npm run build` in `project/`.
2. Combine `dist/` + `wiki/` + `assets/` + `.nojekyll` into a single directory.
3. Serve it as a static site.

The app uses HashRouter, so any static host that returns `index.html` for the base path will work. The 404 handler is GitHub-Pages-specific but harmless elsewhere.

## Branch protection

If `main` has branch protection (PR-only), `git push origin main` from a regular session is blocked. Workflows:

- Open a PR from a feature branch and merge in the GitHub UI.
- Temporarily relax the rule, push, re-enable.
- Use the `gh` CLI with PR auto-merge if available.

Deployment doesn't depend on `main` — `npm run deploy` force-pushes `gh-pages` directly from your local files.
