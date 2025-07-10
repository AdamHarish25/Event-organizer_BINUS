import AI from '../../assets/AI.jpg';
import deepseaDiver from "../../assets/deepseaDiver.jpg";
import Financial from "../../assets/Financial.jpg";
import Mars from "../../assets/mars.jpg";
import Dog from "../../assets/DOG.png";
import Ocean from "../../assets/ocean.png";
import Redlight from "../../assets/redLight.png";
import LivingRoom from "../../assets/livingRoom.png";

// src/data/mockData.js


export const mockUsers = [
  { id: 1, email: 'superadmin@binus.ac.id', password: 'password123', role: 'superadmin', name: 'Super Admin' },
  { id: 2, email: 'admin@binus.ac.id', password: 'password123', role: 'admin', name: 'Admin BEM' },
  { id: 3, email: 'user@binus.ac.id', password: 'password123', role: 'user', name: 'Isyana Sarasvati' },
];

export const mockEvents = [
  { id: 101, authorId: 2, title: 'BINUS Festival 2024', status: 'approved' },
  { id: 102, authorId: 2, title: 'Workshop Web Dev (Pending)', status: 'pending' },
  { id: 103, authorId: 1, title: 'Rapat Anggaran Tahunan', status: 'approved' },
  { id: 104, authorId: 2, title: 'Lomba Catur (Ditolak)', status: 'rejected' },
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