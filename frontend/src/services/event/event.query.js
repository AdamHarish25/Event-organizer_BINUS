import apiClient from '../api';

// --- QUERIES: Fungsi untuk mengambil data event (Read Operations) ---

/**
 * Mengambil daftar event. Untuk admin, ini akan mengambil data paginasi.
 * Menggunakan endpoint: GET /event
 * @param {number} page - Nomor halaman
 * @param {number} limit - Jumlah item per halaman
 */
export const getEvents = async (page = 1, limit = 10) => {
    try {
        const response = await apiClient.get('/event', {
            params: { page, limit, _t: new Date().getTime() }
        });
        return response.data;
    } catch (error) {
        console.error('Get events error:', error);
        throw error; // Error is already standardized by interceptor
    }
};

/**
 * Mengambil event yang dikategorikan (Current, Week, Next).
 * Menggunakan endpoint: GET /event (tanpa parameter page/limit untuk user biasa)
 */
export const getEventsByCategory = async () => {
    try {
        const response = await apiClient.get('/event');
        // Response backend structure: { status: 'success', data: { current: [], thisWeek: [], next: [] } }
        // Or sometimes wrapped differently. Based on Dashboard.jsx, it expects response.data.data to contain { current, thisWeek, next }
        return response.data;
    } catch (error) {
        console.error('Get events by category error:', error);
        throw error;
    }
};
