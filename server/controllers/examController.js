const queueService = require('../services/queueService');
const { logger } = require('../middleware/logger');

exports.submitExam = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const userId = req.user.id; // Assuming user ID is available in request
    
    // Add job to queue
    const job = await queueService.addExamProcessingJob({
      examId,
      userId,
      answers
    });

    // Return job ID for status tracking
    res.status(202).json({
      message: 'Exam submission accepted for processing',
      jobId: job.id
    });
  } catch (error) {
    logger.error('Exam submission failed:', error);
    res.status(500).json({
      message: 'Failed to process exam submission',
      error: error.message
    });
  }
};

exports.getExamStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await queueService.getJobStatus(jobId, 'exam-processing');
    
    if (!status) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    res.json(status);
  } catch (error) {
    logger.error('Failed to get exam status:', error);
    res.status(500).json({
      message: 'Failed to get exam status',
      error: error.message
    });
  }
}; 