import React, { useState } from 'react';
import { FaBell, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle, FaUserPlus, FaTimes } from 'react-icons/fa';

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

const statusColors = {
    REVISION: 'bg-yellow-50',
    REJECTED: 'bg-red-50',
    APPROVED: 'bg-green-50',
    PENDING: 'bg-blue-50',
    UPDATED: 'bg-orange-50',
    DELETED: 'bg-gray-50',
    NEW_ADMIN: 'bg-purple-50',
};

function parsePayload(payload) {
    try {
        return typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch {
        return {};
    }
}

const NotificationItem = ({ item, onClick }) => (
    <div
        className={`flex items-start gap-4 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${!item.isRead ? `${statusColors[item.status] || "bg-blue-50"} border-l-4 border-blue-500` : ''
            }`}
        onClick={onClick}
    >
        <div className="mt-1">{statusIcons[item.status] || <FaBell />}</div>
        <div className="flex-1">
            <h3 className={`font-semibold ${!item.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                {item.title}
                {!item.isRead && <span className={`ml-2 w-2 h-2 ${statusColors[item.status] + "0" || "bg-blue-500"} rounded-full inline-block`}></span>}
            </h3>
            <p className="text-sm text-gray-500">{item.message.substring(0, 80)}...</p>
            <p className="text-xs text-gray-400 mt-1">
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
            </p>
        </div>
    </div>
);

const FeedbackPanel = ({ feedbackList, onFeedbackClick }) => {
    const [showAll, setShowAll] = useState(false);

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
        } else if (notificationType === 'event_created' || notificationType === 'event_updated') {
            // Custom message for new/edited event proposals
            title = item.title || 'New Event Request';
            const eventName = payload.eventName || 'Unknown Event';
            message = `A new Request has been submitted: ${eventName} has submitted a new request, Please review it.`;
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

    // Only show first 10, use modal for the rest
    const displayedList = mappedList.slice(0, 10);
    const hasMore = mappedList.length > 10;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col relative">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Notifications</h2>
            <div className="space-y-4 flex-1 overflow-y-auto">
                {displayedList.length > 0 ? (
                    displayedList.map((item, index) => (
                        <NotificationItem
                            key={item.id || `notification-${index}`}
                            item={item}
                            onClick={() => onFeedbackClick(item)}
                        />
                    ))
                ) : (
                    mappedList.length >= 1 ? (<p className="text-center text-gray-500 py-10">Refresh your browser</p>) : (<p className="text-center text-gray-500 py-10">No notifications.</p>)
                )}
            </div>

            {hasMore && (
                <div className="mt-4 pt-2 border-t text-center">
                    <button
                        onClick={() => setShowAll(true)}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    >
                        View More ({mappedList.length - 10} more)
                    </button>
                </div>
            )}

            {/* Modal for full history */}
            {showAll && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex justify-center items-center p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-lg shadow-2xl flex flex-col animate-fadeIn">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <h3 className="font-bold text-lg text-gray-800">Notification History</h3>
                            <button
                                onClick={() => setShowAll(false)}
                                className="text-gray-500 hover:text-red-500 transition-colors p-2"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {mappedList.map((item, index) => (
                                <NotificationItem
                                    key={item.id || `modal-notification-${index}`}
                                    item={item}
                                    onClick={() => {
                                        onFeedbackClick(item);
                                        setShowAll(false);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackPanel;
