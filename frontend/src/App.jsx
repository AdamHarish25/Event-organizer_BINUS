import { useState } from 'react'
import './App.css'
import LoginPg from './Pages/Login';
import LoginAdmin from './Pages/Admin/Login';
import LoginSup from './Pages/SuperAdmin/Login';
import { Route, Routes, BrowserRouter as Router } from 'react-router';
import ForgotPassUser from './Pages/ForgotPass';
import DashboardUser from './Pages/Dashboard';

function App() {

  return (
    <div className="w-screen overflow-x-hidden">
      <Router>
        <Routes>
          <Route path="/" element={<LoginPg />} />
          <Route path="logAdmin" element={<LoginAdmin />} />
          <Route path="logSupAdmin" element={<LoginSup />} />
          <Route path="Forgot" element={<ForgotPassUser />} />
          <Route path="dashboard" element={<DashboardUser/>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
