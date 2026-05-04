# Contributing

Most ideas for extending this project fall into one of a few patterns. The architecture is small enough that almost any feature lands in two or three files.

## Add a frontmatter field to pages

E.g. you want every page to have a `published_at` date.

1. **Persist it.** Add it to drafts; the publish helper's parser already accepts arbitrary keys.
2. **Index it.** Add it to the `pages.push({ ... })` literal in [generate-index.js](../project/scripts/generate-index.js).
3. **Type it.** Add to `WikiPageMeta` in [types/wiki.ts](../project/src/types/wiki.ts).
4. **Render it.** Wherever in the UI you want it shown — most likely [WikiPageView.tsx](../project/src/components/WikiPageView.tsx).

If the field is a list, also update `serializeFrontmatter` in [publish-helper.js](../project/scripts/publish-helper.js) to emit it in canonical position so the render-side parser catches it.

## Add a profile field to authors

E.g. bios.

1. **Persist it.** Edit `authors.json`. Schema is open — add `"bio": "..."` to any user.
2. **Type it.** Add to the `Author` interface in [types/wiki.ts](../project/src/types/wiki.ts).
3. **Render it.** [AuthorPage.tsx](../project/src/components/AuthorPage.tsx) is the natural home; for byline-level display, see [AuthorByline.tsx](../project/src/components/AuthorByline.tsx).

The full `authors` map is already embedded in `_index.json`, so you don't have to change the index pipeline.

## Add a new platform icon

[AuthorByline.tsx](../project/src/components/AuthorByline.tsx) and [AuthorPage.tsx](../project/src/components/AuthorPage.tsx) each have a `HOST_ICONS` array:

```ts
{ match: /(^|\.)mastodon\.social$/i, icon: Mastodon, label: 'Mastodon' },
```

Add the entry, import the lucide-react icon. Done.

(If you find yourself maintaining the same array in two files, factor it into a shared util — kept duplicated for now because it's small.)

## Add a new page-list filter

[BrowsePage.tsx](../project/src/components/BrowsePage.tsx) currently filters by tag type. To add (e.g.) "by author":

1. Add a state hook for the filter selection.
2. Add a control to the toolbar (the existing tag-type filter is a good template).
3. Apply it in the `useMemo` that builds `filteredPages`.

The 60-row pagination ("visible") and `Load more` button work without changes — they operate on whatever `filteredPages` ends up being.

## Add a new top-level route

1. Add a `lazy(() => import(...))` import in [App.tsx](../project/src/App.tsx).
2. Add the `<Route path="..." element={...} />`.
3. Add a nav link in [Layout.tsx](../project/src/components/Layout.tsx) if it should appear in the header.

Use HashRouter conventions: paths look like `/foo/:bar` (no leading hash; HashRouter adds it).

## Add another content type

E.g. "blog posts" alongside wiki pages.

The simpler approach is to add a new tag type — wiki pages with the right tag *are* blog posts. The harder approach is parallel `wiki/`-like directories with their own indexes. If you go that route, you'll be touching:

- A new generator script (mirror of `generate-index.js`).
- A new `useFooIndex` hook + service.
- New routes for listing and viewing.
- The `deploy.js` to ship the new content directory.

## Switch the YAML parser

If the hand-rolled parsers ever cause trouble:

```bash
npm install js-yaml
```

Replace `parseFrontmatter` in [wikiService.ts](../project/src/services/wikiService.ts) and [publish-helper.js](../project/scripts/publish-helper.js) — the interface is `(raw: string) → { meta, content }`. `serializeFrontmatter` (publish-helper only) needs to use `js-yaml.dump` and add the `---` fences.

## Coding conventions

- TypeScript strict mode is on; don't relax it.
- Components are functional with hooks. No class components.
- Tailwind utility classes for styling. Theme tokens live in [index.css](../project/src/index.css) as CSS vars.
- React Router's `Link` for in-app navigation; raw `<a>` for external links (with `target="_blank" rel="noopener noreferrer"`).
- Fetches go through [services/wikiService.ts](../project/src/services/wikiService.ts). Don't `fetch()` in components.
- Don't fetch from `raw.githubusercontent.com` in production code paths — content ships with the deploy.
- Hand-written YAML parsers must be kept in sync between `publish-helper.js` and `wikiService.ts` for the fields the UI cares about.

## Submitting changes

If you have push access:

```bash
git checkout -b my-feature
# work
git commit -m "..."
git push origin my-feature
```

Then open a PR. If branch protection is on, the PR is required.

Otherwise, fork, push your branch, open a PR from the fork.

For trivial doc fixes, edit on GitHub directly and let the web UI open the PR.
