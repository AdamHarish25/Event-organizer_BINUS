import apiClient from '../api';

// --- APPROVAL: Fungsi untuk menyetujui, menolak, atau memberi feedback event (Business Logic) ---

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
