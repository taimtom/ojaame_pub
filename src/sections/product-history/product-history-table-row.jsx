import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';

// import { fCurrency } from 'src/utils/format-number';
import { fTime, fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

// export function RenderCellPrice({ params }) {
//   return fCurrency(params.row.price);
// }

// ----------------------------------------------------------------------

export function RenderCellPublish({ params }) {
  // Ensure status exists to avoid errors if it's undefined.
  const status = params.row.status || '';
  let color;
  switch (status.toLowerCase()) {
    case 'adjust':
      color = 'info';
      break;
    case 'sold':
      color = 'success';
      break;
    case 'voidsales':
      color = 'error';
      break;
    case 'received':
      color = 'primary';
      break;
    default:
      color = 'default';
      break;
  }
  return (
    <Label variant="soft" color={color}>
      {status}
    </Label>
  );
}


// ----------------------------------------------------------------------

export function RenderCellQuantity({ params }) {
  return params.row.updated_quantity;
}

export function RenderCellAdded({ params }) {
  return params.row.quantity;
}
export function RenderCellPrevious({ params }) {
  return params.row.previous_quantity;
}

// ----------------------------------------------------------------------

export function RenderCellCreatedAt({ params }) {
  return (
    <Stack spacing={0.5}>
      <Box component="span">{fDate(params.row.created_at)}</Box>
      <Box component="span" sx={{ typography: 'caption', color: 'text.secondary' }}>
        {fTime(params.row.created_at)}
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function RenderCellStock({ params }) {
  return (
    <Stack justifyContent="center" sx={{ typography: 'caption', color: 'text.secondary' }}>
      <LinearProgress
        value={(params.row.available * 100) / params.row.quantity}
        variant="determinate"
        color={
          (params.row.inventoryType === 'out of stock' && 'error') ||
          (params.row.inventoryType === 'low stock' && 'warning') ||
          'success'
        }
        sx={{ mb: 1, width: 1, height: 6, maxWidth: 80 }}
      />
      {!!params.row.available && params.row.available} {params.row.inventoryType}
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function RenderCellProduct({ params, onViewRow }) {
  return (
    <Stack direction="row" alignItems="center" sx={{ py: 2, width: 1 }}>
      <Avatar
        alt={params.row.product_name}
        src={params.row.coverUrl}
        variant="rounded"
        sx={{ width: 64, height: 64, mr: 2 }}
      />

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
            {params.row.product_name}
          </Link>
        }
        secondary={
          <Box component="div" sx={{ typography: 'body2', color: 'text.disabled' }}>
            {/* {params.row.category} */}
          </Box>
        }
        sx={{ display: 'flex', flexDirection: 'column' }}
      />
    </Stack>
  );
}
