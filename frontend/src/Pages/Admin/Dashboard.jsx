// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import MainHeader from '../Component/MainHeader'; // <-- Header kita yang bisa dipakai ulang
import { useAuth } from '../Auth/AuthContext';
// Ganti ini dengan mock API service jika sudah dibuat
// import { getMyEvents, deleteEvent, saveEvent } from '../api/eventService';
import MyEventsTable from '../Component/TableData'; // Tabel event
import EventFormModal from '../Component/EventFormModal'; // Modal form
import { mockEvents } from '../data/mockdata'; // <-- Pakai mock data untuk sementara

function AdminDashboard() {
  const { user } = useAuth();
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);

  const fetchMyEvents = () => {
    setLoading(true);
    // Simulasi filter event berdasarkan ID admin yang login
    const filteredEvents = mockEvents.filter(e => e.authorId === user.id);
    setMyEvents(filteredEvents);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchMyEvents();
    }
  }, [user]);

  const handleOpenAddModal = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEventToEdit(null);
  };

  const handleSaveEvent = (eventData) => {
    // Di sini logika untuk save (create/update) ke API
    console.log("Saving event:", eventData);
    alert(`(Simulasi) Event "${eventData.title}" disimpan!`);
    handleCloseModal();
    // Refresh data setelah save
    // Untuk simulasi, kita bisa manipulasi mock data, tapi fetch ulang lebih mudah
    fetchMyEvents();
  };
  
  const handleDeleteEvent = (eventId) => {
    if (window.confirm('Yakin ingin menghapus event ini?')) {
      // Di sini logika untuk delete ke API
      console.log("Deleting event:", eventId);
      alert(`(Simulasi) Event ID ${eventId} dihapus!`);
      // Refresh data setelah delete
      fetchMyEvents();
    }
  };


  return (
    <div>
      <MainHeader pageTitle="Admin Dashboard" />
      <main className="p-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Kelola Event Anda</h1>
          <button
            onClick={handleOpenAddModal}
            className="bg-[#EC6A37] text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition-all"
          >
            + Tambah Event
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <MyEventsTable
              events={myEvents}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteEvent}
            />
          )}
        </div>
      </main>

      {isModalOpen && (
        <EventFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSaveEvent}
          eventToEdit={eventToEdit}
        />
      )}
    </div>
  );
}

export default AdminDashboard;