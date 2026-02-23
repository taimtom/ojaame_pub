import { getTerminology } from 'src/config/business-types-registry';

/**
 * Get terminology for a specific business type
 * @param {string} industry - Primary industry
 * @param {string} subIndustry - Sub industry
 * @param {string} exactBusiness - Exact business
 * @returns {Object} Terminology object
 */
export function getBusinessTerminology(industry, subIndustry, exactBusiness) {
  return getTerminology(industry, subIndustry, exactBusiness);
}

/**
 * Translate a terminology key to business-specific term
 * @param {string} industry - Primary industry
 * @param {string} subIndustry - Sub industry
 * @param {string} exactBusiness - Exact business
 * @param {string} key - Terminology key
 * @returns {string} Translated term
 */
export function translateTerm(industry, subIndustry, exactBusiness, key) {
  const terminology = getTerminology(industry, subIndustry, exactBusiness);
  return terminology[key] || key;
}

/**
 * Common terminology keys used throughout the application
 */
export const TERMINOLOGY_KEYS = {
  PRODUCT: 'product',
  SERVICE: 'service',
  INVOICE: 'invoice',
  SALE: 'sale',
  QUANTITY: 'quantity',
  PRICE: 'price',
  CATEGORY: 'category',
  CUSTOMER: 'customer',
  POS: 'pos',
  ADD_ITEM: 'addItem',
  ITEM: 'item',
  DESCRIPTION: 'description',
  TOTAL: 'total',
  SUBTOTAL: 'subtotal',
  DISCOUNT: 'discount',
  SHIPPING: 'shipping',
  TAXES: 'taxes',
};
