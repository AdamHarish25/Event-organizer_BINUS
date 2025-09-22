import React, { useState, useEffect } from 'react';
import { validateFeedback } from '../../services/validation';

const TextInputModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Masukkan Teks',
  label = 'Keterangan',
  placeholder = 'Tulis di sini...',
  defaultValue = ''
}) => {
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (isOpen) setValue(defaultValue || '');
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate feedback
    const feedbackErrors = validateFeedback(value);
    setErrors(feedbackErrors);
    
    if (feedbackErrors.length === 0 && onSubmit) {
      onSubmit(value.trim());
    }
  };
  
  const handleChange = (e) => {
    setValue(e.target.value);
    // Real-time validation
    const feedbackErrors = validateFeedback(e.target.value);
    setErrors(feedbackErrors);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <textarea
              className={`w-full border rounded-lg px-3 py-2 min-h-[120px] focus:outline-none focus:ring-2 ${errors.length ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
              placeholder={placeholder}
              value={value}
              onChange={handleChange}
              maxLength="1000"
            />
            <div className="text-xs text-gray-500 mt-1">{value.length}/1000 characters</div>
            {errors.map((error, idx) => <p key={idx} className="text-red-500 text-xs mt-1">{error}</p>)}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200">Batal</button>
            <button type="submit" disabled={errors.length > 0 || !value.trim()} className="px-4 py-2 rounded-lg text-white bg-blue-600 disabled:bg-gray-400">Kirim</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TextInputModal;


