#!/usr/bin/env node

/**
 * Generates wiki/_index.json from all markdown files in the wiki/ directory.
 * Parses frontmatter from each .md file and builds a searchable index with taxonomy.
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

const WIKI_DIR = resolve(import.meta.dirname, '../../wiki');
const OUTPUT = join(WIKI_DIR, '_index.json');

// Define the taxonomy hierarchy: Domain > Subject > Topic > Sub-topic
const TAXONOMY = {
  Technology: {
    'Computer Science': {
      'Artificial Intelligence': ['Machine Learning', 'Deep Learning', 'Natural Language Processing'],
      'Data Structures': [],
      'Algorithms': [],
      'Python Programming': [],
      'Web Development': ['Frontend Development', 'Backend Development'],
    },
    'Electronics': {
      'Digital Electronics': [],
    },
  },
  Science: {
    Physics: {
      'Quantum Mechanics': ['Quantum Computing'],
      'Classical Mechanics': [],
    },
    Mathematics: {
      'Linear Algebra': [],
      'Calculus': [],
      'Statistics': [],
    },
  },
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const yamlStr = match[1];
  const body = match[2].trim();
  const meta = {};

  let currentKey = '';
  let currentList = null;
  let inTagItem = false;
  let tagObj = {};

  for (const line of yamlStr.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (!line.startsWith(' ') && !line.startsWith('-')) {
      if (currentList && currentKey) {
        meta[currentKey] = currentList;
        currentList = null;
      }
      if (inTagItem && Object.keys(tagObj).length > 0) {
        if (!currentList) currentList = [];
        currentList.push({ ...tagObj });
        tagObj = {};
        inTagItem = false;
      }
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        const key = trimmed.slice(0, colonIdx).trim();
        const val = trimmed.slice(colonIdx + 1).trim();
        currentKey = key;
        if (val) {
          meta[key] = val.replace(/^["']|["']$/g, '');
        }
      }
    } else if (trimmed.startsWith('- type:')) {
      if (!currentList) currentList = [];
      if (inTagItem && Object.keys(tagObj).length > 0) {
        currentList.push({ ...tagObj });
      }
      tagObj = { type: trimmed.slice(7).trim().replace(/^["']|["']$/g, '') };
      inTagItem = true;
    } else if (trimmed.match(/^name:/) && inTagItem) {
      tagObj.name = trimmed.slice(5).trim().replace(/^["']|["']$/g, '');
    } else if (trimmed.startsWith('- ') && !inTagItem) {
      if (!currentList) currentList = [];
      const val = trimmed.slice(2).trim().replace(/^["']|["']$/g, '');
      currentList.push(val);
    }
  }

  if (inTagItem && Object.keys(tagObj).length > 0) {
    if (!currentList) currentList = [];
    currentList.push({ ...tagObj });
  }
  if (currentList && currentKey) {
    meta[currentKey] = currentList;
  }

  return { meta, body };
}

async function main() {
  const files = await readdir(WIKI_DIR);
  const mdFiles = files.filter((f) => f.endsWith('.md') && !f.startsWith('_'));

  const pages = [];

  for (const file of mdFiles) {
    const slug = file.replace(/\.md$/, '');
    const content = await readFile(join(WIKI_DIR, file), 'utf-8');
    const { meta } = parseFrontmatter(content);

    pages.push({
      slug,
      title: meta.title || slug,
      description: meta.description || '',
      tags: meta.tags || [],
      related: meta.related || [],
    });
  }

  pages.sort((a, b) => a.title.localeCompare(b.title));

  const index = {
    pages,
    taxonomy: TAXONOMY,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(OUTPUT, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`Generated index with ${pages.length} pages at ${OUTPUT}`);
}

main().catch((err) => {
  console.error('Failed to generate index:', err);
  process.exit(1);
});
