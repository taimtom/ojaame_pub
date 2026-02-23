import { useMemo } from 'react';

import { DEFAULT_CONFIG } from 'src/config/business-types-registry';
import { useBusinessTypeContext } from 'src/contexts/business-type-context';

/**
 * Custom hook to access business type configuration and utilities
 * @returns {Object} Business type configuration and helper functions
 */
export function useBusinessType() {
  const { config, company, isLoading, hasBusinessType } = useBusinessTypeContext();

  // Use config or fallback to default
  const activeConfig = config || DEFAULT_CONFIG;

  /**
   * Terminology translation function
   * @param {string} key - The terminology key to translate
   * @returns {string} Translated terminology or the key itself if not found
   */
  const t = useMemo(
    () => (key) => activeConfig.terminology?.[key] || key,
    [activeConfig]
  );

  /**
   * Get custom label for a field
   * @param {string} entityType - 'product' or 'service'
   * @param {string} fieldName - The field name
   * @returns {string} Custom label or default field name
   */
  const getLabel = useMemo(
    () => (entityType, fieldName) => {
      const fieldConfig = activeConfig.fields?.[entityType];
      if (fieldConfig?.labels?.[fieldName]) {
        return fieldConfig.labels[fieldName];
      }
      // Return capitalized field name as fallback
      return fieldName
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    [activeConfig]
  );

  /**
   * Check if a field should be visible
   * @param {string} entityType - 'product' or 'service'
   * @param {string} fieldName - The field name
   * @returns {boolean} True if field should be visible
   */
  const isFieldVisible = useMemo(
    () => (entityType, fieldName) => {
      const fieldConfig = activeConfig.fields?.[entityType];
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
    },
    [activeConfig]
  );

  /**
   * Get navigation label
   * @param {string} key - Navigation key (e.g., 'productManagement', 'pointOfSales')
   * @returns {string} Navigation label
   */
  const getNavLabel = useMemo(
    () => (key) => activeConfig.navigation?.[key] || DEFAULT_CONFIG.navigation[key] || key,
    [activeConfig]
  );

  return {
    config: activeConfig,
    company,
    isLoading,
    hasBusinessType,
    t,
    getLabel,
    isFieldVisible,
    getNavLabel,
  };
}
