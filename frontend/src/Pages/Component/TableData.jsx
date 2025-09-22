// src/components/MyEventsTable.jsx
import React from 'react';
import { FaEdit, FaTrash, FaBell } from 'react-icons/fa';

const statusStyles = {
  Accepted: "bg-green-100 text-green-800",
  Approved: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Revision: "bg-blue-100 text-blue-800",
  Rejected: "bg-red-100 text-red-800",
};

const MyEventsTable = ({ events, onEdit, onDelete, onNotify }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Name</th>
            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Date</th>
            <th className="py-3 px-6 text-left text-sm font-semibold text-gray-600">Location</th>
            <th className="py-3 px-6 text-center text-sm font-semibold text-gray-600">Status</th>
            <th className="py-3 px-6 text-center text-sm font-semibold text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-gray-50">
              <td className="py-4 px-6 text-gray-800 font-medium">{event.eventName}</td>
              <td className="py-4 px-6 text-gray-600">{event.date}</td>
              <td className="py-4 px-6 text-gray-600">{event.location}</td>
              <td className="py-4 px-6 text-center">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusStyles[event.status] || 'bg-gray-100 text-gray-800'}`}>
                  {event.status}
                </span>
              </td>
              <td className="py-4 px-6">
                <div className="flex justify-center items-center gap-4">
                  <button onClick={() => onNotify(event.feedbackId)} className="text-gray-500 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed" title="Notifications" disabled={!event.feedbackId}>
                    <FaBell size={16} />
                  </button>
                  <button onClick={() => onEdit(event)} className="text-gray-500 hover:text-green-600 transition" title="Edit Event">
                    <FaEdit size={16} />
                  </button>
                  <button onClick={() => onDelete(event.id)} className="text-gray-500 hover:text-red-600 transition" title="Delete Event">
                    <FaTrash size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MyEventsTable;