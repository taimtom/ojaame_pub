import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

// import { sentenceCase } from 'src/utils/change-case';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function PaymentMethodTableFiltersResult({ filters, options, totalResults, sx }) {
  // const handleRemoveStock = useCallback(
  //   (inputValue) => {
  //     const newValue = filters.state.stock.filter((item) => item !== inputValue);

  //     filters.setState({ stock: newValue });
  //   },
  //   [filters]
  // );

  const handleRemovePublish = useCallback(
    (val) => {
      filters.setState({ publish: filters.state.publish.filter((x) => x !== val) });
    },
    [filters]
  );

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>


<FiltersBlock label="Publish:" isShow={!!filters.state.publish.length}>
{filters.state.publish.map((val) => {
          // lookup the label from your PUBLISH_OPTIONS
          const label = options.publish.find((o) => o.value === val)?.label ?? val;
          return (
            <Chip
              key={val}
              label={label}
              onDelete={() => handleRemovePublish(val)}
              {...chipProps}
            />
          );
        })}
      </FiltersBlock>
    </FiltersResult>
  );
}
