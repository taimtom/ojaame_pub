import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function InfoRow({ icon, label, value, valueColor }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary', minWidth: 0 }}>
        <Iconify icon={icon} width={16} sx={{ flexShrink: 0 }} />
        <Typography variant="body2" noWrap>
          {label}
        </Typography>
      </Stack>
      <Typography
        variant="subtitle2"
        sx={{ color: valueColor || 'text.primary', textAlign: 'right' }}
      >
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1.5,
        bgcolor: bg || `${color}.lighter`,
        border: `1px solid ${theme.palette[color]?.light || theme.palette.divider}`,
        flex: 1,
      }}
    >
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Iconify icon={icon} width={18} sx={{ color: `${color}.main` }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="h6" sx={{ color: `${color}.dark` }}>
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function ProductDashboardSummary({ product }) {
  const theme = useTheme();

  const {
    name,
    price,
    costPrice,
    priceSale,
    quantity,
    available,
    inventoryType,
    taxes,
    code,
    sku,
    tags,
    is_pack,
    quantity_per_pack,
    cost_price_per_pack,
    pack_sell_price: packSellPriceField,
    allow_variable_price,
    variable_price_min,
    variable_price_max,
    batch_number,
    expiry_date,
    harvest_date,
    prescription_info,
    dosage,
    newLabel,
    saleLabel,
    publish,
  } = product;

  const pack_sell_price = packSellPriceField ?? product.packSellPrice ?? null;

  const stockQty = available ?? quantity ?? 0;
  const profitMargin =
    costPrice && price ? (((price - costPrice) / price) * 100).toFixed(1) : null;

  const inventoryColor =
    (inventoryType === 'out of stock' && 'error') ||
    (inventoryType === 'low stock' && 'warning') ||
    'success';

  return (
    <Stack spacing={3} sx={{ pt: 3 }}>
      {/* Labels row */}
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        <Label color={inventoryColor} variant="soft">
          {inventoryType || 'in stock'}
        </Label>
        <Label color={publish === 'published' ? 'success' : 'default'} variant="outlined">
          {publish || 'draft'}
        </Label>
        {newLabel?.enabled && <Label color="info">{newLabel.content}</Label>}
        {saleLabel?.enabled && <Label color="error">{saleLabel.content}</Label>}
      </Stack>

      {/* Product name */}
      <Typography variant="h5">{name}</Typography>

      {/* Key stock stat cards */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        <StatCard
          icon="solar:box-bold"
          label="Current Stock"
          value={stockQty}
          color="info"
        />
        <StatCard
          icon="solar:tag-price-bold"
          label="Selling Price"
          value={fCurrency(price)}
          color="primary"
        />
        {costPrice != null && (
          <StatCard
            icon="solar:dollar-minimalistic-bold"
            label="Cost Price"
            value={fCurrency(costPrice)}
            color="warning"
          />
        )}
        {profitMargin != null && (
          <StatCard
            icon="solar:chart-square-bold"
            label="Profit Margin"
            value={`${profitMargin}%`}
            color={Number(profitMargin) >= 20 ? 'success' : 'error'}
          />
        )}
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {/* Product identifiers */}
      <Stack spacing={1.5}>
        <Typography variant="overline" sx={{ color: 'text.disabled' }}>
          Identifiers
        </Typography>
        {code && (
          <InfoRow icon="solar:barcode-bold" label="Product Code" value={code} />
        )}
        {sku && (
          <InfoRow icon="solar:tag-bold" label="SKU" value={sku} />
        )}
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {/* Pricing details */}
      <Stack spacing={1.5}>
        <Typography variant="overline" sx={{ color: 'text.disabled' }}>
          Pricing
        </Typography>
        <InfoRow
          icon="solar:tag-price-bold"
          label="Selling Price"
          value={fCurrency(price)}
        />
        {costPrice != null && (
          <InfoRow
            icon="solar:dollar-minimalistic-bold"
            label="Cost Price"
            value={fCurrency(costPrice)}
          />
        )}
        {priceSale != null && (
          <InfoRow
            icon="solar:sale-bold"
            label="Sale Price"
            value={fCurrency(priceSale)}
            valueColor={theme.palette.error.main}
          />
        )}
        {taxes != null && taxes > 0 && (
          <InfoRow icon="solar:percent-bold" label="Taxes" value={`${taxes}%`} />
        )}
        {allow_variable_price && (
          <InfoRow
            icon="solar:graph-up-bold"
            label="Variable Price Range"
            value={`${fCurrency(variable_price_min)} – ${fCurrency(variable_price_max)}`}
          />
        )}
      </Stack>

      {/* Pack info (conditional) */}
      {is_pack && (
        <>
          <Divider sx={{ borderStyle: 'dashed' }} />
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ color: 'text.disabled' }}>
              Pack Info
            </Typography>
            <InfoRow
              icon="solar:layers-bold"
              label="Units per Pack"
              value={quantity_per_pack}
            />
            {cost_price_per_pack != null && (
              <InfoRow
                icon="solar:dollar-minimalistic-bold"
                label="Cost per Pack"
                value={fCurrency(cost_price_per_pack)}
              />
            )}
            <InfoRow
              icon="solar:cart-large-bold"
              label="Pack Sell Price"
              value={
                pack_sell_price != null && pack_sell_price !== ''
                  ? fCurrency(Number(pack_sell_price))
                  : '—'
              }
              valueColor={pack_sell_price != null ? 'primary.main' : 'text.disabled'}
            />
          </Stack>
        </>
      )}

      {/* Business-specific fields (conditional) */}
      {(batch_number || expiry_date || harvest_date || prescription_info || dosage) && (
        <>
          <Divider sx={{ borderStyle: 'dashed' }} />
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ color: 'text.disabled' }}>
              Additional Info
            </Typography>
            {batch_number && (
              <InfoRow icon="solar:document-bold" label="Batch Number" value={batch_number} />
            )}
            {expiry_date && (
              <InfoRow
                icon="solar:calendar-date-bold"
                label="Expiry Date"
                value={fDate(expiry_date)}
                valueColor={
                  new Date(expiry_date) < new Date()
                    ? theme.palette.error.main
                    : undefined
                }
              />
            )}
            {harvest_date && (
              <InfoRow
                icon="solar:calendar-bold"
                label="Harvest Date"
                value={fDate(harvest_date)}
              />
            )}
            {prescription_info && (
              <InfoRow
                icon="solar:medical-kit-bold"
                label="Prescription"
                value={prescription_info}
              />
            )}
            {dosage && (
              <InfoRow icon="solar:pill-bold" label="Dosage" value={dosage} />
            )}
          </Stack>
        </>
      )}

      {/* Tags */}
      {tags?.length > 0 && (
        <>
          <Divider sx={{ borderStyle: 'dashed' }} />
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ color: 'text.disabled' }}>
              Tags
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="soft" />
              ))}
            </Stack>
          </Stack>
        </>
      )}
    </Stack>
  );
}
