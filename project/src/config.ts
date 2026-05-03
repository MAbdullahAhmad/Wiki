const isDev = import.meta.env.DEV;

export const CONFIG = {
  REPO_OWNER: 'MAbdullahAhmad',
  REPO_NAME: 'Wiki',
  BRANCH: 'main',
  WIKI_DIR: 'wiki',
  ASSETS_DIR: 'assets',
  BASE_URL: './',
  get RAW_BASE() {
    return `https://raw.githubusercontent.com/${this.REPO_OWNER}/${this.REPO_NAME}/${this.BRANCH}`;
  },
  get INDEX_URL() {
    if (isDev) return '/wiki-index.json';
    return `${this.RAW_BASE}/${this.WIKI_DIR}/_index.json`;
  },
  getIndexChunkUrl(n: number) {
    if (isDev) return `/wiki-index-${n}.json`;
    return `${this.RAW_BASE}/${this.WIKI_DIR}/_index-${n}.json`;
  },
  getPageUrl(slug: string) {
    if (isDev) return `/wiki/${slug}.md`;
    return `${this.RAW_BASE}/${this.WIKI_DIR}/${slug}.md`;
  },
  // Resolve a markdown-relative asset path (e.g. "assets/foo.png") to a
  // URL the browser can load. Dev: served by the vite middleware from the
  // repo's assets/ directory. Prod: raw GitHub URL on the content branch.
  getAssetUrl(relativePath: string) {
    const clean = relativePath.replace(/^\.?\/+/, '');
    if (isDev) return `/${clean}`;
    return `${this.RAW_BASE}/${clean}`;
  },
} as const;
