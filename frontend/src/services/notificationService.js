// src/services/notificationService.js
import apiClient from './api';

/**
 * Get notifications with pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 */
export const getNotifications = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/notification', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get notifications error:', error);
    throw error.response?.data || error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await apiClient.patch(`/notification/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Mark notification as read error:', error);
    throw error.response?.data || error;
  }
};

const notificationService = {
  getNotifications,
  markNotificationAsRead,
};

export default notificationService;