import apiClient from '../api';

// --- ACTIONS: Fungsi untuk memodifikasi data event (Create/Update/Delete) ---

// Membuat Event baru (hanya admin)
export const createEvent = async (formData) => {
    try {
        const response = await apiClient.post('/event', formData);
        return response.data;
    } catch (error) {
        console.error('Create event error:', error);
        throw error; // Error is already standardized by interceptor
    }
};

// Edit Event (hanya admin)
export const editEvent = async (eventId, formData) => {
    try {
        const response = await apiClient.patch(`/event/${eventId}`, formData);
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
