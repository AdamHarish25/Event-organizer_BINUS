import React, { useState } from 'react';
import { FaEnvelope } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      setError('Masukkan alamat email yang valid.');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Attempting to send OTP for email:', email);
      const res = await authService.forgotPassword(email);
      console.log('Forgot password response:', res);
      setMessage(res.message || 'Kode OTP telah dikirim ke email Anda.');
      // Lanjut ke halaman OTP dengan membawa email
      setTimeout(() => navigate(`/verify-otp?email=${encodeURIComponent(email)}`), 800);
    } catch (err) {
      console.error('Forgot password error in component:', err);
      const msg = err?.message || err?.error || 'Gagal mengirim OTP.';
      setError(typeof msg === 'string' ? msg : 'Gagal mengirim OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="background_home w-screen h-screen flex justify-center items-center relative">
      <div className="absolute w-full h-full inset-y-0 inset-x-0 bg-[#B0D6F580]" />
      <div className="bg-[#3F88BC] z-10 sm:w-fit md:w-96 lg:w-[600px] p-10 md:p-8 rounded-md text-white lg:absolute right-10 bottom-5">
        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
        <p className="text-sm mb-6">Masukkan email Anda. Kami akan mengirim kode OTP untuk verifikasi.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center bg-white rounded-md overflow-hidden">
            <div className="p-3 text-[#3F88BC]"><FaEnvelope /></div>
            <div className="w-px bg-[#3F88BC] h-10" />
            <input type="email" className="w-full p-3 text-gray-700 outline-none" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p className="text-red-200 text-sm">{error}</p>}
          {message && <p className="text-green-200 text-sm">{message}</p>}
          <div className="flex justify-between items-center">
            <Link className="underline text-sm" to="/login/admin">Kembali ke Login</Link>
            <button type="submit" className="w-fit py-3 px-8 bg-blue-700 rounded-md hover:bg-blue-800 transition" disabled={loading}>
              {loading ? 'Mengirim...' : 'Kirim OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;


