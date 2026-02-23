// import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

// import { varAlpha } from 'src/theme/styles';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function StoreFiltersResult({ filters, totalResults, sx }) {
  const handleRemoveName = () => {
    filters.setState({ storeName: '' });
  };

  const handleRemoveStatus = () => {
    filters.setState({ status: [] });
  };

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock label="Name:" isShow={!!filters.state.storeName}>
        <Chip {...chipProps} label={filters.state.storeName} onDelete={handleRemoveName} />
      </FiltersBlock>

      <FiltersBlock label="Status:" isShow={filters.state.status.length > 0}>
        {filters.state.status.map((status) => (
          <Chip
            {...chipProps}
            key={status}
            label={status === 'active' ? 'Active' : 'Inactive'}
            onDelete={handleRemoveStatus}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}
