import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';

export function SearchResultCard({ item, onAdd }) {
  return (
    <Card
      onClick={() => onAdd(item)}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'primary.main', boxShadow: 2, transform: 'translateY(-1px)' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            bgcolor: item.type === 'product' ? 'info.lighter' : 'warning.lighter',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify
            icon={item.type === 'product' ? 'solar:box-bold' : 'solar:hand-stars-bold'}
            width={20}
            sx={{ color: item.type === 'product' ? 'info.dark' : 'warning.dark' }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {item.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="caption" color="text.secondary">
              {fCurrency(item.price)}
            </Typography>
            {item.stock != null && (
              <Chip
                size="small"
                label={`Qty: ${item.stock}`}
                color={item.stock > 5 ? 'success' : item.stock > 0 ? 'warning' : 'error'}
                sx={{ height: 18, fontSize: 10 }}
              />
            )}
            {item.has_consigned && (
              <Chip
                size="small"
                label="Consignment"
                color="info"
                variant="outlined"
                sx={{ height: 18, fontSize: 10 }}
              />
            )}
          </Stack>
        </Box>
        <Iconify icon="eva:plus-fill" width={18} sx={{ color: 'primary.main', flexShrink: 0 }} />
      </Stack>
    </Card>
  );
}

SearchResultCard.propTypes = {
  item: PropTypes.object.isRequired,
  onAdd: PropTypes.func.isRequired,
};
