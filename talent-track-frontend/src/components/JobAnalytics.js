import React from 'react';
import { FaUsers, FaClock, FaCheck, FaTimes } from 'react-icons/fa';

const JobAnalytics = ({ stats = {} }) => {
  const analyticsData = [
    {
      title: 'Total Applications',
      value: stats.total || 0,
      icon: FaUsers,
      color: 'bg-blue-500/20'
    },
    {
      title: 'Pending Review',
      value: stats.pending || 0,
      icon: FaClock,
      color: 'bg-yellow-500/20'
    },
    {
      title: 'Accepted',
      value: stats.accepted || 0,
      icon: FaCheck,
      color: 'bg-green-500/20'
    },
    {
      title: 'Rejected',
      value: stats.rejected || 0,
      icon: FaTimes,
      color: 'bg-red-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {analyticsData.map((item, index) => (
        <div key={index} className={`${item.color} p-4 rounded-lg`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-white/80">{item.title}</p>
              <p className="text-2xl font-bold text-white">{item.value}</p>
            </div>
            <item.icon className="text-white/50 text-3xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobAnalytics;
