import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TestCreation from '../components/admin/TestCreation.jsx';
import QuestionBank from '../components/admin/QuestionBank.jsx';
import Analytics from '../components/admin/Analytics.jsx';
import UserDashboard from '../components/user/UserDashboard.jsx';
import TestTaking from '../components/user/TestTaking.jsx';
import TestResults from '../components/user/TestResults.jsx';
import AvailableTests from '../components/user/AvailableTests.jsx';
import Jobs from '../components/pages/Jobs.jsx';
import Profile from '../components/pages/Profile.jsx';
import PrivateRoute from './PrivateRoute';
import Login from '../components/Login.jsx';
import Register from '../components/Register.jsx';
import { useSelector } from 'react-redux';
import JobManagementDashboard from '../components/JobManagementDashboard.jsx';

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    {/* Protected Routes */}
    <Route path="/" element={<PrivateRoute />}>
      {/* Default route based on user role */}
      <Route index element={<RoleBasedRedirect />} />
      
      <Route path="jobs" element={<Jobs />} />
      <Route path="profile" element={<Profile />} />
      
      {/* Admin Routes */}
      <Route path="admin/*" element={<PrivateRoute role="admin" />}>
        <Route path="tests/create" element={<TestCreation />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* Admin Dashboard */}
      <Route path="admin-dashboard" element={<PrivateRoute role="admin" />}>
        <Route index element={<JobManagementDashboard />} />
      </Route>

      {/* User Dashboard */}
      <Route path="user-dashboard" element={<PrivateRoute role="user" />}>
        <Route index element={<UserDashboard />} />
      </Route>

      {/* User Test Routes */}
      <Route path="tests/*" element={<PrivateRoute role="user" />}>
        <Route index element={<AvailableTests />} />
        <Route path=":testId" element={<TestTaking />} />
        <Route path="results" element={<TestResults />} />
      </Route>
    </Route>

    {/* Catch-all redirect */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// Component to redirect based on user role
const RoleBasedRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate 
    to={user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} 
    replace 
  />;
};

export default AppRoutes;
