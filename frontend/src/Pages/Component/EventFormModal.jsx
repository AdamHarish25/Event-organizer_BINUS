// src/components/EventFormModal.jsx
import React, { useState, useEffect } from 'react';

const EventFormModal = ({ isOpen, onClose, onSave, eventToEdit, helperMessage }) => {
  // State asli untuk data form (tetap utuh)
  const [formData, setFormData] = useState({
    eventName: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    speaker: '',
    image: null
  });

  // State baru untuk mengontrol visibilitas pratinjau
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  // State baru untuk menyimpan sumber URL gambar pratinjau
  const [previewImageSrc, setPreviewImageSrc] = useState(null);

  const isEditMode = Boolean(eventToEdit);

  // useEffect diperbarui untuk mengatur pratinjau gambar juga
  useEffect(() => {
    if (isOpen && isEditMode) {
      // const [datePart, timePart] = (eventToEdit.date || ' - ').split(' - ');
      setFormData({
        eventName: eventToEdit.eventName || '',
        location: eventToEdit.location || '',
        date: eventToEdit.date || '',
        startTime: eventToEdit.startTime || '',
        endTime: eventToEdit.endTime || '',
        speaker: eventToEdit.speaker || '',
        image: null
      });
      setPreviewImageSrc(eventToEdit.imageUrl || null);
    } else {
      // Reset semua state saat modal ditutup atau dalam mode 'New Event'
      setFormData({ eventName: '', location: '', date: '', startTime: '', endTime: '', speaker: '', image: null });
      setPreviewImageSrc(null);
      setIsPreviewVisible(false); // Pastikan pratinjau tersembunyi saat dibuka kembali
    }
  }, [isOpen, eventToEdit, isEditMode]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'image' && files && files[0]) {
      const file = files[0];
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewImageSrc(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('eventName', formData.eventName);
    fd.append('date', formData.date);
    fd.append('startTime', formData.startTime);
    fd.append('endTime', formData.endTime);
    fd.append('location', formData.location);
    fd.append('speaker', formData.speaker);
    if (formData.image) fd.append('image', formData.image);
    onSave(fd);
    console.log([...fd.entries()]);
  };

  // Fungsi untuk toggle pratinjau
  const togglePreview = () => {
    setIsPreviewVisible(!isPreviewVisible);
  };

  if (!isOpen) return null;


  

  return (
    // Latar belakang modal
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className={`m-4 transform rounded-xl bg-white p-2 shadow-2xl transition-all lg:flex ${previewImageSrc ? "max-w-4xl w-full" : "max-w-2xl w-full"}`}>

        {/* Kolom Kiri: Form */}
        <div className="w-full lg:w-1/2 p-6">
          <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Edit Event' : 'New Event'}</h2>
          {helperMessage && (
            <div className="mt-3 rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800">
              {helperMessage}
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Input fields tetap sama */}
            <div>
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-600">Event Name</label>
              <input type="text" name="eventName" id="eventName" value={formData.eventName} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500" required />
            </div>



            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-600">Location</label>
                <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500" required />
              </div>

              <div>
                <label htmlFor="speaker" className="block text-sm font-medium text-gray-600">Speaker</label>
                <input type="text" name="speaker" id="speaker" value={formData.speaker} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500" required />
              </div>

            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-600">Date</label>
              <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-600">Start Time</label>
                <input type="time" name="startTime" id="startTime" value={formData.startTime} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500" required />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-600">End Time</label>
                <input type="time" name="endTime" id="endTime" value={formData.endTime} onChange={handleChange} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500" required />
              </div>
            </div>
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-600">Poster</label>
              <input type="file" name="image" id="image" onChange={handleChange} className="mt-1 w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
            </div>

            {/* Tombol Toggle Pratinjau */}
            <div className="pt-2">
              <button
                type="button"
                onClick={togglePreview}
                className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isPreviewVisible ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}`}
              >
                {isPreviewVisible ? 'Close Preview' : 'See Preview'}
              </button>
            </div>

            {/* Tombol Aksi Utama */}
            <div className="flex justify-end gap-4 pt-4 ">
              <button type="button" onClick={onClose} className="rounded-lg bg-gray-200 px-6 py-2 font-medium text-gray-800 hover:bg-gray-300">Cancel</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700">Save Event</button>
            </div>
          </form>
        </div>

        {/* Kolom Kanan: Area Pratinjau */}
        <div className={`relative w-full items-center justify-center rounded-lg bg-gray-50 lg:w-1/2 p-4 ${isPreviewVisible ? 'flex ' : 'hidden'}`}>
          {isPreviewVisible ? (
            previewImageSrc ? (
              <img src={previewImageSrc} alt="image Preview" className="max-h-[500px] w-auto rounded-md object-contain shadow-md" />
            ) : (
              <div className="text-center text-gray-500">Tidak ada image untuk ditampilkan. Silakan unggah gambar.</div>
            )
          ) : (
            <div className="text-center text-gray-500">Pratinjau image akan muncul di sini.</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EventFormModal;