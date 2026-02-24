import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';


// ----------------------------------------------------------------------

// Overview
const IndexPage = lazy(() => import('src/pages/dashboard'));
const DashboardRootRedirect = lazy(() => import('src/components/dashboard/dashboardRootRedirect'));
const QuickDashboardPage = lazy(() => import('src/pages/dashboard/quick-dashboard'));
// const StoreRootRedirect = lazy(() => import('src/components/dashboard/RequireStoreParam'));
const OverviewEcommercePage = lazy(() => import('src/pages/dashboard/ecommerce'));
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
const OverviewBankingPage = lazy(() => import('src/pages/dashboard/banking'));
const OverviewBookingPage = lazy(() => import('src/pages/dashboard/booking'));
const OverviewFilePage = lazy(() => import('src/pages/dashboard/file'));
const OverviewCoursePage = lazy(() => import('src/pages/dashboard/course'));

// pos
const PosCreatePage = lazy(() => import('src/pages/dashboard/pos'));
const PosEditPage = lazy(() => import('src/pages/dashboard/pos/edit'));
const PosReceiptPage = lazy(() => import('src/pages/dashboard/pos/receipt'));

// Product
const ProductDetailsPage = lazy(() => import('src/pages/dashboard/product/details'));
const ProductListPage = lazy(() => import('src/pages/dashboard/product/list'));
const ProductCreatePage = lazy(() => import('src/pages/dashboard/product/new'));
const ProductEditPage = lazy(() => import('src/pages/dashboard/product/edit'));
const ProductAddQuantityPage = lazy(() => import('src/pages/dashboard/product/addqty'));
const ProductHistoryListPage = lazy(() => import('src/pages/dashboard/product/history'));
const ProductHistoryMovementPage = lazy(() => import('src/pages/dashboard/product/movement'));

// Category
const CategoryListPage = lazy(() => import('src/pages/dashboard/category/list'));
const CategoryCreatePage = lazy(() => import('src/pages/dashboard/category/new'));
const CategoryEditPage = lazy(() => import('src/pages/dashboard/category/edit'));


// Expense
const ExpenseListPage = lazy(() => import('src/pages/dashboard/expense/list'));
const ExpenseCreatePage = lazy(() => import('src/pages/dashboard/expense/new'));
const ExpenseEditPage = lazy(() => import('src/pages/dashboard/expense/edit'));
const ExpenseDetailsPage = lazy(() => import('src/pages/dashboard/expense/details'));

// Expense
const PaymentMethodListPage = lazy(() => import('src/pages/dashboard/payment-method/list'));
const PaymentMethodCreatePage = lazy(() => import('src/pages/dashboard/payment-method/new'));
const PaymentMethodEditPage = lazy(() => import('src/pages/dashboard/payment-method/edit'));

// Service
const ServiceListPage = lazy(() => import('src/pages/dashboard/service/list'));
const ServiceCreatePage = lazy(() => import('src/pages/dashboard/service/new'));
const ServiceEditPage = lazy(() => import('src/pages/dashboard/service/edit'));
const ServiceDetailsPage = lazy(() => import('src/pages/dashboard/service/details'));
// Order
const OrderListPage = lazy(() => import('src/pages/dashboard/order/list'));
const OrderDetailsPage = lazy(() => import('src/pages/dashboard/order/details'));
// Invoice
const InvoiceListPage = lazy(() => import('src/pages/dashboard/invoice/list'));
const InvoiceDetailsPage = lazy(() => import('src/pages/dashboard/invoice/details'));
const InvoiceCreatePage = lazy(() => import('src/pages/dashboard/invoice/new'));
const InvoiceEditPage = lazy(() => import('src/pages/dashboard/invoice/edit'));
const InvoiceHistoryListPage = lazy(() => import('src/pages/dashboard/invoice/historydetails'));
const InvoiceHistoryPage = lazy(() => import('src/pages/dashboard/invoice/history'));
// User
const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserAccountPage = lazy(() => import('src/pages/dashboard/user/account'));

// const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/invite'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));


// User
const CustomerListPage = lazy(() => import('src/pages/dashboard/customer/list'));

// const CustomerCreatePage = lazy(() => import('src/pages/dashboard/customer/new'));
const CustomerCreatePage = lazy(() => import('src/pages/dashboard/customer/new'));
const CustomerEditPage = lazy(() => import('src/pages/dashboard/customer/edit'));

// Store
const StoreCreatePage = lazy(() => import('src/pages/dashboard/store/new'));
const StoreListPage = lazy(() => import('src/pages/dashboard/store/list'));
const StoreAccountPage = lazy(() => import('src/pages/dashboard/store/account'));
// const StoreWrapper = lazy(() => import('src/pages/dashboard/store/redirect'));

// Integration
const IntegrationListPage = lazy(() => import('src/pages/dashboard/integration/list'));
const IntegrationDashboardPage = lazy(() => import('src/pages/dashboard/integration/dashboard'));
const IntegrationDetailsPage = lazy(() => import('src/pages/dashboard/integration/details'));
const IntegrationCreatePage = lazy(() => import('src/pages/dashboard/integration/new'));
const IntegrationEditPage = lazy(() => import('src/pages/dashboard/integration/edit'));
const OAuthCallbackPage = lazy(() => import('src/pages/dashboard/integration/oauth-callback'));
const OAuthSuccessPage = lazy(() => import('src/pages/dashboard/integration/oauth-success'));

// Google Integration pages
const GoogleEmailPage = lazy(() => import('src/pages/dashboard/integration/google/email'));
const GoogleDrivePage = lazy(() => import('src/pages/dashboard/integration/google/drive'));
const GoogleCalendarPage = lazy(() => import('src/pages/dashboard/integration/google/calendar'));
const GoogleMeetPage = lazy(() => import('src/pages/dashboard/integration/google/meet'));
const GoogleIntegrationUsagePage = lazy(() => import('src/pages/dashboard/integration/google-usage'));

// Jumia Integration pages
const JumiaProductsPage = lazy(() => import('src/pages/dashboard/integration/jumia/products'));
const JumiaOrdersPage = lazy(() => import('src/pages/dashboard/integration/jumia/orders'));
const JumiaInventoryPage = lazy(() => import('src/pages/dashboard/integration/jumia/inventory'));

// Blog
const BlogPostsPage = lazy(() => import('src/pages/dashboard/post/list'));
const BlogPostPage = lazy(() => import('src/pages/dashboard/post/details'));
const BlogNewPostPage = lazy(() => import('src/pages/dashboard/post/new'));
const BlogEditPostPage = lazy(() => import('src/pages/dashboard/post/edit'));
// Job
const JobDetailsPage = lazy(() => import('src/pages/dashboard/job/details'));
const JobListPage = lazy(() => import('src/pages/dashboard/job/list'));
const JobCreatePage = lazy(() => import('src/pages/dashboard/job/new'));
const JobEditPage = lazy(() => import('src/pages/dashboard/job/edit'));
// Role
const RoleDetailsPage = lazy(() => import('src/pages/dashboard/role/details'));
const RoleListPage = lazy(() => import('src/pages/dashboard/role/list'));
const RoleCreatePage = lazy(() => import('src/pages/dashboard/role/new'));
const RoleEditPage = lazy(() => import('src/pages/dashboard/role/edit'));

// Tour
const TourDetailsPage = lazy(() => import('src/pages/dashboard/tour/details'));
const TourListPage = lazy(() => import('src/pages/dashboard/tour/list'));
const TourCreatePage = lazy(() => import('src/pages/dashboard/tour/new'));
const TourEditPage = lazy(() => import('src/pages/dashboard/tour/edit'));
// File manager
const FileManagerPage = lazy(() => import('src/pages/dashboard/file-manager'));
// App
const ChatPage = lazy(() => import('src/pages/dashboard/chat'));
const MailPage = lazy(() => import('src/pages/dashboard/mail'));
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));
const KanbanPage = lazy(() => import('src/pages/dashboard/kanban'));
// Test render page by role
const PermissionDeniedPage = lazy(() => import('src/pages/dashboard/permission'));
// Blank page
const ParamsPage = lazy(() => import('src/pages/dashboard/params'));
const BlankPage = lazy(() => import('src/pages/dashboard/blank'));
// Store website settings
const StoreWebsiteSettingsPage = lazy(() => import('src/pages/dashboard/store/website'));

// ----------------------------------------------------------------------

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);

export const dashboardRoutes = [
  {
    path: 'app',
    element: CONFIG.auth.skip ? <>{layoutContent}</> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      { path: 'analytics', element: <OverviewAnalyticsPage /> },
      { path: 'quick-dashboard', element: <QuickDashboardPage /> },

      { index: true, element: <DashboardRootRedirect /> },
      {
        path: ':storeParam', // Expects a parameter like "my-store-1"
        element: <Outlet />,
      //   <RequireStoreParam>
      //   <Outlet />
      // </RequireStoreParam>,
        children: [{ index: true, element: <IndexPage /> }, {
          path: 'product',
          children: [
            { index: true, element: <ProductListPage /> },
            { path: 'list', element: <ProductListPage /> },
            { path: 'history', element: <ProductHistoryListPage /> },
            { path: ':id', element: <ProductDetailsPage /> },
            { path: ':id/movement', element: <ProductHistoryMovementPage /> },
            { path: 'new', element: <ProductCreatePage /> },
            { path: ':id/edit', element: <ProductEditPage /> },
            { path: ':id/addqty', element: <ProductAddQuantityPage /> },
          ],
        },
        {
          path: 'pos',
          children: [
            {index: true, element: <PosCreatePage /> },
            { path: ':id/edit', element: <PosEditPage /> },
            { path: ':id/receipt', element: <PosReceiptPage /> },
          ],
        },
        {
          path: 'service',
          children: [
            { index: true, element: <ServiceListPage /> },
            { path: 'list', element: <ServiceListPage /> },
            { path: 'new', element: <ServiceCreatePage /> },
            { path: ':id', element: <ServiceDetailsPage /> },
            { path: ':id/edit', element: <ServiceEditPage /> },
          ],
        },
        {
          path: 'category',
          children: [
            { index: true, element: <CategoryListPage /> },
            { path: 'list', element: <CategoryListPage /> },
            { path: 'new', element: <CategoryCreatePage /> },
            { path: ':id/edit', element: <CategoryEditPage /> },
          ],
        },
        {
          path: 'customer',
          children: [
            { index: true, element: <CustomerListPage /> },
            // { path: 'list', element: <CustomerListPage /> },
            { path: 'new', element: <CustomerCreatePage /> },
            { path: ':id/edit', element: <CustomerEditPage /> },
          ],
        },

        {
          path: 'invoice',
          children: [
            { index: true, element: <InvoiceListPage /> },
            { path: 'list', element: <InvoiceListPage /> },
            { path: ':id', element: <InvoiceDetailsPage /> },
            { path: ':id/edit', element: <InvoiceEditPage /> },
            { path: 'new', element: <InvoiceCreatePage /> },
            { path: 'history', element: <InvoiceHistoryPage /> },
            { path: ':id/history', element: <InvoiceHistoryListPage /> },
          ],
        },

        {
          path: 'expense',
          children: [
            { index: true, element: <ExpenseListPage /> },
            { path: 'list', element: <ExpenseListPage /> },
            { path: ':id', element: <ExpenseDetailsPage /> },
            { path: 'new', element: <ExpenseCreatePage /> },
            { path: ':id/edit', element: <ExpenseEditPage /> },
          ],
        },
        {
          path: 'payment-method',
          children: [
            { index: true, element: <PaymentMethodListPage /> },
            { path: 'list', element: <PaymentMethodListPage /> },
            { path: 'new', element: <PaymentMethodCreatePage /> },
            { path: ':id/edit', element: <PaymentMethodEditPage /> },
          ],
        },
      ],
      },

      {
        path: 'store',
        children: [
          { index: true, element: <StoreListPage /> },
          { path: 'new', element: <StoreCreatePage /> },
          { path: ':id/account', element: <StoreAccountPage /> },
          { path: ':id/website', element: <StoreWebsiteSettingsPage /> },
          { path: 'list', element: <StoreListPage /> },
        ],
      },



          { path: 'ecommerce', element: <OverviewEcommercePage /> },
          { path: 'analytics', element: <OverviewAnalyticsPage /> },
          { path: 'banking', element: <OverviewBankingPage /> },
          { path: 'booking', element: <OverviewBookingPage /> },
          { path: 'file', element: <OverviewFilePage /> },
          { path: 'course', element: <OverviewCoursePage /> },

          {
            path: 'user',
            children: [
              { index: true, element: <UserListPage /> },
              // { index: true, element: <UserProfilePage /> },
              { path: 'profile', element: <UserProfilePage /> },
              { path: 'cards', element: <UserCardsPage /> },
              { path: 'list', element: <UserListPage /> },
              { path: 'invite', element: <UserCreatePage /> },
              { path: ':id/edit', element: <UserEditPage /> },
              { path: 'account', element: <UserAccountPage /> },
            ],
          },

          {
            path: 'integration',
            children: [
              { index: true, element: <IntegrationListPage /> },
              { path: 'list', element: <IntegrationListPage /> },
              { path: 'dashboard', element: <IntegrationDashboardPage /> },
              { path: 'new', element: <IntegrationCreatePage /> },
              { path: ':id', element: <IntegrationDetailsPage /> },
              { path: ':id/edit', element: <IntegrationEditPage /> },
              { path: 'oauth-callback', element: <OAuthCallbackPage /> },
              { path: 'oauth-success', element: <OAuthSuccessPage /> },
              // Google integration routes
              {
                path: 'google',
                children: [
                  { path: 'email', element: <GoogleEmailPage /> },
                  { path: 'drive', element: <GoogleDrivePage /> },
                  { path: 'calendar', element: <GoogleCalendarPage /> },
                  { path: 'meet', element: <GoogleMeetPage /> },
                ],
              },
              // Integration usage routes
              { path: ':id/usage', element: <GoogleIntegrationUsagePage /> },
              // Jumia integration routes
              {
                path: 'jumia',
                children: [
                  { path: 'products', element: <JumiaProductsPage /> },
                  { path: 'orders', element: <JumiaOrdersPage /> },
                  { path: 'inventory', element: <JumiaInventoryPage /> },
                ],
              },
            ],
          },

          // {
          //   path: 'store',
          //   children: [
          //     { index: true, element: <StoreListPage /> },
          //     { path: 'new', element: <StoreCreatePage /> },
          //     { path: ':id/account', element: <StoreAccountPage /> },
          //     { path: ':list', element: <StoreListPage /> },
          //   ],
          // },

          {
            path: 'order',
            children: [
              { index: true, element: <OrderListPage /> },
              { path: 'list', element: <OrderListPage /> },
              { path: ':id', element: <OrderDetailsPage /> },
            ],
          },

          {
            path: 'role',
            children: [
              { index: true, element: <RoleListPage /> },
              { path: 'list', element: <RoleListPage /> },
              { path: ':id', element: <RoleDetailsPage /> },
              { path: 'new', element: <RoleCreatePage /> },
              { path: ':id/edit', element: <RoleEditPage /> },
            ],
          },



          {
            path: 'post',
            children: [
              { index: true, element: <BlogPostsPage /> },
              { path: 'list', element: <BlogPostsPage /> },
              { path: ':title', element: <BlogPostPage /> },
              { path: ':title/edit', element: <BlogEditPostPage /> },
              { path: 'new', element: <BlogNewPostPage /> },
            ],
          },
          {
            path: 'job',
            children: [
              { index: true, element: <JobListPage /> },
              { path: 'list', element: <JobListPage /> },
              { path: ':id', element: <JobDetailsPage /> },
              { path: 'new', element: <JobCreatePage /> },
              { path: ':id/edit', element: <JobEditPage /> },
            ],
          },
          {
            path: 'tour',
            children: [
              { index: true, element: <TourListPage /> },
              { path: 'list', element: <TourListPage /> },
              { path: ':id', element: <TourDetailsPage /> },
              { path: 'new', element: <TourCreatePage /> },
              { path: ':id/edit', element: <TourEditPage /> },
            ],
          },
          { path: 'file-manager', element: <FileManagerPage /> },
          { path: 'mail', element: <MailPage /> },
          { path: 'chat', element: <ChatPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'kanban', element: <KanbanPage /> },
          { path: 'permission', element: <PermissionDeniedPage /> },
          { path: 'params', element: <ParamsPage /> },
          { path: 'blank', element: <BlankPage /> },
        ],
      },
    ];
