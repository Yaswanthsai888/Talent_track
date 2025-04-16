import React, { useState } from 'react';
import { FaFilter, FaCheck } from 'react-icons/fa';
import JobAnalytics from './JobAnalytics';
import ApplicationFlowCard from './ApplicationFlowCard';
import Button from './ui/button';

const ApplicationsList = ({ applications = [], stats = {}, onUpdateStatus, onBulkAccept }) => {
  const [minSkillMatch, setMinSkillMatch] = useState(70);
  const [showFilterControls, setShowFilterControls] = useState(false);

  const handleBulkAccept = () => {
    onBulkAccept(minSkillMatch);
  };

  // Add debugging logs
  console.log('Applications received:', applications);
  console.log('Stats received:', stats);

  // Ensure applications is always an array
  const applicationsArray = Array.isArray(applications) ? applications : [];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Applications</h3>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilterControls(!showFilterControls)}
            className="flex items-center gap-2"
          >
            <FaFilter /> Filter
          </Button>
          <Button
            variant="success"
            onClick={handleBulkAccept}
            className="flex items-center gap-2"
          >
            <FaCheck /> Bulk Accept ({minSkillMatch}%+ Match)
          </Button>
        </div>
      </div>

      {showFilterControls && (
        <div className="mb-6 p-4 bg-white/5 rounded-lg">
          <label className="block text-white mb-2">
            Minimum Skill Match Percentage
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={minSkillMatch}
            onChange={(e) => setMinSkillMatch(e.target.value)}
            className="w-full"
          />
          <div className="text-white mt-2">
            Current: {minSkillMatch}%
          </div>
        </div>
      )}
      
      <JobAnalytics stats={stats} />
      
      {applicationsArray.length === 0 ? (
        <p className="text-gray-300 text-center">No applications yet</p>
      ) : (
        <div className="space-y-6">
          {applicationsArray.map((app) => (
            <div key={app._id} className="bg-white/5 rounded-lg p-4">
              <ApplicationFlowCard
                key={app._id}
                application={app}
                onUpdateStatus={onUpdateStatus}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsList;
