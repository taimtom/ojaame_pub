import { useMemo } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import {
  DataGrid,
  GridActionsCellItem,
} from '@mui/x-data-grid';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';

import { useGetDigitalProducts } from 'src/actions/digital-product';
import { DashboardContent } from 'src/layouts/dashboard';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

export function DigitalProductListView({ storeSlug, storeId }) {
  const router = useRouter();
  const { fCurrency } = useCurrencyFormat();
  const { digitalProducts, digitalProductsLoading } = useGetDigitalProducts(storeId);

  const rows = useMemo(
    () =>
      (digitalProducts || []).map((row) => ({
        id: row.id,
        name: row.name,
        price: row.price,
        merchant_payout_amount: row.merchant_payout_amount,
        delivery_type: row.delivery_type,
        publish: row.publish,
      })),
    [digitalProducts]
  );

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
    {
      field: 'price',
      headerName: 'List price',
      width: 120,
      valueFormatter: (v) => fCurrency(v),
    },
    {
      field: 'merchant_payout_amount',
      headerName: 'You receive',
      width: 130,
      valueFormatter: (v) => fCurrency(v ?? 0),
    },
    { field: 'delivery_type', headerName: 'Delivery', width: 120 },
    { field: 'publish', headerName: 'Status', width: 100 },
    {
      type: 'actions',
      field: 'actions',
      headerName: '',
      width: 80,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Iconify icon="solar:pen-bold" />}
          label="Edit"
          onClick={() =>
            router.push(paths.dashboard.digitalProduct.edit(storeSlug, params.row.id))
          }
        />,
      ],
    },
  ];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Digital Products"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Digital Products' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.digitalProduct.new(storeSlug)}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New digital product
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={digitalProductsLoading}
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          slots={{
            noRowsOverlay: () => <EmptyContent title="No digital products yet" />,
          }}
        />
      </Card>
    </DashboardContent>
  );
}
