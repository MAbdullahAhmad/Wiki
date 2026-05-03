# Wiki - Personal Knowledge Base

A markdown-based personal wiki/encyclopedia built with React, TypeScript, and Tailwind CSS. Browse topics across Technology, Science, and Mathematics with hierarchical tagging, full-text search, and Wikipedia-style link previews.

**Live:** [mabdullahahmad.github.io/Wiki](https://mabdullahahmad.github.io/Wiki/)

## Features

- **Markdown Content** - Write wiki pages in plain markdown with YAML frontmatter
- **Hierarchical Tags** - Organize pages by Domain > Subject > Topic > Sub-topic with color-coded badges
- **Full-Screen Search** - Search across all pages, titles, descriptions, tags, excerpts, and keywords
- **Link Previews** - Hover over any wiki link to see a preview popup (like Wikipedia)
- **Tag Breadcrumbs** - Hover over a tag to see its full hierarchy in a notification-style breadcrumb
- **Related Pages** - Each page can link to related topics
- **Publish Tool** - Interactive CLI to publish drafts with auto-link detection
- **GitHub Pages** - Built site served from the `pages` branch, fetches content from main

## Structure

```
Wiki/
├── drafts/                  # Source of truth - organize by hierarchy
│   ├── Technology/
│   │   └── Computer Science/
│   │       ├── algorithms.md              # Topic-level page
│   │       ├── Artificial Intelligence/
│   │       │   ├── machine-learning.md    # Sub-topic page
│   │       │   └── deep-learning.md
│   │       └── ...
│   └── Science/
│       ├── Physics/
│       └── Mathematics/
├── wiki/                    # Published pages (flat, auto-managed)
│   ├── _index.json          # Auto-generated index with metadata
│   └── *.md                 # Published markdown files
├── project/                 # React application
│   ├── src/                 # App source code
│   ├── scripts/
│   │   ├── generate-index.js   # Builds _index.json + taxonomy
│   │   ├── publish-helper.js   # Backend for publish.bash
│   │   └── deploy.js           # Deploys to pages branch
│   └── package.json
├── publish.bash             # Interactive publish tool
└── README.md
```

## Workflow: Adding & Publishing Pages

### 1. Create a draft

Place your markdown file in `drafts/` following the directory hierarchy:

```
drafts/<Domain>/<Subject>/<file>.md          → tagged as topic
drafts/<Domain>/<Subject>/<Topic>/<file>.md  → tagged as subtopic
```

Tags are **automatically derived** from the directory path. The filename becomes the slug.

### 2. Publish

```bash
./publish.bash              # Interactive: pick which drafts to publish
./publish.bash --all        # Publish everything
./publish.bash myfile.md    # Publish a specific file
```

The publish tool will:
- Auto-detect mentions of existing wiki page titles in your content
- Let you select which to convert to `[linked text](slug)` markdown links
- Derive the correct tag type from the directory structure
- Copy the processed file to `wiki/<slug>.md`
- Regenerate the search index with excerpts, keywords, and updated taxonomy

### 3. Deploy

```bash
cd project
npm run deploy              # Build and push to pages branch
git push origin pages       # Publish to GitHub Pages
```

## Wiki Page Format

Each markdown file uses YAML frontmatter:

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

## Tech Stack

- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **react-markdown** - Markdown rendering
- **react-router-dom** - Client-side routing (HashRouter for GitHub Pages)
