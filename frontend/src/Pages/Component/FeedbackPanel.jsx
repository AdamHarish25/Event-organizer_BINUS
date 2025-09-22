import React from 'react';
import { FaBell, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const typeToStatus = {
  event_revision: 'REVISION',
  event_rejected: 'REJECTED',
  event_approved: 'APPROVED',
  event_created: 'PENDING',
};

const statusIcons = {
  REVISION: <FaExclamationTriangle className="text-yellow-500" />,
  REJECTED: <FaTimesCircle className="text-red-500" />,
  APPROVED: <FaCheckCircle className="text-green-500" />,
  PENDING: <FaClock className="text-blue-500" />,
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
    const status = typeToStatus[item.notificationType] || 'PENDING';
    const payload = parsePayload(item.payload);
    const title = payload.eventName || 'Event Notification';
    const message =
      item.feedback ||
      `Event "${payload.eventName || ''}" by ${payload.speaker || ''} at ${payload.location || ''} on ${payload.date || ''}`;
    return {
      ...item,
      status,
      title,
      message,
    };
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg h-full">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Notifications</h2>
      <div className="space-y-4">
        {mappedList.length > 0 ? (
          mappedList.map(item => (
            <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" onClick={() => onFeedbackClick(item)}>
              <div className="mt-1">{statusIcons[item.status] || <FaBell />}</div>
              <div>
                <h3 className="font-semibold text-gray-700">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.message.substring(0, 50)}...</p>
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