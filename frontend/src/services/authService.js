// src/services/authService.js
import apiClient from './api';

/**
 * Fungsi untuk melakukan login.
 * Menggunakan endpoint: POST /auth/login
 */
export const login = async ({ email, password }) => {
  const payload = { email, password, deviceName: getDeviceName() };
  const res = await apiClient.post("/auth/login", payload);
  const parsed = parseLoginResponse(res);
  if (parsed.accessToken) {
    try {
      localStorage.setItem("accessToken", parsed.accessToken);
    } catch {}
  }
  return parsed;
};

const register = async (registrationData) => {
  try {
    const response = await apiClient.post('/auth/register', registrationData);
    return response.data;
  } catch (error) {
    console.error("Registration Error:", error.response?.data || error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    await apiClient.post("/auth/logout"); // jika backend punya endpoint
  } catch {}
  try { localStorage.removeItem("accessToken"); } catch {}
};


const getDeviceName = () => {
  try {
    return (navigator.userAgent || "web-client").slice(0, 200);
  } catch {
    return "web-client";
  }
};

const parseLoginResponse = (res) => {
  // backend bisa meletakkan token di berbagai tempat — handle beberapa kemungkinan
  const d = res?.data || {};
  return {
    accessToken: d?.data?.accessToken || d?.accessToken || d?.token || null,
    refreshToken: d?.data?.refreshToken || d?.refreshToken || null,
    user: d?.data?.user || d?.user || d || null,
  };
};

const forgotPassword = async (email) => {
  try {
    console.log('Sending forgot password request for email:', email);
    const response = await apiClient.post('/password/forgot-password', { email });
    console.log('Forgot password response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    // Error is already standardized by API interceptor
    throw error;
  }
};

/**
 * Memverifikasi OTP yang diterima.
 * Menggunakan endpoint: POST /password/verify-otp
 */
const verifyOtp = async (email, otp) => {
  try {
    console.log('Verifying OTP for email:', email, 'OTP:', otp);
    const response = await apiClient.post('/password/verify-otp', { email, otp });
    console.log('Verify OTP response:', response.data);
    return response.data; // Akan mengembalikan resetToken
  } catch (error) {
    console.error('Verify OTP error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    // Error is already standardized by API interceptor
    throw error;
  }
};

/**
 * Mengatur ulang password dengan token.
 * Menggunakan endpoint: POST /password/reset-password
 */
const resetPassword = async (email, password, resetToken) => {
  try {
    console.log('Resetting password for email:', email, 'with token:', resetToken);
    const response = await apiClient.post('/password/reset-password', { email, password, resetToken });
    console.log('Reset password response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    // Error is already standardized by API interceptor
    throw error;
  }
};


// --- Helper Functions (Tidak ada perubahan) ---
const getCurrentUser = () => {
  const userString = localStorage.getItem('user');
  return userString ? JSON.parse(userString) : null;
};

const isAuthenticated = () => {
  return !!getCurrentUser();
};

const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};

const isAdmin = () => {
  return getUserRole() === 'admin';
};

const isSuperAdmin = () => {
  return getUserRole() === 'super_admin';
};

const authService = {
  login,
  register,
  logout,
  forgotPassword, // <-- Tambahkan
  verifyOtp,      // <-- Tambahkan
  resetPassword,  // <-- Tambahkan
  getCurrentUser,
  isAuthenticated,
  getUserRole,
  isAdmin,
  isSuperAdmin,
};

export default authService;