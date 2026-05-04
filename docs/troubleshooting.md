# Troubleshooting

## Live site shows GitHub's generic 404

GitHub Pages isn't pointed at the right branch. Open Settings → Pages, set Source to "Deploy from a branch", Branch `gh-pages`, folder `/ (root)`. See [deployment.md](deployment.md).

If Pages was previously configured for a different branch (e.g. `pages`, `master`, `main`), the new branch needs to be saved explicitly even if it's listed.

## Live site reload-loops at the base URL

This was a real bug; if it returns, the SPA fallback got reverted. Check that:

- `project/public/404.html` only redirects when `sessionStorage` doesn't already have the `__spa_redirect_in_flight__` sentinel.
- `project/index.html` reads the stash and clears the sentinel.

A naive 404 that always redirects to the base path will loop if the base path itself returns 404 (which can happen briefly during a fresh deploy).

## Browser shows the old theme/title after deploy

Hard-refresh (Ctrl/Cmd-Shift-R). HTML caching at GitHub's CDN can also delay propagation by ~30 seconds; check `curl -sI https://<site>/` for the `etag` header to confirm you're getting the fresh response.

## "ERROR: <slug> references unknown authors"

The draft has an `author:` or `co-authors:` username that's not in `authors.json`. Run `./publish.bash` and accept the registration prompt, or edit `authors.json` directly. See [authors.md](authors.md).

## "ERROR: <slug> references missing assets"

A markdown reference like `![](assets/foo.png)` doesn't resolve. Check the path:

```bash
ls assets/foo.png
```

Common causes: typo, missing file extension, file inside a subdirectory you forgot to include in the path. The validator is strict about exact filenames.

## Author byline renders but names aren't bold/full

The username is referenced but not in `authors.json`. The byline falls back to showing the raw username. Register the author or edit `authors.json` directly.

## Pages aren't appearing in the live site

Check the deployed index:

```bash
curl -s https://mabdullahahmad.github.io/Wiki/wiki/_index.json | jq '.pages | length'
```

If the count is wrong, the deploy didn't include the latest `wiki/` content. Re-run `npm run deploy` from a clean working tree.

If the page exists in the index but doesn't render, it's a frontend bug — check the browser console.

## `npm run build` fails with type errors

Verify the type check standalone:

```bash
cd project
npx tsc --noEmit
```

Most often after editing the `Author` interface or `WikiPageMeta` — the index generator and renderer both have fields hard-coded; keep them in sync.

## `git push origin main` rejected by branch protection

```
remote: - Changes must be made through a pull request.
```

Either open a PR (`git push origin main:my-branch && open the PR URL`), temporarily relax the protection rule, or use a PR-merging tool like the `gh` CLI. The deploy doesn't need `main` to be up to date — `npm run deploy` works from your local working tree.

## Vite dev server doesn't serve a file under `assets/`

Check that the file is actually in `<repo>/assets/`, not `project/assets/` or somewhere else. The dev middleware reads from the repo root `assets/`.

If the extension isn't in the MIME map at the top of [vite.config.ts](../project/vite.config.ts), the file is served as `application/octet-stream` — most browsers handle this fine, but if you hit a case where it doesn't, add the MIME entry.

## `_index.json` keeps growing past 10 MB

It shouldn't — `generate-index.js` rotates. Verify:

```bash
ls -lh wiki/_index*.json
```

You should see `_index.json` and one or more `_index-N.json`. If you see a single huge file, the rotation logic isn't running — most likely you have a stale `_index.json` from before rotation was added. Delete it and re-run `npm run generate-index`.

## Search doesn't find a page that was just published

The search reads from `_index.json`. If you didn't run the index regeneration step (it's automatic at the end of `./publish.bash`, but skipped if you bypass the script), search won't see the new page. Run:

```bash
cd project && npm run generate-index
```

Then refresh the dev server.

## CDN serves stale content

GitHub raw and Pages have CDN caching of ~5 minutes. After a deploy, the live site is up immediately, but `/wiki/welcome.md` fetched directly may take a few minutes. The app uses `cache: "default"` fetches — if you've shipped a critical fix and need to bust caches aggressively, change the URLs in `config.ts` to append a build-time version query string.
