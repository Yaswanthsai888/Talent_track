import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-section">
        {user && (
          <Link to={isAdmin ? '/admin-dashboard' : '/user-dashboard'}>
            Dashboard
          </Link>
        )}
        <Link to="/jobs">Jobs</Link>
        <Link to="/profile">Profile</Link>
        {user && <Link to="/tests">Tests</Link>}
      </div>
      
      {isAdmin ? (
        <div className="nav-section admin-nav">
          <Link to="/admin/tests/create">Create Test</Link>
          <Link to="/admin/questions">Question Bank</Link>
          <Link to="/admin/analytics">Test Analytics</Link>
        </div>
      ) : user && (
        <div className="nav-section user-nav">
          <Link to="/tests">Available Tests</Link>
          <Link to="/tests/results">Test Results</Link>
        </div>
      )}

      <div className="nav-section auth-actions">
        {user ? (
          <>
            <span>Welcome, {user.name}</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
