import apiClient from './api';

// --- TAMBAHAN: Fungsi untuk mengambil event (dengan paginasi untuk admin) ---
/**
 * Mengambil daftar event. Untuk admin, ini akan mengambil data paginasi.
 * Menggunakan endpoint: GET /event
 * @param {number} page - Nomor halaman
 * @param {number} limit - Jumlah item per halaman
 */
export const getEvents = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/event', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get events error:', error);
    throw error; // Error is already standardized by interceptor
  }
};

// Membuat Event baru (hanya admin)
export const createEvent = async (formData) => {
  try {
    const response = await apiClient.post('/event', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Create event error:', error);
    throw error; // Error is already standardized by interceptor
  }
};

// Edit Event (hanya admin)
export const editEvent = async (eventId, formData) => {
  try {
    const response = await apiClient.patch(`/event/${eventId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Edit event error:', error);
    throw error; // Error is already standardized by interceptor
  }
};

// Delete Event (hanya admin)
export const deleteEvent = async (eventId) => {
  try {
    const response = await apiClient.delete(`/event/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Delete event error:', error);
    throw error; // Error is already standardized by interceptor
  }
};

// Approve Event (hanya super admin)
export const approveEvent = async (eventId) => {
  try {
    const response = await apiClient.post(`/event/${eventId}/approve`);
    return response.data;
  } catch (error) {
    console.error('Approve event error:', error);
    throw error; // Error is already standardized by interceptor
  }
};

// Reject Event (hanya super admin)
export const rejectEvent = async (eventId, feedback) => {
  try {
    const response = await apiClient.post(`/event/${eventId}/reject`, { feedback });
    return response.data;
  } catch (error) {
    console.error('Reject event error:', error);
    throw error; // Error is already standardized by interceptor
  }
};

// --- TAMBAHAN: FUNGSI UNTUK MENGIRIM FEEDBACK ---
/**
 * Mengirim feedback revisi dari Super Admin ke Admin.
 * Menggunakan endpoint: POST /event/:eventId/feedback
 * @param {string} eventId - ID event yang direvisi
 * @param {string} feedback - Pesan feedback
 */
export const sendFeedback = async (eventId, feedback) => {
  try {
    const response = await apiClient.post(`/event/${eventId}/feedback`, { feedback });
    return response.data;
  } catch (error) {
    console.error('Send feedback error:', error);
    throw error; // Error is already standardized by interceptor
  }
};