import { useNavigate } from 'react-router-dom';
import { useWikiIndex } from '@/hooks/useWikiIndex';
import { TagBadge } from './TagBadge';
import { LinkPreview } from './LinkPreview';
import { Search, BookOpen, Loader2, Tag, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WikiTag, TaxonomyNode } from '@/types/wiki';
import { TAG_COLORS } from '@/types/wiki';

export function HomePage() {
  const navigate = useNavigate();
  const { index, loading } = useWikiIndex();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const domains = index?.taxonomy ? Object.keys(index.taxonomy) : [];
  const recentPages = index?.pages.slice(0, 6) || [];

  const getDomainSubjects = (domain: string): string[] => {
    if (!index?.taxonomy) return [];
    const subjects = index.taxonomy[domain];
    if (typeof subjects === 'object' && !Array.isArray(subjects)) {
      return Object.keys(subjects);
    }
    return [];
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Wiki by Abdullah
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            A knowledge base covering technology, science, and mathematics.
            Browse topics, explore connections, and discover new ideas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/search')} className="gap-2">
              <Search className="h-5 w-5" />
              Search Wiki
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/browse')} className="gap-2">
              <BookOpen className="h-5 w-5" />
              Browse All Pages
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold">{index?.pages.length || 0}</div>
            <div className="text-sm text-muted-foreground">Pages</div>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold">{domains.length}</div>
            <div className="text-sm text-muted-foreground">Domains</div>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold">
              {index?.pages.reduce((acc, p) => acc + p.tags.length, 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Tags</div>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <div className="text-2xl font-bold">
              {index?.pages.reduce((acc, p) => acc + p.related.length, 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Connections</div>
          </div>
        </div>
      </section>

      {/* Taxonomy Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Tag className="h-6 w-6" />
          Browse by Domain
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain) => (
            <div key={domain} className="p-5 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
              <button
                onClick={() => navigate(`/tag/${encodeURIComponent(domain)}`)}
                className="flex items-center gap-2 mb-3 group"
              >
                <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${TAG_COLORS.domain.bg} ${TAG_COLORS.domain.text}`}>
                  {domain}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </button>
              <div className="flex flex-wrap gap-1.5">
                {getDomainSubjects(domain).map((subject) => (
                  <TagBadge
                    key={subject}
                    tag={{ type: 'subject' as WikiTag['type'], name: subject }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Pages */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          All Pages
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recentPages.map((page) => (
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
                  <TagBadge key={idx} tag={tag} clickable={false} />
                ))}
              </div>
            </div>
          ))}
        </div>
        {(index?.pages.length || 0) > 6 && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={() => navigate('/browse')}>
              View All {index?.pages.length} Pages
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
