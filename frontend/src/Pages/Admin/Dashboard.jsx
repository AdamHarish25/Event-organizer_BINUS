import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import MainHeader from '../Component/MainHeader';
import MyEventsTable from '../Component/TableData';
import FeedbackPanel from '../Component/FeedbackPanel';
import EventFormModal from '../Component/EventFormModal';
import { ConfirmationModal } from '../Component/ConfirmationModal';
import { StatusModal } from '../Component/StatusModal';
import { createEvent, editEvent, deleteEvent, getEvents } from '../../services/eventService';
import notificationService from '../../services/notificationService';

const AdminDashboard = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [modal, setModal] = useState({ type: null, data: null });
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);

  // State untuk Paginasi
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch notifications
  const fetchNotifications = async () => {
    setNotifLoading(true);
    setNotifError(null);
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data || []); // Consistent data access
    } catch (err) {
      setNotifications([]);
      setNotifError('Gagal mengambil notifikasi');
      console.error('Error fetching notifications:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch events dari backend dengan paginasi
  const fetchEvents = async (page = 1) => {
    try {
      const res = await getEvents(page); // Memanggil service dengan nomor halaman
      setAllEvents(res.data.data || []);
      setPaginationInfo(res.data.pagination);
      setCurrentPage(res.data.pagination.currentPage);
    } catch (err) {
      console.error('Error fetching events:', err);
      setAllEvents([]);
      setPaginationInfo(null);
    }
  };

  useEffect(() => {
    fetchEvents(currentPage);
  }, [currentPage]);

  // Filtering (diterapkan pada data halaman saat ini)
  useEffect(() => {
    let processed = [...allEvents];
    if (statusFilter !== 'All') {
      processed = processed.filter(e => (e.status.toLowerCase() === statusFilter.toLowerCase()));
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      processed = processed.filter(e => (
        (e.eventName && e.eventName.toLowerCase().includes(term)) ||
        (e.location && e.location.toLowerCase().includes(term)) ||
        (e.date && e.date.toLowerCase().includes(term)) ||
        (e.startTime && e.startTime.toLowerCase().includes(term)) ||
        (e.endTime && e.endTime.toLowerCase().includes(term)) ||
        (e.speaker && e.speaker.toLowerCase().includes(term))
      ));
    }
    setFilteredEvents(processed);
  }, [searchTerm, statusFilter, allEvents]);

  const handlePageChange = (newPage) => {
    if (paginationInfo && newPage > 0 && newPage <= paginationInfo.totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const handleOpenModal = (type, data = null) => setModal({ type, data });
  const handleCloseModal = () => setModal({ type: null, data: null });

  const handleEditEvent = (event) => handleOpenModal('form', event);

  // Klik notifikasi -> aksi berdasarkan status
  const handleNotificationClick = (notif) => {
    let payload = {};
    try {
      payload = typeof notif.payload === 'string' ? JSON.parse(notif.payload) : (notif.payload || {});
    } catch {
      payload = notif.payload || {};
    }

    // Cari eventId yang mungkin ada di payload
    const candidateEventId = payload.eventId || payload.id || payload.event_id;
    let eventToEdit = null;

    if (candidateEventId) {
      eventToEdit = allEvents.find(e => String(e.id) === String(candidateEventId)) || null;
    }

    // Jika tidak ketemu di daftar saat ini, coba rakit dari payload
    if (!eventToEdit) {
      const maybeEvent = payload.event || payload;
      const hasEssential = maybeEvent && (maybeEvent.eventName || maybeEvent.location || maybeEvent.date);
      if (hasEssential) {
        eventToEdit = {
          id: candidateEventId || maybeEvent.id,
          eventName: maybeEvent.eventName || '',
          location: maybeEvent.location || '',
          date: maybeEvent.date || '',
          startTime: maybeEvent.startTime || '',
          endTime: maybeEvent.endTime || '',
          speaker: maybeEvent.speaker || '',
          imageUrl: maybeEvent.imageUrl || maybeEvent.image || undefined,
        };
      }
    }

    const status = (notif.notificationType && notif.notificationType.toLowerCase()) || '';

    if (status === 'event_revision') {
      // Revised: buka edit event
      if (eventToEdit) {
        handleOpenModal('form', eventToEdit);
      } else {
        handleOpenModal('status', { variant: 'danger', title: 'Tidak Ditemukan', message: 'Data event revisi tidak tersedia.' });
      }
    } else if (status === 'event_rejected') {
      // Rejected: buka form event baru + tips
      const tips = notif.feedback || payload.feedback || 'Event ditolak. Silakan perbaiki sesuai catatan yang diberikan.';
      handleOpenModal('form', null);
      setTimeout(() => setModal(prev => ({ ...prev, helperMessage: tips })), 0);
    } else if (status === 'event_approved') {
      // Approved: tampilkan modal info
      handleOpenModal('status', { variant: 'success', title: 'Approved!', message: 'Event telah di-approved!' });
    } else {
      // Default: jika ada data event, buka edit, jika tidak info
      if (eventToEdit) {
        handleOpenModal('form', eventToEdit);
      } else {
        handleOpenModal('status', { variant: 'success', title: 'Notifikasi', message: 'Notifikasi diproses.' });
      }
    }
  };

  const handleDeleteClick = (eventId) => {
    setActionToConfirm(() => async () => {
      try {
        await deleteEvent(eventId);
        await fetchEvents(currentPage);
        handleCloseModal();
        setTimeout(() => handleOpenModal('status', { variant: 'danger', title: 'Deleted!', message: 'Event berhasil dihapus.' }), 100);
      } catch (err) {
        handleCloseModal();
        setTimeout(() => handleOpenModal('status', { variant: 'danger', title: 'Error!', message: 'Gagal menghapus event.' }), 100);
      }
    });
    handleOpenModal('confirm-delete');
  };

  const handleSaveEvent = (formData) => {
    setActionToConfirm(() => async () => {
      try {
        if (modal.data?.id) {
          await editEvent(modal.data.id, formData);
        } else {
          await createEvent(formData);
        }
        await fetchEvents(currentPage);
        handleCloseModal();
        setTimeout(() => handleOpenModal('status', { variant: 'success', title: 'Success!', message: 'Event berhasil disimpan.' }), 100);
      } catch (err) {
        handleCloseModal();
        setTimeout(() => handleOpenModal('status', { variant: 'danger', title: 'Error!', message: 'Gagal menyimpan event.' }), 100);
      }
    });
    handleOpenModal('confirm-save');
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <MainHeader pageTitle="ADMIN" />
      <main className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <input
              type="text"
              placeholder="Search by event name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2 px-4 py-2 border rounded-lg"
            />
            <div className="w-full md:w-auto flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-auto px-4 py-2 border rounded-lg"
              >
                <option value="All">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="revised">Revised</option>
                <option value="rejected">Rejected</option>
              </select>
              <button
                onClick={() => handleOpenModal('form')}
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
              >
                Create New Event
              </button>
            </div>
          </div>
          <MyEventsTable
            events={filteredEvents}
            onEdit={handleEditEvent}
            onDelete={handleDeleteClick}
          />
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
                Prev
              </button>
              <span>Page {paginationInfo.currentPage} of {paginationInfo.totalPages}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === paginationInfo.totalPages} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">
                Next
              </button>
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <FeedbackPanel feedbackList={notifications} onFeedbackClick={handleNotificationClick} />
        </div>
      </main>
      <EventFormModal
        isOpen={modal.type === 'form'}
        onClose={handleCloseModal}
        eventToEdit={modal.data}
        onSave={handleSaveEvent}
        helperMessage={modal.helperMessage}
      />
      <ConfirmationModal
        isOpen={modal.type === 'confirm-save'}
        onClose={handleCloseModal}
        onConfirm={actionToConfirm}
        title="Attention!"
        message="Are you sure you want to save this event?"
        variant="success"
      />
      <ConfirmationModal
        isOpen={modal.type === 'confirm-delete'}
        onClose={handleCloseModal}
        onConfirm={actionToConfirm}
        title="Attention!"
        message="This will permanently delete the event."
        variant="danger"
      />
      <StatusModal
        isOpen={modal.type === 'status'}
        onClose={handleCloseModal}
        title={modal.data?.title}
        message={modal.data?.message}
        variant={modal.data?.variant}
      />
    </div>
  );
};

export default AdminDashboard;