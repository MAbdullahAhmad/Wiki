export interface WikiTag {
  type: 'domain' | 'subject' | 'topic' | 'subtopic';
  name: string;
}

export interface WikiPageMeta {
  slug: string;
  title: string;
  description: string;
  tags: WikiTag[];
  related: string[];
  author?: string;
  coAuthors?: string[];
  excerpt?: string;
  sections?: string[];
  keywords?: string[];
  wordCount?: number;
}

export interface WikiPage extends WikiPageMeta {
  content: string;
  sections: string[];
}

export interface TaxonomyNode {
  [key: string]: TaxonomyNode | string[];
}

export interface AuthorLink {
  url: string;
  type?: string;
  label?: string;
}

export interface Author {
  name: string;
  links?: AuthorLink[];
}

export interface WikiIndex {
  pages: WikiPageMeta[];
  taxonomy: TaxonomyNode;
  authors?: Record<string, Author>;
}

export interface TagBreadcrumb {
  domain?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
}

export const TAG_COLORS: Record<WikiTag['type'], { bg: string; text: string; border: string }> = {
  domain: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700' },
  subject: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' },
  topic: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-300 dark:border-emerald-700' },
  subtopic: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
};
