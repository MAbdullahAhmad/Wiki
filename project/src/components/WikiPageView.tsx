import { useParams, useNavigate } from 'react-router-dom';
import { useWikiPage } from '@/hooks/useWikiPage';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TagBadge } from './TagBadge';
import { RelatedPages } from './RelatedPages';
import { ArrowLeft, Loader2, AlertCircle, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function WikiPageView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { page, loading, error } = useWikiPage(slug);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading page...</span>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive/60" />
        <h2 className="text-xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {error || `The page "${slug}" could not be found.`}
        </p>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    );
  }

  const wordCount = page.content.split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-4xl font-bold tracking-tight mb-3">{page.title}</h1>

        {page.description && (
          <p className="text-lg text-muted-foreground mb-4">{page.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {page.tags.map((tag, i) => (
            <TagBadge key={i} tag={tag} />
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {readTime} min read
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {page.sections.length} sections
          </span>
        </div>
      </div>

      <Separator className="mb-6" />

      {page.sections.length > 1 && (
        <nav className="mb-8 p-4 rounded-lg bg-muted/50 border border-border">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contents</h3>
          <ul className="space-y-1">
            {page.sections.map((section, i) => (
              <li key={i}>
                <a
                  href={`#${section.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}`}
                  className="text-sm text-primary hover:underline"
                >
                  {section}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <article className="mb-8">
        <MarkdownRenderer content={page.content} />
      </article>

      <RelatedPages slugs={page.related} />
    </div>
  );
}
