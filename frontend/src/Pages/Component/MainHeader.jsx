// src/components/MainHeader.jsx
import React from 'react';
import { useAuth } from '../Auth/AuthContext'; // Sesuaikan path
import avatar from '../../assets/profilePhoto.jpg';
import authService from '../../services/authService';

const MainHeader = ({ pageTitle }) => {
  const { getCurrentUser, logout } = authService;

  const user = getCurrentUser();

  console.log("User", user);

  // Jika user tidak ada, tampilkan header default tanpa info user
  if (!user) {
    return (
      <div className="w-full h-fit px-10 py-5 bg-white grid grid-cols-3 gap-6 shadow-md items-center">
        <div>
          <h3 className="text-[#36699F] font-bold text-sm">BINA NUSANTARA UNIVERSITY</h3>
          <h1 className="font-bold text-2xl">
            {pageTitle || "Bekasi"} <span className="text-[#EC6A37]">@Event Viewer</span>
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-fit px-10 py-5 bg-white grid grid-cols-3 gap-6 shadow-md items-center">
      <div>
        <h3 className="text-[#36699F] font-bold text-sm">BINA NUSANTARA UNIVERSITY</h3>
        <h1 className="font-bold text-2xl">
          {pageTitle || "Bekasi"} <span className="text-[#EC6A37]">@Event Viewer</span>
        </h1>
      </div>

      <div />

      <div className="flex items-center justify-end gap-5">
        <div className="text-right">
          {/* --- PERBAIKAN DI SINI --- */}
          <h1 className="text-lg font-semibold">{user.email}</h1>
          <p className="text-sm text-gray-500 capitalize">{user.role}</p>
        </div>
        <img src={user.avatar || avatar} alt={user.email} className="w-10 h-10 rounded-full object-cover" />

        <button onClick={logout} className="self-center ml-4 px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">
          Log Out
        </button>
      </div>
    </div>
  );
};

export default MainHeader;