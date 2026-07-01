import { useState, useEffect, useCallback } from 'react';

import axiosInstance from 'src/utils/axios';
import {
  filterCacheByQuery,
  loadSearchCache,
  normalizeQuickSearchProduct,
  saveSearchCache,
} from 'src/utils/quick-search';

export function useQuickSearch(storeId, { isOnline = true } = {}) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let timer;
    if (!storeId) {
      setSearchResults([]);
    } else if (!query.trim()) {
      // Consigned-stock effect loads when search is empty.
    } else if (!isOnline) {
      const cached = loadSearchCache();
      const filtered = filterCacheByQuery(cached, query.trim());
      setSearchResults(filtered.map(normalizeQuickSearchProduct));
    } else {
      timer = setTimeout(async () => {
        try {
          setSearching(true);
          const res = await axiosInstance.get('/api/quick-dashboard/search', {
            params: { query: query.trim(), store_id: storeId, limit: 20 },
          });
          const raw = res.data?.results || [];
          const normalized = raw.map(normalizeQuickSearchProduct);
          const existing = loadSearchCache();
          const existingMap = new Map(existing.map((r) => [`${r.type}-${r.id}`, r]));
          raw.forEach((r) => existingMap.set(`${r.type}-${r.id}`, r));
          saveSearchCache(Array.from(existingMap.values()));
          setSearchResults(normalized);
        } catch {
          const cached = loadSearchCache();
          const filtered = filterCacheByQuery(cached, query.trim());
          setSearchResults(filtered.map(normalizeQuickSearchProduct));
        } finally {
          setSearching(false);
        }
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [query, storeId, isOnline]);

  useEffect(() => {
    if (!storeId || query.trim() || !isOnline) return undefined;
    let cancelled = false;
    (async () => {
      try {
        setSearching(true);
        const res = await axiosInstance.get('/api/quick-dashboard/consigned-stock', {
          params: { store_id: storeId, limit: 30 },
        });
        if (cancelled) return;
        const normalized = (res.data?.results || []).map(normalizeQuickSearchProduct);
        setSearchResults(normalized);
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query, storeId, isOnline]);

  const searchImmediate = useCallback(
    async (value) => {
      const trimmed = value.trim();
      if (!trimmed || !storeId) return [];

      if (!isOnline) {
        const cached = loadSearchCache();
        const filtered = filterCacheByQuery(cached, trimmed);
        const normalized = filtered.map(normalizeQuickSearchProduct);
        setSearchResults(normalized);
        return normalized;
      }

      try {
        setSearching(true);
        const res = await axiosInstance.get('/api/quick-dashboard/search', {
          params: { query: trimmed, store_id: storeId, limit: 20 },
        });
        const raw = res.data?.results || [];
        const normalized = raw.map(normalizeQuickSearchProduct);
        const existingCache = loadSearchCache();
        const existingMap = new Map(existingCache.map((r) => [`${r.type}-${r.id}`, r]));
        raw.forEach((r) => existingMap.set(`${r.type}-${r.id}`, r));
        saveSearchCache(Array.from(existingMap.values()));
        setSearchResults(normalized);
        return normalized;
      } catch {
        const cached = loadSearchCache();
        const filtered = filterCacheByQuery(cached, trimmed);
        const normalized = filtered.map(normalizeQuickSearchProduct);
        setSearchResults(normalized);
        return normalized;
      } finally {
        setSearching(false);
      }
    },
    [storeId, isOnline]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchResults([]);
  }, []);

  return {
    query,
    setQuery,
    searchResults,
    searching,
    searchImmediate,
    clearSearch,
  };
}
