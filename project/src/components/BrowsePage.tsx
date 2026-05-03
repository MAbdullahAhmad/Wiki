import { useState, useMemo } from 'react';
import { useWikiIndex } from '@/hooks/useWikiIndex';
import { TagBadge } from './TagBadge';
import { LinkPreview } from './LinkPreview';
import { Loader2, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WikiTag } from '@/types/wiki';
import { TAG_COLORS } from '@/types/wiki';

export function BrowsePage() {
  const { index, loading } = useWikiIndex();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<WikiTag['type'] | ''>('');

  const filteredPages = useMemo(() => {
    if (!index) return [];
    if (!activeFilter) return index.pages;
    return index.pages.filter((p) => p.tags.some((t) => t.type === activeFilter));
  }, [index, activeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tagTypes: WikiTag['type'][] = ['domain', 'subject', 'topic', 'subtopic'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Pages</h1>
          <p className="text-muted-foreground mt-1">{filteredPages.length} pages</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
            {tagTypes.map((type) => {
              const c = TAG_COLORS[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveFilter(activeFilter === type ? '' : type)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all capitalize ${
                    activeFilter === type
                      ? `${c.bg} ${c.text}`
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
          <div className="flex border border-border rounded-md p-0.5">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <div
              key={page.slug}
              className="p-4 rounded-lg border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all"
            >
              <LinkPreview slug={page.slug}>
                <span className="text-base font-semibold">{page.title}</span>
              </LinkPreview>
              {page.description && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{page.description}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-3">
                {page.tags.map((tag, idx) => (
                  <TagBadge key={idx} tag={tag} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPages.map((page) => (
            <div
              key={page.slug}
              className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:shadow-sm hover:border-primary/30 transition-all"
            >
              <div className="flex-1 min-w-0">
                <LinkPreview slug={page.slug}>
                  <span className="font-medium">{page.title}</span>
                </LinkPreview>
                {page.description && (
                  <p className="text-sm text-muted-foreground truncate">{page.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-1 shrink-0">
                {page.tags.map((tag, idx) => (
                  <TagBadge key={idx} tag={tag} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
