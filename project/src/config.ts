const isDev = import.meta.env.DEV;

export const CONFIG = {
  REPO_OWNER: 'MAbdullahAhmad',
  REPO_NAME: 'Wiki',
  BRANCH: 'main',
  WIKI_DIR: 'wiki',
  BASE_URL: '/Wiki/',
  get RAW_BASE() {
    return `https://raw.githubusercontent.com/${this.REPO_OWNER}/${this.REPO_NAME}/${this.BRANCH}/${this.WIKI_DIR}`;
  },
  get INDEX_URL() {
    if (isDev) {
      return '/wiki-index.json';
    }
    return `https://raw.githubusercontent.com/${this.REPO_OWNER}/${this.REPO_NAME}/${this.BRANCH}/${this.WIKI_DIR}/_index.json`;
  },
  getPageUrl(slug: string) {
    if (isDev) {
      return `/wiki/${slug}.md`;
    }
    return `${this.RAW_BASE}/${slug}.md`;
  },
} as const;
