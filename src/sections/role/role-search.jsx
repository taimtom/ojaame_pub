// src/sections/role/role-search.jsx
import React from 'react';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { SearchNotFound } from 'src/components/search-not-found';

export function RoleSearch({ search, onSearch }) {
  const router = useRouter();
  const { query, results } = search.state;

  const handleClick = (id) => {
    router.push(paths.dashboard.role.details(id));
  };

  const handleKeyUp = (event) => {
    if (query && event.key === 'Enter') {
      const selected = results.find((role) => role.name === query);
      if (selected) {
        handleClick(selected.id);
      }
    }
  };

  return (
    <Autocomplete
      freeSolo
      autoHighlight
      popupIcon={null}
      sx={{ width: { xs: 1, sm: 260 } }}
      options={results}
      onInputChange={(_, newValue) => onSearch(newValue)}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText={<SearchNotFound query={query} />}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search roles..."
          onKeyUp={handleKeyUp}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ ml: 1, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      )}
      renderOption={(props, option, { inputValue }) => {
        const matches = match(option.name, inputValue);
        const parts = parse(option.name, matches);

        return (
          <Box
            component="li"
            {...props}
            key={option.id}
            onClick={() => handleClick(option.id)}
          >
            {parts.map((part, index) => (
              <Typography
                key={index}
                component="span"
                color={part.highlight ? 'primary' : 'textPrimary'}
                sx={{
                  typography: 'body2',
                  fontWeight: part.highlight ? 'fontWeightSemiBold' : 'fontWeightRegular',
                }}
              >
                {part.text}
              </Typography>
            ))}
          </Box>
        );
      }}
    />
  );
}
