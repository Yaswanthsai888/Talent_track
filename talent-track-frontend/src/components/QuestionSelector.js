import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';
import axiosInstance from '../config/axios';
import { toast } from 'react-toastify';

const QuestionSelector = ({ 
  type, 
  onSelect, 
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
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await axiosInstance.get(`/questions?${params}`);
      if (response.data?.questions) {
        const mappedQuestions = response.data.questions.map(q => ({
          ...q,
          type: q.type === 'Multiple Choice' ? 'aptitude' : 'coding'
        }));
        setQuestions(mappedQuestions);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setQuestions([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
      setQuestions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [type, page, filters]);

  useEffect(() => {
    fetchQuestions();
  }, [type, filters, page, fetchQuestions]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleQuestionSelect = (question) => {
    if (!question || !question._id) return;
    
    if (selectedQuestions.length >= maxQuestions) {
      toast.warning(`Maximum ${maxQuestions} questions allowed`);
      return;
    }

    if (!selectedQuestions.find(q => q._id === question._id)) {
      const questionWithType = {
        ...question,
        type: question.type === 'Multiple Choice' ? 'aptitude' : 'coding'
      };
      onSelect([...selectedQuestions, questionWithType]);
    }
  };

  const handleQuestionRemove = (questionId) => {
    onSelect(selectedQuestions.filter(q => q._id !== questionId));
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
              <option value="Numerical Reasoning">Numerical Reasoning</option>
              <option value="Logical Reasoning">Logical Reasoning</option>
              <option value="Verbal Ability">Verbal Ability</option>
            </>
          ) : (
            <>
              <option value="Arrays">Arrays</option>
              <option value="Strings">Strings</option>
              <option value="Dynamic Programming">Dynamic Programming</option>
              <option value="Algorithms">Algorithms</option>
            </>
          )}
        </select>
      </div>

      {/* Selected Questions */}
      <div className="space-y-2">
        <h3 className="font-semibold">Selected Questions ({selectedQuestions.length}/{maxQuestions})</h3>
        <div className="space-y-2">
          {selectedQuestions.map(question => (
            <div key={question._id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
              <span className="truncate flex-1 mr-2">{question.content}</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                  {question.difficulty}
                </span>
                <button
                  onClick={() => handleQuestionRemove(question._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-2">
        <h3 className="font-semibold">Available Questions</h3>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No questions found</div>
        ) : (
          <div className="space-y-2">
            {questions.map(question => (
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
                {type === 'aptitude' && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {question.options.map((option, idx) => (
                      <div 
                        key={idx}
                        className={`p-2 text-sm border rounded ${option.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
                      >
                        {option.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
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