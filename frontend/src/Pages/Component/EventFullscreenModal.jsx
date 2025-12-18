import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, MapPin, Clock, Calendar, Mic, FileText } from "lucide-react";

// Helper component for Icon Row with premium styling
const InfoRow = ({ icon: Icon, label, value, colorClass }) => (
  <div className="flex items-start space-x-4 group p-3 rounded-xl transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/5">
    <div className={`p-3 rounded-xl backdrop-blur-md ${colorClass} shadow-lg`}>
      <Icon size={22} />
    </div>
    <div className="flex-1">
      <p className="text-xs font-bold text-black/50 uppercase tracking-widest mb-1 opacity-80">{label}</p>
      <p className="text-lg text-black font-medium leading-snug tracking-wide text-shadow-sm">{value}</p>
    </div>
  </div>
);

const EventFullscreenModal = ({ events, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);

  // Keyboard navigation
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

  const nextEvent = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
      setIsAnimating(false);
    }, 200); // Fast transition
  };

  const prevEvent = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
      setIsAnimating(false);
    }, 200);
  };

  const currentEvent = events[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ease-in-out">
      {/* Background Layer with heavy blur */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-white/60 z-10" />
        <img
          key={`bg-${currentIndex}`}
          src={currentEvent.image || '/api/placeholder/800/600'}
          className="w-full h-full object-cover blur-3xl opacity-50 scale-110 transition-all duration-700 ease-in-out"
          alt="Background"
        />
      </div>

      {/* Main Modal Container */}
      <div className="relative z-20 w-[95vw] h-[90vh] max-w-7xl bg-white/40 backdrop-blur-2xl border border-gray-900/10 rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 ring-1 ring-gray-900/10">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/20 hover:bg-gray-900/10 text-black/70 hover:text-black transition-all duration-300 border border-transparent hover:border-gray-900/10"
        >
          <X size={28} />
        </button>

        {/* Left Side: Hero Image */}
        <div className="relative h-64 lg:h-full w-full overflow-hidden bg-white/50 group">
          <div className={`w-full h-full transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
            <img
              src={currentEvent.image || '/api/placeholder/800/600'}
              alt={currentEvent.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => {
                e.target.src = '/api/placeholder/800/600';
              }}
            />
          </div>
          {/* Image Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent opacity-80 lg:opacity-40" />

          {/* Pagination Badge */}
          <div className="absolute bottom-6 left-6 px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-md border border-gray-900/10 text-black/90 text-sm font-medium tracking-widest">
            {currentIndex + 1} <span className="text-black/40 mx-1">/</span> {events.length}
          </div>
        </div>

        {/* Right Side: Event Details */}
        <div className="flex flex-col h-full bg-gradient-to-b from-black/5 to-transparent relative overflow-hidden">
          <div className={`flex flex-col h-full overflow-y-auto custom-scrollbar p-8 lg:p-12 transition-opacity duration-300 ${isAnimating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>

            {/* Header Section */}
            <div className="mb-8">
              <div className="inline-flex items-center px-3 py-1 mb-6 text-xs font-bold tracking-widest text-black uppercase bg-blue-500/20 rounded-full border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                Event Details
              </div>
              <h1 className="text-3xl lg:text-5xl font-black text-black leading-tight mb-4 tracking-tight">
                {currentEvent.title}
              </h1>
              <div className="h-1.5 w-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mt-2 shadow-lg" />
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              <InfoRow
                icon={MapPin}
                label="Location"
                value={currentEvent.location}
                colorClass="bg-red-500/20 text-black border border-red-500/10"
              />
              <InfoRow
                icon={Calendar}
                label="Date"
                value={currentEvent.date}
                colorClass="bg-blue-500/20 text-black border border-blue-500/10"
              />
              <InfoRow
                icon={Clock}
                label="Time"
                value={currentEvent.time}
                colorClass="bg-orange-500/20 text-black border border-orange-500/10"
              />
              <InfoRow
                icon={Mic}
                label="Speaker"
                value={currentEvent.speaker}
                colorClass="bg-green-500/20 text-black border border-green-500/10"
              />
            </div>

            {/* Description Section */}
            <div className="mt-auto pt-6 border-t border-black/10">
              <div className="flex items-center space-x-2 mb-4 text-black">
                <FileText size={18} />
                <span className="text-sm font-bold uppercase tracking-widest">About This Event</span>
              </div>
              <p className="text-black leading-relaxed text-lg font-light whitespace-pre-wrap break-words">
                {currentEvent.description || "No description provided for this event."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Navigation Buttons (Bottom Center for Mobile, Sides for Desktop) */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center space-x-8 lg:space-x-0 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:justify-between lg:px-8 pointer-events-none z-30">
        {events.length > 1 && (
          <>
            <button
              onClick={prevEvent}
              className="pointer-events-auto p-4 rounded-full bg-black/5 backdrop-blur-md hover:bg-white/20 text-black transition-all duration-300 border border-white/10 hover:scale-110 hover:shadow-glow-white group"
            >
              <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={nextEvent}
              className="pointer-events-auto p-4 rounded-full bg-black/5 backdrop-blur-md hover:bg-white/20 text-black transition-all duration-300 border border-white/10 hover:scale-110 hover:shadow-glow-white group"
            >
              <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </>
        )}
      </div>

    </div>
  );
};

export default EventFullscreenModal;