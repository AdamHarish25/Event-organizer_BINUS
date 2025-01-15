import { useState } from 'react'
import './App.css'
import LoginPg from './Pages/Login';
import LoginAdmin from './Pages/Admin/Login';
import LoginSup from './Pages/SuperAdmin/Login';
import { Route, Routes, BrowserRouter as Router } from 'react-router';

function App() {

  return (
    <div className='w-screen'>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPg/>} />
          <Route path="logAdmin" element={<LoginAdmin/>} />
          <Route path="logSupAdmin" element={<LoginSup/>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
