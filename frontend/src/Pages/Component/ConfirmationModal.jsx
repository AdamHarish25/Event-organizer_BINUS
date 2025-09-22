import React from 'react';
import { FaQuestionCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const confirmVariants = {
  default: { icon: <FaQuestionCircle size={48} className="text-blue-500" />, btn: 'bg-blue-600' },
  danger: { icon: <FaExclamationTriangle size={48} className="text-red-500" />, btn: 'bg-red-600' },
  success: { icon: <FaCheckCircle size={48} className="text-green-500" />, btn: 'bg-green-600' },
};

export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, variant = 'default' }) => {
  if (!isOpen) return null;
  const v = confirmVariants[variant];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md text-center">
        <div className="mx-auto mb-6">{v.icon}</div>
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        <div className="flex justify-center gap-4">
          <button onClick={onClose} className="px-8 py-2 rounded-lg bg-gray-200">Cancel</button>
          <button onClick={onConfirm} className={`px-8 py-2 rounded-lg text-white ${v.btn}`}>Yes</button>
        </div>
      </div>
    </div>
  );
};