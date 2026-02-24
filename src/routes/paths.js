import { paramCase } from 'src/utils/change-case';

import { _id, _postTitles } from 'src/_mock/assets';

// ----------------------------------------------------------------------

const MOCK_ID = _id[1];

const MOCK_TITLE = _postTitles[2];

const ROOTS = {
  AUTH: '/auth',
  AUTH_DEMO: '/auth-demo',
  DASHBOARD: '/app',
};

// ----------------------------------------------------------------------

export const paths = {
  comingSoon: '/coming-soon',
  maintenance: '/maintenance',
  pricing: '/pricing',
  payment: '/payment',
  about: '/about-us',
  contact: '/contact-us',
  faqs: '/faqs',
  publicStore: (slug) => `/site/${slug}`,
  publicStoreProducts: (slug) => `/site/${slug}/products`,
  publicStoreProduct: (slug, productId) => `/site/${slug}/products/${productId}`,
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  components: '/components',
  docs: 'https://docs.minimals.cc',
  changelog: 'https://docs.minimals.cc/changelog',
  zoneStore: 'https://mui.com/store/items/zone-landing-page/',
  minimalStore: 'https://mui.com/store/items/minimal-dashboard/',
  freeUI: 'https://mui.com/store/items/minimal-dashboard-free/',
  figma: 'https://www.figma.com/design/cAPz4pYPtQEXivqe11EcDE/%5BPreview%5D-Minimal-Web.v6.0.0',
  category: {
    root: `/category`,
    demo: { details: `/category/${MOCK_ID}` },
  },
  product: {
    root: `/product`,
    checkout: `/product/checkout`,
    details: (id) => `/product/${id}`,
    demo: { details: `/product/${MOCK_ID}` },
  },
  post: {
    root: `/post`,
    details: (title) => `/post/${paramCase(title)}`,
    demo: { details: `/post/${paramCase(MOCK_TITLE)}` },
  },
  // AUTH
  auth: {
    amplify: {
      signIn: `${ROOTS.AUTH}/amplify/sign-in`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      signUp: `${ROOTS.AUTH}/amplify/sign-up`,
      updatePassword: `${ROOTS.AUTH}/amplify/update-password`,
      resetPassword: `${ROOTS.AUTH}/amplify/reset-password`,
    },
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
      resetPassword: `${ROOTS.AUTH}/jwt/reset-password`,
      updatePassword: `${ROOTS.AUTH}/jwt/update-password`,
      verify: `${ROOTS.AUTH}/jwt/verify`,
      // updateStaff: `${ROOTS.AUTH}/jwt/update-staff`,
      updateStaff: (invitation_id) => `${ROOTS.AUTH}/jwt/update-staff/${invitation_id}`,
      company: `${ROOTS.AUTH}/jwt/company`,
    },
    firebase: {
      signIn: `${ROOTS.AUTH}/firebase/sign-in`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      signUp: `${ROOTS.AUTH}/firebase/sign-up`,
      resetPassword: `${ROOTS.AUTH}/firebase/reset-password`,
    },
    auth0: {
      signIn: `${ROOTS.AUTH}/auth0/sign-in`,
    },
    supabase: {
      signIn: `${ROOTS.AUTH}/supabase/sign-in`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      signUp: `${ROOTS.AUTH}/supabase/sign-up`,
      updatePassword: `${ROOTS.AUTH}/supabase/update-password`,
      resetPassword: `${ROOTS.AUTH}/supabase/reset-password`,
    },
  },
  authDemo: {
    split: {
      signIn: `${ROOTS.AUTH_DEMO}/split/sign-in`,
      signUp: `${ROOTS.AUTH_DEMO}/split/sign-up`,
      resetPassword: `${ROOTS.AUTH_DEMO}/split/reset-password`,
      updatePassword: `${ROOTS.AUTH_DEMO}/split/update-password`,
      verify: `${ROOTS.AUTH_DEMO}/split/verify`,
    },
    centered: {
      signIn: `${ROOTS.AUTH_DEMO}/centered/sign-in`,
      signUp: `${ROOTS.AUTH_DEMO}/centered/sign-up`,
      resetPassword: `${ROOTS.AUTH_DEMO}/centered/reset-password`,
      updatePassword: `${ROOTS.AUTH_DEMO}/centered/update-password`,
      verify: `${ROOTS.AUTH_DEMO}/centered/verify`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    quickDashboard: `${ROOTS.DASHBOARD}/quick-dashboard`,
    mail: `${ROOTS.DASHBOARD}/mail`,
    chat: `${ROOTS.DASHBOARD}/chat`,
    blank: `${ROOTS.DASHBOARD}/blank`,
    kanban: `${ROOTS.DASHBOARD}/kanban`,
    calendar: `${ROOTS.DASHBOARD}/calendar`,
    fileManager: `${ROOTS.DASHBOARD}/file-manager`,
    permission: `${ROOTS.DASHBOARD}/permission`,
    general: {
      app: `${ROOTS.DASHBOARD}/app`,
      ecommerce: `${ROOTS.DASHBOARD}/ecommerce`,
      analytics: `${ROOTS.DASHBOARD}/analytics`,
      banking: `${ROOTS.DASHBOARD}/banking`,
      booking: `${ROOTS.DASHBOARD}/booking`,
      file: `${ROOTS.DASHBOARD}/file`,
      course: `${ROOTS.DASHBOARD}/course`,
    },
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      invite: `${ROOTS.DASHBOARD}/user/invite`,
      list: `${ROOTS.DASHBOARD}/user/list`,
      cards: `${ROOTS.DASHBOARD}/user/cards`,
      profile: `${ROOTS.DASHBOARD}/user/profile`,
      account: `${ROOTS.DASHBOARD}/user/account`,
      edit: (id) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
      demo: {
        edit: `${ROOTS.DASHBOARD}/user/${MOCK_ID}/edit`,
      },
    },
    store: {
      root: `${ROOTS.DASHBOARD}/store`,
      new: `${ROOTS.DASHBOARD}/store/new`,
      list: `${ROOTS.DASHBOARD}/store/list`,
      account: (id = ':id') => `${ROOTS.DASHBOARD}/store/${id}/account`,
      website: (id = ':id') => `${ROOTS.DASHBOARD}/store/${id}/website`,
      demo: {
        edit: `${ROOTS.DASHBOARD}/user/${MOCK_ID}/edit`,
      },
    },
    customer: {
      root: (storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/customer`,
      list: (storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/customer/list`,
      new: (storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/customer/new`,
      edit: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/customer/${id}/edit`,
    },

    category: {
      root:(storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/category`,
      new:(storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/category/new`,
      edit: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/category/${id}/edit`,
      demo: {
        edit: `${ROOTS.DASHBOARD}/category/${MOCK_ID}/edit`,
      },
    },

    service: {
      root: (storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/service`,
      new: (storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/service/new`,
      details: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/service/${id}`,
      edit: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/service/${id}/edit`,
      demo: {
        edit: `${ROOTS.DASHBOARD}/service/${MOCK_ID}/edit`,
      },
    },
    product: {
      // root: `${ROOTS.DASHBOARD}/product`,
      // new: `${ROOTS.DASHBOARD}/product/new`,
      // details: (id) => `${ROOTS.DASHBOARD}/product/${id}`,
      // edit: (id) => `${ROOTS.DASHBOARD}/product/${id}/edit`,
      // addqty: (id) => `${ROOTS.DASHBOARD}/product/${id}/addqty`,
      // history: `${ROOTS.DASHBOARD}/product/history`,
      root: (storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/product`,
      new: (storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/product/new`,
      details: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/product/${id}`,
      movement: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/product/${id}/movement`,
      edit: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/product/${id}/edit`,
      addqty: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/product/${id}/addqty`,
      history: (storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/product/history`,
      demo: {
        details: `${ROOTS.DASHBOARD}/product/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/product/${MOCK_ID}/edit`,
      },
    },
    pos: {
      root:(storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/pos`,
      edit: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/pos/${id}/edit`,
      receipt: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/pos/${id}/receipt`,
    },
    invoice: {
      root:(storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/invoice`,
      new:(storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/invoice/new`,
      details: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/invoice/${id}`,
      edit: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/invoice/${id}/edit`,
      history: (storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/invoice/history`,
      historylist: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/invoice/${id}/history`,
      demo: {
        details: `${ROOTS.DASHBOARD}/invoice/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/invoice/${MOCK_ID}/edit`,
      },
    },
    expense: {
      root:(storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/expense`,
      new:(storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/expense/new`,
      details: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/expense/${id}`,
      edit: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/expense/${id}/edit`,

      demo: {
        details: `${ROOTS.DASHBOARD}/expense/${MOCK_ID}`,
      },
    },

    paymentMethod: {
      root:(storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/payment-method`,
      new:(storeParam) => `${ROOTS.DASHBOARD}/${storeParam}/payment-method/new`,
      edit: (storeParam, id) => `${ROOTS.DASHBOARD}/${storeParam}/payment-method/${id}/edit`,
    },

    integration: {
      root: `${ROOTS.DASHBOARD}/integration`,
      list: `${ROOTS.DASHBOARD}/integration/list`,
      dashboard: `${ROOTS.DASHBOARD}/integration/dashboard`,
      new: `${ROOTS.DASHBOARD}/integration/new`,
      details: (id) => `${ROOTS.DASHBOARD}/integration/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/integration/${id}/edit`,
      usage: (id) => `${ROOTS.DASHBOARD}/integration/${id}/usage`,
      // Google integration pages
      google: {
        root: `${ROOTS.DASHBOARD}/integration/google`,
        email: `${ROOTS.DASHBOARD}/integration/google/email`,
        drive: `${ROOTS.DASHBOARD}/integration/google/drive`,
        calendar: `${ROOTS.DASHBOARD}/integration/google/calendar`,
        meet: `${ROOTS.DASHBOARD}/integration/google/meet`,
      },
      // Jumia integration pages
      jumia: {
        root: `${ROOTS.DASHBOARD}/integration/jumia`,
        products: `${ROOTS.DASHBOARD}/integration/jumia/products`,
        orders: `${ROOTS.DASHBOARD}/integration/jumia/orders`,
        inventory: `${ROOTS.DASHBOARD}/integration/jumia/inventory`,
      },
      // OAuth callback
      oauthCallback: `${ROOTS.DASHBOARD}/integration/oauth-callback`,
      // OAuth success callback (frontend redirect)
      oauthSuccess: `${ROOTS.DASHBOARD}/integration/oauth-success`,
    },
    // App routes for OAuth
    app: {
      integration: {
        oauthSuccess: '/app/integration/oauth-success',
      },
    },

    role: {
      root: `${ROOTS.DASHBOARD}/role`,
      new: `${ROOTS.DASHBOARD}/role/new`,
      details: (id) => `${ROOTS.DASHBOARD}/role/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/role/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/role/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/role/${MOCK_ID}/edit`,
      },
    },
    post: {
      root: `${ROOTS.DASHBOARD}/post`,
      new: `${ROOTS.DASHBOARD}/post/new`,
      details: (title) => `${ROOTS.DASHBOARD}/post/${paramCase(title)}`,
      edit: (title) => `${ROOTS.DASHBOARD}/post/${paramCase(title)}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/post/${paramCase(MOCK_TITLE)}`,
        edit: `${ROOTS.DASHBOARD}/post/${paramCase(MOCK_TITLE)}/edit`,
      },
    },
    job: {
      root: `${ROOTS.DASHBOARD}/job`,
      new: `${ROOTS.DASHBOARD}/job/new`,
      details: (id) => `${ROOTS.DASHBOARD}/job/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/job/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/job/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/job/${MOCK_ID}/edit`,
      },
    },
    order: {
      root: `${ROOTS.DASHBOARD}/order`,
      details: (id) => `${ROOTS.DASHBOARD}/order/${id}`,
      demo: {
        details: `${ROOTS.DASHBOARD}/order/${MOCK_ID}`,
      },
    },




    tour: {
      root: `${ROOTS.DASHBOARD}/tour`,
      new: `${ROOTS.DASHBOARD}/tour/new`,
      details: (id) => `${ROOTS.DASHBOARD}/tour/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/tour/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/tour/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/tour/${MOCK_ID}/edit`,
      },
    },
  },
};
