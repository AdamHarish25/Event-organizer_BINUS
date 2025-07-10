// src/components/MyEventsTable.jsx
import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

// Komponen kecil untuk menampilkan status dengan warna yang berbeda
const StatusBadge = ({ status }) => {
  const baseStyle = "px-3 py-1 text-xs font-bold text-white rounded-full uppercase";
  const statusMap = {
    approved: `bg-green-500`,
    pending: `bg-yellow-500`,
    rejected: `bg-red-500`,
  };

  return (
    <span className={`${baseStyle} ${statusMap[status] || 'bg-gray-500'}`}>
      {status}
    </span>
  );
};

// Komponen Tabel Utama
const MyEventsTable = ({ events, onEdit, onDelete }) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Anda belum mengajukan event. Silakan klik "Tambah Event" untuk memulai.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Judul Event</th>
            <th className="py-3 px-6 text-center text-sm font-semibold text-gray-600">Status</th>
            <th className="py-3 px-6 text-center text-sm font-semibold text-gray-600">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-gray-50">
              <td className="py-4 px-6 text-gray-800">{event.title}</td>
              <td className="py-4 px-6 text-center">
                <StatusBadge status={event.status} />
              </td>
              <td className="py-4 px-6">
                <div className="flex justify-center items-center gap-4">
                  <button 
                    onClick={() => onEdit(event)}
                    className="text-blue-500 hover:text-blue-700 transition"
                    title="Edit Event"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button 
                    onClick={() => onDelete(event.id)}
                    className="text-red-500 hover:text-red-700 transition"
                    title="Hapus Event"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MyEventsTable;