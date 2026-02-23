import { getFieldConfig } from 'src/config/business-types-registry';

/**
 * Get field configuration for a specific business type and entity
 * @param {string} industry - Primary industry
 * @param {string} subIndustry - Sub industry
 * @param {string} exactBusiness - Exact business
 * @param {string} entityType - 'product' or 'service'
 * @returns {Object} Field configuration object
 */
export function getFieldConfiguration(industry, subIndustry, exactBusiness, entityType = 'product') {
  return getFieldConfig(industry, subIndustry, exactBusiness, entityType);
}

/**
 * Check if a field should be visible for a business type
 * @param {string} industry - Primary industry
 * @param {string} subIndustry - Sub industry
 * @param {string} exactBusiness - Exact business
 * @param {string} entityType - 'product' or 'service'
 * @param {string} fieldName - Field name to check
 * @returns {boolean} True if field should be visible
 */
export function isFieldVisible(industry, subIndustry, exactBusiness, entityType, fieldName) {
  const fieldConfig = getFieldConfiguration(industry, subIndustry, exactBusiness, entityType);
  
  if (!fieldConfig) return true; // Default to visible if no config

  // Check hide list first
  if (fieldConfig.hide?.includes(fieldName)) {
    return false;
  }

  // Check show list if it exists
  if (fieldConfig.show && fieldConfig.show.length > 0) {
    return fieldConfig.show.includes(fieldName);
  }

  // Default to visible
  return true;
}

/**
 * Get custom label for a field
 * @param {string} industry - Primary industry
 * @param {string} subIndustry - Sub industry
 * @param {string} exactBusiness - Exact business
 * @param {string} entityType - 'product' or 'service'
 * @param {string} fieldName - Field name
 * @returns {string} Custom label or default
 */
export function getFieldLabel(industry, subIndustry, exactBusiness, entityType, fieldName) {
  const fieldConfig = getFieldConfiguration(industry, subIndustry, exactBusiness, entityType);
  
  if (fieldConfig?.labels?.[fieldName]) {
    return fieldConfig.labels[fieldName];
  }
  
  // Return capitalized field name as fallback
  return fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Common field names used throughout the application
 */
export const FIELD_NAMES = {
  // Product fields
  NAME: 'name',
  DESCRIPTION: 'description',
  PRICE: 'price',
  QUANTITY: 'quantity',
  CATEGORY: 'category',
  SKU: 'sku',
  CODE: 'code',
  IMAGES: 'images',
  SIZE: 'size',
  COLOR: 'color',
  BARCODE: 'barcode',
  BATCH_NUMBER: 'batch_number',
  HARVEST_DATE: 'harvest_date',
  EXPIRY_DATE: 'expiry_date',
  PRESCRIPTION_INFO: 'prescription_info',
  DOSAGE: 'dosage',
  
  // Service fields
  DURATION: 'duration',
  APPOINTMENT_REQUIRED: 'appointment_required',
  SESSION_COUNT: 'session_count',
  APPOINTMENT_TIME: 'appointment_time',
};
