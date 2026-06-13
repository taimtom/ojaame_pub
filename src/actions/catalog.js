import axiosInstance, { endpoints } from 'src/utils/axios';

export async function searchCatalogProducts(query, categoryId, limit = 20) {
  const response = await axiosInstance.get(endpoints.catalog.searchProducts, {
    params: {
      q: query,
      category_id: categoryId || undefined,
      limit,
    },
  });
  return response.data?.items || [];
}

export async function listCatalogCategories() {
  const response = await axiosInstance.get(endpoints.catalog.categories);
  return response.data || [];
}
