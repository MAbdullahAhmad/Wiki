# Wiki - Personal Knowledge Base

A markdown-based personal wiki/encyclopedia built with React, TypeScript, and Tailwind CSS. Browse topics across Technology, Science, and Mathematics with hierarchical tagging, full-text search, and Wikipedia-style link previews.

**Live:** [mabdullahahmad.github.io/Wiki](https://mabdullahahmad.github.io/Wiki/)

## Features

- **Markdown Content** - Write wiki pages in plain markdown with YAML frontmatter
- **Hierarchical Tags** - Organize pages by Domain > Subject > Topic > Sub-topic with color-coded badges
- **Full-Screen Search** - Search across all pages, titles, descriptions, and tags with sorting and filtering
- **Link Previews** - Hover over any wiki link to see a preview popup (like Wikipedia)
- **Tag Breadcrumbs** - Hover over a tag to see its full hierarchy in a notification-style breadcrumb
- **Related Pages** - Each page can link to related topics
- **GitHub Pages** - Built site served from the `pages` branch, fetches content from main

## Structure

```
Wiki/
├── wiki/                    # Markdown content (on main branch)
│   ├── _index.json          # Auto-generated page index
│   ├── artificial-intelligence.md
│   ├── machine-learning.md
│   └── ...
├── project/                 # React application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── services/        # Data fetching & parsing
│   │   ├── hooks/           # React hooks
│   │   ├── types/           # TypeScript types
│   │   └── lib/             # Utilities
│   ├── scripts/
│   │   ├── generate-index.js  # Generates _index.json
│   │   └── deploy.js         # Deploys to pages branch
│   └── package.json
└── README.md
```

## Wiki Page Format

Each markdown file in `wiki/` uses YAML frontmatter:

```markdown
---
title: "Machine Learning"
description: "A subset of AI that enables systems to learn from data"
tags:
  - type: subtopic
    name: Machine Learning
related:
  - artificial-intelligence
  - deep-learning
  - statistics
---

# Machine Learning

Content here...
```

### Tag Types

| Type | Color | Description |
|------|-------|-------------|
| **domain** | Purple | Top-level category (Technology, Science) |
| **subject** | Blue | Subject within a domain (Computer Science, Physics) |
| **topic** | Green | Specific topic (Artificial Intelligence, Calculus) |
| **subtopic** | Amber | Sub-topic within a topic (Machine Learning, Deep Learning) |

## Development

```bash
cd project
npm install
npm run generate-index   # Generate wiki/_index.json
npm run dev              # Start dev server
```

## Adding a New Page

1. Create a `.md` file in `wiki/` with frontmatter (title, description, tags, related)
2. Run `npm run generate-index` to update the index
3. The page will appear in search and browse views

## Building & Deploying

```bash
cd project
npm run build            # Generate index + build
npm run deploy           # Build and deploy to pages branch
git push origin pages    # Push to GitHub Pages
```

## Tech Stack

- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **react-markdown** - Markdown rendering
- **react-router-dom** - Client-side routing (HashRouter for GitHub Pages)
