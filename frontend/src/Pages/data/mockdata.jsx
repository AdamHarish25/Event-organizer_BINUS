import AI from '../../assets/AI.jpg';
import deepseaDiver from "../../assets/deepseaDiver.jpg";
import Financial from "../../assets/Financial.jpg";
import Mars from "../../assets/mars.jpg";
import Dog from "../../assets/DOG.png";
import Ocean from "../../assets/ocean.png";
import Redlight from "../../assets/redLight.png";
import LivingRoom from "../../assets/livingRoom.png";


export const mockFeedback = [
  { id: 901, eventId: 101, status: 'REVISION', title: 'Your Request requires REVISION', message: 'Posternya tolong diganti ya, resolusinya terlalu kecil dan pecah.' },
  { id: 902, eventId: 102, status: 'REJECTED', title: 'Your request has been REJECTED', message: 'Maaf, tanggal yang Anda ajukan bentrok dengan acara lain.' },
  { id: 903, eventId: 103, status: 'APPROVED', title: 'Your request has been APPROVED', message: 'Selamat, acara Anda telah disetujui.' },
  { id: 904, eventId: 104, status: 'PENDING', title: 'Your request is currently PENDING', message: 'Permintaan Anda sedang dalam antrian review.' },
];

export const mockEvents = [
    { id: 101, authorId: 2, name: 'Protoathon 2024', date: '14th May 2023 - 08.00', location: 'Binus Bekasi Amphitheatre', status: 'Revision', feedbackId: 901, posterUrl: '/path/to/poster1.jpg' },
    { id: 102, authorId: 2, name: 'Biztecho 3.0', date: '24th May 2023 - 12.00', location: 'Binus Bekasi Room 403', status: 'Rejected', feedbackId: 902, posterUrl: '/path/to/poster2.jpg' },
    { id: 103, authorId: 2, name: 'Pro-to-mega-kill', date: '3rd June 2023 - 04.00', location: 'Binus Bekasi Room 301', status: 'Approved', feedbackId: 903, posterUrl: '/path/to/poster3.jpg' },
    { id: 104, authorId: 2, name: 'Preetty-athon 2023', date: '26th July 2023 - 04.00', location: 'Binus Bekasi Mini Theatre', status: 'Pending', feedbackId: 904, posterUrl: '/path/to/poster4.jpg' },
    { id: 105, authorId: 2, name: 'Businesstechno 2023', date: '10th August 2023 - 12.00', location: 'Binus LKC', status: 'Accepted', feedbackId: null, posterUrl: '/path/to/poster5.jpg' },
];

export const mockUsers = [
  { id: 1, email: 'superadmin@binus.ac.id', password: 'password123', role: 'superadmin', name: 'Super Admin' },
  { id: 2, email: 'admin@binus.ac.id', password: 'password123', role: 'admin', name: 'My Name' },
  { id: 3, email: 'user@binus.ac.id', password: 'password123', role: 'user', name: 'Isyana Sarasvati' },
];

export const ApprovedEvents = [
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