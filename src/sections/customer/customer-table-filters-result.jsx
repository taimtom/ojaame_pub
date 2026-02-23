import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

export function CustomerTableFiltersResult({ filters, onResetPage, totalResults, sx }) {
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  // If you ever add an addressType filter to your UI, you can add:
  const handleRemoveAddressType = useCallback(() => {
    onResetPage();
    filters.setState({ addressType: 'all' });
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    onResetPage();
    filters.onResetState();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Keyword:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveKeyword} />
      </FiltersBlock>
      {/* Uncomment this block if you add an addressType filter UI */}
      {/*
      <FiltersBlock label="Address Type:" isShow={filters.state.addressType !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.state.addressType}
          onDelete={handleRemoveAddressType}
        />
      </FiltersBlock>
      */}
    </FiltersResult>
  );
}
