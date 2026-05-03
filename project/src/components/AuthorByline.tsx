import { Github, Linkedin, Twitter, Instagram, Youtube, Facebook, Globe, Link as LinkIcon, Briefcase } from 'lucide-react';
import { useWikiIndex } from '@/hooks/useWikiIndex';
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
  // Explicit type wins.
  if (link.type) {
    const t = link.type.toLowerCase();
    const match = HOST_ICONS.find((h) => h.label.toLowerCase() === t || h.match.test(`${t}.com`));
    if (match) return { Icon: match.icon, label: match.label };
    if (t === 'website' || t === 'web' || t === 'site') return { Icon: Globe, label: 'Website' };
  }
  // Fall back to hostname matching.
  try {
    const host = new URL(link.url).hostname;
    const match = HOST_ICONS.find((h) => h.match.test(host));
    if (match) return { Icon: match.icon, label: match.label };
    // Personal-domain heuristic: not a known platform → globe icon.
    return { Icon: Globe, label: link.label || host };
  } catch {
    return { Icon: LinkIcon, label: link.label || link.url };
  }
}

interface AuthorChipProps {
  username: string;
  author: Author | undefined;
  prefix?: string;
}

function AuthorChip({ username, author, prefix }: AuthorChipProps) {
  const name = author?.name || username;
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {prefix && <span className="text-muted-foreground">{prefix}</span>}
      <span className="font-medium">{name}</span>
      {author?.links && author.links.length > 0 && (
        <span className="inline-flex items-center gap-1">
          {author.links.map((link) => {
            const { Icon, label } = iconFor(link);
            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                title={label}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            );
          })}
        </span>
      )}
    </span>
  );
}

interface AuthorBylineProps {
  author?: string;
  coAuthors?: string[];
}

export function AuthorByline({ author, coAuthors }: AuthorBylineProps) {
  const { index } = useWikiIndex();
  if (!author && (!coAuthors || coAuthors.length === 0)) return null;

  const authors = (index?.authors || {}) as Record<string, Author>;

  return (
    <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mb-6">
      {author && <AuthorChip prefix="By" username={author} author={authors[author]} />}
      {coAuthors && coAuthors.length > 0 && (
        <>
          {author && <span className="text-muted-foreground/50">·</span>}
          <span className="inline-flex items-center gap-x-3 gap-y-1 flex-wrap">
            <span className="text-muted-foreground">{author ? 'with' : 'By'}</span>
            {coAuthors.map((u, i) => (
              <span key={u} className="inline-flex items-center">
                <AuthorChip username={u} author={authors[u]} />
                {i < coAuthors.length - 1 && <span className="ml-1 text-muted-foreground/50">,</span>}
              </span>
            ))}
          </span>
        </>
      )}
    </div>
  );
}
