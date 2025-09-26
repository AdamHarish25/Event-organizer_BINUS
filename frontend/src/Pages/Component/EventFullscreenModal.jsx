import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { FaMapMarkerAlt, FaClock, FaCalendar, FaMicrophone } from "react-icons/fa";

const EventFullscreenModal = ({ events, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextEvent = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const prevEvent = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prevEvent();
      if (e.key === 'ArrowRight') nextEvent();
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  if (!isOpen || !events || events.length === 0) return null;

  const currentEvent = events[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-7xl mx-auto p-4 flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <X size={32} />
        </button>

        {/* Navigation Buttons */}
        {events.length > 1 && (
          <>
            <button
              onClick={prevEvent}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              <ChevronLeft size={48} />
            </button>
            <button
              onClick={nextEvent}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              <ChevronRight size={48} />
            </button>
          </>
        )}

        {/* Event Content */}
        <div className="bg-white rounded-lg overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh] grid grid-cols-1 lg:grid-cols-2">
          {/* Event Image */}
          <div className="relative">
            <img
              src={currentEvent.image || '/api/placeholder/400/300'}
              alt={currentEvent.title}
              className="w-full h-64 lg:h-full object-cover"
              onError={(e) => {
                e.target.src = '/api/placeholder/400/300';
              }}
            />
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {currentIndex + 1} / {events.length}
            </div>
          </div>

          {/* Event Details */}
          <div className="p-8 flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {currentEvent.title}
              </h1>
              <div className="w-16 h-1 bg-blue-500 mb-4"></div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-gray-600">
                <FaMapMarkerAlt className="text-red-500 text-xl" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-lg">{currentEvent.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-600">
                <FaMicrophone className="text-green-500 text-xl" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Speaker</p>
                  <p className="text-lg">{currentEvent.speaker}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-600">
                <FaCalendar className="text-blue-500 text-xl" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-lg">{currentEvent.date}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-gray-600">
                <FaClock className="text-orange-500 text-xl" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-lg font-semibold text-blue-600">{currentEvent.time}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventFullscreenModal;