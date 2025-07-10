import React, { useState, useEffect } from 'react';

function EventFormModal({ isOpen, onClose, onSubmit, eventToEdit }) {
  // State untuk setiap input field di form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Menentukan apakah kita sedang dalam mode edit atau tidak
  const isEditMode = Boolean(eventToEdit);

  // useEffect ini sangat penting!
  // Ia akan dijalankan setiap kali modal dibuka atau data 'eventToEdit' berubah.
  useEffect(() => {
    // Jika modal terbuka DAN kita dalam mode edit, isi form dengan data event.
    if (isOpen && isEditMode) {
      setTitle(eventToEdit.title || '');
      setDescription(eventToEdit.description || '');
      setLocation(eventToEdit.location || '');
      setDate(eventToEdit.date || '');
      setTime(eventToEdit.time || '');
    } else {
      // Jika tidak, reset form menjadi kosong.
      // Ini mencegah data lama muncul saat membuka modal untuk 'Tambah Event Baru'.
      setTitle('');
      setDescription('');
      setLocation('');
      setDate('');
      setTime('');
    }
  }, [isOpen, eventToEdit, isEditMode]);


  // Handler saat form disubmit
  const handleSubmit = (e) => {
    // Mencegah browser me-refresh halaman
    e.preventDefault();

    // Mengumpulkan semua data dari state menjadi satu objek
    const formData = {
      // Jika mode edit, gunakan id yang ada. Jika tidak, backend yang akan generate id.
      id: isEditMode ? eventToEdit.id : null,
      title,
      description,
      location,
      date,
      time,
    };
    
    // Kirim data kembali ke komponen induk (AdminDashboard) untuk diproses
    onSubmit(formData);
  };


  // Jika 'isOpen' adalah false, jangan render apa-apa (return null)
  if (!isOpen) {
    return null;
  }


  return (
    // Container Latar Belakang (Overlay)
    // z-50 memastikan modal berada di atas semua konten lain
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity"
      onClick={onClose} // Menutup modal jika area di luar modal diklik
    >
      {/* Container Konten Modal */}
      <div
        className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutup modal
      >
        {/* Header Modal */}
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {isEditMode ? 'Edit Event' : 'Tambah Event Baru'}
        </h2>
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Input untuk Judul Event */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Judul Event
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F88BC]"
                required
              />
            </div>

            {/* Input untuk Deskripsi */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                id="description"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F88BC]"
              />
            </div>

            {/* Grup untuk Lokasi, Tanggal, dan Waktu */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F88BC]"
                  required
                />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F88BC]"
                  required
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                  Waktu
                </label>
                <input
                  type="time"
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F88BC]"
                  required
                />
              </div>
            </div>
            {/* Di sini Anda bisa menambahkan input untuk upload poster (type="file") nanti */}
          </div>
          
          {/* Tombol Aksi di bagian bawah */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button" // 'button' agar tidak men-submit form
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg text-white bg-[#3F88BC] hover:bg-[#36699F] transition-colors"
            >
              {isEditMode ? 'Simpan Perubahan' : 'Simpan Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventFormModal;