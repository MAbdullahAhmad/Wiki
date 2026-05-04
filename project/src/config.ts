const isDev = import.meta.env.DEV;

// Prod URLs are relative to the document. Content (wiki/, assets/) is bundled
// into the gh-pages deploy alongside the built site, so the live site is
// self-contained — no dependency on main being merged.
export const CONFIG = {
  REPO_OWNER: 'MAbdullahAhmad',
  REPO_NAME: 'Wiki',
  BRANCH: 'main',
  WIKI_DIR: 'wiki',
  ASSETS_DIR: 'assets',
  BASE_URL: './',
  get INDEX_URL() {
    if (isDev) return '/wiki-index.json';
    return `${this.WIKI_DIR}/_index.json`;
  },
  getIndexChunkUrl(n: number) {
    if (isDev) return `/wiki-index-${n}.json`;
    return `${this.WIKI_DIR}/_index-${n}.json`;
  },
  getPageUrl(slug: string) {
    if (isDev) return `/wiki/${slug}.md`;
    return `${this.WIKI_DIR}/${slug}.md`;
  },
  // Resolve a markdown-relative asset path (e.g. "assets/foo.png") to a
  // URL the browser can load. Dev: served by the vite middleware from the
  // repo's assets/ directory. Prod: relative path under the deployed site.
  getAssetUrl(relativePath: string) {
    const clean = relativePath.replace(/^\.?\/+/, '');
    if (isDev) return `/${clean}`;
    return clean;
  },
} as const;
