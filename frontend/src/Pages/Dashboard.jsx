import { useState, useEffect } from "react";
import {
  FaRegClock,
  FaRegCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaCalendar,
} from "react-icons/fa";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import SearchBar from "./Component/searchBar";
import EventCarousel from "./Component/eventCarousel";
import "./Component/background.css";
import { FaLocationPin } from "react-icons/fa6";
import RealtimeClock from "./Component/realtime";
import MainHeader from "./Component/MainHeader";
import apiClient from "../services/api";

const DashboardUser = () => {
  const [currentEvents, setCurrentEvents] = useState([]);
  const [thisWeekEvents, setThisWeekEvents] = useState([]);
  const [nextEvents, setNextEvents] = useState([]);
  const [searchItem, setSearchItem] = useState("");
  const [filteredThisWeek, setFilteredThisWeek] = useState([]); // State terpisah untuk hasil filter
  const [loading, setLoading] = useState(true);
  const [bookmarkedEvents, setBookmarkedEvents] = useState(new Set());

  const toggleBookmark = (id) => {
    setBookmarkedEvents((prev) => {
      const newBookmarks = new Set(prev);
      newBookmarks.has(id) ? newBookmarks.delete(id) : newBookmarks.add(id);
      return newBookmarks;
    });
  };

  useEffect(() => {
    const fetchCategorizedEvents = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/event/');
        const { current, thisWeek, next } = response.data.data;
        
        setCurrentEvents(current || []);
        setThisWeekEvents(thisWeek || []);
        setNextEvents(next || []);
        
      } catch (err) {
        console.error("Error fetching categorized events:", err);
        setCurrentEvents([]);
        setThisWeekEvents([]);
        setNextEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategorizedEvents();
  }, []);

  // --- PERBAIKAN LOGIKA FILTER ---
  // Gunakan useEffect untuk memfilter `thisWeekEvents` setiap kali searchItem atau data asli berubah
  useEffect(() => {
    if (!searchItem) {
      setFilteredThisWeek(thisWeekEvents); // Jika tidak ada pencarian, tampilkan semua event minggu ini
      return;
    }
    
    const searchTermLower = searchItem.toLowerCase();
    const results = thisWeekEvents.filter((event) => {
      // Logika pencarian Anda sudah benar
      return `${event.eventName} ${event.location} ${event.speaker}`
        .toLowerCase()
        .includes(searchTermLower);
    });
    setFilteredThisWeek(results);
  }, [searchItem, thisWeekEvents]); // Dijalankan saat searchItem atau thisWeekEvents berubah

  // Mapping data untuk EventCarousel
  const carouselData = currentEvents.map(event => ({
    title: event.eventName,
    location: event.location,
    speaker: event.speaker,
    date: new Date(event.date).toLocaleDateString(),
    time: `${event.startTime} - ${event.endTime}`,
    image: event.imageUrl || '/api/placeholder/400/300'
  }));

  return (
    <div className="w-full relative overflow-x-hidden">
      <MainHeader pageTitle="Event Viewer" />

      <div className="p-5 space-y-2 bg-[#3C82CE]">
        <div className="flex items-center justify-between mb-3 px-20 text-white">
          <h1 className="text-2xl font-semibold">Current Events</h1>
          <RealtimeClock />
        </div>
        <div className="grid gap-2 w-full place-items-center">
          {/* Pastikan carouselData diteruskan dengan benar */}
          <EventCarousel carouselData={carouselData} />
        </div>
      </div>

      <div className="px-5 md:px-10 xl:px-20 pt-5 bgDash grid place-items-center">
        <div className="bg-white w-full h-full px-10 py-5 rounded-t-xl pb-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-semibold">This Week</h1>
            <div className="flex items-center gap-4">
              <SearchBar searchTerm={searchItem} onSearch={setSearchItem} />
            </div>
          </div>

          <ul className="mt-4 space-y-4 divide-y-2 min-h-[200px]">
            {loading ? (
              <p>Loading...</p>
            ) : filteredThisWeek.length > 0 ? (
              // Gunakan state filteredThisWeek untuk me-render
              filteredThisWeek.map((event, index) => (
                <li key={event.id} className={`p-4 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"} flex items-center justify-between`}>
                  <div>
                    <p className="font-semibold text-lg">{event.eventName}</p>
                    <div className="flex items-center text-sm text-gray-600 space-x-3 mt-1">
                      <span className="flex items-center">
                        <FaRegCalendarAlt className="mr-1" /> {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <FaRegClock className="mr-1" /> {`${event.startTime} - ${event.endTime}`}
                      </span>
                      <span className="flex items-center">
                        <FaMapMarkerAlt className="mr-1 text-red-500" />{" "}
                        {event.location}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => toggleBookmark(event.id)}>
                    {bookmarkedEvents.has(event.id) ? (
                      <BsBookmarkFill className="text-blue-500" />
                    ) : (
                      <BsBookmark className="text-gray-500" />
                    )}
                  </button>
                </li>
              ))
            ) : (
              <p>No events found for this week.</p>
            )}
          </ul>

          <h1 className="text-2xl font-semibold mt-10 mb-5">Next Events</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {nextEvents.slice(0, 4).map((event) => (
              <div
                key={event.id + "-next"}
                className="space-y-5 py-5 pl-5 pr-20 border-2 border-gray-500 rounded-lg h-full"
              >
                <h1 className="text-xl font-semibold">{event.eventName}</h1>
                <div>
                  <p className="space-x-2 flex items-center">
                    <FaClock className="text-[#EC6A37]"/>
                    <span>{`${event.startTime} - ${event.endTime}`}</span>
                  </p>
                  <p className="space-x-2 flex items-center">
                    <FaCalendar className="text-[#3F88BC]"/>
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </p>
                  <p className="space-x-2 flex items-center">
                    <FaLocationPin className="text-[#D9242A]"/>
                    <span>{event.location}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-fit px-10 py-5 bg-[#F3F3F3] text-right">
        <p className="text-gray-600">Universitas Bina Nusantara Bekasi 2023</p>
      </div>
    </div>
  );
};

export default DashboardUser;