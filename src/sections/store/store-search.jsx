import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { paramCase } from 'src/utils/change-case';

import { useAuthContext } from 'src/auth/hooks';
import { Iconify } from 'src/components/iconify';
import { SearchNotFound } from 'src/components/search-not-found';

export function StoreSearch({ query, results, onSearch, loading }) {
  const router = useRouter();
  const { user } = useAuthContext();

  // Build a store slug from storeName and id.
  const getStoreParam = (store) => `${paramCase(store.storeName)}-${store.id}`;

  const handleClick = (store) => {
    // Save the selected store (with current user_id) in localStorage as the active workspace.
    localStorage.setItem('activeWorkspace', JSON.stringify({ ...store, user_id: user?.user_id }));
    const storeParam = getStoreParam(store);
    // Build the URL by concatenating the dashboard root (assumed to be a string) with the store slug.
    const linkTo = `${paths.dashboard.root}/${storeParam}`;
    router.push(linkTo);
  };

  const handleKeyUp = (event) => {
    if (query && event.key === 'Enter') {
      const selectItem = results.find(
        (store) => store.storeName.toLowerCase() === query.toLowerCase()
      );
      if (!selectItem) {
        console.warn("No store found matching the query.");
        return;
      }
      handleClick(selectItem);
    }
  };

  return (
    <Autocomplete
      sx={{ width: { xs: 1, sm: 260 } }}
      loading={loading}
      autoHighlight
      popupIcon={null}
      options={results}
      onInputChange={(event, newValue) => onSearch(newValue)}
      getOptionLabel={(option) => option.storeName}
      noOptionsText={<SearchNotFound query={query} />}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      slotProps={{
        popper: { placement: 'bottom-start', sx: { minWidth: 320 } },
        paper: { sx: { [` .${autocompleteClasses.option}`]: { pl: 0.75 } } },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search..."
          onKeyUp={handleKeyUp}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ ml: 1, color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? (
                  <Iconify icon="svg-spinners:8-dots-rotate" sx={{ mr: -3 }} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, store, { inputValue }) => {
        // Destructure and remove any prop named "a" from the passed props.
        const { a, ...restProps } = props;
        const matches = match(store.storeName, inputValue);
        const parts = parse(store.storeName, matches);
        return (
          <Box
            component="li"
            {...restProps}
            onClick={() => handleClick(store)}
            key={store.id}
          >
            <Avatar
              alt={store.storeName}
              src={store.coverUrl}
              variant="rounded"
              sx={{
                mr: 1.5,
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: 1,
              }}
            />
            <div>
              {parts.map((part, index) => (
                <Typography
                  key={index}
                  component="span"
                  color={part.highlight ? 'primary' : 'textPrimary'}
                  sx={{
                    typography: 'body2',
                    fontWeight: part.highlight ? 'fontWeightSemiBold' : 'fontWeightMedium',
                  }}
                >
                  {part.text}
                </Typography>
              ))}
            </div>
          </Box>
        );
      }}
    />
  );
}
