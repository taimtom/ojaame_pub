import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
// import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
// import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';
import { fTime, fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------


// ----------------------------------------------------------------------

export function RenderCellCategory({ params }) {
  return (
    <Label variant="soft" color={(params.row.category === 'publish' && 'info') || 'default'}>
      {params.row.category}
    </Label>
  );
}

// ----------------------------------------------------------------------
export function RenderCellPrice({ params }) {
  return fCurrency(params.row.amount);
}

// ----------------------------------------------------------------------

export function RenderCellCreatedAt({ params }) {
  return (
    <Stack spacing={0.5}>
      <Box component="span">{fDate(params.row.expense_date)}</Box>
      <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
        {fTime(params.row.expense_date)}
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export function RenderCellProduct({ params, onViewRow }) {
  return (
    <Stack direction="row" alignItems="center" sx={{ py: 2, width: 1 }}>


      <ListItemText
        disableTypography
        primary={
          <Link
            noWrap
            color="inherit"
            variant="subtitle2"
            onClick={onViewRow}
            sx={{ cursor: 'pointer' }}
          >
            {params.row.description}
          </Link>
        }
        secondary={
          <Box component="div" sx={{ typography: 'body2', color: 'text.disabled' }}>
            {params.row.category}
          </Box>
        }
        sx={{ display: 'flex', flexDirection: 'column' }}
      />
    </Stack>
  );
}
