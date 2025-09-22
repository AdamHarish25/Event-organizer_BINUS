import React, { useState, useEffect } from 'react';
import MainHeader from '../Component/MainHeader';
import { StatusModal } from '../Component/StatusModal';
import { ConfirmationModal } from '../Component/ConfirmationModal';
import TextInputModal from '../Component/TextInputModal';
import FeedbackPanel from '../Component/FeedbackPanel';
import { approveEvent, rejectEvent, getEvents, sendFeedback } from '../../services/eventService';
import notificationService from '../../services/notificationService';

const SuperAdminDashboard = () => {
  const [allEvents, setAllEvents] = useState([]);
  // Notifikasi pendaftaran admin
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [adminNotifLoading, setAdminNotifLoading] = useState(false);
  const [adminNotifError, setAdminNotifError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [modal, setModal] = useState({ type: null, data: null });

  // State untuk Paginasi
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch events dengan paginasi
  const fetchEvents = async (page = 1) => {
    try {
      const res = await getEvents(page, 10);
      setAllEvents(res.data.data || []);
      setPaginationInfo(res.data.pagination);
      setCurrentPage(res.data.pagination.currentPage);
    } catch (err) {
      console.error("Error fetching events:", err);
      setAllEvents([]);
      setPaginationInfo(null);
    }
  };

  // Ambil notifikasi pendaftaran admin dari endpoint notifikasi, lalu filter
  const fetchAdminNotifications = async () => {
    setAdminNotifLoading(true);
    setAdminNotifError(null);
    try {
      const res = await notificationService.getNotifications();
      const list = res.data || [];
      // Debug: lihat tipe-tipe apa saja yang datang
      console.debug('Admin registration notifications raw:', list.map(n => ({ type: n.notificationType, payload: n.payload })));
      // Hanya tampilkan notifikasi yang masih dalam 28 hari terakhir (jika field waktu tersedia)
      const now = Date.now();
      const fourWeeksMs = 28 * 24 * 60 * 60 * 1000;
      const isWithinWindow = (n) => {
        const createdAtStr = n.createdAt || n.created_at || n.timestamp || n.createdAtUtc || n.created_at_utc;
        if (!createdAtStr) return true; // jika tidak ada field waktu, jangan disaring
        const t = Date.parse(createdAtStr);
        if (Number.isNaN(t)) return true;
        return (now - t) <= fourWeeksMs;
      };

      const filtered = list.filter(n => {
        const type = (n.notificationType || '').toLowerCase();
        let payload = {};
        try { payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : (n.payload || {}); } catch { payload = n.payload || {}; }
        const role = (payload.role || payload.userRole || '').toString().toLowerCase();
        const typeContainsAdmin = type.includes('admin');
        const typeUserRegistered = type.includes('registered') || type.includes('registration') || type.includes('user_created');
        return isWithinWindow(n) && (role === 'admin' || typeContainsAdmin || (typeUserRegistered && role === 'admin'));
      });
      setAdminNotifications(filtered);
    } catch (err) {
      console.error('Gagal mengambil notifikasi pendaftaran admin:', err);
      setAdminNotifications([]);
      setAdminNotifError('Gagal mengambil notifikasi pendaftaran admin.');
    } finally {
      setAdminNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(currentPage);
    fetchAdminNotifications();
    const interval = setInterval(fetchAdminNotifications, 10000);
    return () => clearInterval(interval);
  }, [currentPage]);

  useEffect(() => {
    let processed = [...allEvents];
    if (statusFilter !== 'All') {
      processed = processed.filter(e => e.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      processed = processed.filter(e => (e.eventName && e.eventName.toLowerCase().includes(term)));
    }
    setFilteredEvents(processed);
  }, [searchTerm, statusFilter, allEvents]);
  
  const handlePageChange = (newPage) => {
    if (paginationInfo && newPage > 0 && newPage <= paginationInfo.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAction = async (action, successMessage, errorMessage) => {
    try {
      await action();
      setModal({ type: 'status', data: { variant: 'success', title: 'Success!', message: successMessage } });
      fetchEvents(currentPage); // Re-fetch
    } catch (err) {
      setModal({ type: 'status', data: { variant: 'danger', title: 'Error!', message: err.message || errorMessage } });
    }
  };

  const handleApprove = (eventId, eventName) => {
    setModal({
      type: 'confirm',
      data: {
        title: 'Approve Event',
        message: `Apakah Anda yakin ingin menyetujui event "${eventName || ''}"?`,
        variant: 'success',
        onConfirm: () => {
          handleAction(
            () => approveEvent(eventId),
            'Event berhasil disetujui.',
            'Gagal menyetujui event.'
          );
          setModal({ type: null, data: null });
        }
      }
    });
  };

  const handleReject = (eventId, eventName) => {
    setModal({
      type: 'textinput',
      data: {
        title: 'Tolak Event',
        label: 'Alasan Penolakan',
        placeholder: 'Tuliskan alasan penolakan...',
        onSubmit: (feedback) => {
          handleAction(
            () => rejectEvent(eventId, feedback),
            'Event berhasil ditolak.',
            'Gagal menolak event.'
          );
          setModal({ type: null, data: null });
        }
      }
    });
  };
  
  const handleFeedback = (eventId, eventName) => {
    setModal({
      type: 'textinput',
      data: {
        title: 'Kirim Feedback Revisi',
        label: 'Catatan Revisi',
        placeholder: 'Tuliskan catatan revisi untuk admin/event owner...',
        onSubmit: (feedback) => {
          handleAction(
            () => sendFeedback(eventId, feedback),
            'Feedback revisi berhasil dikirim.',
            'Gagal mengirim feedback.'
          );
          setModal({ type: null, data: null });
        }
      }
    });
  };

  // Klik notifikasi pendaftaran admin: tampilkan detail ringkas
  const handleAdminNotifClick = (n) => {
    let payload = {};
    try { payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : (n.payload || {}); } catch { payload = n.payload || {}; }
    const name = [payload.firstName, payload.lastName].filter(Boolean).join(' ') || payload.name || 'Calon Admin';
    const email = payload.email || '-';
    setModal({
      type: 'status',
      data: {
        variant: 'success',
        title: 'Pendaftaran Admin Baru',
        message: `Nama: ${name}\nEmail: ${email}`,
      }
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <MainHeader pageTitle="SUPER ADMIN" />
      <main className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Event Approval</h2>
          <div className="flex justify-between mb-4">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-1/2 px-4 py-2 border rounded-lg"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="All">All Status</option>
              <option value="pending">Pending</option>
              <option value="revised">Revised</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2">Event Name</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(event => (
                <tr key={event.id}>
                  <td className="p-2">{event.eventName}</td>
                  <td>{event.location}</td>
                  <td>{event.date}</td>
                  <td><span className={`px-2 py-1 rounded-full text-xs font-semibold ${event.status === 'approved' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>{event.status}</span></td>
                  <td className="flex gap-2">
                    <button onClick={() => handleApprove(event.id, event.eventName)} className="text-green-500 font-bold">Approve</button>
                    <button onClick={() => handleReject(event.id, event.eventName)} className="text-red-500 font-bold">Reject</button>
                    <button onClick={() => handleFeedback(event.id, event.eventName)} className="text-blue-500 font-bold">Revise</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        
        <div className="p-6 rounded-lg">
          {adminNotifLoading ? (
            <p className="text-gray-500">Loading notifications...</p>
          ) : adminNotifError ? (
            <p className="text-red-500">{adminNotifError}</p>
          ) : (
            <FeedbackPanel feedbackList={adminNotifications} onFeedbackClick={handleAdminNotifClick} />
          )}
        </div>
      </main>
      <StatusModal
        isOpen={modal.type === 'status'}
        onClose={() => setModal({ type: null, data: null })}
        title={modal.data?.title}
        message={modal.data?.message}
        variant={modal.data?.variant}
      />
      <ConfirmationModal
        isOpen={modal.type === 'confirm'}
        onClose={() => setModal({ type: null, data: null })}
        onConfirm={modal.data?.onConfirm}
        title={modal.data?.title}
        message={modal.data?.message}
        variant={modal.data?.variant || 'default'}
      />
      <TextInputModal
        isOpen={modal.type === 'textinput'}
        onClose={() => setModal({ type: null, data: null })}
        onSubmit={modal.data?.onSubmit}
        title={modal.data?.title}
        label={modal.data?.label}
        placeholder={modal.data?.placeholder}
        defaultValue={modal.data?.defaultValue}
      />
    </div>
  );
};

export default SuperAdminDashboard;