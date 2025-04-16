import React from 'react';
import { FaRocket, FaCode, FaUsers } from 'react-icons/fa';
import Button from '../components/ui/button';
import AnimatedBackground from '../components/AnimatedBackground';

const LandingPage = () => {
  return (
    <AnimatedBackground>
      <div className="min-h-screen flex flex-col justify-center items-center text-center px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6">
            Talent Track: Your Career Journey Starts Here
          </h1>
          <p className="text-xl text-gray-200 mb-12">
            Discover opportunities, showcase your skills, and connect with top employers.
          </p>

          <div className="flex justify-center space-x-4 mb-16">
            <Button 
              variant="primary" 
              icon={FaRocket}
              onClick={() => window.location.href = '/register'}
            >
              Get Started
            </Button>
            <Button 
              variant="secondary"
              icon={FaCode}
              onClick={() => window.location.href = '/explore'}
            >
              Explore Jobs
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl">
              <FaRocket className="text-4xl text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Quick Apply</h3>
              <p className="text-gray-200">
                Streamline your job application process with our intuitive platform.
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl">
              <FaCode className="text-4xl text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Skill Matching</h3>
              <p className="text-gray-200">
                Get matched with jobs that align perfectly with your skills.
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-xl">
              <FaUsers className="text-4xl text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Networking</h3>
              <p className="text-gray-200">
                Connect with professionals and expand your career network.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default LandingPage;
