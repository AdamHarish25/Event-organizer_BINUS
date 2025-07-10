// src/components/MainHeader.jsx
// Versi ini menghapus dropdown "View As" untuk kesederhanaan.

import React from 'react';
import { useAuth } from '../context/AuthContext'; // Sesuaikan path

const MainHeader = ({ pageTitle }) => {
  // Hanya butuh user dan logout.
  const { user, logout } = useAuth();
  
  return (
    <div className="w-full h-fit px-10 py-5 bg-white grid grid-cols-3 gap-6 shadow-md items-center">
      {/* Kolom Kiri */}
      <div className="flex items-center gap-5">
        <div>
          <h3 className="text-[#36699F] font-bold text-sm">BINA NUSANTARA UNIVERSITY</h3>
          <h1 className="font-bold text-2xl">
            {pageTitle || "Bekasi"} <span className="text-[#EC6A37]">@Event Viewer</span>
          </h1>
        </div>
      </div>
      
      {/* Kolom Tengah */}
      <div />

      {/* Kolom Kanan */}
      <div className="flex items-center justify-end gap-5">
        <div className="text-right">
          <h1 className="text-lg font-semibold">{user?.name}</h1>
          {/* Menampilkan peran asli pengguna secara langsung */}
          <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
        </div>
        
        <button onClick={logout} className="self-center ml-4 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
          Log Out
        </button>
      </div>
    </div>
  );
};

export default MainHeader;