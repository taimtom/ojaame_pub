// import { mutate } from 'swr';
// import { useState, useCallback } from 'react';

// import {
//   Box,
//   Tab,
//   Tabs,
//   Card,
//   Stack,
//   alpha,
//   Button,
//   useTheme,
//   Container,
//   useMediaQuery,
//   CircularProgress,
// } from '@mui/material';

// import { paths } from 'src/routes/paths';
// import { useRouter } from 'src/routes/hooks';
// import { RouterLink } from 'src/routes/components';

// import { useTabs } from 'src/hooks/use-tabs';
// import { useSetState } from 'src/hooks/use-set-state';

// import { DashboardContent } from 'src/layouts/dashboard';
// import { deleteIntegration, useListIntegrations } from 'src/actions/integration';

// import { Label } from 'src/components/label';
// import { toast } from 'src/components/snackbar';
// import { Iconify } from 'src/components/iconify';
// import { EmptyContent } from 'src/components/empty-content';
// import { ConfirmDialog } from 'src/components/custom-dialog';
// import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// import { IntegrationSort } from '../integration-sort';
// import { IntegrationSearch } from '../integration-search';
// import { IntegrationFilters } from '../integration-filters';
// import { IntegrationListEnhanced } from '../integration-list-enhanced';
// import { IntegrationFiltersResult } from '../integration-filters-result';

// // ----------------------------------------------------------------------

// const defaultFilters = {
//   name: '',
//   provider: 'all',
//   status: 'all',
//   type: 'all',
// };

// const INTEGRATION_SORT_OPTIONS = [
//   { value: 'latest', label: 'Latest' },
//   { value: 'oldest', label: 'Oldest' },
//   { value: 'name', label: 'Name' },
//   { value: 'provider', label: 'Provider' },
// ];

// // ----------------------------------------------------------------------

// export function IntegrationListViewEnhanced() {
//   const theme = useTheme();
//   const router = useRouter();
//   const isMobile = useMediaQuery(theme.breakpoints.down('md'));

//   const tabs = useTabs('all');

//   const [sortBy, setSortBy] = useState('latest');
//   const [deleteId, setDeleteId] = useState(null);
//   const [isDeleting, setIsDeleting] = useState(false);

//   const { state: filters, setState: setFilters } = useSetState(defaultFilters);

//   // Fetch integrations with real-time updates
//   const {
//     integrations,
//     integrationsLoading,
//     integrationsError,
//     integrationsEmpty,
//   } = useListIntegrations();

//   // Apply filters and sorting
//   const dataFiltered = applyFilter({
//     inputData: integrations || [],
//     filters,
//     sortBy,
//     tab: tabs.value
//   });

//   const canReset = Object.keys(filters).some(
//     (key) => filters[key] !== defaultFilters[key]
//   );

//   // Get counts for tabs
//   const allCount = integrations?.length || 0;
//   const activeCount = integrations?.filter(item => item.is_active)?.length || 0;
//   const inactiveCount = integrations?.filter(item => !item.is_active)?.length || 0;

//   const handleFilters = useCallback((name, value) => {
//     setFilters({ [name]: value });
//   }, [setFilters]);

//   const handleResetFilters = useCallback(() => {
//     setFilters(defaultFilters);
//   }, [setFilters]);

//   const handleSortBy = useCallback((newValue) => {
//     setSortBy(newValue);
//   }, []);

//   const handleFilterName = useCallback(
//     (inputValue) => {
//       setFilters({ name: inputValue });
//     },
//     [setFilters]
//   );

//   const handleDeleteIntegration = useCallback(async () => {
//     if (!deleteId) return;

//     setIsDeleting(true);
//     try {
//       await deleteIntegration(deleteId);
//       toast.success('Integration deleted successfully!');

//       // Trigger real-time update
//       mutate('/api/integrations/list');
//     } catch (error) {
//       console.error('Delete error:', error);
//       toast.error('Failed to delete integration');
//     } finally {
//       setIsDeleting(false);
//       setDeleteId(null);
//     }
//   }, [deleteId]);

//   const handleView = useCallback(
//     (id) => {
//       router.push(`/dashboard/integration/${id}`);
//     },
//     [router]
//   );

//   const handleEdit = useCallback(
//     (id) => {
//       router.push(`/dashboard/integration/edit/${id}`);
//     },
//     [router]
//   );

//   const handleSetup = useCallback(
//     (id) => {
//       router.push(`/dashboard/integration/setup/${id}`);
//     },
//     [router]
//   );

//   const renderFilters = (
//     <IntegrationFilters
//       filters={filters}
//       onResetFilters={handleResetFilters}
//       onFilters={handleFilters}
//       canReset={canReset}
//     />
//   );

//   const renderResults = (
//     <IntegrationFiltersResult
//       filters={filters}
//       onResetFilters={handleResetFilters}
//       canReset={canReset}
//       results={dataFiltered.length}
//     />
//   );

//   return (
//     <DashboardContent>
//       <Container maxWidth="lg">
//         <CustomBreadcrumbs
//           heading="Integrations"
//           links={[
//             { name: 'Dashboard', href: paths.dashboard.root },
//             { name: 'Integrations' },
//           ]}
//           action={
//             <Button
//               component={RouterLink}
//               href="/dashboard/integration/new"
//               variant="contained"
//               startIcon={<Iconify icon="mingcute:add-line" />}
//               size={isMobile ? 'small' : 'medium'}
//             >
//               {isMobile ? 'Add' : 'New Integration'}
//             </Button>
//           }
//           sx={{
//             mb: { xs: 2, md: 3 },
//             '& .MuiTypography-h4': {
//               fontSize: { xs: '1.5rem', md: '2rem' }
//             }
//           }}
//         />

//         <Card>
//           <Tabs
//             value={tabs.value}
//             onChange={tabs.onChange}
//             variant={isMobile ? 'fullWidth' : 'standard'}
//             sx={{
//               px: { xs: 1, md: 2.5 },
//               boxShadow: t => `inset 0 -2px 0 0 ${alpha(t.vars.palette.grey['500Channel'], 0.08)}`,
//               // boxShadow: theme => `inset 0 -2px 0 0 ${alpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
//               '& .MuiTab-root': {
//                 minWidth: { xs: 'auto', md: 120 },
//                 fontSize: { xs: '0.875rem', md: '1rem' }
//               }
//             }}
//           >
//             {[
//               ['all', 'All', allCount],
//               ['active', 'Active', activeCount],
//               ['inactive', 'Inactive', inactiveCount]
//             ].map(([value, label, count]) => (
//               <Tab
//                 key={value}
//                 iconPosition="end"
//                 value={value}
//                 label={label}
//                 icon={
//                   <Label
//                     variant={(value === 'all' && 'default') || 'filled'}
//                     color={
//                       (value === 'active' && 'success') ||
//                       (value === 'inactive' && 'warning') ||
//                       'default'
//                     }
//                     size={isMobile ? 'small' : 'medium'}
//                   >
//                     {count}
//                   </Label>
//                 }
//               />
//             ))}
//           </Tabs>

//           <Stack
//             spacing={{ xs: 2, md: 2.5 }}
//             sx={{
//               p: { xs: 2, md: 2.5 },
//               pr: { xs: 2, md: 1 }
//             }}
//           >
//             <Stack
//               spacing={2}
//               justifyContent="space-between"
//               alignItems={{ xs: 'stretch', sm: 'center' }}
//               direction={{ xs: 'column', sm: 'row' }}
//             >
//               <Box sx={{ flex: 1, maxWidth: { sm: 320 } }}>
//                 <IntegrationSearch onSearch={handleFilterName} />
//               </Box>
//               <Box sx={{ minWidth: { sm: 200 } }}>
//                 <IntegrationSort
//                   sort={sortBy}
//                   onSort={handleSortBy}
//                   sortOptions={INTEGRATION_SORT_OPTIONS}
//                 />
//               </Box>
//             </Stack>

//             {canReset && renderResults}

//             {integrationsLoading ? (
//               <Box
//                 display="flex"
//                 justifyContent="center"
//                 alignItems="center"
//                 minHeight={200}
//               >
//                 <CircularProgress />
//               </Box>
//             ) : integrationsError ? (
//               <EmptyContent
//                 filled
//                 title="Error Loading Integrations"
//                 description={integrationsError.message || 'Failed to load integrations'}
//                 action={
//                   <Button
//                     variant="contained"
//                     onClick={() => mutate('/api/integrations/list')}
//                     startIcon={<Iconify icon="eva:refresh-fill" />}
//                   >
//                     Retry
//                   </Button>
//                 }
//                 sx={{ py: { xs: 5, md: 10 } }}
//               />
//             ) : dataFiltered.length > 0 ? (
//             // ) : !!dataFiltered.length ? (
//               <IntegrationListEnhanced
//                 integrations={dataFiltered}
//                 onView={handleView}
//                 onEdit={handleEdit}
//                 onDelete={setDeleteId}
//                 onSetup={handleSetup}
//               />
//             ) : (
//               <EmptyContent
//                 filled
//                 title={integrationsEmpty ? 'No Integrations' : 'No Results Found'}
//                 description={
//                   integrationsEmpty
//                     ? 'Get started by setting up your first integration with Google or Jumia.'
//                     : 'Try adjusting your search or filter criteria.'
//                 }
//                 action={
//                   integrationsEmpty && (
//                     <Button
//                       component={RouterLink}
//                       href="/dashboard/integration/new"
//                       variant="contained"
//                       startIcon={<Iconify icon="mingcute:add-line" />}
//                     >
//                       Add First Integration
//                     </Button>
//                   )
//                 }
//                 sx={{ py: { xs: 5, md: 10 } }}
//               />
//             )}
//           </Stack>
//         </Card>

//         {!isMobile && renderFilters}
//       </Container>

//       <ConfirmDialog
//         open={!!deleteId}
//         onClose={() => setDeleteId(null)}
//         title="Delete Integration"
//         content="Are you sure you want to delete this integration? This action cannot be undone."
//         action={
//           <Button
//             variant="contained"
//             color="error"
//             onClick={handleDeleteIntegration}
//             disabled={isDeleting}
//           >
//             {isDeleting ? 'Deleting...' : 'Delete'}
//           </Button>
//         }
//       />
//     </DashboardContent>
//   );
// }

// // ----------------------------------------------------------------------

// function applyFilter({ inputData, filters, sortBy, tab }) {
//   const { name, provider, status, type } = filters;

//   let filtered = [...inputData];

//   // Apply tab filter
//   if (tab === 'active') {
//     filtered = filtered.filter(item => item.is_active);
//   } else if (tab === 'inactive') {
//     filtered = filtered.filter(item => !item.is_active);
//   }

//   // Apply search filter
//   if (name) {
//     filtered = filtered.filter(item =>
//       item.name.toLowerCase().includes(name.toLowerCase()) ||
//       item.provider.toLowerCase().includes(name.toLowerCase())
//     );
//   }

//   // Apply provider filter
//   if (provider !== 'all') {
//     filtered = filtered.filter(item => item.provider === provider);
//   }

//   // Apply status filter
//   if (status !== 'all') {
//     filtered = filtered.filter(item =>
//       status === 'active' ? item.is_active : !item.is_active
//     );
//   }

//   // Apply type filter
//   if (type !== 'all') {
//     filtered = filtered.filter(item => item.integration_type === type);
//   }

//   // Apply sorting
//   if (sortBy === 'latest') {
//     filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//   } else if (sortBy === 'oldest') {
//     filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
//   } else if (sortBy === 'name') {
//     filtered.sort((a, b) => a.name.localeCompare(b.name));
//   } else if (sortBy === 'provider') {
//     filtered.sort((a, b) => a.provider.localeCompare(b.provider));
//   }

//   return filtered;
// }

