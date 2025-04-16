import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import './config/firebase';  // Initialize Firebase
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import UserDashboard from './pages/dashboard/user/UserDashboard';
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';

function App() {
  // Firebase is automatically initialized when imported
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard/user" element={<UserDashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
