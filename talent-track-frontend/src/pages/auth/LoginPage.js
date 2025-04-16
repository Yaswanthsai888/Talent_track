import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../config/axios';
import AnimatedBackground from '../../components/AnimatedBackground';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      console.log('Login attempt details:', { 
        email: trimmedEmail,
        passwordLength: password?.length 
      });

      const loginData = {
        email: trimmedEmail,
        password: password
      };

      console.log('Sending login request:', loginData);

      const response = await axiosInstance.post('/auth/login', loginData);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.role);
        
        // Navigate based on role
        navigate(response.data.role === 'admin' ? '/dashboard/admin' : '/dashboard/user');
      }
    } catch (err) {
      console.error('Login error details:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        data: err.response?.data
      });
      setError(err.response?.data?.message || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <div className="flex justify-center items-center min-h-screen px-4">
        <div className="w-full max-w-md bg-white/20 backdrop-blur-md rounded-xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-center text-white mb-6">Login</h2>
          
          {error && (
            <div className="bg-red-500/50 text-white p-3 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-white mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white 
                           border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-white mb-2">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white 
                           border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-white mb-4">
              Don't have an account? {' '}
              <Link 
                to="/register" 
                className="text-blue-300 hover:text-blue-200 underline"
              >
                Register here
              </Link>
            </p>
            
            <Link 
              to="/" 
              className="text-white hover:text-blue-200 underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default LoginPage;
