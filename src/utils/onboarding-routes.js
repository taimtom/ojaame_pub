import { paths } from 'src/routes/paths';

import {
  ONBOARDING_QUERY_PARAM,
  ONBOARDING_QUERY_VALUE,
} from 'src/auth/onboarding-constants';

// ----------------------------------------------------------------------

export function withOnboardingQuery(path) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}${ONBOARDING_QUERY_PARAM}=${ONBOARDING_QUERY_VALUE}`;
}

export function isOnboardingMode(searchParams) {
  return searchParams?.get(ONBOARDING_QUERY_PARAM) === ONBOARDING_QUERY_VALUE;
}

export function getOnboardingPathForStep(step, progress) {
  const storeParam = progress?.store_param;

  switch (step) {
    case 'store':
      return withOnboardingQuery(paths.dashboard.store.new);
    case 'card':
      return withOnboardingQuery(`${paths.dashboard.user.account}?tab=billing`);
    case 'staff':
      return withOnboardingQuery(paths.dashboard.user.invite);
    case 'products':
      if (!storeParam) return withOnboardingQuery(paths.dashboard.store.new);
      return withOnboardingQuery(paths.dashboard.product.new(storeParam));
    case 'customers':
      if (!storeParam) return withOnboardingQuery(paths.dashboard.store.new);
      return withOnboardingQuery(paths.dashboard.customer.new(storeParam));
    case 'sales':
      if (!storeParam) return withOnboardingQuery(paths.dashboard.store.new);
      return withOnboardingQuery(paths.dashboard.quickDashboard);
    case 'report':
      if (!storeParam) return withOnboardingQuery(paths.dashboard.store.new);
      return withOnboardingQuery(paths.dashboard.reports.customers(storeParam));
    default:
      if (storeParam) return `${paths.dashboard.root}/${storeParam}`;
      return paths.dashboard.root;
  }
}

export function getOnboardingRedirectPath(progress) {
  if (!progress || progress.onboarding_completed) {
    if (progress?.store_param) {
      return `${paths.dashboard.root}/${progress.store_param}`;
    }
    return paths.dashboard.root;
  }
  if (!progress.current_step) {
    if (progress.store_param) {
      return `${paths.dashboard.root}/${progress.store_param}`;
    }
    return paths.dashboard.root;
  }
  return getOnboardingPathForStep(progress.current_step, progress);
}

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, '') || '/';
}

export function pathMatchesOnboardingStep(pathname, searchParams, step, progress) {
  const path = normalizePath(pathname);
  const storeParam = progress?.store_param;

  switch (step) {
    case 'store':
      return path === paths.dashboard.store.new;
    case 'card':
      return (
        path === paths.dashboard.user.account &&
        searchParams?.get('tab') === 'billing'
      );
    case 'staff':
      return path === paths.dashboard.user.invite;
    case 'products':
      if (!storeParam) return false;
      return (
        path === normalizePath(paths.dashboard.product.new(storeParam))
        || path === normalizePath(paths.dashboard.product.bulkAdd(storeParam))
      );
    case 'customers':
      return storeParam
        ? path === normalizePath(paths.dashboard.customer.new(storeParam))
        : false;
    case 'sales':
      return path === paths.dashboard.quickDashboard;
    case 'report':
      return storeParam
        ? path === normalizePath(paths.dashboard.reports.customers(storeParam))
        : false;
    default:
      return false;
  }
}

export function currentPathWithSearch(pathname, searchParams) {
  const qs = searchParams?.toString?.() || '';
  return qs ? `${pathname}?${qs}` : pathname;
}

export function isAllowedOnboardingPath(pathname, searchParams, progress) {
  if (!progress || progress.onboarding_completed || !progress.current_step) {
    return true;
  }
  return pathMatchesOnboardingStep(
    pathname,
    searchParams,
    progress.current_step,
    progress
  );
}
