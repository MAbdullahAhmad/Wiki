import { useState, useEffect } from 'react';
import type { WikiIndex } from '@/types/wiki';
import { fetchWikiIndex, ensureFullIndex } from '@/services/wikiService';

interface UseWikiIndexOptions {
  // When true, also fetches all rotated chunks. Use for search/browse/tag
  // pages that need every entry. Defaults to false (base only) so the home
  // page stays cheap on big wikis.
  full?: boolean;
}

export function useWikiIndex(opts: UseWikiIndexOptions = {}) {
  const [index, setIndex] = useState<WikiIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const full = opts.full === true;

  useEffect(() => {
    let cancelled = false;
    const loader = full ? ensureFullIndex() : fetchWikiIndex();
    loader
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
  }, [full]);

  return { index, loading, error };
}
