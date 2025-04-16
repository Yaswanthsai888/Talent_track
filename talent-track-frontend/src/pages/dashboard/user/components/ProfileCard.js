import React from 'react';

const ProfileCard = ({ userData }) => {
  return (
    <div className="bg-blue-50 p-6 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Your Profile</h3>
      <p className="text-gray-600">Complete your profile to increase visibility</p>
    </div>
  );
};

export default ProfileCard;
