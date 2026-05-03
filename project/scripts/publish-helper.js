#!/usr/bin/env node

/**
 * publish-helper.js - Node.js helper for the publish.bash script
 *
 * Commands:
 *   detect-links <draft-file>
 *     Scans a draft for mentions of existing wiki page titles.
 *     Output: slug|title|count (one per line, pipe-delimited)
 *
 *   publish <draft-file> [links-to-apply]
 *     Publishes a draft to wiki/. Updates frontmatter tags from directory
 *     structure, applies selected auto-links, copies to wiki/<slug>.md.
 *     Output: "PUBLISHED <slug>" on success
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { basename, relative, resolve, join } from 'path';

const REPO_ROOT = resolve(import.meta.dirname, '../..');
const DRAFTS_DIR = resolve(REPO_ROOT, 'drafts');
const WIKI_DIR = resolve(REPO_ROOT, 'wiki');

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

    // Top-level key (not indented, not a list item)
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
        if (val) {
          meta[currentKey] = val.replace(/^["']|["']$/g, '');
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
      currentList.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ''));
    }
  }

  if (inTagItem && Object.keys(tagObj).length > 0) {
    if (!currentList) currentList = [];
    currentList.push({ ...tagObj });
  }
  if (currentList && currentKey) {
    meta[currentKey] = currentList;
  }

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
    for (const rel of meta.related) {
      lines.push(`  - ${rel}`);
    }
  }

  // Preserve any extra keys
  for (const [key, val] of Object.entries(meta)) {
    if (['title', 'description', 'tags', 'related'].includes(key)) continue;
    if (typeof val === 'string') {
      lines.push(`${key}: "${val}"`);
    } else if (Array.isArray(val) && val.every((v) => typeof v === 'string')) {
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
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Derives the tag for a file based on its position in drafts/.
 *
 * Directory layout:
 *   drafts/<Domain>/<Subject>/<file>.md          → topic
 *   drafts/<Domain>/<Subject>/<Topic>/<file>.md  → subtopic
 *   drafts/<Domain>/<file>.md                    → subject-level (rare)
 *   drafts/<file>.md                             → no auto-tag
 */
function deriveTagFromPath(filePath, title) {
  if (!filePath.startsWith(DRAFTS_DIR)) return null;
  const rel = relative(DRAFTS_DIR, filePath);
  const parts = rel.split('/');
  const dirs = parts.slice(0, -1); // directory components only
  const name = title || slugToTitle(basename(filePath, '.md'));

  switch (dirs.length) {
    case 0:
      return null;
    case 1:
      return { type: 'domain', name: dirs[0] };
    case 2:
      return { type: 'topic', name };
    default:
      return { type: 'subtopic', name };
  }
}

// ═══════════════════════════════════════════════════════════
// Link detection
// ═══════════════════════════════════════════════════════════

function loadWikiPages() {
  const indexPath = join(WIKI_DIR, '_index.json');
  if (!existsSync(indexPath)) return [];
  try {
    const data = JSON.parse(readFileSync(indexPath, 'utf-8'));
    return data.pages || [];
  } catch {
    return [];
  }
}

/**
 * Scans content for mentions of known wiki page titles that aren't already linked.
 * Returns array of { slug, title, count }.
 */
function detectLinks(content, wikiPages, currentSlug) {
  // Strip code blocks and existing links for detection
  let cleaned = content;
  // Remove fenced code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (m) => ' '.repeat(m.length));
  // Remove inline code
  cleaned = cleaned.replace(/`[^`]+`/g, (m) => ' '.repeat(m.length));
  // Mark existing markdown links so we skip them
  cleaned = cleaned.replace(/\[([^\]]*)\]\([^)]*\)/g, (m) => ' '.repeat(m.length));

  const results = [];

  for (const page of wikiPages) {
    if (page.slug === currentSlug) continue;

    const escaped = page.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match whole phrase, not inside a word
    const regex = new RegExp(`(?<![\\w])${escaped}(?![\\w])`, 'gi');

    let count = 0;
    let m;
    while ((m = regex.exec(cleaned)) !== null) {
      count++;
    }

    if (count > 0) {
      results.push({ slug: page.slug, title: page.title, count });
    }
  }

  results.sort((a, b) => b.count - a.count);
  return results;
}

/**
 * Applies auto-links: replaces the FIRST plain-text occurrence of each
 * selected title with a markdown link [Title](slug). Skips code blocks
 * and heading lines.
 */
function applyLinks(content, linksToApply, wikiPages) {
  let result = content;

  for (const slug of linksToApply) {
    const page = wikiPages.find((p) => p.slug === slug);
    if (!page) continue;

    const lines = result.split('\n');
    const out = [];
    let inCodeBlock = false;
    let linked = false; // only link first occurrence overall

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        out.push(line);
        continue;
      }
      if (inCodeBlock || line.startsWith('#') || linked) {
        out.push(line);
        continue;
      }

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

// ═══════════════════════════════════════════════════════════
// Commands
// ═══════════════════════════════════════════════════════════

const command = process.argv[2];

if (command === 'detect-links') {
  const draftFile = resolve(process.argv[3]);
  const raw = readFileSync(draftFile, 'utf-8');
  const { content } = parseFrontmatter(raw);
  const slug = basename(draftFile, '.md');
  const pages = loadWikiPages();

  const detected = detectLinks(content, pages, slug);
  for (const d of detected) {
    process.stdout.write(`${d.slug}|${d.title}|${d.count}\n`);
  }
} else if (command === 'publish') {
  const draftFile = resolve(process.argv[3]);
  const linksArg = process.argv[4] || '';
  const linksToApply = linksArg ? linksArg.split(',').filter(Boolean) : [];

  const raw = readFileSync(draftFile, 'utf-8');
  const { meta, content } = parseFrontmatter(raw);
  const slug = basename(draftFile, '.md');

  // Ensure basic metadata
  if (!meta.title) meta.title = slugToTitle(slug);
  if (!meta.description) meta.description = '';
  if (!Array.isArray(meta.tags)) meta.tags = [];
  if (!Array.isArray(meta.related)) meta.related = [];

  // Derive tag from directory structure
  const derivedTag = deriveTagFromPath(draftFile, meta.title);
  if (derivedTag) {
    // Replace any existing tag of the same type
    meta.tags = meta.tags.filter((t) => t.type !== derivedTag.type);
    meta.tags = [derivedTag, ...meta.tags];
  }

  // Apply auto-links to content
  let processedContent = content;
  if (linksToApply.length > 0) {
    const pages = loadWikiPages();
    processedContent = applyLinks(content, linksToApply, pages);

    // Add linked pages to related (deduped)
    for (const ls of linksToApply) {
      if (!meta.related.includes(ls)) {
        meta.related.push(ls);
      }
    }
  }

  // Write to wiki/
  const output = serializeFrontmatter(meta, processedContent);
  writeFileSync(join(WIKI_DIR, `${slug}.md`), output, 'utf-8');

  process.stdout.write(`PUBLISHED ${slug}\n`);
} else {
  process.stderr.write(
    'Usage:\n' +
      '  publish-helper.js detect-links <draft-file>\n' +
      '  publish-helper.js publish <draft-file> [links-csv]\n'
  );
  process.exit(1);
}
