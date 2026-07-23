import axiosInstance from 'src/utils/axios';

// Room types
export async function fetchRoomTypes(storeId) {
  const res = await axiosInstance.get('/api/rooms/types', { params: { store_id: storeId } });
  return res.data;
}

export async function createRoomType(payload) {
  const res = await axiosInstance.post('/api/rooms/types', payload);
  return res.data;
}

export async function updateRoomType(typeId, payload) {
  const res = await axiosInstance.patch(`/api/rooms/types/${typeId}`, payload);
  return res.data;
}

// Rooms
export async function fetchRooms(storeId) {
  const res = await axiosInstance.get('/api/rooms/', { params: { store_id: storeId } });
  return res.data;
}

export async function fetchRoomBoard(storeId) {
  const res = await axiosInstance.get('/api/rooms/board', { params: { store_id: storeId } });
  return res.data;
}

export async function fetchRoomBlockedDates(roomId, storeId, params = {}) {
  const res = await axiosInstance.get(`/api/rooms/${roomId}/blocked-dates`, {
    params: { store_id: storeId, ...params },
  });
  return res.data;
}

export async function fetchRoomHistory(roomId, storeId, params = {}) {
  const res = await axiosInstance.get(`/api/rooms/${roomId}/history`, {
    params: { store_id: storeId, ...params },
  });
  return res.data;
}

export async function fetchRoomAvailability(storeId, params = {}) {
  const res = await axiosInstance.get('/api/rooms/availability', {
    params: { store_id: storeId, ...params },
  });
  return res.data;
}

export async function fetchHousekeepingBoard(storeId) {
  const res = await axiosInstance.get('/api/rooms/housekeeping', {
    params: { store_id: storeId },
  });
  return res.data;
}

export async function applyRoomHousekeeping(roomId, payload) {
  const res = await axiosInstance.post(`/api/rooms/${roomId}/housekeeping`, payload);
  return res.data;
}

export async function createRoom(payload) {
  const res = await axiosInstance.post('/api/rooms/', payload);
  return res.data;
}

export async function updateRoom(roomId, payload) {
  const res = await axiosInstance.patch(`/api/rooms/${roomId}`, payload);
  return res.data;
}

export async function markRoomAvailable(roomId, storeId) {
  const res = await axiosInstance.post(`/api/rooms/${roomId}/mark-available`, {
    store_id: storeId,
  });
  return res.data;
}

// Bookings
export async function fetchRoomBookings(params) {
  const res = await axiosInstance.get('/api/room-bookings/', { params });
  return res.data;
}

export async function createRoomBooking(payload) {
  const res = await axiosInstance.post('/api/room-bookings/', payload);
  return res.data;
}

export async function updateRoomBooking(bookingId, payload) {
  const res = await axiosInstance.patch(`/api/room-bookings/${bookingId}`, payload);
  return res.data;
}

export async function checkInRoomBooking(bookingId, storeId) {
  const res = await axiosInstance.post(
    `/api/room-bookings/${bookingId}/check-in`,
    null,
    { params: { store_id: storeId } }
  );
  return res.data;
}

export async function checkOutRoomBooking(bookingId, payload) {
  const res = await axiosInstance.post(`/api/room-bookings/${bookingId}/check-out`, payload);
  return res.data;
}

export async function moveRoomBooking(bookingId, payload) {
  const res = await axiosInstance.post(`/api/room-bookings/${bookingId}/move`, payload);
  return res.data;
}

export async function cancelRoomBooking(bookingId, payload) {
  const res = await axiosInstance.post(`/api/room-bookings/${bookingId}/cancel`, payload);
  return res.data;
}

export async function addRoomBookingDeposit(bookingId, payload) {
  const res = await axiosInstance.post(`/api/room-bookings/${bookingId}/add-deposit`, payload);
  return res.data;
}

export async function earlyCheckoutRoomBooking(bookingId, payload) {
  const res = await axiosInstance.post(
    `/api/room-bookings/${bookingId}/early-checkout`,
    payload
  );
  return res.data;
}

export async function fetchBookingFolio(bookingId, storeId) {
  const res = await axiosInstance.get(`/api/room-bookings/${bookingId}/folio`, {
    params: { store_id: storeId },
  });
  return res.data;
}

export async function addBookingFolioItem(bookingId, payload) {
  const res = await axiosInstance.post(`/api/room-bookings/${bookingId}/folio`, payload);
  return res.data;
}

export async function deleteBookingFolioItem(bookingId, itemId, storeId) {
  await axiosInstance.delete(`/api/room-bookings/${bookingId}/folio/${itemId}`, {
    params: { store_id: storeId },
  });
}
