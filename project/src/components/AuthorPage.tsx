import { useParams, useNavigate } from 'react-router-dom';
import { Github, Linkedin, Twitter, Instagram, Youtube, Facebook, Globe, Link as LinkIcon, Briefcase, ArrowLeft, User as UserIcon } from 'lucide-react';
import { useWikiIndex } from '@/hooks/useWikiIndex';
import { Button } from '@/components/ui/button';
import { LinkPreview } from './LinkPreview';
import { TagBadge } from './TagBadge';
import type { Author, AuthorLink } from '@/types/wiki';

const HOST_ICONS: Array<{ match: RegExp; icon: typeof Github; label: string }> = [
  { match: /(^|\.)github\.com$/i, icon: Github, label: 'GitHub' },
  { match: /(^|\.)linkedin\.com$/i, icon: Linkedin, label: 'LinkedIn' },
  { match: /(^|\.)(twitter|x)\.com$/i, icon: Twitter, label: 'X / Twitter' },
  { match: /(^|\.)instagram\.com$/i, icon: Instagram, label: 'Instagram' },
  { match: /(^|\.)youtube\.com$/i, icon: Youtube, label: 'YouTube' },
  { match: /(^|\.)facebook\.com$/i, icon: Facebook, label: 'Facebook' },
  { match: /(^|\.)upwork\.com$/i, icon: Briefcase, label: 'Upwork' },
];

function iconFor(link: AuthorLink) {
  if (link.type) {
    const t = link.type.toLowerCase();
    const match = HOST_ICONS.find((h) => h.label.toLowerCase() === t || h.match.test(`${t}.com`));
    if (match) return { Icon: match.icon, label: match.label };
    if (t === 'website' || t === 'web' || t === 'site') return { Icon: Globe, label: 'Website' };
  }
  try {
    const host = new URL(link.url).hostname;
    const match = HOST_ICONS.find((h) => h.match.test(host));
    if (match) return { Icon: match.icon, label: match.label };
    return { Icon: Globe, label: link.label || host };
  } catch {
    return { Icon: LinkIcon, label: link.label || link.url };
  }
}

export function AuthorPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { index, loading } = useWikiIndex({ full: true });

  if (loading) return null;

  const u = decodeURIComponent(username || '');
  const authors = (index?.authors || {}) as Record<string, Author>;
  const author = authors[u];
  const pages = (index?.pages || []).filter(
    (p) => p.author === u || (p.coAuthors && p.coAuthors.includes(u))
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 -ml-2">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex items-start gap-4 mb-6">
        <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <UserIcon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{author?.name || u}</h1>
          <div className="text-sm text-muted-foreground">@{u}</div>
          {author?.links && author.links.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {author.links.map((link) => {
                const { Icon, label } = iconFor(link);
                return (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                    title={label}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!author && (
        <p className="text-muted-foreground mb-6">
          This author hasn't been registered in <code className="px-1 py-0.5 rounded bg-muted text-xs">authors.json</code>.
        </p>
      )}

      <h2 className="text-xl font-semibold mb-3">
        {pages.length} page{pages.length === 1 ? '' : 's'}
      </h2>

      {pages.length === 0 ? (
        <p className="text-muted-foreground">No pages yet.</p>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
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
      )}
    </div>
  );
}
