import React, { useState } from 'react';
import Button from './ui/button';

const ApplicationModal = ({ job, onClose, onSubmit }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(coverLetter);
      onClose();
    } catch (error) {
      console.error('Application submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-8 animate-fade-in-up">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">{job.title}</h2>
          <p className="text-xl text-gray-700 font-medium">{job.company}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="coverLetter" className="block text-lg font-semibold text-gray-800 mb-3">
              Cover Letter
            </label>
            <textarea
              id="coverLetter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-64 resize-none transition-all duration-200"
              placeholder="Write your cover letter here..."
              aria-describedby="coverLetterHelp"
              required
            />
            <p id="coverLetterHelp" className="mt-2 text-sm text-gray-500">
              Tell us why you're the perfect candidate for this position.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;
