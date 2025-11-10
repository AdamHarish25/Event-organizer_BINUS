import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import EventFullscreenModal from "./EventFullscreenModal";

function EventCard({ event, onFullscreen }) {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden grid grid-cols-2 gap-5 relative group">
      <img 
        src={event.image || '/api/placeholder/400/300'} 
        alt={event.title} 
        className="w-full h-60 object-cover object-top"
        onError={(e) => {
          e.target.src = '/api/placeholder/400/300';
        }}
      />
      <div className="p-4 flex flex-col">
        <h3 className="text-lg font-semibold">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-gray-700 mb-2 line-clamp-2 flex-1">{event.description}</p>
        )}
        <div className="space-y-1">
          <p className="text-gray-500 text-sm">{event.location}</p>
          <p className="text-sm text-gray-600">{event.speaker}</p>
          <p className="text-sm text-gray-600">{event.date}</p>
          <p className="text-sm text-blue-600 font-semibold">{event.time}</p>
        </div>
      </div>
      <button
        onClick={onFullscreen}
        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
      >
        <Maximize2 size={16} />
      </button>
    </div>
  );
}

const ITEMS_PER_PAGE = 4;

// --- PERBAIKAN: Gunakan prop `carouselData` ---
export default function EventCarousel({ carouselData }) { 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  
  // Pastikan carouselData adalah array sebelum menghitung totalSlides
  const totalSlides = Array.isArray(carouselData) ? Math.ceil(carouselData.length / ITEMS_PER_PAGE) : 0;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
  };

  const openFullscreen = (eventIndex) => {
    setFullscreenIndex(eventIndex);
    setIsFullscreenOpen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreenOpen(false);
  };

  // Jangan render jika tidak ada data atau totalSlides 0
  if (!Array.isArray(carouselData) || carouselData.length === 0) {
    return <div className="text-center text-white py-10">No current events available.</div>;
  }

  return (
    <div className="relative w-full max-w-full px-20 py-10">
      <div className="overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 grid-rows-1 lg:grid-rows-2 gap-8">
          {carouselData
            .slice(
              currentIndex * ITEMS_PER_PAGE,
              (currentIndex + 1) * ITEMS_PER_PAGE
            )
            .map((event, index) => {
              const globalIndex = currentIndex * ITEMS_PER_PAGE + index;
              return (
                <EventCard 
                  key={index} 
                  event={event} 
                  onFullscreen={() => openFullscreen(globalIndex)}
                />
              );
            })}
        </div>
      </div>

      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-200 transition"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md hover:bg-gray-200 transition"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
      
      <EventFullscreenModal
        events={carouselData}
        isOpen={isFullscreenOpen}
        onClose={closeFullscreen}
        initialIndex={fullscreenIndex}
      />
    </div>
  );
}