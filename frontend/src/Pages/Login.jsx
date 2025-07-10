// src/pages/LoginUserPage.jsx
import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaUserCircle, FaUserShield, FaUserTie } from "react-icons/fa"; // Menggunakan ikon yang sesuai
// import { Link } from "react-router-dom";
import { useAuth } from './Auth/AuthContext'; // <-- Mesin login terpusat kita

// Pastikan path asset logo Anda benar
import logo from '../assets/logo.png';

const LoginPg = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();

  // Menggunakan struktur className yang sama untuk konsistensi
  const className = {
    container: "background_home w-screen h-screen flex justify-center items-center relative",
    overlay: "absolute w-full h-full inset-y-0 inset-x-0 bg-[#B0D6F580]",
    formContainer: "bg-[#3F88BC] z-10 sm:w-fit md:w-96 lg:w-[600px] p-10 md:p-8 rounded-md text-white lg:absolute right-10 bottom-5",
    logoContainer: "space-y-2 mb-4 ",
    logoText: "text-xs text-center font-semibold ml-2",
    form: "space-y-4",
    inputGroup: "flex items-center bg-white rounded-md overflow-hidden",
    icon: "p-3 text-[#3F88BC]",
    separator: "w-px bg-[#3F88BC] h-10",
    input: "w-full p-3 text-gray-700 outline-none",
    button: "w-fit py-3 px-8 bg-blue-700 rounded-md hover:bg-blue-800 transition",
    footer: "inset-x-0 text-center absolute bottom-0 bg-white gap-5 justify-between",
    grid: "w-full grid grid-cols-2 gap-3 place-items-center",
    link: "px-8 py-5 bg-blue-700 text-white font-bold flex items-center gap-3",
  };

  // Logika login yang sama persis dengan halaman lain
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = auth.login(email, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className={className.container}>
      <div className={className.overlay} />
      <div className={className.formContainer}>
        {/* Menggunakan ikon generik untuk User/Student */}
        <div className="w-full flex items-center justify-between gap-5">
          <div className="text-white">
            <FaUserCircle size={100} />
          </div>
          <div className={className.logoContainer}>
            <img src={logo} alt="Logo Binus" className="h-16" />
            <p className={className.logoText}>Event Viewer</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Student Login</h1>
        <p className="text-sm mb-6">Welcome! Please enter your credentials to view events.</p>

        <form className={className.form} onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className={className.inputGroup}>
            <div className={className.icon}><FaEnvelope /></div>
            <div className={className.separator}></div>
            <input
              type="email"
              placeholder="Enter your Email"
              className={className.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {/* Password Input */}
          <div className={className.inputGroup}>
            <div className={className.icon}><FaLock /></div>
            <div className={className.separator}></div>
            <input
              type="password"
              placeholder="Enter your Password"
              className={className.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}
          
          <div className="flex">
            <button type="submit" className={className.button}>Login</button>
          </div>
        </form>
      </div>

      {/* Footer disesuaikan untuk User Page */}
      <footer className={className.footer}>
        {/* <div className={className.grid}>
          <Link className={className.link} to={"/login/admin"}>
            <FaUserShield /> <p>Sign in as Admin</p>
          </Link>
          <Link className={className.link} to={"/login/superadmin"}>
            <FaUserTie /> <p>Sign in as Super Admin</p>
          </Link>
        </div> */}
        <h1 className="text-gray-600">Universitas Bina Nusantara Bekasi 2025</h1>
        <div></div>
      </footer>
    </div>
  );
};

export default LoginPg;