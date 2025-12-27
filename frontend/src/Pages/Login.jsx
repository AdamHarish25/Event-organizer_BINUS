// src/Pages/Login.jsx
import React, { useState } from 'react';
import { FaUser, FaLock } from "react-icons/fa"; // Menggunakan ikon User
import { useNavigate, Link } from "react-router-dom";
import authService from '../services/authService'; // Mengimpor authService yang sudah akurat

import logo from '../assets/logo.png'; // Pastikan path ini benar

const LoginUserPage = () => {
  // Menggunakan 'email' sesuai standar API login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Panggil authService.login dengan email dan password
      await authService.login(email, password);

      // Jika tidak ada error, berarti login berhasil
      // Redirect ke dashboard
      navigate('/dashboard');

    } catch (err) {
      // Menangkap error dari backend dan menampilkannya
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ClassName dari kode Anda, tidak diubah.
  const className = {
    container: "background_home w-screen h-screen flex justify-center items-center relative",
    overlay: "absolute w-full h-full inset-y-0 inset-x-0 bg-[#B0D6F580]",
    formContainer: "bg-[#3F88BC] z-10 sm:w-fit md:w-96 lg:w-[600px] p-10 md:p-8 rounded-md text-white lg:absolute right-10 bottom-5",
    logoContainer: "text-center space-y-2 mb-4 ",
    logoText: "text-xs font-semibold ml-2",
    form: "space-y-4",
    inputGroup: "flex items-center bg-white rounded-md overflow-hidden",
    icon: "p-3 text-[#3F88BC]",
    separator: "w-px bg-[#3F88BC] h-10",
    input: "w-full p-3 text-gray-700 outline-none",
    button: "w-fit py-3 px-8 bg-blue-700 rounded-md hover:bg-blue-800 transition disabled:bg-blue-400",
    footer: "inset-x-0 text-center absolute bottom-0 bg-white",
  };

  return (
    <div className={className.container}>
      <div className={className.overlay} />
      <div className={className.formContainer}>
        <div className="w-full flex items-center justify-end gap-5">
          <div className={className.logoContainer}>
            <img src={logo} alt="Logo Binus" className="h-20 w-fit" />
            <p className={className.logoText}>Event Viewer</p>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Student Login</h1>
        <p className="text-sm mb-6">Welcome! Please enter your credentials to view events.</p>

        <form className={className.form} onSubmit={handleSubmit}>
          {/* Input field menggunakan state 'email' */}
          <div className={className.inputGroup}>
            <div className={className.icon}><FaUser /></div>
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
          <div className="flex justify-between items-center text-sm mt-1">
            <a className="underline" href="/forgot-password">lupa password</a>
          </div>
          <div className="flex">
            <button type="submit" className={className.button} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          <div className="mt-4 text-center text-sm">
            <p>Don't have an account? <Link to="/register" className="font-bold hover:underline">Register here</Link></p>
          </div>
        </form>
      </div>

      <footer className={className.footer}>
        <h1 className="text-gray-600">Universitas Bina Nusantara Bekasi 2025</h1>
      </footer>
    </div>
  );
};

export default LoginUserPage;