import { createContext, useContext } from 'react';

export const StoreWebsiteContext = createContext(null);

export function useStoreWebsite() {
  return useContext(StoreWebsiteContext);
}
