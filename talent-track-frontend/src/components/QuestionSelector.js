import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import axiosInstance from '../config/axios';
import { toast } from 'react-toastify';

const QuestionSelector = ({ 
  type, 
  onQuestionsSelected, 
  selectedQuestions = [], 
  maxQuestions = 10 
}) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: '',
    category: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: type === 'aptitude' ? 'Multiple Choice' : 'Coding',
        page,
        limit: 10,
        ...filters
      });

      const response = await axiosInstance.get(`/questions?${params}`);
      setQuestions(response.data.questions || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to fetch questions');
      console.error('Error fetching questions:', error);
      setQuestions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [type, page, filters]);

  useEffect(() => {
    fetchQuestions();
  }, [type, filters, page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const handleQuestionSelect = (question) => {
    if (!question || !question._id) return;
    
    const currentSelected = Array.isArray(selectedQuestions) ? selectedQuestions : [];
    if (currentSelected.length >= maxQuestions) {
      toast.warning(`Maximum ${maxQuestions} questions allowed`);
      return;
    }

    if (!currentSelected.find(q => q._id === question._id)) {
      onQuestionsSelected([...currentSelected, question]);
    }
  };

  const handleQuestionRemove = (questionId) => {
    const currentSelected = Array.isArray(selectedQuestions) ? selectedQuestions : [];
    onQuestionsSelected(currentSelected.filter(q => q._id !== questionId));
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            name="search"
            placeholder="Search questions..."
            value={filters.search}
            onChange={handleFilterChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          name="difficulty"
          value={filters.difficulty}
          onChange={handleFilterChange}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {type === 'aptitude' ? (
            <>
              <option value="Verbal Reasoning">Verbal Reasoning</option>
              <option value="Logical Reasoning">Logical Reasoning</option>
              <option value="Quantitative">Quantitative</option>
            </>
          ) : (
            <>
              <option value="Algorithms">Algorithms</option>
              <option value="Data Structures">Data Structures</option>
              <option value="Problem Solving">Problem Solving</option>
            </>
          )}
        </select>
      </div>

      {/* Selected Questions */}
      <div className="space-y-2">
        <h3 className="font-semibold">Selected Questions ({selectedQuestions?.length || 0}/{maxQuestions})</h3>
        <div className="space-y-2">
          {Array.isArray(selectedQuestions) && selectedQuestions.map(question => (
            <div key={question._id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
              <span>{question.content}</span>
              <button
                onClick={() => handleQuestionRemove(question._id)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-2">
        <h3 className="font-semibold">Available Questions</h3>
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="space-y-2">
            {Array.isArray(questions) && questions.map(question => (
              <div
                key={question._id}
                className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => handleQuestionSelect(question)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{question.content}</h4>
                    <p className="text-sm text-gray-600">Category: {question.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      {question.difficulty}
                    </span>
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                      {question.points} points
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionSelector; 