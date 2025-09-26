import React from 'react';
import { FaBell, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle, FaUserPlus } from 'react-icons/fa';

const typeToStatus = {
  event_revision: 'REVISION',
  event_rejected: 'REJECTED',
  event_approved: 'APPROVED',
  event_created: 'PENDING',
  event_updated: 'UPDATED',
  event_deleted: 'DELETED',
  event_pending: 'PENDING',
  admin_registered: 'NEW_ADMIN',
};

const statusIcons = {
  REVISION: <FaExclamationTriangle className="text-yellow-500" />,
  REJECTED: <FaTimesCircle className="text-red-500" />,
  APPROVED: <FaCheckCircle className="text-green-500" />,
  PENDING: <FaClock className="text-blue-500" />,
  UPDATED: <FaExclamationTriangle className="text-orange-500" />,
  DELETED: <FaTimesCircle className="text-gray-500" />,
  NEW_ADMIN: <FaUserPlus className="text-purple-500" />,
};

function parsePayload(payload) {
  try {
    return typeof payload === 'string' ? JSON.parse(payload) : payload;
  } catch {
    return {};
  }
}

const FeedbackPanel = ({ feedbackList, onFeedbackClick }) => {
  // Mapping dari SQL ke format frontend
  const mappedList = feedbackList.map(item => {
    // Handle both database notifications and realtime socket notifications
    const notificationType = item.notificationType || item.type;
    const status = typeToStatus[notificationType] || 'PENDING';
    const payload = parsePayload(item.payload || item.data);
    
    let title, message;
    
    // Handle different notification types
    if (notificationType === 'event_deleted') {
      title = item.title || 'Event Terhapus';
      message = item.message || `Event "${payload.eventName || 'Unknown'}" telah dihapus.`;
    } else if (notificationType === 'admin_registered') {
      title = item.title || 'Admin Baru Terdaftar';
      message = item.message || `${payload.firstName || ''} ${payload.lastName || ''} telah mendaftar sebagai Admin.`;
    } else if (item.title && item.message) {
      // Realtime notification from socket
      title = item.title;
      message = item.message;
    } else {
      // Database notification
      title = payload.eventName || 'Event Notification';
      message = item.feedback || 
        `Event "${payload.eventName || ''}" by ${payload.speaker || ''} at ${payload.location || ''} on ${payload.date || ''}`;
    }
    
    return {
      ...item,
      status,
      title,
      message,
      isRead: item.isRead || false,
    };
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Notifications</h2>
      <div className="space-y-4">
        {mappedList.length > 0 ? (
          mappedList.map((item, index) => (
            <div 
              key={item.id || `notification-${index}`} 
              className={`flex items-start gap-4 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${
                !item.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`} 
              onClick={() => onFeedbackClick(item)}
            >
              <div className="mt-1">{statusIcons[item.status] || <FaBell />}</div>
              <div className="flex-1">
                <h3 className={`font-semibold ${!item.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                  {item.title}
                  {!item.isRead && <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>}
                </h3>
                <p className="text-sm text-gray-500">{item.message.substring(0, 80)}...</p>
                <p className="text-xs text-gray-400 mt-1">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 py-10">No notifications.</p>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;