import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function EventCard({ event }) {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden grid grid-cols-2 gap-5">
      <img src={event.image} alt={event.title} className="w-full h-40 object-cover" />
      <div className="p-4">
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <p className="text-gray-500">{event.location}</p>
        <p className="text-sm text-gray-600">{event.speaker}</p>
        <p className="text-sm text-gray-600">{event.date}</p>
        <p className="text-sm text-blue-600 font-semibold">{event.time}</p>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 4;

// --- PERBAIKAN: Gunakan prop `carouselData` ---
export default function EventCarousel({ carouselData }) { 
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Pastikan carouselData adalah array sebelum menghitung totalSlides
  const totalSlides = Array.isArray(carouselData) ? Math.ceil(carouselData.length / ITEMS_PER_PAGE) : 0;

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
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
            .map((event, index) => (
              <EventCard key={index} event={event} />
            ))}
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
    </div>
  );
}