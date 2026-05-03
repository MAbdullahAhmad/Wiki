import { useState, useEffect } from 'react';
import type { WikiPage } from '@/types/wiki';
import { fetchWikiPage } from '@/services/wikiService';

export function useWikiPage(slug: string | undefined) {
  const [page, setPage] = useState<WikiPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(null);

    fetchWikiPage(slug)
      .then((data) => {
        if (!cancelled) {
          setPage(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [slug]);

  return { page, loading, error };
}
