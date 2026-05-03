import { useState, useEffect } from 'react';
import type { WikiIndex } from '@/types/wiki';
import { fetchWikiIndex } from '@/services/wikiService';

export function useWikiIndex() {
  const [index, setIndex] = useState<WikiIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWikiIndex()
      .then((data) => {
        if (!cancelled) {
          setIndex(data);
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
  }, []);

  return { index, loading, error };
}
