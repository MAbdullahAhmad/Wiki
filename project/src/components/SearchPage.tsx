import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpAZ, ArrowDownAZ, Search, X, Filter } from 'lucide-react';
import { useWikiIndex } from '@/hooks/useWikiIndex';
import { searchPages } from '@/services/wikiService';
import { TagBadge } from './TagBadge';
import type { WikiPageMeta, WikiTag } from '@/types/wiki';
import { TAG_COLORS } from '@/types/wiki';

export function SearchPage() {
  const navigate = useNavigate();
  const { index, loading: indexLoading } = useWikiIndex();
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');
  const [filterTagType, setFilterTagType] = useState<WikiTag['type'] | ''>('');
  const [filteredData, setFilteredData] = useState<WikiPageMeta[]>([]);

  useEffect(() => {
    if (!index) return;
    let results = searchPages(index.pages, query);

    if (filterTagType) {
      results = results.filter((p) => p.tags.some((t) => t.type === filterTagType));
    }

    if (sortOrder === 'asc') {
      results.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'desc') {
      results.sort((a, b) => b.title.localeCompare(a.title));
    }

    setFilteredData(results);
  }, [query, sortOrder, filterTagType, index]);

  const tagTypes: WikiTag['type'][] = ['domain', 'subject', 'topic', 'subtopic'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-[12vh] px-4 pb-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Wiki Search</h1>
        <p className="text-muted-foreground">Search through all wiki pages, topics, and tags</p>
      </div>

      <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search pages, topics, tags..."
            className="w-full pr-10 h-12 text-base"
            onChange={(e) => setQuery(e.target.value)}
            value={query}
            autoFocus
          />
          <Search
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={20}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-12 w-full sm:w-auto">
              <ArrowUpAZ className="mr-2 h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setSortOrder('asc')} className="flex justify-between items-center">
              <span>A to Z</span>
              <ArrowUpAZ className="ml-2 h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder('desc')} className="flex justify-between items-center">
              <span>Z to A</span>
              <ArrowDownAZ className="ml-2 h-4 w-4" />
            </DropdownMenuItem>
            {sortOrder && (
              <DropdownMenuItem onClick={() => setSortOrder('')} className="flex justify-between items-center text-muted-foreground">
                <span>Clear sort</span>
                <X className="ml-2 h-4 w-4" />
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className={`h-12 w-full sm:w-auto ${filterTagType ? 'border-primary' : ''}`}>
              <Filter className="mr-2 h-4 w-4" />
              {filterTagType || 'Filter'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {tagTypes.map((type) => {
              const c = TAG_COLORS[type];
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setFilterTagType(type)}
                  className="flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${c.bg} ${c.border} border`} />
                  <span className="capitalize">{type}</span>
                </DropdownMenuItem>
              );
            })}
            {filterTagType && (
              <DropdownMenuItem onClick={() => setFilterTagType('')} className="text-muted-foreground">
                <X className="mr-2 h-4 w-4" />
                Clear filter
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="w-full max-w-2xl flex-1 min-h-0" style={{ maxHeight: 'calc(100vh - 320px)' }}>
        <div className="space-y-3 pr-4">
          {indexLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading wiki index...</div>
          ) : filteredData.length > 0 ? (
            filteredData.map((item) => (
              <button
                key={item.slug}
                onClick={() => navigate(`/page/${item.slug}`)}
                className="w-full text-left bg-card text-card-foreground p-4 rounded-lg border border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
              >
                <h3 className="text-lg font-semibold leading-tight">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.tags.map((tag, idx) => (
                    <TagBadge key={idx} tag={tag} clickable={false} />
                  ))}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                {query ? 'No results found. Try a different search term.' : 'No pages available.'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
