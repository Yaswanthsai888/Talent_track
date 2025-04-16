import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/axiosInstance';
import { toast } from 'react-toastify';
import ExamModal from '../components/ExamModal';

const AdminExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await axiosInstance.get('/exams');
      setExams(response.data);
    } catch (error) {
      toast.error('Failed to fetch exams');
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (examData) => {
    try {
      await axiosInstance.post('/exams', examData);
      toast.success('Exam created successfully');
      setShowModal(false);
      fetchExams();
    } catch (error) {
      toast.error('Failed to create exam');
      console.error('Error creating exam:', error);
    }
  };

  const handleUpdateExam = async (examData) => {
    try {
      await axiosInstance.put(`/exams/${selectedExam._id}`, examData);
      toast.success('Exam updated successfully');
      setShowModal(false);
      setSelectedExam(null);
      fetchExams();
    } catch (error) {
      toast.error('Failed to update exam');
      console.error('Error updating exam:', error);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await axiosInstance.delete(`/exams/${examId}`);
        toast.success('Exam deleted successfully');
        fetchExams();
      } catch (error) {
        toast.error('Failed to delete exam');
        console.error('Error deleting exam:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Exam Management</h1>
        <button
          onClick={() => {
            setSelectedExam(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Exam
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <div
            key={exam._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold">{exam.name}</h2>
              <span className={`px-2 py-1 rounded-full text-sm ${
                exam.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {exam.status}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4">{exam.description}</p>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Exam Details:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Job: {exam.jobId}</li>
                <li>Duration: {exam.totalDuration} minutes</li>
                <li>Aptitude Questions: {exam.aptitudeRound.totalQuestions}</li>
                <li>Coding Problems: {exam.codingRound.totalProblems}</li>
                <li>Passing Criteria: {exam.passingCriteria}%</li>
              </ul>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setSelectedExam(exam);
                  setShowModal(true);
                }}
                className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteExam(exam._id)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <ExamModal
          exam={selectedExam}
          onClose={() => {
            setShowModal(false);
            setSelectedExam(null);
          }}
          onSubmit={selectedExam ? handleUpdateExam : handleCreateExam}
        />
      )}
    </div>
  );
};

export default AdminExamsPage; 