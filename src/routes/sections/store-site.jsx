import { lazy, Suspense } from 'react';

import { StoreWebsiteLayout } from 'src/layouts/store-website/layout';
import { SplashScreen } from 'src/components/loading-screen';

const StoreWebsitePage = lazy(() => import('src/pages/site/store-website'));
const StoreProductsPage = lazy(() => import('src/pages/site/store-products'));
const StoreProductDetailPage = lazy(() => import('src/pages/site/store-product-detail'));

// Legacy embedded storefront fallback (primary storefronts use {slug}.ojaa.me)
export const storeSiteRoutes = [
  {
    path: 'site/:slug',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <StoreWebsiteLayout>
          <StoreWebsitePage />
        </StoreWebsiteLayout>
      </Suspense>
    ),
  },
  {
    path: 'site/:slug/products',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <StoreWebsiteLayout>
          <StoreProductsPage />
        </StoreWebsiteLayout>
      </Suspense>
    ),
  },
  {
    path: 'site/:slug/products/:productId',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <StoreWebsiteLayout>
          <StoreProductDetailPage />
        </StoreWebsiteLayout>
      </Suspense>
    ),
  },
];
