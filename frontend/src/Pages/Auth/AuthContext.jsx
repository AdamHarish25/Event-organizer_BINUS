// src/context/AuthContext.jsx
// Versi ini menghapus fitur "switchViewAs" untuk stabilitas dan kesederhanaan.

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockUsers } from '../data/mockdata'; // Sesuaikan path jika perlu

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // useEffect untuk menjaga sesi login saat refresh (tidak berubah)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('binus-event-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Gagal memuat sesi dari localStorage", error);
      localStorage.removeItem('binus-event-user');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fungsi login (tidak berubah)
  const login = (email, password) => {
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const { password, ...userToStore } = foundUser;
      setUser(userToStore);
      localStorage.setItem('binus-event-user', JSON.stringify(userToStore));
      
      if (userToStore.role === 'admin' || userToStore.role === 'superadmin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
      return { success: true };
    }
    return { success: false, message: 'Email atau password salah.' };
  };

  // Fungsi logout (tidak berubah)
  const logout = () => {
    setUser(null);
    localStorage.removeItem('binus-event-user');
    navigate('/');
  };

  // ==========================================================
  // DIHAPUS: State untuk `activeRole` dan fungsi `switchViewAs`
  // Kode menjadi lebih simpel dan bebas bug.
  // ==========================================================

  // Value yang diekspor sekarang lebih sederhana
  const value = { user, login, logout, isAuthenticated: !!user, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Pola ini (custom hook di file terpisah) bisa menyebabkan masalah Fast Refresh
// Cara paling aman adalah import { useContext } dan { AuthContext } langsung di komponen.
// Untuk sekarang, kita biarkan dulu. Jika masalah HMR muncul lagi, kita perbaiki ini.
export const useAuth = () => {
  return useContext(AuthContext);
};