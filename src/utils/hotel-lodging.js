/** Exact businesses that unlock Hotel Front Desk. */
export const HOTEL_LODGING_EXACT_BUSINESSES = new Set([
  'Hotel',
  'Lodge',
  'Guest house',
  'Boutique hotel',
  'Resort',
  'Beach resort',
  'Spa resort',
  'Holiday resort',
]);

export function isHotelLodgingBusiness(companyOrExact) {
  if (!companyOrExact) return false;
  if (typeof companyOrExact === 'string') {
    return HOTEL_LODGING_EXACT_BUSINESSES.has(companyOrExact);
  }
  const exact = companyOrExact.exactBusiness || companyOrExact.exact_business || '';
  if (HOTEL_LODGING_EXACT_BUSINESSES.has(exact)) return true;
  const sub = companyOrExact.subIndustry || companyOrExact.sub_industry || '';
  return sub === 'Hotels' || sub === 'Resorts';
}
