import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { toast } from 'react-toastify';
import AptitudeTest from '../components/AptitudeTest';
import CodingEnvironment from '../components/CodingEnvironment';
import ExamResults from '../components/ExamResults';

const ExamsPage = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await axiosInstance.get('/exams/available');
      setExams(response.data);
    } catch (error) {
      toast.error('Failed to fetch exams');
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const startExam = async (exam) => {
    try {
      const response = await axiosInstance.post(`/exams/jobs/${exam.jobId}/exam/start`);
      setCurrentAttempt(response.data);
      setSelectedExam(exam);
    } catch (error) {
      toast.error('Failed to start exam');
      console.error('Error starting exam:', error);
    }
  };

  const handleAptitudeSubmit = async (answers) => {
    try {
      const response = await axiosInstance.post(
        `/exams/jobs/${selectedExam.jobId}/exam/aptitude/submit`,
        { answers }
      );
      setCurrentAttempt(response.data);
      
      if (response.data.aptitudeAttempt.status === 'completed' && 
          response.data.aptitudeAttempt.totalScore >= selectedExam.aptitudeRound.passingScore) {
        toast.success('Aptitude test passed! Proceeding to coding round.');
      } else {
        setShowResults(true);
        toast.error('Aptitude test failed. Please try again later.');
      }
    } catch (error) {
      toast.error('Failed to submit aptitude test');
      console.error('Error submitting aptitude test:', error);
    }
  };

  const handleCodingSubmit = async (solutions) => {
    try {
      const response = await axiosInstance.post(
        `/exams/jobs/${selectedExam.jobId}/exam/coding/submit`,
        { solutions }
      );
      setCurrentAttempt(response.data);
      setShowResults(true);
    } catch (error) {
      toast.error('Failed to submit coding test');
      console.error('Error submitting coding test:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (showResults && currentAttempt) {
    return (
      <ExamResults
        exam={selectedExam}
        attempt={currentAttempt}
        onBack={() => {
          setShowResults(false);
          setSelectedExam(null);
          setCurrentAttempt(null);
        }}
      />
    );
  }

  if (selectedExam && currentAttempt) {
    if (currentAttempt.aptitudeAttempt.status === 'completed' &&
        currentAttempt.aptitudeAttempt.totalScore >= selectedExam.aptitudeRound.passingScore &&
        currentAttempt.codingAttempt.status !== 'completed') {
      return (
        <CodingEnvironment
          exam={selectedExam}
          attempt={currentAttempt}
          onSubmit={handleCodingSubmit}
          onBack={() => {
            setSelectedExam(null);
            setCurrentAttempt(null);
          }}
        />
      );
    } else if (currentAttempt.aptitudeAttempt.status !== 'completed') {
      return (
        <AptitudeTest
          exam={selectedExam}
          attempt={currentAttempt}
          onSubmit={handleAptitudeSubmit}
          onBack={() => {
            setSelectedExam(null);
            setCurrentAttempt(null);
          }}
        />
      );
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Exams</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => (
          <div
            key={exam._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{exam.name}</h2>
            <p className="text-gray-600 mb-4">{exam.description}</p>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Exam Details:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Total Duration: {exam.totalDuration} minutes</li>
                <li>Aptitude Questions: {exam.aptitudeRound.totalQuestions}</li>
                <li>Coding Problems: {exam.codingRound.totalProblems}</li>
                <li>Passing Criteria: {exam.passingCriteria}%</li>
              </ul>
            </div>

            <button
              onClick={() => startExam(exam)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Start Exam
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamsPage; 