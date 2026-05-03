#!/usr/bin/env node

/**
 * Generates wiki/_index.json from all markdown files in the wiki/ directory.
 * Parses frontmatter from each .md file and builds a searchable index.
 * Auto-builds the taxonomy from the drafts/ directory structure.
 */

import { readdir, readFile, writeFile, stat, unlink } from 'fs/promises';
import { join, resolve, basename } from 'path';
import { existsSync } from 'fs';

const WIKI_DIR = resolve(import.meta.dirname, '../../wiki');
const DRAFTS_DIR = resolve(import.meta.dirname, '../../drafts');
const OUTPUT = join(WIKI_DIR, '_index.json');

// Max bytes for any single index file (base or chunk). Pages are split greedily
// across `_index.json` (base, also holds taxonomy) and `_index-1.json`,
// `_index-2.json`, … so each file stays under this size.
const CHUNK_BYTES = 10 * 1024 * 1024;

// Fallback taxonomy (used when drafts/ doesn't exist)
const FALLBACK_TAXONOMY = {
  Technology: {
    'Computer Science': {
      'Artificial Intelligence': ['Machine Learning', 'Deep Learning', 'Natural Language Processing'],
      'Data Structures': [],
      'Algorithms': [],
      'Python Programming': [],
      'Web Development': ['Frontend Development', 'Backend Development'],
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
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
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

    if (!line.startsWith(' ') && !line.startsWith('\t') && !line.startsWith('-')) {
      if (inTagItem && Object.keys(tagObj).length > 0) {
        if (!currentList) currentList = [];
        currentList.push({ ...tagObj });
        tagObj = {};
        inTagItem = false;
      }
      if (currentList && currentKey) {
        meta[currentKey] = currentList;
        currentList = null;
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

function slugToTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractExcerpt(body) {
  const lines = body.split('\n');
  const paragraphs = [];
  let current = '';
  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith('```') || line.startsWith('|')) continue;
    const trimmed = line.trim();
    if (trimmed === '') {
      if (current) {
        paragraphs.push(current.trim());
        current = '';
      }
    } else {
      current += ' ' + trimmed;
    }
  }
  if (current) paragraphs.push(current.trim());
  return (paragraphs[0] || '').slice(0, 300);
}

function extractSections(body) {
  const sections = [];
  for (const line of body.split('\n')) {
    const match = line.match(/^#{1,3}\s+(.+)/);
    if (match) sections.push(match[1].trim());
  }
  return sections;
}

function extractKeywords(body, title) {
  const keywords = new Set();
  // Add words from bold text
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let m;
  while ((m = boldRegex.exec(body)) !== null) {
    keywords.add(m[1].trim());
  }
  // Add section headings
  for (const line of body.split('\n')) {
    const match = line.match(/^#{1,4}\s+(.+)/);
    if (match) keywords.add(match[1].trim());
  }
  // Add title words
  for (const word of title.split(/\s+/)) {
    if (word.length > 3) keywords.add(word);
  }
  return [...keywords].slice(0, 30);
}

/**
 * Scans the drafts/ directory structure and builds a taxonomy tree.
 * Structure: drafts/<Domain>/<Subject>/<Topic-dir>/ contains subtopic files
 * Files at drafts/<Domain>/<Subject>/*.md are topics.
 */
async function buildTaxonomyFromDrafts() {
  if (!existsSync(DRAFTS_DIR)) return FALLBACK_TAXONOMY;

  const taxonomy = {};

  async function readDirSafe(dir) {
    try {
      return await readdir(dir);
    } catch {
      return [];
    }
  }

  // Level 1: Domains
  const domains = await readDirSafe(DRAFTS_DIR);
  for (const domain of domains) {
    const domainPath = join(DRAFTS_DIR, domain);
    const domainStat = await stat(domainPath).catch(() => null);
    if (!domainStat?.isDirectory()) continue;

    taxonomy[domain] = {};

    // Level 2: Subjects
    const subjects = await readDirSafe(domainPath);
    for (const subject of subjects) {
      const subjectPath = join(domainPath, subject);
      const subjectStat = await stat(subjectPath).catch(() => null);
      if (!subjectStat?.isDirectory()) continue;

      taxonomy[domain][subject] = {};

      // Level 3: items are either topic files or topic directories
      const items = await readDirSafe(subjectPath);
      for (const item of items) {
        const itemPath = join(subjectPath, item);
        const itemStat = await stat(itemPath).catch(() => null);

        if (itemStat?.isDirectory()) {
          // This is a topic directory; files inside are subtopics
          const subtopicFiles = await readDirSafe(itemPath);
          const subtopics = subtopicFiles
            .filter((f) => f.endsWith('.md'))
            .map((f) => slugToTitle(basename(f, '.md')));
          taxonomy[domain][subject][item] = subtopics;
        } else if (item.endsWith('.md')) {
          // This is a topic file
          const topicName = slugToTitle(basename(item, '.md'));
          if (!taxonomy[domain][subject][topicName]) {
            taxonomy[domain][subject][topicName] = [];
          }
        }
      }
    }
  }

  return taxonomy;
}

async function main() {
  const files = await readdir(WIKI_DIR);
  const mdFiles = files.filter((f) => f.endsWith('.md') && !f.startsWith('_'));

  const pages = [];

  for (const file of mdFiles) {
    const slug = file.replace(/\.md$/, '');
    const content = await readFile(join(WIKI_DIR, file), 'utf-8');
    const { meta, body } = parseFrontmatter(content);
    const title = meta.title || slugToTitle(slug);

    pages.push({
      slug,
      title,
      description: meta.description || '',
      tags: meta.tags || [],
      related: meta.related || [],
      excerpt: extractExcerpt(body),
      sections: extractSections(body),
      keywords: extractKeywords(body, title),
      wordCount: body.split(/\s+/).filter(Boolean).length,
    });
  }

  pages.sort((a, b) => a.title.localeCompare(b.title));

  const taxonomy = await buildTaxonomyFromDrafts();
  const generatedAt = new Date().toISOString();

  // Remove any pre-existing rotated chunks so stale ones never linger.
  const existingFiles = await readdir(WIKI_DIR);
  for (const f of existingFiles) {
    if (/^_index-\d+\.json$/.test(f)) {
      await unlink(join(WIKI_DIR, f));
    }
  }

  // Greedy split: fill the base file (which also carries taxonomy) up to
  // CHUNK_BYTES, then spill remaining pages into _index-1.json, _index-2.json…
  const slices = [];
  let current = [];
  let currentBytes = 0;
  let isFirst = true;

  const overheadBytes = (firstChunk) =>
    Buffer.byteLength(
      JSON.stringify(
        firstChunk
          ? { pages: [], taxonomy, generatedAt, chunks: 0 }
          : { pages: [] },
        null,
        2
      ),
      'utf-8'
    );

  let budget = CHUNK_BYTES - overheadBytes(true);

  for (const page of pages) {
    const pageBytes = Buffer.byteLength(JSON.stringify(page, null, 2), 'utf-8') + 4; // ", "
    if (current.length > 0 && currentBytes + pageBytes > budget) {
      slices.push(current);
      current = [];
      currentBytes = 0;
      isFirst = false;
      budget = CHUNK_BYTES - overheadBytes(false);
    }
    current.push(page);
    currentBytes += pageBytes;
  }
  if (current.length > 0 || slices.length === 0) slices.push(current);

  const chunks = Math.max(slices.length - 1, 0);
  const base = {
    pages: slices[0] || [],
    taxonomy,
    generatedAt,
    chunks,
  };
  await writeFile(OUTPUT, JSON.stringify(base, null, 2), 'utf-8');

  for (let i = 1; i < slices.length; i++) {
    const chunkPath = join(WIKI_DIR, `_index-${i}.json`);
    await writeFile(chunkPath, JSON.stringify({ pages: slices[i] }, null, 2), 'utf-8');
  }

  if (chunks > 0) {
    console.log(`Generated index with ${pages.length} pages, split into base + ${chunks} chunk(s) at ${WIKI_DIR}`);
  } else {
    console.log(`Generated index with ${pages.length} pages at ${OUTPUT}`);
  }
}

main().catch((err) => {
  console.error('Failed to generate index:', err);
  process.exit(1);
});
