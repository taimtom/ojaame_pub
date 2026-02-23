import { createContext, useMemo, useContext } from 'react';

import { useCompany } from 'src/actions/company';
import { getBusinessTypeConfig } from 'src/config/business-types-registry';

const BusinessTypeContext = createContext(null);

export function BusinessTypeProvider({ children }) {
  const { company, companyLoading } = useCompany({ skip: false });

  const config = useMemo(() => {
    if (!company || companyLoading) {
      return null;
    }

    const industry = company.primaryIndustry || '';
    const subIndustry = company.subIndustry || '';
    const exactBusiness = company.exactBusiness || '';

    if (!industry || !subIndustry || !exactBusiness) {
      console.warn('BusinessTypeProvider: Missing industry data', { industry, subIndustry, exactBusiness });
      return null;
    }

    const businessConfig = getBusinessTypeConfig(industry, subIndustry, exactBusiness);
    console.log('BusinessTypeProvider: Config loaded', { industry, subIndustry, exactBusiness, hasConfig: !!businessConfig });
    return businessConfig;
  }, [company, companyLoading]);

  const value = useMemo(
    () => ({
      config,
      company,
      isLoading: companyLoading,
      hasBusinessType: !!config,
    }),
    [config, company, companyLoading]
  );

  return <BusinessTypeContext.Provider value={value}>{children}</BusinessTypeContext.Provider>;
}

export function useBusinessTypeContext() {
  const context = useContext(BusinessTypeContext);
  if (!context) {
    throw new Error('useBusinessTypeContext must be used within BusinessTypeProvider');
  }
  return context;
}
