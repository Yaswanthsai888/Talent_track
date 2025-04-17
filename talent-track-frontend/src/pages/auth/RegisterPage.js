import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../config/axios';
import AnimatedBackground from '../../components/AnimatedBackground';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user', // Default to user role
    phoneNumber: '',
    experience: '',
    companyName: '',
    adminKey: '',
    skills: []
  });
  const [resume, setResume] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResume(file);
      setError('');
    } else {
      setError('Please upload a PDF file');
      e.target.value = '';
    }
  };

  const handleSkillsChange = (e) => {
    const skillsArray = e.target.value.split(',').map(skill => skill.trim());
    setFormData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.password || !formData.phoneNumber) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate admin specific fields
    if (formData.role === 'admin' && (!formData.companyName || !formData.adminKey)) {
      setError('Company name and admin key are required for admin registration');
      setLoading(false);
      return;
    }

    try {
      // Create form data for file upload
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'skills') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      if (resume) {
        submitData.append('resume', resume);
      }

      const response = await axios.post('/api/auth/register', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Store token and redirect
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      
      // Redirect based on role
      if (response.data.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/user');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <div className="flex justify-center items-center min-h-screen px-4 py-12">
        <div className="w-full max-w-2xl bg-white/20 backdrop-blur-md rounded-xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-center text-white mb-6">
            Create your account
          </h2>
          
          <p className="text-center text-white/80 mb-8">
            Or{' '}
            <Link to="/login" className="text-blue-300 hover:text-blue-200 underline">
              sign in to your account
            </Link>
          </p>

          {error && (
            <div className="bg-red-500/50 text-white p-3 rounded-lg mb-6 text-center" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-white mb-2">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-white mb-2">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-white mb-2">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-white mb-2">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-white mb-2">Phone Number</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-white mb-2">Account Type</label>
                <select
                  id="role"
                  name="role"
                  className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">Job Seeker</option>
                  <option value="admin">Company Admin</option>
                </select>
              </div>

              {formData.role === 'admin' ? (
                <>
                  <div>
                    <label htmlFor="companyName" className="block text-white mb-2">Company Name</label>
                    <input
                      type="text"
                      name="companyName"
                      id="companyName"
                      required
                      className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter company name"
                      value={formData.companyName}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="adminKey" className="block text-white mb-2">Admin Key</label>
                    <input
                      type="password"
                      name="adminKey"
                      id="adminKey"
                      required
                      className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter admin key"
                      value={formData.adminKey}
                      onChange={handleChange}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="experience" className="block text-white mb-2">Years of Experience</label>
                    <input
                      type="number"
                      name="experience"
                      id="experience"
                      min="0"
                      className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter years of experience"
                      value={formData.experience}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="skills" className="block text-white mb-2">Skills (comma-separated)</label>
                    <input
                      type="text"
                      name="skills"
                      id="skills"
                      className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="React, Node.js, Python"
                      onChange={handleSkillsChange}
                    />
                  </div>
                  <div>
                    <label htmlFor="resume" className="block text-white mb-2">Resume (PDF only)</label>
                    <input
                      type="file"
                      name="resume"
                      id="resume"
                      accept="application/pdf"
                      onChange={handleResumeChange}
                      className="w-full px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 rounded-lg text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                loading ? 'bg-blue-400/50 cursor-not-allowed' : 'bg-blue-600/80 hover:bg-blue-700/80'
              }`}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>

            <div className="text-center mt-6">
              <Link to="/" className="text-white hover:text-blue-200 underline">
                Back to Home
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default RegisterPage;
