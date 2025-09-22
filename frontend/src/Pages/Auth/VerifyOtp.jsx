import React, { useState, useEffect } from 'react';
import { FaKey } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const VerifyOtp = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qEmail = query.get('email');
    if (qEmail) setEmail(qEmail);
  }, [query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    // Basic validation
    if (!otp || otp.length < 4) {
      setError('Masukkan kode OTP yang valid (minimal 4 digit).');
      setLoading(false);
      return;
    }
    
    if (!email) {
      setError('Email tidak ditemukan. Silakan kembali ke halaman sebelumnya.');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Attempting to verify OTP for email:', email, 'OTP:', otp);
      const res = await authService.verifyOtp(email, otp);
      console.log('Verify OTP response:', res);
      setMessage(res.message || 'OTP valid. Lanjutkan reset password.');
      // Arahkan ke halaman reset password dengan membawa token dari backend
      const resetToken = res.resetToken || res.token || '';
      setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(resetToken)}`), 800);
    } catch (err) {
      console.error('Verify OTP error in component:', err);
      const msg = err?.message || err?.error || 'OTP tidak valid.';
      setError(typeof msg === 'string' ? msg : 'OTP tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="background_home w-screen h-screen flex justify-center items-center relative">
      <div className="absolute w-full h-full inset-y-0 inset-x-0 bg-[#B0D6F580]" />
      <div className="bg-[#3F88BC] z-10 sm:w-fit md:w-96 lg:w-[600px] p-10 md:p-8 rounded-md text-white lg:absolute right-10 bottom-5">
        <h1 className="text-2xl font-bold mb-2">Verifikasi OTP</h1>
        <p className="text-sm mb-6">Masukkan kode OTP yang dikirim ke email Anda.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center bg-white rounded-md overflow-hidden">
            <div className="p-3 text-[#3F88BC]"><FaKey /></div>
            <div className="w-px bg-[#3F88BC] h-10" />
            <input type="text" className="w-full p-3 text-gray-700 outline-none" placeholder="Kode OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
          </div>
          {error && <p className="text-red-200 text-sm">{error}</p>}
          {message && <p className="text-green-200 text-sm">{message}</p>}
          <div className="flex justify-between items-center">
            <Link className="underline text-sm" to={`/forgot-password`}>Ganti email</Link>
            <button type="submit" className="w-fit py-3 px-8 bg-blue-700 rounded-md hover:bg-blue-800 transition" disabled={loading}>
              {loading ? 'Memverifikasi...' : 'Verifikasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtp;


