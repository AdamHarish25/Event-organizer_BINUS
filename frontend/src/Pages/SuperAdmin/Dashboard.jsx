import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import MainHeader from '../Component/MainHeader';
import { StatusModal } from '../Component/StatusModal';
import { ConfirmationModal } from '../Component/ConfirmationModal';
import TextInputModal from '../Component/TextInputModal';
import EventDetailModal from '../Component/EventDetailModal';
import FeedbackPanel from '../Component/FeedbackPanel';
import { approveEvent, rejectEvent, getEvents, sendFeedback } from '../../services/eventService';
import notificationService from '../../services/notificationService';
import socketService from '../../services/socketService';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState([]);
  // Notifikasi pendaftaran admin
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [adminNotifLoading, setAdminNotifLoading] = useState(false);
  const [adminNotifError, setAdminNotifError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [modal, setModal] = useState({ type: null, data: null });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

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
        // Filter for event proposals (created or updated)
        return type === 'event_created' || type === 'event_updated';
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

  // Ref to keep track of current page without re-triggering socket connection
  const currentPageRef = React.useRef(currentPage);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Socket connection and realtime notifications
  useEffect(() => {
    if (user?.accessToken) {
      // Connect socket
      socketService.connect(user.accessToken);

      // Listen for new notifications
      const handleNewNotification = (notification) => {
        console.log('New notification received:', notification);

        // Refresh notifications list from server
        fetchAdminNotifications();

        // Refresh events list on current page
        fetchEvents(currentPageRef.current);

        // Show toast for new event proposals
        if (notification.type === 'event_created' || notification.type === 'event_updated') {
          // Optional: You can remove the modal if you just want the data to update silently, 
          // but keeping it helps visibility.
          setModal({
            type: 'status',
            data: {
              variant: 'info',
              title: 'Update Received',
              message: notification.message || 'Data events telah diperbarui.'
            }
          });
        }
      };

      socketService.onNotification(handleNewNotification);
      socketService.onEventUpdated(handleNewNotification);

      return () => {
        socketService.off('new_notification', handleNewNotification);
        socketService.off('eventUpdated', handleNewNotification);
        socketService.disconnect();
      };
    }
  }, [user?.accessToken]);

  useEffect(() => {
    fetchEvents(currentPage);
    fetchAdminNotifications();
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

  // Handler untuk klik event - tampilkan detail modal
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  // Handler untuk menutup modal detail event
  const handleCloseEventDetail = () => {
    setShowEventDetail(false);
    setSelectedEvent(null);
  };

  // Klik notifikasi: tampilkan detail event proposal
  const handleAdminNotifClick = (n) => {
    let payload = {};
    try {
      payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : (n.payload || n.data || {});
    } catch {
      payload = n.payload || n.data || {};
    }

    // Check if it's an event proposal
    const eventName = payload.eventName || 'Unknown Event';
    const speaker = payload.speaker || '-';
    const date = payload.date || '-';
    const location = payload.location || '-';
    const description = payload.description || '-';

    setModal({
      type: 'status',
      data: {
        variant: 'info',
        title: 'Detail Event Proposal',
        message: `Event: ${eventName}\nSpeaker: ${speaker}\nDate: ${date}\nLocation: ${location}\n\nDescription: ${description}`,
      }
    });
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <MainHeader pageTitle="SUPER ADMIN" />
      <main className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
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
                <tr
                  key={event.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleEventClick(event)}
                >
                  <td className="p-2 font-medium text-blue-600 hover:text-blue-800">{event.eventName}</td>
                  <td>{event.location}</td>
                  <td>{event.date}</td>
                  <td><span className={`px-2 py-1 rounded-full text-xs font-semibold ${event.status === 'approved' ? 'bg-green-200 text-green-800' : event.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : event.status === 'revised' ? 'bg-orange-200 text-orange-800' : 'bg-red-200 text-red-800'}`}>{event.status}</span></td>
                  <td className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleApprove(event.id, event.eventName)} className="text-green-500 font-bold hover:text-green-700">Approve</button>
                    <button onClick={() => handleReject(event.id, event.eventName)} className="text-red-500 font-bold hover:text-red-700">Reject</button>
                    <button onClick={() => handleFeedback(event.id, event.eventName)} className="text-blue-500 font-bold hover:text-blue-700">Revise</button>
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

        <div className="lg:col-span-1">
          <FeedbackPanel
            feedbackList={adminNotifications}
            onFeedbackClick={handleAdminNotifClick}
          />
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
      <EventDetailModal
        isOpen={showEventDetail}
        onClose={handleCloseEventDetail}
        event={selectedEvent}
        onApprove={(eventId, eventName) => {
          handleCloseEventDetail();
          handleApprove(eventId, eventName);
        }}
        onReject={(eventId, eventName) => {
          handleCloseEventDetail();
          handleReject(eventId, eventName);
        }}
        onRevise={(eventId, eventName) => {
          handleCloseEventDetail();
          handleFeedback(eventId, eventName);
        }}
      />
    </div>
  );
};

export default SuperAdminDashboard;