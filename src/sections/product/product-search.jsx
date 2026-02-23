// import { useParams } from 'react-router-dom';
// import parse from 'autosuggest-highlight/parse';
// import match from 'autosuggest-highlight/match';

// import Box from '@mui/material/Box';
// import Avatar from '@mui/material/Avatar';
// import TextField from '@mui/material/TextField';
// import Typography from '@mui/material/Typography';
// import InputAdornment from '@mui/material/InputAdornment';
// import Autocomplete, { autocompleteClasses } from '@mui/material/Autocomplete';

// import { paths } from 'src/routes/paths';
// import { useRouter } from 'src/routes/hooks';

// import { Iconify } from 'src/components/iconify';
// import { SearchNotFound } from 'src/components/search-not-found';

// // ----------------------------------------------------------------------

// export function ProductSearch({ query, results, onSearch, loading }) {
//   const router = useRouter();
//   const { storeParam } = useParams();

//   // Determine the current store id:
//   let currentStore = '';
//   if (storeParam) {
//     // e.g., "my-store-1" -> "1"
//     const parts = storeParam.split('-');
//     currentStore = parts[parts.length - 1];
//   } else {
//     // Fall back to activeWorkspace in localStorage
//     const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
//     if (activeWorkspaceJson) {
//       try {
//         const activeWorkspace = JSON.parse(activeWorkspaceJson);
//         currentStore = activeWorkspace.id;
//       } catch (error) {
//         console.error('Error parsing activeWorkspace from localStorage', error);
//       }
//     }
//   }

//   // Handler to navigate to product details using store id
//   const handleClick = (id) => {
//     // Ensure your routes are defined like: paths.dashboard.product.details(storeId, productId)
//     router.push(paths.dashboard.product.details(currentStore, id));
//   };

//   const handleKeyUp = (event) => {
//     if (query && event.key === 'Enter') {
//       const selectItem = results.find((product) => product.name === query);
//       if (selectItem) {
//         handleClick(selectItem.id);
//       }
//     }
//   };

//   return (
//     <Autocomplete
//       sx={{ width: { xs: 1, sm: 260 } }}
//       loading={loading}
//       autoHighlight
//       popupIcon={null}
//       options={results}
//       onInputChange={(event, newValue) => onSearch(newValue)}
//       getOptionLabel={(option) => option.name}
//       noOptionsText={<SearchNotFound query={query} />}
//       isOptionEqualToValue={(option, value) => option.id === value.id}
//       slotProps={{
//         popper: { placement: 'bottom-start', sx: { minWidth: 320 } },
//         paper: { sx: { [` .${autocompleteClasses.option}`]: { pl: 0.75 } } },
//       }}
//       renderInput={(params) => (
//         <TextField
//           {...params}
//           placeholder="Search..."
//           onKeyUp={handleKeyUp}
//           InputProps={{
//             ...params.InputProps,
//             startAdornment: (
//               <InputAdornment position="start">
//                 <Iconify icon="eva:search-fill" sx={{ ml: 1, color: 'text.disabled' }} />
//               </InputAdornment>
//             ),
//             endAdornment: (
//               <>
//                 {loading ? <Iconify icon="svg-spinners:8-dots-rotate" sx={{ mr: -3 }} /> : null}
//                 {params.InputProps.endAdornment}
//               </>
//             ),
//           }}
//         />
//       )}
//       renderOption={(props, product, { inputValue }) => {
//         const matches = match(product.name, inputValue);
//         const parts = parse(product.name, matches);

//         return (
//           <Box
//             component="li"
//             {...props}
//             onClick={() => handleClick(product.id)}
//             key={product.id}
//           >
//             <Avatar
//               alt={product.name}
//               src={product.coverUrl}
//               variant="rounded"
//               sx={{
//                 mr: 1.5,
//                 width: 48,
//                 height: 48,
//                 flexShrink: 0,
//                 borderRadius: 1,
//               }}
//             />
//             <div>
//               {parts.map((part, index) => (
//                 <Typography
//                   key={index}
//                   component="span"
//                   color={part.highlight ? 'primary' : 'textPrimary'}
//                   sx={{
//                     typography: 'body2',
//                     fontWeight: part.highlight ? 'fontWeightSemiBold' : 'fontWeightMedium',
//                   }}
//                 >
//                   {part.text}
//                 </Typography>
//               ))}
//             </div>
//           </Box>
//         );
//       }}
//     />
//   );
// }


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

import { Iconify } from 'src/components/iconify';
import { SearchNotFound } from 'src/components/search-not-found';

// ----------------------------------------------------------------------

export function ProductSearch({ query, results, onSearch, loading }) {
  const router = useRouter();

  const handleClick = (id) => {
    router.push(paths.product.details(id));
  };

  const handleKeyUp = (event) => {
    if (query) {
      if (event.key === 'Enter') {
        const selectItem = results.filter((product) => product.name === query)[0];

        handleClick(selectItem.id);
      }
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
      getOptionLabel={(option) => option.name}
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
                {loading ? <Iconify icon="svg-spinners:8-dots-rotate" sx={{ mr: -3 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, product, { inputValue }) => {
        const matches = match(product.name, inputValue);
        const parts = parse(product.name, matches);

        return (
          <Box component="li" {...props} onClick={() => handleClick(product.id)} key={product.id}>
            <Avatar
              key={product.id}
              alt={product.name}
              src={product.coverUrl}
              variant="rounded"
              sx={{
                mr: 1.5,
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: 1,
              }}
            />

            <div key={inputValue}>
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
