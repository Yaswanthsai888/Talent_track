import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../config/axios';
import DashboardLayout from '../../../components/DashboardLayout';
import JobCard from '../../../components/JobCard';
import Button from '../../../components/ui/button';

const UserDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [showMatchedOnly, setShowMatchedOnly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        console.log('Fetching user data...'); // Debug log
        const response = await axiosInstance.get('/user/profile');
        console.log('User data received:', response.data); // Debug log
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        console.log('Fetching jobs...');
        const response = await axiosInstance.get('/jobs');
        console.log('Jobs received:', response.data);
        const allJobs = response.data.jobPostings;
        
        if (!allJobs || !Array.isArray(allJobs)) {
          console.error('Invalid jobs data received');
          return;
        }
        
        // Calculate skill matches for each job
        const jobsWithMatches = allJobs.map(job => {
          const skillMatch = userData?.skills ? 
            calculateSkillMatch(userData.skills, job.requiredSkills) : 0;
          return {
            ...job,
            skillMatch
          };
        });

        // Filter jobs with 80% or higher match
        const matched = jobsWithMatches.filter(job => job.skillMatch >= 80);
        console.log('Matched jobs:', matched);
        setMatchedJobs(matched);
        setJobs(jobsWithMatches);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };

    if (userData) {
      fetchJobs();
    }
  }, [userData]);

  const calculateSkillMatch = (jobSkills, userSkills) => {
    if (!userSkills || !jobSkills || jobSkills.length === 0) return 0;
    
    // Ensure we're working with arrays
    const userSkillsArray = Array.isArray(userSkills) ? userSkills : [];
    
    // Normalize skills for comparison (convert to lowercase)
    const normalizedUserSkills = userSkillsArray.map(s => s.toLowerCase());
    const normalizedJobSkills = jobSkills.map(s => s.toLowerCase());
    
    // Count matching skills
    const matchedSkills = normalizedJobSkills.filter(skill => 
      normalizedUserSkills.includes(skill)
    );
    
    return (matchedSkills.length / normalizedJobSkills.length) * 100;
  };

  if (loading || !userData) {
    return <DashboardLayout loading={true} />;
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6">Welcome, {userData.name}!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Profile Section */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Your Profile</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Email:</span> {userData.email}</p>
                <p><span className="font-medium">Phone:</span> {userData.phoneNumber}</p>
                <p><span className="font-medium">Experience:</span> {userData.experience}</p>
                {userData.skills && (
                  <div>
                    <span className="font-medium">Skills:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {userData.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Job Matches Section */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Job Matches</h3>
              <p className="text-3xl font-bold text-green-600">
                {matchedJobs.length}
              </p>
              <p className="text-gray-600 mt-2">
                jobs match your skills by 80% or more
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Available Jobs</h2>
          <Button
            variant="secondary"
            onClick={() => setShowMatchedOnly(!showMatchedOnly)}
          >
            {showMatchedOnly ? 'Show All Jobs' : 'Show Matched Jobs'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(showMatchedOnly ? matchedJobs : jobs).length === 0 ? (
            <p className="text-gray-400 col-span-full text-center py-8">
              {showMatchedOnly ? 'No matched jobs found.' : 'No jobs available at the moment.'}
            </p>
          ) : (
            (showMatchedOnly ? matchedJobs : jobs).map(job => (
              job && job._id && (
                <JobCard
                  key={job._id}
                  job={job}
                  isAdmin={false}
                  skillMatch={calculateSkillMatch(job.requiredSkills, userData.skills)}
                  userSkills={userData.skills || []}
                />
              )
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
