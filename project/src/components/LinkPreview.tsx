import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWikiPage } from '@/services/wikiService';
import type { WikiPage } from '@/types/wiki';
import { Loader2 } from 'lucide-react';

interface LinkPreviewProps {
  slug: string;
  children: React.ReactNode;
}

export function LinkPreview({ slug, children }: LinkPreviewProps) {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<WikiPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setVisible(true);
      try {
        const page = await fetchWikiPage(slug);
        setPreview(page);
      } catch {
        setPreview(null);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [slug]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const previewWidth = 360;
    const previewHeight = 280;

    let x = e.clientX + 16;
    let y = e.clientY + 16;

    if (x + previewWidth > viewportWidth - 16) {
      x = e.clientX - previewWidth - 16;
    }
    if (y + previewHeight > viewportHeight - 16) {
      y = e.clientY - previewHeight - 16;
    }

    setPosition({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
    setPreview(null);
    setLoading(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      window.open(`${window.location.href.split('#')[0]}#/page/${slug}`, '_blank');
    } else {
      navigate(`/page/${slug}`);
    }
  }, [navigate, slug]);

  const getPreviewText = () => {
    if (!preview) return '';
    const lines = preview.content.split('\n').filter(l => !l.startsWith('#') && l.trim());
    return lines.slice(0, 6).join(' ').slice(0, 300);
  };

  return (
    <span ref={containerRef} className="relative inline">
      <a
        href={`#/page/${slug}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="link-local cursor-pointer"
      >
        {children}
      </a>

      {visible && (
        <div
          className="fixed z-[100] w-[360px] max-h-[280px] bg-popover border border-border rounded-lg shadow-xl overflow-hidden"
          style={{ left: position.x, top: position.y, pointerEvents: 'none' }}
        >
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading preview...</span>
            </div>
          ) : preview ? (
            <div className="p-4">
              <h4 className="font-semibold text-base mb-1">{preview.title}</h4>
              {preview.description && (
                <p className="text-xs text-muted-foreground mb-2 italic">{preview.description}</p>
              )}
              <div className="text-sm text-foreground/80 leading-relaxed line-clamp-6">
                {getPreviewText()}
              </div>
              {preview.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-border">
                  {preview.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Page not found</div>
          )}
        </div>
      )}
    </span>
  );
}
