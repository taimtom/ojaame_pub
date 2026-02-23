import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { sentenceCase } from 'src/utils/change-case';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function ProductTableFiltersResult({ filters, totalResults, sx }) {
  // Provide default empty arrays if not defined
  const { publish = [] } = filters.state || {};

  const handleRemovePublish = useCallback(
    (inputValue) => {
      const newValue = publish.filter((item) => item !== inputValue);
      filters.setState({ ...filters.state, publish: newValue });
    },
    [filters, publish]
  );

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock label="Status:" isShow={publish.length > 0}>
        {publish.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={sentenceCase(item)}
            onDelete={() => handleRemovePublish(item)}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}
