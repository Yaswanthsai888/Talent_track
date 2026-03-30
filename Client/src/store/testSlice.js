import { createSlice } from '@reduxjs/toolkit';

const testSlice = createSlice({
  name: 'test',
  initialState: {
    activeTest: null,
    answers: {},
    timeLeft: 0,
    isSaving: false,
    testList: [],
    loading: false,
    error: null,
    evaluationStatus: 'pending', // 'pending', 'evaluating', 'completed', 'failed'
    score: null,
    individualScores: {},
    evaluationError: null
  },
  reducers: {
    setActiveTest: (state, action) => {
      state.activeTest = action.payload;
      state.timeLeft = action.payload?.timeLimit * 60 || 0;
    },
    updateAnswer: (state, action) => {
      state.answers = {
        ...state.answers,
        [action.payload.questionId]: action.payload.answer
      };
    },
    setSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    decrementTimer: (state) => {
      if (state.timeLeft > 0) {
        state.timeLeft -= 1;
      }
    },
    setTests: (state, action) => {
      state.testList = action.payload;
    },
    setEvaluationStatus: (state, action) => {
      state.evaluationStatus = action.payload;
    },
    setScore: (state, action) => {
      state.score = action.payload.total;
      state.individualScores = action.payload.individual;
    },
    setEvaluationError: (state, action) => {
      state.evaluationError = action.payload;
      state.evaluationStatus = 'failed';
    }
  }
});

export const {
  setActiveTest,
  updateAnswer,
  setSaving,
  decrementTimer,
  setTests,
  setEvaluationStatus,
  setScore,
  setEvaluationError
} = testSlice.actions;

export default testSlice.reducer;
