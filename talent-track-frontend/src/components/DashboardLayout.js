import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import AnimatedBackground from './AnimatedBackground';
import Button from './ui/button';

const DashboardLayout = ({ children, isAdmin = false, loading = false }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  if (loading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AnimatedBackground>
    );
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col">
        {/* Navbar */}
        <nav className="bg-white/20 backdrop-blur-md shadow-xl py-4">
          <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">
                Talent Track {isAdmin ? 'Admin' : 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="secondary" 
                icon={FaSignOutAlt}
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                Logout
              </Button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-grow p-6 bg-white/10 backdrop-blur-md">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>

        {/* Optional Footer */}
        <footer className="bg-white/20 backdrop-blur-md py-4 text-center">
          <p className="text-white opacity-70">
            &copy; {new Date().getFullYear()} Talent Track. All Rights Reserved.
          </p>
        </footer>
      </div>
    </AnimatedBackground>
  );
};

export default DashboardLayout;
