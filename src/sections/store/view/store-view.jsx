import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDebounce } from 'src/hooks/use-debounce';
import { useSetState } from 'src/hooks/use-set-state';

import { useSearchStores } from 'src/actions/store';

import { EmptyContent } from 'src/components/empty-content';

import { StoreList } from '../store-list';
import { StoreSort } from '../store-sort';
import { StoreSearch } from '../store-search';
import { StoreFiltersResult } from '../store-filters-result';

// Helper function to filter stores.
function applyFilter({ inputData, filters, sortBy }) {
  const { status, storeName } = filters;
  if (!Array.isArray(inputData)) inputData = [];
  // Filter by status (e.g. "active" or "inactive")
  if (status.length) {
    inputData = inputData.filter((store) => status.includes(store.status));
  }
  // Filter by store name if provided.
  if (storeName) {
    inputData = inputData.filter((store) =>
      store.storeName.toLowerCase().includes(storeName.toLowerCase())
    );
  }
  // Sort alphabetically by store name.
  inputData = inputData.sort((a, b) => a.storeName.localeCompare(b.storeName));
  return inputData;
}

export function StoreShopView({ stores, loading }) {
  const openFilters = useBoolean();
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery);

  const filters = useSetState({
    storeName: '',
    status: [], // e.g. ["active", "inactive"]
  });

  const { searchResults, searchLoading } = useSearchStores(debouncedQuery);

  const dataFiltered = applyFilter({
    inputData: Array.isArray(stores) ? stores : [],
    filters: filters.state,
    sortBy,
  });

  const canReset = filters.state.storeName !== '' || filters.state.status.length > 0;
  const notFound = !dataFiltered.length && canReset;
  const storesEmpty = !loading && !stores.length;

  const handleSortBy = useCallback((newValue) => {
    setSortBy(newValue);
  }, []);

  const handleSearch = useCallback((inputValue) => {
    setSearchQuery(inputValue);
  }, []);

  const renderFilters = (
    <Stack
      spacing={3}
      justifyContent="space-between"
      alignItems={{ xs: 'flex-end', sm: 'center' }}
      direction={{ xs: 'column', sm: 'row' }}
    >
      <StoreSearch
        query={debouncedQuery}
        results={searchResults}
        onSearch={handleSearch}
        loading={searchLoading}
      />
      <Stack direction="row" spacing={1} flexShrink={0}>
        <StoreSort sort={sortBy} onSort={handleSortBy} />
      </Stack>
    </Stack>
  );

  const renderResults = (
    <StoreFiltersResult filters={filters} totalResults={dataFiltered.length} />
  );

  const renderNotFound = <EmptyContent filled sx={{ py: 10 }} />;

  return (
    <Container sx={{ mb: 15 }}>
      <Typography variant="h4" sx={{ my: { xs: 3, md: 5 } }}>
        Select Store
      </Typography>
      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        {renderFilters}
        {canReset && renderResults}
      </Stack>
      {(notFound || storesEmpty) && renderNotFound}
      <StoreList stores={dataFiltered} loading={loading} />
    </Container>
  );
}
