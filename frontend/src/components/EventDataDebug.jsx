// Debug component untuk melihat data event yang di-fetch
import React, { useState } from 'react';

const EventDataDebug = ({ events, title = "Event Data Debug" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  if (!events || events.length === 0) {
    return (
      <div className="fixed bottom-20 left-4 bg-yellow-100 border border-yellow-400 rounded p-2 text-xs">
        <strong>{title}:</strong> No events data
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-20 left-4 bg-purple-500 text-white p-2 rounded-full shadow-lg hover:bg-purple-600 z-50"
        title="Toggle Event Data Debug"
      >
        📊
      </button>
      
      {isVisible && (
        <div className="fixed bottom-32 left-4 bg-white border-2 border-purple-300 rounded-lg p-4 shadow-lg max-w-md max-h-96 overflow-auto text-xs z-40">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm">📊 {title}</h3>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <div>
              <strong>Total Events:</strong> {events.length}
            </div>
            
            <div>
              <strong>Events with Description:</strong> {events.filter(e => e.description).length}
            </div>
            
            <div>
              <strong>Sample Event Fields:</strong>
              <select 
                onChange={(e) => setSelectedEvent(events[parseInt(e.target.value)])}
                className="w-full mt-1 p-1 border rounded text-xs"
              >
                <option value="">Select event to inspect...</option>
                {events.map((event, index) => (
                  <option key={event.id || index} value={index}>
                    {event.eventName || `Event ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedEvent && (
              <div>
                <strong>Selected Event Data:</strong>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-1">
                  {JSON.stringify({
                    id: selectedEvent.id,
                    eventName: selectedEvent.eventName,
                    description: selectedEvent.description ? 
                      `${selectedEvent.description.substring(0, 50)}...` : 
                      'No description',
                    location: selectedEvent.location,
                    date: selectedEvent.date,
                    status: selectedEvent.status,
                    hasDescription: !!selectedEvent.description
                  }, null, 2)}
                </pre>
              </div>
            )}
            
            <div>
              <strong>Description Status:</strong>
              <div className="text-xs space-y-1 mt-1">
                {events.slice(0, 3).map((event, index) => (
                  <div key={event.id || index} className="flex justify-between">
                    <span>{event.eventName?.substring(0, 20)}...</span>
                    <span className={event.description ? 'text-green-600' : 'text-red-600'}>
                      {event.description ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
                {events.length > 3 && <div>... and {events.length - 3} more</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EventDataDebug;