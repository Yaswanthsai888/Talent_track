import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../config/axios';

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <p className="text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to your account
            </Link>
          </p>
        </div>

      <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
        </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
            <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="sr-only">Phone Number</label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Account Type
              </label>
              <select
                id="role"
                name="role"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                 <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                 Company Name
                 </label>
                 <input
                 type="text"
                 name="companyName"
                 id="companyName"
                    required
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                 <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700">
                 Admin Key
                 </label>
                 <input
                 type="password"
                 name="adminKey"
                 id="adminKey"
                    required
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.adminKey}
                    onChange={handleChange}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                 <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                 Years of Experience
                 </label>
                 <input
                 type="number"
                 name="experience"
                 id="experience"
                    min="0"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.experience}
                    onChange={handleChange}
                  />
                </div>
                <div>
                 <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                 Skills (comma-separated)
                 </label>
                 <input
                 type="text"
                 name="skills"
                 id="skills"
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="React, Node.js, Python"
                    onChange={handleSkillsChange}
                  />
                </div>
                <div>
                  <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
                    Resume (PDF only)
                  </label>
                  <input
                    type="file"
                    name="resume"
                    id="resume"
                    accept="application/pdf"
                    onChange={handleResumeChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>

      </div>
    </div>
  );
};

export default RegisterPage;
