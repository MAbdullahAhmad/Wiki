import { useParams, useNavigate } from 'react-router-dom';
import { useWikiIndex } from '@/hooks/useWikiIndex';
import { TagBadge } from './TagBadge';
import { LinkPreview } from './LinkPreview';
import { ArrowLeft, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TagView() {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const { index, loading } = useWikiIndex();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const decodedTag = decodeURIComponent(tagName || '');
  const matchingPages = index?.pages.filter((p) =>
    p.tags.some((t) => t.name === decodedTag)
  ) || [];

  const tagInfo = matchingPages.length > 0
    ? matchingPages[0].tags.find((t) => t.name === decodedTag)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <Tag className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{decodedTag}</h1>
          {tagInfo && (
            <span className="text-sm text-muted-foreground capitalize">{tagInfo.type}</span>
          )}
        </div>
      </div>

      <p className="text-muted-foreground mb-6">
        {matchingPages.length} page{matchingPages.length !== 1 ? 's' : ''} tagged with "{decodedTag}"
      </p>

      <div className="space-y-3">
        {matchingPages.map((page) => (
          <div
            key={page.slug}
            className="p-4 rounded-lg border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all"
          >
            <LinkPreview slug={page.slug}>
              <span className="text-lg font-semibold">{page.title}</span>
            </LinkPreview>
            {page.description && (
              <p className="text-sm text-muted-foreground mt-1.5">{page.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {page.tags.map((tag, idx) => (
                <TagBadge key={idx} tag={tag} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {matchingPages.length === 0 && (
        <div className="text-center py-16">
          <Tag className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No pages found with this tag.</p>
        </div>
      )}
    </div>
  );
}
