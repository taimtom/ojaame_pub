import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function RoleFiltersResult({ filters, totalResults, sx }) {
  const handleRemoveEmploymentTypes = (inputValue) => {
    const newValue = filters.state.employmentTypes.filter((item) => item !== inputValue);
    filters.setState({ employmentTypes: newValue });
  };

  const handleRemoveExperience = () => {
    filters.setState({ experience: 'all' });
  };

  const handleRemovePosition = (inputValue) => {
    const newValue = filters.state.position.filter((item) => item !== inputValue);
    filters.setState({ position: newValue });
  };

  const handleRemoveLocations = (inputValue) => {
    const newValue = filters.state.locations.filter((item) => item !== inputValue);
    filters.setState({ locations: newValue });
  };

  const handleRemoveBenefits = (inputValue) => {
    const newValue = filters.state.benefits.filter((item) => item !== inputValue);
    filters.setState({ benefits: newValue });
  };

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock label="Employment types:" isShow={!!filters.state.employmentTypes.length}>
        {filters.state.employmentTypes.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={item}
            onDelete={() => handleRemoveEmploymentTypes(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Experience:" isShow={filters.state.experience !== 'all'}>
        <Chip {...chipProps} label={filters.state.experience} onDelete={handleRemoveExperience} />
      </FiltersBlock>

      <FiltersBlock label="Position:" isShow={!!filters.state.position.length}>
        {filters.state.position.map((item) => (
          <Chip {...chipProps} key={item} label={item} onDelete={() => handleRemovePosition(item)} />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Locations:" isShow={!!filters.state.locations.length}>
        {filters.state.locations.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={item}
            onDelete={() => handleRemoveLocations(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock label="Benefits:" isShow={!!filters.state.benefits.length}>
        {filters.state.benefits.map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={item}
            onDelete={() => handleRemoveBenefits(item)}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}
