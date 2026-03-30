import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ role }) => {
  const { user } = useSelector((state) => state.auth);

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role is specified, check user role
  if (role && user.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and role matches (or no role specified), render child routes
  return <Outlet />;
};

export default PrivateRoute;
