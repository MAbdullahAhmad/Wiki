# Contributing

Thanks for your interest in contributing! Most extension recipes — adding a frontmatter field, profile field, platform icon, route, etc. — are documented in [docs/contributing.md](docs/contributing.md).

## Quick start

```bash
git clone https://github.com/MAbdullahAhmad/Wiki.git
cd Wiki/project
npm install
npm run dev
```

See [docs/getting-started.md](docs/getting-started.md) for full setup.

## Workflow

1. Fork the repo (or branch from `main` if you have push access).
2. Make your changes. Type-check with `cd project && npx tsc --noEmit`.
3. Build to verify the bundle is clean: `npm run build`.
4. Commit with a clear message that explains the *why*, not just the *what*.
5. Open a PR. The CI is just a build check; passing it locally is sufficient.

## Where to make changes

- **Adding wiki content** — drop markdown into `drafts/` and run `./publish.bash`. See [docs/authoring.md](docs/authoring.md).
- **Frontend bug fixes / features** — `project/src/`.
- **Publish pipeline** — `publish.bash` and `project/scripts/publish-helper.js`.
- **Docs** — anything under `docs/` or the root `README.md` / `AGENTS.md`.

## Coding conventions

- TypeScript strict mode is on. Don't relax it.
- Tailwind for styling; theme tokens are CSS vars in `project/src/index.css`.
- Don't fetch from `raw.githubusercontent.com` — content ships with the deploy.
- Keep the two YAML parsers (`publish-helper.js` + `wikiService.ts`) in sync for fields the UI consumes.

## Reporting bugs

Use the issue templates under [.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/) for bug reports and feature requests.

## Code of Conduct

By contributing you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).
