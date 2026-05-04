# Assets

Images, PDFs, videos, and any other binary referenced by markdown live in [`assets/`](../assets/) at the repo root. They ship with the deploy.

## Reference syntax

Use a relative path beginning with `assets/`:

```markdown
![architecture](assets/architecture.png)
[whitepaper](assets/foo.pdf)
<video controls src="assets/demo.mp4"></video>
```

The path you write in markdown is the path stored in the published file — there's no rewriting at publish time. Resolution happens at render time:

| Environment | Resolution                                                            |
| ----------- | --------------------------------------------------------------------- |
| Dev         | Vite middleware serves `assets/<path>` from the local `assets/` directory |
| Prod        | Renderer resolves the path relative to the deployed site root          |

The renderer ([MarkdownRenderer.tsx](../project/src/components/MarkdownRenderer.tsx)) calls `CONFIG.getAssetUrl()` for every `<img>` and any `<a>` whose href starts with `assets/`. Non-asset images and links pass through unchanged.

## Validation

When you run `./publish.bash`, the helper scans the draft for any `[…](assets/…)` or `![…](assets/…)` references and verifies each file exists under `assets/`. Missing files abort the publish with an error like:

```
ERROR: machine-learning references missing assets:
  - assets/architecture.png
  - assets/diagram.svg
Add them under /path/to/Wiki/assets/ or fix the path, then republish.
```

The check is path-aware: paths trying to escape the `assets/` directory (e.g., `assets/../secret`) are also flagged.

## Subdirectories

Subdirectories are fine:

```
assets/
├── diagrams/
│   └── arch-2026.png
└── papers/
    └── foo.pdf
```

```markdown
![arch](assets/diagrams/arch-2026.png)
```

## Supported MIME types in dev

The Vite middleware at [project/vite.config.ts](../project/vite.config.ts) recognizes common types (PNG, JPG, GIF, WEBP, SVG, AVIF, ICO, BMP, PDF, MP4, WEBM, MP3, WAV, ZIP, JSON, TXT, MD). Anything else is served as `application/octet-stream` — browsers handle most binaries fine that way, so you rarely need to extend it.

In production, MIME type is set by GitHub Pages, which has its own list.

## Why a separate `assets/` and not a markdown-relative resolution?

Two reasons:

1. The wiki is flat. Every page lives at `wiki/<slug>.md`, no subdirectories. There's no natural "next to the page" location for binaries.
2. `assets/` is shared — multiple pages can reference the same image without duplicating it.

Trade-off: you can't co-locate a draft with its images. If that becomes a pain point, see [contributing.md](contributing.md) — supporting per-page asset folders is a small extension.

## Naming collision with the build

Vite outputs hashed JS/CSS chunks under `dist/assets/` (e.g., `index-Bg9wcJxG.js`). The deploy step copies both `dist/` (which puts those chunks at `<deploy>/assets/`) and the user `assets/` directory into the same target. The hashes guarantee no real-world collision, but if you ever name a user file something like `index-XxXxXxXx.js`, you'd shadow a build chunk. Don't.
