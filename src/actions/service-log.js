import axiosInstance from 'src/utils/axios';

export async function createServiceLog(payload) {
  const res = await axiosInstance.post('/api/service-logs/', payload);
  return res.data;
}

export async function updateServiceLog(logId, payload) {
  const res = await axiosInstance.put(`/api/service-logs/${logId}`, payload);
  return res.data;
}

export async function completeDraftServiceLog(logId, payload) {
  const res = await axiosInstance.post(`/api/service-logs/${logId}/complete`, payload);
  return res.data;
}

export async function billServiceLog(logId, payload) {
  const res = await axiosInstance.post(`/api/service-logs/${logId}/bill`, payload);
  return res.data;
}

export async function cancelServiceLog(logId, storeId) {
  const res = await axiosInstance.post(`/api/service-logs/${logId}/cancel`, null, {
    params: { store_id: storeId },
  });
  return res.data;
}

export async function fetchServiceLog(logId, storeId) {
  const res = await axiosInstance.get(`/api/service-logs/${logId}`, {
    params: { store_id: storeId },
  });
  return res.data;
}

export async function fetchServiceLogs(params) {
  const res = await axiosInstance.get('/api/service-logs/', { params });
  return res.data;
}

export async function fetchServiceLogTodayStats(storeId) {
  const res = await axiosInstance.get('/api/service-logs/today-stats', {
    params: { store_id: storeId },
  });
  return res.data;
}

export async function fetchServiceConsumableTemplates(serviceId, storeId) {
  const res = await axiosInstance.get(
    `/api/service-logs/services/${serviceId}/consumables`,
    { params: { store_id: storeId } }
  );
  return res.data;
}

export async function updateServiceConsumableTemplates(serviceId, storeId, items) {
  const res = await axiosInstance.put(
    `/api/service-logs/services/${serviceId}/consumables`,
    items,
    { params: { store_id: storeId } }
  );
  return res.data;
}
