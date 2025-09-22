import React from 'react';
import { FaQuestionCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';


const statusVariants = {
  danger: { icon: <FaExclamationTriangle size={48} className="text-red-500" />, btn: 'bg-red-600' },
  success: { icon: <FaCheckCircle size={48} className="text-green-500" />, btn: 'bg-green-600' },
};

export const StatusModal = ({ isOpen, onClose, title, message, variant = 'success' }) => {
  if (!isOpen) return null;
  const v = statusVariants[variant];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <div className="mx-auto mb-6">{v.icon}</div>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        <button onClick={onClose} className={`px-8 py-2 rounded-lg text-white ${v.btn}`}>Close</button>
      </div>
    </div>
  );
};