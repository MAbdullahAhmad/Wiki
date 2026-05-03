#!/usr/bin/env node

/**
 * publish-helper.js - Node.js helper for the publish.bash script
 *
 * Commands:
 *   generate-local-links <draft-file>
 *     Detects mentions of existing wiki page titles in a draft.
 *     Writes .publish/local-links.json with include:false for user review.
 *     Output: LOCAL:<count>\nFILE:<path>
 *
 *   publish <draft-file>
 *     Reads .publish/local-links.json and .publish/wikipedia-links.json,
 *     applies links where include:true, updates frontmatter tags from
 *     directory structure, copies to wiki/<slug>.md.
 *     Output: "PUBLISHED <slug>" on success
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from 'fs';
import { basename, relative, resolve, join } from 'path';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const DRAFTS_DIR = resolve(REPO_ROOT, 'drafts');
const WIKI_DIR = resolve(REPO_ROOT, 'wiki');
const PUBLISH_DIR = resolve(REPO_ROOT, '.publish');

// ═══════════════════════════════════════════════════════════
// Frontmatter parsing & serialization
// ═══════════════════════════════════════════════════════════

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const yamlStr = match[1];
  const content = match[2];
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
        currentKey = trimmed.slice(0, colonIdx).trim();
        const val = trimmed.slice(colonIdx + 1).trim();
        if (val) meta[currentKey] = val.replace(/^["']|["']$/g, '');
      }
    } else if (trimmed.startsWith('- type:')) {
      if (!currentList) currentList = [];
      if (inTagItem && Object.keys(tagObj).length > 0) currentList.push({ ...tagObj });
      tagObj = { type: trimmed.slice(7).trim().replace(/^["']|["']$/g, '') };
      inTagItem = true;
    } else if (trimmed.match(/^name:/) && inTagItem) {
      tagObj.name = trimmed.slice(5).trim().replace(/^["']|["']$/g, '');
    } else if (trimmed.startsWith('- ') && !inTagItem) {
      if (!currentList) currentList = [];
      currentList.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ''));
    }
  }

  if (inTagItem && Object.keys(tagObj).length > 0) {
    if (!currentList) currentList = [];
    currentList.push({ ...tagObj });
  }
  if (currentList && currentKey) meta[currentKey] = currentList;

  return { meta, content };
}

function serializeFrontmatter(meta, content) {
  const lines = ['---'];
  if (meta.title) lines.push(`title: "${meta.title}"`);
  if (meta.description) lines.push(`description: "${meta.description}"`);

  if (meta.tags && meta.tags.length > 0) {
    lines.push('tags:');
    for (const tag of meta.tags) {
      lines.push(`  - type: ${tag.type}`);
      lines.push(`    name: ${tag.name}`);
    }
  }
  if (meta.related && meta.related.length > 0) {
    lines.push('related:');
    for (const rel of meta.related) lines.push(`  - ${rel}`);
  }
  for (const [key, val] of Object.entries(meta)) {
    if (['title', 'description', 'tags', 'related'].includes(key)) continue;
    if (typeof val === 'string') lines.push(`${key}: "${val}"`);
    else if (Array.isArray(val) && val.every((v) => typeof v === 'string')) {
      lines.push(`${key}:`);
      for (const item of val) lines.push(`  - ${item}`);
    }
  }
  lines.push('---');
  lines.push('');
  return lines.join('\n') + content;
}

// ═══════════════════════════════════════════════════════════
// Tag derivation from directory structure
// ═══════════════════════════════════════════════════════════

function slugToTitle(slug) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function deriveTagFromPath(filePath, title) {
  if (!filePath.startsWith(DRAFTS_DIR)) return null;
  const rel = relative(DRAFTS_DIR, filePath);
  const dirs = rel.split('/').slice(0, -1);
  const name = title || slugToTitle(basename(filePath, '.md'));

  switch (dirs.length) {
    case 0: return null;
    case 1: return { type: 'domain', name: dirs[0] };
    case 2: return { type: 'topic', name };
    default: return { type: 'subtopic', name };
  }
}

// ═══════════════════════════════════════════════════════════
// Local link detection
// ═══════════════════════════════════════════════════════════

function loadWikiPages() {
  const indexPath = join(WIKI_DIR, '_index.json');
  if (!existsSync(indexPath)) return [];
  try {
    return JSON.parse(readFileSync(indexPath, 'utf-8')).pages || [];
  } catch {
    return [];
  }
}

function cleanForDetection(content) {
  let c = content;
  c = c.replace(/```[\s\S]*?```/g, (m) => ' '.repeat(m.length));
  c = c.replace(/`[^`]+`/g, (m) => ' '.repeat(m.length));
  c = c.replace(/\[([^\]]*)\]\([^)]*\)/g, (m) => ' '.repeat(m.length));
  return c;
}

function extractContext(content, index, matchLen) {
  const start = Math.max(0, index - 40);
  const end = Math.min(content.length, index + matchLen + 40);
  let ctx = content.slice(start, end).replace(/\n/g, ' ').trim();
  if (start > 0) ctx = '...' + ctx;
  if (end < content.length) ctx = ctx + '...';
  return ctx;
}

function detectLocalLinks(content, wikiPages, currentSlug) {
  const cleaned = cleanForDetection(content);
  const results = [];

  for (const page of wikiPages) {
    if (page.slug === currentSlug) continue;
    const escaped = page.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'gi');

    let count = 0;
    let firstContext = '';
    let m;
    while ((m = regex.exec(cleaned)) !== null) {
      if (count === 0) firstContext = extractContext(content, m.index, m[0].length);
      count++;
    }

    if (count > 0) {
      results.push({ slug: page.slug, title: page.title, count, context: firstContext });
    }
  }

  results.sort((a, b) => b.count - a.count);
  return results;
}

// ═══════════════════════════════════════════════════════════
// Apply links to content
// ═══════════════════════════════════════════════════════════

function applyLocalLinks(content, links, wikiPages) {
  let result = content;

  for (const slug of links) {
    const page = wikiPages.find((p) => p.slug === slug);
    if (!page) continue;

    const lines = result.split('\n');
    const out = [];
    let inCodeBlock = false;
    let linked = false;

    for (const line of lines) {
      if (line.trim().startsWith('```')) { inCodeBlock = !inCodeBlock; out.push(line); continue; }
      if (inCodeBlock || line.startsWith('#') || linked) { out.push(line); continue; }

      const escaped = page.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<![\\[\\w/])${escaped}(?![\\]\\w)(/])`, 'gi');

      const newLine = line.replace(regex, (match) => {
        if (linked) return match;
        linked = true;
        return `[${match}](${slug})`;
      });
      out.push(newLine);
    }
    result = out.join('\n');
  }
  return result;
}

function applyWikipediaLinks(content, links) {
  let result = content;

  for (const { term, url } of links) {
    const lines = result.split('\n');
    const out = [];
    let inCodeBlock = false;
    let linked = false;

    for (const line of lines) {
      if (line.trim().startsWith('```')) { inCodeBlock = !inCodeBlock; out.push(line); continue; }
      if (inCodeBlock || line.startsWith('#') || linked) { out.push(line); continue; }

      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?<![\\[\\w/])${escaped}(?![\\]\\w)(/])`, 'gi');

      const newLine = line.replace(regex, (match) => {
        if (linked) return match;
        linked = true;
        return `[${match}](${url})`;
      });
      out.push(newLine);
    }
    result = out.join('\n');
  }
  return result;
}

// ═══════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════

const command = process.argv[2];

if (command === 'generate-local-links') {
  const draftFile = resolve(process.argv[3]);
  const raw = readFileSync(draftFile, 'utf-8');
  const { content } = parseFrontmatter(raw);
  const slug = basename(draftFile, '.md');
  const pages = loadWikiPages();

  mkdirSync(PUBLISH_DIR, { recursive: true });

  const localDetected = detectLocalLinks(content, pages, slug);
  const localFile = join(PUBLISH_DIR, 'local-links.json');
  writeFileSync(
    localFile,
    JSON.stringify(
      {
        _info: 'Set "include" to true for local wiki links you want to add. Save the file, then press Enter in terminal.',
        _file: basename(draftFile),
        links: localDetected.map((d) => ({
          include: false,
          title: d.title,
          slug: d.slug,
          occurrences: d.count,
          context: d.context,
        })),
      },
      null,
      2
    ),
    'utf-8'
  );

  process.stdout.write(`LOCAL:${localDetected.length}\n`);
  process.stdout.write(`FILE:${localFile}\n`);

} else if (command === 'publish') {
  const draftFile = resolve(process.argv[3]);
  const raw = readFileSync(draftFile, 'utf-8');
  const { meta, content } = parseFrontmatter(raw);
  const slug = basename(draftFile, '.md');

  if (!meta.title) meta.title = slugToTitle(slug);
  if (!meta.description) meta.description = '';
  if (!Array.isArray(meta.tags)) meta.tags = [];
  if (!Array.isArray(meta.related)) meta.related = [];

  const derivedTag = deriveTagFromPath(draftFile, meta.title);
  if (derivedTag) {
    meta.tags = meta.tags.filter((t) => t.type !== derivedTag.type);
    meta.tags = [derivedTag, ...meta.tags];
  }

  let processedContent = content;
  const pages = loadWikiPages();

  // Apply local links from JSON
  const localFile = join(PUBLISH_DIR, 'local-links.json');
  if (existsSync(localFile)) {
    try {
      const localData = JSON.parse(readFileSync(localFile, 'utf-8'));
      const selectedLocal = (localData.links || [])
        .filter((l) => l.include)
        .map((l) => l.slug);

      if (selectedLocal.length > 0) {
        processedContent = applyLocalLinks(processedContent, selectedLocal, pages);
        for (const ls of selectedLocal) {
          if (!meta.related.includes(ls)) meta.related.push(ls);
        }
      }
    } catch { /* ignore bad JSON */ }
  }

  // Apply Wikipedia links from JSON
  const wikiFile = join(PUBLISH_DIR, 'wikipedia-links.json');
  if (existsSync(wikiFile)) {
    try {
      const wikiData = JSON.parse(readFileSync(wikiFile, 'utf-8'));
      const selectedWiki = (wikiData.links || [])
        .filter((l) => l.include)
        .map((l) => ({ term: l.term, url: l.url }));

      if (selectedWiki.length > 0) {
        processedContent = applyWikipediaLinks(processedContent, selectedWiki);
      }
    } catch { /* ignore bad JSON */ }
  }

  const output = serializeFrontmatter(meta, processedContent);
  writeFileSync(join(WIKI_DIR, `${slug}.md`), output, 'utf-8');
  process.stdout.write(`PUBLISHED ${slug}\n`);

} else {
  process.stderr.write(
    'Usage:\n' +
    '  publish-helper.js generate-local-links <draft-file>\n' +
    '  publish-helper.js publish <draft-file>\n'
  );
  process.exit(1);
}
