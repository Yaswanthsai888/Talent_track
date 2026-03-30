import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

const RealTimeEvaluation = ({ testId, answerId }) => {
  const [feedback, setFeedback] = useState(null);
  const evaluationStatus = useSelector(state => state.test.evaluationStatus);
  const score = useSelector(state => state.test.score);

  useEffect(() => {
    if (evaluationStatus === 'completed' && score) {
      setFeedback({
        status: 'success',
        message: `Score: ${score.total}%`,
        details: score.individual[answerId]
      });
    } else if (evaluationStatus === 'failed') {
      setFeedback({
        status: 'error',
        message: 'Evaluation failed. Please try again.'
      });
    }
  }, [evaluationStatus, score, answerId]);

  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`evaluation-feedback ${feedback.status}`}
        >
          <p>{feedback.message}</p>
          {feedback.details && (
            <div className="feedback-details">
              <p>Question Score: {feedback.details.score}/{feedback.details.maxScore}</p>
              <p>{feedback.details.feedback}</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RealTimeEvaluation;
