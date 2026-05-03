import { CONFIG } from '@/config';
import type { WikiIndex, WikiPage, WikiPageMeta, WikiTag, TagBreadcrumb, TaxonomyNode } from '@/types/wiki';

const pageCache = new Map<string, WikiPage>();
let indexCache: WikiIndex | null = null;
let baseChunkCount = 0;
let chunksLoaded = false;
let chunksPromise: Promise<void> | null = null;

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const yamlStr = match[1];
  const content = match[2].trim();
  const meta: Record<string, unknown> = {};

  let currentKey = '';
  let currentList: unknown[] | null = null;
  let inTagItem = false;
  let tagObj: Record<string, string> = {};

  for (const line of yamlStr.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (!line.startsWith(' ') && !line.startsWith('-')) {
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
    } else if (trimmed.startsWith('- type:') || trimmed.startsWith('- name:')) {
      if (!currentList) currentList = [];
      if (trimmed.startsWith('- type:')) {
        if (inTagItem && Object.keys(tagObj).length > 0) {
          currentList.push({ ...tagObj });
        }
        tagObj = { type: trimmed.slice(7).trim().replace(/^["']|["']$/g, '') };
        inTagItem = true;
      } else if (trimmed.startsWith('- name:')) {
        tagObj.name = trimmed.slice(7).trim().replace(/^["']|["']$/g, '');
      }
    } else if (trimmed.match(/^name:/)) {
      tagObj.name = trimmed.slice(5).trim().replace(/^["']|["']$/g, '');
    } else if (trimmed.match(/^type:/)) {
      tagObj.type = trimmed.slice(5).trim().replace(/^["']|["']$/g, '');
    } else if (trimmed.startsWith('- ')) {
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

  return { meta, content };
}

function extractSections(content: string): string[] {
  const sections: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+)/);
    if (match) sections.push(match[1].trim());
  }
  return sections;
}

// Fetch the base index (taxonomy + first slice of pages). Cheap — one HTTP
// round trip, capped at 10 MB by the writer. Sufficient for the home page,
// which only needs taxonomy + a handful of recent pages.
export async function fetchWikiIndex(): Promise<WikiIndex> {
  if (indexCache) return indexCache;

  const res = await fetch(CONFIG.INDEX_URL);
  if (!res.ok) throw new Error(`Failed to fetch wiki index: ${res.status}`);
  const base = (await res.json()) as WikiIndex & { chunks?: number };
  baseChunkCount = typeof base.chunks === 'number' ? base.chunks : 0;
  chunksLoaded = baseChunkCount === 0;
  indexCache = base;
  return indexCache;
}

// Ensure all rotated index chunks are fetched and merged. Called by routes
// that need to filter or browse the entire corpus (search, browse, tag view).
// Idempotent; concurrent callers share the same in-flight fetch.
export async function ensureFullIndex(): Promise<WikiIndex> {
  const base = await fetchWikiIndex();
  if (chunksLoaded) return base;
  if (!chunksPromise) {
    chunksPromise = (async () => {
      const urls = Array.from({ length: baseChunkCount }, (_, i) => CONFIG.getIndexChunkUrl(i + 1));
      const results = await Promise.all(
        urls.map(async (url) => {
          const r = await fetch(url);
          if (!r.ok) throw new Error(`Failed to fetch index chunk ${url}: ${r.status}`);
          return (await r.json()) as { pages: WikiIndex['pages'] };
        })
      );
      for (const chunk of results) base.pages = base.pages.concat(chunk.pages || []);
      chunksLoaded = true;
    })();
  }
  await chunksPromise;
  return base;
}

export async function fetchWikiPage(slug: string): Promise<WikiPage> {
  if (pageCache.has(slug)) return pageCache.get(slug)!;

  const url = CONFIG.getPageUrl(slug);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch page: ${slug} (${res.status})`);
  const raw = await res.text();

  const { meta, content } = parseFrontmatter(raw);
  const tags = (meta.tags as WikiTag[]) || [];
  const related = (meta.related as string[]) || [];
  const sections = extractSections(content);

  const page: WikiPage = {
    slug,
    title: (meta.title as string) || slug,
    description: (meta.description as string) || '',
    tags,
    related,
    author: (meta.author as string) || undefined,
    coAuthors: (meta['co-authors'] as string[]) || undefined,
    content,
    sections,
  };

  pageCache.set(slug, page);
  return page;
}

export function clearCache() {
  pageCache.clear();
  indexCache = null;
  baseChunkCount = 0;
  chunksLoaded = false;
  chunksPromise = null;
}

export function findBreadcrumb(taxonomy: TaxonomyNode, tagName: string): TagBreadcrumb | null {
  for (const [domain, subjects] of Object.entries(taxonomy)) {
    if (domain === tagName) return { domain };
    if (typeof subjects === 'object' && !Array.isArray(subjects)) {
      for (const [subject, topics] of Object.entries(subjects as TaxonomyNode)) {
        if (subject === tagName) return { domain, subject };
        if (typeof topics === 'object' && !Array.isArray(topics)) {
          for (const [topic, subtopics] of Object.entries(topics as TaxonomyNode)) {
            if (topic === tagName) return { domain, subject, topic };
            if (Array.isArray(subtopics) && subtopics.includes(tagName)) {
              return { domain, subject, topic, subtopic: tagName };
            }
          }
        }
      }
    }
  }
  return null;
}

export function searchPages(pages: WikiPageMeta[], query: string): WikiPageMeta[] {
  const q = query.toLowerCase().trim();
  if (!q) return pages;
  return pages.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.name.toLowerCase().includes(q)) ||
      (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
      (p.keywords && p.keywords.some((k) => k.toLowerCase().includes(q)))
  );
}
