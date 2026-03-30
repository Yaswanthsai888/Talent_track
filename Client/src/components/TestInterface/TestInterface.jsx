import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Paper, 
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField
} from '@mui/material';
import CodeEditor from '@uiw/react-textarea-code-editor';
import Countdown from 'react-countdown';

const TestInterface = ({ testId }) => {
  const [test, setTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [testAttemptId, setTestAttemptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch test details and start attempt
  useEffect(() => {
    const startTestAttempt = async () => {
      try {
        const response = await axios.post(`/api/tests/${testId}/start`);
        setTestAttemptId(response.data.data.attemptId);
        setTest(response.data.data.test);
        setTimeRemaining(response.data.data.test.timeLimit * 60 * 1000);
      } catch (error) {
        console.error('Failed to start test', error);
      }
    };

    startTestAttempt();
  }, [testId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const renderQuestionInput = (question) => {
    switch (question.type) {
      case 'mcq':
        return (
          <RadioGroup
            value={answers[question._id] || ''}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
          >
            {question.content.options.map((option) => (
              <FormControlLabel
                key={option.text}
                value={option.text}
                control={<Radio />}
                label={option.text}
              />
            ))}
          </RadioGroup>
        );
      
      case 'coding':
        return (
          <CodeEditor
            value={answers[question._id] || ''}
            language={question.content.language || 'python'}
            placeholder="Write your code here..."
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            padding={15}
            style={{
              fontSize: 12,
              backgroundColor: "#f4f4f4",
              fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
            }}
          />
        );
      
      case 'subjective':
        return (
          <TextField
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={answers[question._id] || ''}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            placeholder="Write your answer here..."
          />
        );
      
      default:
        return <Typography>Unsupported question type</Typography>;
    }
  };

  const submitTest = async () => {
    setIsSubmitting(true);
    try {
      const preparedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        selectedOptions: Array.isArray(answer) ? answer : [answer],
        submittedCode: answer,
        submittedText: answer
      }));

      const response = await axios.post('/api/tests/submit', {
        attemptId: testAttemptId,
        answers: preparedAnswers
      });

      // Handle test submission result
      console.log('Test Result:', response.data);
    } catch (error) {
      console.error('Test submission failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateQuestion = (direction) => {
    setCurrentQuestionIndex(prev => 
      direction === 'next' 
        ? Math.min(prev + 1, test.questions.length - 1)
        : Math.max(prev - 1, 0)
    );
  };

  if (!test) return <CircularProgress />;

  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h5">{test.title}</Typography>
          <Countdown 
            date={Date.now() + timeRemaining}
            renderer={({ hours, minutes, seconds }) => (
              <Typography color="error">
                {hours}:{minutes}:{seconds}
              </Typography>
            )}
            onComplete={submitTest}
          />
        </Box>

        <Typography variant="subtitle1" mb={2}>
          Question {currentQuestionIndex + 1} of {test.questions.length}
        </Typography>

        <Typography variant="body1" mb={2}>
          {currentQuestion.content.question}
        </Typography>

        {renderQuestionInput(currentQuestion)}

        <Grid container spacing={2} mt={2}>
          <Grid item xs={6}>
            <Button 
              variant="outlined" 
              disabled={currentQuestionIndex === 0}
              onClick={() => navigateQuestion('prev')}
            >
              Previous
            </Button>
          </Grid>
          <Grid item xs={6} textAlign="right">
            {currentQuestionIndex === test.questions.length - 1 ? (
              <Button 
                variant="contained" 
                color="primary"
                disabled={isSubmitting}
                onClick={submitTest}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Submit Test'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigateQuestion('next')}
              >
                Next
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default TestInterface;
