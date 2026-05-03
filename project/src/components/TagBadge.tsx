import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WikiTag, TagBreadcrumb } from '@/types/wiki';
import { TAG_COLORS } from '@/types/wiki';
import { findBreadcrumb } from '@/services/wikiService';
import { useWikiIndex } from '@/hooks/useWikiIndex';

interface TagBadgeProps {
  tag: WikiTag;
  clickable?: boolean;
}

export function TagBadge({ tag, clickable = true }: TagBadgeProps) {
  const navigate = useNavigate();
  const { index } = useWikiIndex();
  const [breadcrumb, setBreadcrumb] = useState<TagBreadcrumb | null>(null);
  const [showBreadcrumb, setShowBreadcrumb] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const colors = TAG_COLORS[tag.type];

  const handleMouseEnter = () => {
    if (index?.taxonomy) {
      const bc = findBreadcrumb(index.taxonomy, tag.name);
      setBreadcrumb(bc);
      if (bc) {
        timeoutRef.current = setTimeout(() => setShowBreadcrumb(true), 300);
      }
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowBreadcrumb(false);
  };

  const handleClick = () => {
    if (clickable) {
      navigate(`/tag/${encodeURIComponent(tag.name)}`);
    }
  };

  const typeLabel = tag.type.charAt(0).toUpperCase() + tag.type.slice(1);

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm cursor-pointer ${colors.bg} ${colors.text} ${colors.border}`}
        title={`${typeLabel}: ${tag.name}`}
      >
        <span className="opacity-60 text-[10px] uppercase tracking-wider">{tag.type}</span>
        <span>{tag.name}</span>
      </button>

      {showBreadcrumb && breadcrumb && (
        <div className="fixed bottom-4 right-4 z-50 bg-card border border-border rounded-lg shadow-lg px-4 py-2.5 flex items-center gap-2 text-sm animate-in slide-in-from-bottom-2 max-w-[90vw]">
          {breadcrumb.domain && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS.domain.bg} ${TAG_COLORS.domain.text}`}>
              {breadcrumb.domain}
            </span>
          )}
          {breadcrumb.subject && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS.subject.bg} ${TAG_COLORS.subject.text}`}>
                {breadcrumb.subject}
              </span>
            </>
          )}
          {breadcrumb.topic && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS.topic.bg} ${TAG_COLORS.topic.text}`}>
                {breadcrumb.topic}
              </span>
            </>
          )}
          {breadcrumb.subtopic && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS.subtopic.bg} ${TAG_COLORS.subtopic.text}`}>
                {breadcrumb.subtopic}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}
