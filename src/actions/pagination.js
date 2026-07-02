export const DEFAULT_PAGINATION = {
  skip: 0,
  limit: 50,
  returned: 0,
  total: 0,
  has_more: false,
};

export function normalizePaginatedResponse(data) {
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      pagination: { ...DEFAULT_PAGINATION, ...(data.pagination || {}) },
      filters: data.filters || {},
      sort: data.sort || {},
    };
  }

  if (Array.isArray(data)) {
    const total = data.length;
    return {
      items: data,
      pagination: {
        ...DEFAULT_PAGINATION,
        returned: total,
        total,
      },
      filters: {},
      sort: {},
    };
  }

  return {
    items: [],
    pagination: { ...DEFAULT_PAGINATION },
    filters: {},
    sort: {},
  };
}
