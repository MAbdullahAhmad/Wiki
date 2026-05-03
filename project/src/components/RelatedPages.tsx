import { LinkPreview } from './LinkPreview';
import { useWikiIndex } from '@/hooks/useWikiIndex';
import { FileText } from 'lucide-react';

interface RelatedPagesProps {
  slugs: string[];
}

export function RelatedPages({ slugs }: RelatedPagesProps) {
  const { index } = useWikiIndex();
  if (!slugs.length) return null;

  const pages = slugs
    .map((slug) => index?.pages.find((p) => p.slug === slug))
    .filter(Boolean);

  if (!pages.length) return null;

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        Related Pages
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {pages.map((page) => (
          <div
            key={page!.slug}
            className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
          >
            <LinkPreview slug={page!.slug}>
              <span className="font-medium">{page!.title}</span>
            </LinkPreview>
            {page!.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{page!.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
