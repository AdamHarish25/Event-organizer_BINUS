import React from 'react';
import { FaSpinner } from 'react-icons/fa';

const LoadingModal = ({ isOpen, message = "Processing..." }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4 animate-bounce-slight">
                <FaSpinner className="text-blue-600 w-10 h-10 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-800">{message}</h3>
            </div>
        </div>
    );
};

export default LoadingModal;
