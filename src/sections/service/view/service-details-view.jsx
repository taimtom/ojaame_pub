import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useTabs } from 'src/hooks/use-tabs';

import { fCurrency } from 'src/utils/format-number';
import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ServicePurchaseHistoryTab, ServiceSaleHistoryTab } from '../service-history-tab';

// ----------------------------------------------------------------------

function ServiceDetailsSummaryCard({ service }) {
  return (
    <Card sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Service icon placeholder */}
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: 2,
              bgcolor: 'primary.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:running-round-bold" width={36} sx={{ color: 'primary.main' }} />
          </Box>

          <Box>
            <Typography variant="h5">{service.name}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <Chip
                size="small"
                label={service.publish || 'draft'}
                color={service.publish === 'published' ? 'success' : 'default'}
                variant="soft"
              />
              {service.duration && (
                <Chip
                  size="small"
                  icon={<Iconify icon="solar:clock-circle-outline" width={14} />}
                  label={`${service.duration} min`}
                  variant="soft"
                />
              )}
            </Stack>
          </Box>
        </Stack>

        <Divider />

        <Box
          display="grid"
          gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }}
          gap={2}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Price
            </Typography>
            <Typography variant="subtitle1" fontWeight="bold">
              {fCurrency(service.price)}
            </Typography>
          </Box>

          {service.price_sale != null && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Sale Price
              </Typography>
              <Typography variant="subtitle1" color="error.main" fontWeight="bold">
                {fCurrency(service.price_sale)}
              </Typography>
            </Box>
          )}

          {service.costPrice != null && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Cost Price
              </Typography>
              <Typography variant="subtitle1">{fCurrency(service.costPrice)}</Typography>
            </Box>
          )}

          {service.taxes != null && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Tax
              </Typography>
              <Typography variant="subtitle1">{service.taxes}%</Typography>
            </Box>
          )}

          {service.session_count != null && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Sessions
              </Typography>
              <Typography variant="subtitle1">{service.session_count}</Typography>
            </Box>
          )}

          {service.appointment_required != null && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Appointment Required
              </Typography>
              <Typography variant="subtitle1">
                {service.appointment_required === 'true' || service.appointment_required === true
                  ? 'Yes'
                  : 'No'}
              </Typography>
            </Box>
          )}
        </Box>

        {service.description && (
          <>
            <Divider />
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2">{service.description}</Typography>
            </Box>
          </>
        )}

        {service.sub_description && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Additional Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {service.sub_description}
            </Typography>
          </Box>
        )}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function ServiceDetailsView({ service, error, loading, storeSlug, storeId }) {
  const tabs = useTabs('description');

  if (loading) {
    return (
      <DashboardContent sx={{ pt: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
          <Typography variant="body1" color="text.secondary">
            Loading service details…
          </Typography>
        </Box>
      </DashboardContent>
    );
  }

  if (error || !service) {
    return (
      <DashboardContent sx={{ pt: 5 }}>
        <EmptyContent
          filled
          title="Service not found!"
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.service.root(storeSlug)}
              startIcon={<Iconify width={16} icon="eva:arrow-ios-back-fill" />}
              sx={{ mt: 3 }}
            >
              Back to list
            </Button>
          }
          sx={{ py: 10, height: 'auto', flexGrow: 'unset' }}
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={service.name}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Services', href: paths.dashboard.service.root(storeSlug) },
          { name: service.name },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.service.edit(storeSlug, service.id)}
            variant="contained"
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            Edit Service
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ServiceDetailsSummaryCard service={service} />

      <Card sx={{ mt: 3 }}>
        <Tabs
          value={tabs.value}
          onChange={tabs.onChange}
          sx={{
            px: 3,
            boxShadow: (theme) =>
              `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {[
            { value: 'description', label: 'Description' },
            { value: 'purchase_history', label: 'Purchase History' },
            { value: 'sale_history', label: 'Sale History' },
          ].map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>

        {tabs.value === 'description' && (
          <Box sx={{ p: 3 }}>
            {service.description ? (
              <Typography variant="body1">{service.description}</Typography>
            ) : (
              <EmptyContent title="No description available" sx={{ py: 5 }} />
            )}
          </Box>
        )}

        {tabs.value === 'purchase_history' && (
          <ServicePurchaseHistoryTab storeId={storeId} serviceId={service.id} />
        )}

        {tabs.value === 'sale_history' && (
          <ServiceSaleHistoryTab storeId={storeId} serviceId={service.id} />
        )}
      </Card>
    </DashboardContent>
  );
}
