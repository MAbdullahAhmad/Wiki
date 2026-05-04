# Authors

Authors are stored in [`authors.json`](../authors.json) at the repo root — a flat map keyed by username:

```json
{
  "abdullah": {
    "name": "Abdullah Ahmad",
    "links": [
      { "url": "https://github.com/MAbdullahAhmad" },
      { "url": "https://linkedin.com/in/m-abdullah-ahmad" },
      { "url": "https://upwork.com/freelancers/abdullah123" },
      { "url": "https://devabdullah.com" }
    ]
  }
}
```

`name` is the only required field. `links` is optional. The schema is intentionally open — you can add `bio`, `avatar`, or anything else later, and the renderer will ignore unknown fields until you wire them up.

## Frontmatter

Drafts reference authors by username:

```yaml
---
title: "Page title"
author: abdullah
co-authors:
  - jane
  - kim
---
```

Both fields are optional. A page can have only co-authors, only a primary author, or neither.

## Registering authors during publish

`./publish.bash` runs a check before each draft. Any unknown username triggers an interactive prompt:

```
Warning: author 'jane' is not registered.
Create author 'jane'? [Y/n] y
Full name for 'jane': Jane Doe
Created: jane → Jane Doe
```

Decline (or provide an empty name) and the publish for that file is aborted; the rest of the batch continues. The new author is appended to `authors.json` immediately.

You can also edit `authors.json` directly. The format is plain JSON.

## Byline

Each page renders a byline below the title via [AuthorByline.tsx](../project/src/components/AuthorByline.tsx):

> By **Abdullah Ahmad** ⛓ ⛓ ⛓ · with **Jane Doe**, **Kim Lee**

- Names are clickable — they link to `/#/author/<username>`.
- Profile links render as small icons after the name. Common platforms (GitHub, LinkedIn, X/Twitter, Instagram, YouTube, Facebook, Upwork) are auto-detected from the URL hostname; anything else gets a globe icon (likely a personal site) or a generic link icon as a last resort.
- Co-authors over the visible limit (default 3) collapse behind an "and N more" toggle that expands inline; "Show less" collapses again.

The visible-limit constant lives at the top of `AuthorByline.tsx`:

```ts
const COAUTHOR_VISIBLE_LIMIT = 3;
```

## Author pages

Each registered username has a profile page at `/#/author/<username>`, rendered by [AuthorPage.tsx](../project/src/components/AuthorPage.tsx). It shows:

- Display name + `@username`
- Profile links with platform icons
- Every page where the author appears as primary or co-author

Unregistered usernames (referenced by a page but missing from `authors.json`) still get a page — it just shows a note that the author hasn't been registered.

## Extending

The `Author` interface in [project/src/types/wiki.ts](../project/src/types/wiki.ts) has open shape:

```ts
export interface Author {
  name: string;
  links?: AuthorLink[];
  // add bio, avatar, etc. here
}
```

To extend:

1. Add the field to `authors.json` for an existing author.
2. Add the field to the `Author` interface.
3. Render it in `AuthorPage.tsx` (and optionally `AuthorChip` in `AuthorByline.tsx` for byline-level display).

Nothing else has to change — the index already serializes the full authors map verbatim.
