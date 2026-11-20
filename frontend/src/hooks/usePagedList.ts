import { useEffect, useState } from 'react';
import api from '../utils/api';

export interface PagedResponse<T> {
  records: T[];
  totalSize: number;
  limit: number;
  offset: number;
}

export interface Sort {
  field: string;
  dir: 'ASC' | 'DESC';
}

// Fetches one page at a time from a paginated backend endpoint.
// Search is debounced (waits until the user stops typing) so we don't call Salesforce on every keystroke.
export function usePagedList<T>(endpoint: string, initialSort: Sort, pageSize = 25, debounceMs = 300) {
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>(initialSort);
  const [data, setData] = useState<PagedResponse<T>>({ records: [], totalSize: 0, limit: pageSize, offset: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Apply the typed search after a pause, and go back to the first page
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchInput, debounceMs]);

  useEffect(() => {
    let cancelled = false; // ignore responses that arrive after a newer request started
    setLoading(true);
    setError('');
    api.get<PagedResponse<T>>(endpoint, {
      params: { limit: pageSize, offset: page * pageSize, search: search || undefined, sort: sort.field, dir: sort.dir },
    })
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error || 'Failed to load data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [endpoint, page, pageSize, search, sort, reloadKey]);

  // Clicking the same column flips the direction; a new column starts ascending
  const toggleSort = (field: string) => {
    setSort((prev) => (prev.field === field ? { field, dir: prev.dir === 'ASC' ? 'DESC' : 'ASC' } : { field, dir: 'ASC' }));
    setPage(0);
  };

  return {
    ...data, page, setPage, pageSize, searchInput, setSearchInput, sort, toggleSort,
    loading, error, reload: () => setReloadKey((k) => k + 1),
  };
}
