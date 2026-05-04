# Authoring

Drafts live under `drafts/`. The directory you place a file in determines its tags, and the filename becomes its slug. The publish step (see [publishing.md](publishing.md)) copies the processed file to `wiki/<slug>.md`.

## Tag derivation

```
drafts/<Domain>/<Subject>/<file>.md           → topic     (name = file's title)
drafts/<Domain>/<Subject>/<Topic>/<file>.md   → subtopic  (name = file's title)
drafts/<Domain>/<file>.md                     → domain    (rare; usually pages live deeper)
```

Tag types are colored consistently across the UI:

| Type     | Color  | Example                |
| -------- | ------ | ---------------------- |
| domain   | Purple | Technology, Science    |
| subject  | Blue   | Computer Science       |
| topic    | Green  | Artificial Intelligence|
| subtopic | Amber  | Machine Learning       |

The home page taxonomy panel is built directly from the directory tree under `drafts/`, so adding a new `Domain/Subject/` folder with at least one file is enough to make it appear.

## Frontmatter

```yaml
---
title: "Machine Learning"               # required
description: "Brief one-liner."         # optional, shown in lists and previews
author: abdullah                        # optional, references authors.json
co-authors:                             # optional, list of usernames
  - jane
  - kim
related:                                # optional, slugs to other wiki pages
  - artificial-intelligence
  - deep-learning
tags:                                   # optional, manual override
  - type: subtopic
    name: Machine Learning
---
```

The `tags` field is normally **derived** from the directory path; you only need to set it manually for unusual cases (e.g. a page at the wrong depth that should be tagged differently). When derived, the publish helper adds a single tag of the appropriate type at the front of the `tags` list and preserves any others you've added.

## Body conventions

Standard GFM markdown. Headings up to `###` are extracted as the page's section list (used for the on-page table of contents). Bold text and headings are auto-extracted as keywords for search.

In-wiki links use the slug as the href:

```markdown
This builds on [linear algebra](linear-algebra) and [calculus](calculus).
```

The publish tool can detect mentions of existing pages and offer to convert them into links automatically — see [publishing.md](publishing.md).

Asset references use the `assets/<path>` form:

```markdown
![architecture](assets/architecture.png)
```

See [assets.md](assets.md) for details.

## Drafts directory hygiene

- The directory hierarchy is the source of truth for tags. Renaming a folder retags every page under it.
- Filenames should already be slugs (lowercase, hyphenated). The slug is the filename, not the title.
- You can have empty subject directories — they show up in the home-page taxonomy until you add files.
