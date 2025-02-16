import { useState, useEffect } from "react";
import { FaRegClock, FaRegCalendarAlt, FaMapMarkerAlt, FaClock, FaCalendar } from "react-icons/fa";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import LogoBinus from "../assets/LogoBinus.png";
import bowtie from "../assets/bowtie.png";
import SearchBar from "./Component/searchBar";
import profilePhoto from "../assets/profilePhoto.jpg";
import { Link } from "react-router";
import EventCarousel from "./Component/eventCarousel";

import AI from '../assets/AI.jpg';
import deepseaDiver from "../assets/deepseaDiver.jpg";
import Financial from "../assets/Financial.jpg";
import Mars from "../assets/mars.jpg";
import Dog from "../assets/DOG.png";
import Ocean from "../assets/ocean.png";
import Redlight from "../assets/redlight.png";
import LivingRoom from "../assets/livingRoom.png";

import "./Component/background.css";
import { FaLocationPin } from "react-icons/fa6";
import RealtimeClock from "./Component/realtime";


const DashboardUser = () => {
  const [apiEvent, setApiEvent] = useState([]);
  const [searchItem, setSearchItem] = useState("");
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookmarkedEvents, setBookmarkedEvents] = useState(new Set());
  const [showBookmarked, setShowBookmarked] = useState(false);

 const events = [
   {
     title: "Living and Studying in Greenland",
     location: "Binus Bekasi MMG",
     speaker: "Embassy of Greenland",
     date: "12th May 2023",
     time: "07.40 - 09.50",
     image: LivingRoom,
   },
   {
     title: "Managing New York’s Busiest Junction",
     location: "Binus Bekasi Ampitheatre",
     speaker: "Barrack Obama",
     date: "12th May 2023",
     time: "10.00 - 18.00",
     image: Redlight,
   },
   {
     title: "How to Train a Decent Dog",
     location: "Binus Bekasi Room 503",
     speaker: "James Walker and Jhonny Red",
     date: "12th May 2023",
     time: "09.00 - 13.50",
     image: Dog,
   },
   {
     title: "Saving the World’s Cleanest Ocean",
     location: "Binus Bekasi Canteen",
     speaker: "Embassy of Australia",
     date: "12th May 2023",
     time: "15.00 - 19.30",
     image: Ocean,
   },
   {
     title: "Exploring Mars Colonization",
     location: "Binus Bekasi Hall A",
     speaker: "NASA",
     date: "15th May 2023",
     time: "09.00 - 11.30",
     image: Mars,
   },
   {
     title: "The Future of Artificial Intelligence",
     location: "Binus Bekasi Innovation Lab",
     speaker: "Elon Musk",
     date: "16th May 2023",
     time: "13.00 - 17.00",
     image: AI,
   },
   {
     title: "Mastering Personal Finance",
     location: "Binus Bekasi Room 102",
     speaker: "Warren Buffet",
     date: "17th May 2023",
     time: "10.00 - 14.00",
     image: Financial,
   },
   {
     title: "Deep Sea Exploration",
     location: "Binus Bekasi Science Hall",
     speaker: "Dr. Sylvia Earle",
     date: "18th May 2023",
     time: "15.00 - 19.00",
     image: deepseaDiver,
   },
 ];


  const toggleBookmark = (id) => {
    setBookmarkedEvents((prev) => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(id)) {
        newBookmarks.delete(id);
      } else {
        newBookmarks.add(id);
      }
      return newBookmarks;
    });
  };

  useEffect(() => {
    fetch("https://dummyjson.com/c/9be7-2560-4afa-9343")
      .then((response) => response.json())
      .then((data) => {
        if (data.event) {
          setApiEvent(data.event);
          setFilteredEvents(data.event);
        }
      })
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!apiEvent.length) return;
    const term = searchItem.toLowerCase();
    let filteredData = apiEvent.filter((event) =>
      `${event.info} ${event.location} ${event.speaker} ${event.date} ${event.time}`
        .toLowerCase()
        .includes(term)
    );
    if (selectedFilter) {
      filteredData = filteredData.filter((event) =>
        event[selectedFilter]?.toLowerCase().includes(term)
      );
    }
    setFilteredEvents(filteredData);
  }, [searchItem, selectedFilter, apiEvent]);

  const currDate = new Date().toLocaleDateString();
  const currTime = new Date().toLocaleTimeString();

  return (
    <div className="w-full relative overflow-x-hidden">
      <div className="w-full h-fit px-10 py-5 bg-white grid grid-cols-3 gap-6">
        <div className="flex items-center gap-5 divide-x-4 divide-[#5B5B5B]">
          <div className="w-fit flex items-center justify-center gap-8">
            <img src={bowtie} alt="bowtie" />
            <img src={LogoBinus} alt="BINUS LOGO" />
          </div>
          <div className="w-fit px-5">
            <h3 className="text-[#36699F] font-bold text-sm">
              BINA NUSANTARA UNIVERSITY
            </h3>
            <h1 className="font-bold text-2xl">
              Bekasi <span className="text-[#EC6A37]">@Event Viewer</span>
            </h1>
          </div>
        </div>
        <div className="grid place-items-center w-full h-full">
          <SearchBar searchTerm={searchItem} onSearch={setSearchItem} />
        </div>
        <div className="flex items-center justify-end gap-5 divide-x-2 divide-[#5B5B5B]">
          <div className="space-y-4 font-semibold text-right">
            <h1 className="text-2xl">Isyana Sarasvati</h1>
            <Link className="text-[#D9242A]">Log Out</Link>
          </div>
          <div className="w-fit h-fit pl-5">
            <img
              className="rounded-full w-12 h-12 object-cover object-center"
              src={profilePhoto}
            />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-2 bg-[#3C82CE]">
        <div className="flex items-center justify-between mb-3 px-20 text-white">
          <h1 className="text-2xl font-semibold">Current Events</h1>
          <div className="flex items-end justify-center gap-3">
            <RealtimeClock/>
          </div>
        </div>

        <div className="grid gap-2 w-full place-items-center">
          <EventCarousel carouselData={events} />
        </div>
      </div>

      <div className="px-20 pt-5 bgDash grid place-items-center ">
        <div className="bg-white w-full h-full px-10 py-5 rounded-t-xl pb-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-semibold">This Week</h1>
            <select
              className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-300"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="">All Fields</option>
              <option value="info">Event Name</option>
              <option value="location">Location</option>
              <option value="speaker">Speaker</option>
              <option value="date">Date</option>
            </select>
          </div>

          {/* <button
          onClick={() => setShowBookmarked((prev) => !prev)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          {showBookmarked ? "Show All Events" : "Show Bookmarked Events"}
        </button> */}

          <ul className="mt-4 space-y-4 divide-y-2">
            {loading ? (
              <p className="text-gray-500">Loading events...</p>
            ) : filteredEvents.length > 0 ? (
              filteredEvents
                .filter(
                  (event) => !showBookmarked || bookmarkedEvents.has(event.id)
                )
                .map((event, index) => (
                  <li
                    key={event.id}
                    className={`p-4 rounded-lg shadow-sm flex justify-between items-center ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-200"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-lg">{event.info}</p>
                      <div className="flex items-center text-sm text-gray-600 space-x-3 mt-1">
                        <span className="flex items-center">
                          <FaRegCalendarAlt className="mr-1" /> {event.date}
                        </span>
                        <span className="flex items-center">
                          <FaRegClock className="mr-1" /> {event.time}
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
              <p className="text-gray-500">No results found</p>
            )}
          </ul>

          <h1 className="text-2xl font-semibold mt-10 mb-5">Next Events</h1>
          <div className="flex items-center justify-start gap-10 divide-x-4 h-fit max-h-full divide-gray-500">
            <div className="grid grid-cols-4 gap-5 place-items-start">
              <div className="space-y-5 py-5 pl-5 pr-20 border-2 border-gray-500 rounded-lg">
                <h1 className="text-xl font-semibold">Bios Tech 2.0</h1>
                <div>
                  <p className="space-x-2 flex">
                    <FaClock className="text-[#EC6A37]" />{" "}
                    <span>15:00 - 20:00</span>
                  </p>
                  <p className="space-x-2 flex">
                    <FaCalendar className="text-[#3F88BC]" />{" "}
                    <span>2nd June 2023</span>
                  </p>
                  <p className="space-x-2 flex">
                    <FaLocationPin className="text-[#D9242A]" />{" "}
                    <span>Binus Bekasi MMG Lobby</span>
                  </p>
                </div>
              </div>

              <div className="space-y-5 py-5 pl-5 pr-20 border-2 border-gray-500 rounded-lg">
                <h1 className="text-xl font-semibold">Pro - To - Athon 2.0</h1>
                <div>
                  <p className="space-x-2 flex">
                    <FaClock className="text-[#EC6A37]" />{" "}
                    <span>10.00 - 13.00</span>
                  </p>
                  <p className="space-x-2 flex">
                    <FaCalendar className="text-[#3F88BC]" />{" "}
                    <span>3rd June 2023 </span>
                  </p>
                  <p className="space-x-2 flex">
                    <FaLocationPin className="text-[#D9242A]" />{" "}
                    <span>Binus Bekasi Ampitheatre</span>
                  </p>
                </div>
              </div>

              <div className="space-y-5 py-5 pl-5 pr-20 border-2 border-gray-500 rounded-lg">
                <h1 className="text-xl font-semibold">
                  Very Exciting Event Bekasi
                </h1>
                <div>
                  <p className="space-x-2 flex">
                    <FaClock className="text-[#EC6A37]" />{" "}
                    <span>16.30 - 23.00</span>
                  </p>
                  <p className="space-x-2 flex">
                    <FaCalendar className="text-[#3F88BC]" />{" "}
                    <span>5th June 2023 </span>
                  </p>
                  <p className="space-x-2 flex">
                    <FaLocationPin className="text-[#D9242A]" />{" "}
                    <span>Binus Bekasi Room 401</span>
                  </p>
                </div>
              </div>

              <div className="space-y-5 py-5 pl-5 pr-20 border-2 border-gray-500 rounded-lg">
                <h1 className="text-xl font-semibold">
                  Another Exciting Event 2.0
                </h1>
                <div>
                  <p className="space-x-2 flex">
                    <FaClock className="text-[#EC6A37]" />{" "}
                    <span>07.00 - 10.00</span>
                  </p>
                  <p className="space-x-2 flex">
                    <FaCalendar className="text-[#3F88BC]" />{" "}
                    <span>19th June 2023 </span>
                  </p>
                  <p className="space-x-2 flex">
                    <FaLocationPin className="text-[#D9242A]" />{" "}
                    <span>Binus Bekasi MMG Lobby</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="h-full space-y-5 px-4">
              <h1 className="text-2xl font-semibold">Filters</h1>

              <select
                className="px-3 py-2 border rounded-lg focus:ring focus:ring-blue-300"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="">All Fields</option>
                <option value="info">Event Name</option>
                <option value="location">Location</option>
                <option value="speaker">Speaker</option>
                <option value="date">Date</option>
              </select>
            </div>
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
