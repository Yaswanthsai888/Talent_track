import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { toast } from 'react-toastify';
import AptitudeTest from '../components/AptitudeTest';
import CodingEnvironment from '../components/CodingEnvironment';
import ExamResults from '../components/ExamResults';

const ExamsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const startExam = useCallback(async (exam) => {
    try {
      if (!exam?.jobId) {
        throw new Error('Invalid exam data');
      }
      
      const response = await axiosInstance.post(`/exams/jobs/${exam.jobId}/exam/start`);
      if (response.data) {
        setCurrentAttempt(response.data);
        // Don't navigate, just update the state to show the appropriate test component
      } else {
        throw new Error('Invalid response data');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to start exam';
      toast.error(errorMessage);
      console.error('Error starting exam:', error);
      navigate('/'); // Redirect to home on error
    }
  }, [navigate]);

  const fetchExamByJobId = useCallback(async (jobId) => {
    try {
      const response = await axiosInstance.get(`/exams/jobs/${jobId}/exam`);
      if (response.data) {
        setSelectedExam(response.data);
        // Start the exam automatically
        startExam(response.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch exam';
      toast.error(errorMessage);
      console.error('Error fetching exam:', error);
      navigate('/'); // Redirect to home on error
    } finally {
      setLoading(false);
    }
  }, [navigate, startExam]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const jobId = params.get('jobId');
    
    if (jobId) {
      fetchExamByJobId(jobId);
    } else {
      fetchExams();
    }
  }, [location.search, fetchExamByJobId]);

  const fetchExams = async () => {
    try {
      await axiosInstance.get('/exams/available');
      setSelectedExam(null);
      setCurrentAttempt(null);
    } catch (error) {
      toast.error('Failed to fetch exams');
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAptitudeSubmit = async (answers, retryCount = 0) => {
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
      if (error.response?.status === 429 && retryCount < 3) {
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 32000);
        toast.info('Server busy. Retrying submission...');
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return handleAptitudeSubmit(answers, retryCount + 1);
      }
      toast.error('Failed to submit aptitude test');
      console.error('Error submitting aptitude test:', error);
    }
  };

  const handleCodingSubmit = async (solutions, retryCount = 0) => {
    try {
      const response = await axiosInstance.post(
        `/exams/jobs/${selectedExam.jobId}/exam/coding/submit`,
        { solutions }
      );
      setCurrentAttempt(response.data);
      setShowResults(true);
    } catch (error) {
      if (error.response?.status === 429 && retryCount < 3) {
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 32000);
        toast.info('Server busy. Retrying submission...');
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return handleCodingSubmit(solutions, retryCount + 1);
      }
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
          navigate('/');
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
            navigate('/');
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
            navigate('/');
          }}
        />
      );
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Exams</h1>
      {selectedExam ? (
        <div className="text-center">
          <p className="text-xl mb-4">Starting exam: {selectedExam.name}</p>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      ) : (
        <p className="text-center text-gray-600">No exams available at this time.</p>
      )}
    </div>
  );
};

export default ExamsPage;