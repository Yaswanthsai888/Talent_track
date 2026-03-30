const mongoose = require('mongoose');
const Test = require('../models/Test');
const Question = require('../models/Question');
const UserTestAttempt = require('../models/UserTestAttempt');

class TestEvaluationService {
    // Evaluate a user's test attempt
    static async evaluateTestAttempt(testAttemptId) {
        const testAttempt = await UserTestAttempt.findById(testAttemptId)
            .populate('test')
            .populate('questions.question');

        if (!testAttempt) {
            throw new Error('Test attempt not found');
        }

        let totalScore = 0;
        let maxPossibleScore = 0;
        const detailedResults = [];

        for (const questionAttempt of testAttempt.questions) {
            const question = questionAttempt.question;
            let questionScore = 0;
            let questionMaxScore = question.maxScore;

            maxPossibleScore += questionMaxScore;

            switch (question.type) {
                case 'mcq':
                    questionScore = this.evaluateMCQ(question, questionAttempt);
                    break;
                case 'coding':
                    questionScore = await this.evaluateCodingQuestion(question, questionAttempt);
                    break;
                case 'true_false':
                    questionScore = this.evaluateTrueFalse(question, questionAttempt);
                    break;
                case 'subjective':
                    questionScore = await this.evaluateSubjective(question, questionAttempt);
                    break;
            }

            totalScore += questionScore;

            detailedResults.push({
                questionId: question._id,
                type: question.type,
                maxScore: questionMaxScore,
                obtainedScore: questionScore
            });
        }

        // Calculate percentage and determine pass/fail
        const scorePercentage = (totalScore / maxPossibleScore) * 100;
        const isPassed = scorePercentage >= testAttempt.test.passingCriteria.minScore;

        // Update test attempt
        testAttempt.totalScore = totalScore;
        testAttempt.maxPossibleScore = maxPossibleScore;
        testAttempt.scorePercentage = scorePercentage;
        testAttempt.isPassed = isPassed;
        testAttempt.detailedResults = detailedResults;

        await testAttempt.save();

        return {
            totalScore,
            maxPossibleScore,
            scorePercentage,
            isPassed,
            detailedResults
        };
    }

    // Evaluate Multiple Choice Questions
    static evaluateMCQ(question, questionAttempt) {
        const correctOptions = question.content.options
            .filter(opt => opt.isCorrect)
            .map(opt => opt.text);

        const userSelectedOptions = questionAttempt.selectedOptions;

        // Exact match
        if (JSON.stringify(correctOptions.sort()) === JSON.stringify(userSelectedOptions.sort())) {
            return question.maxScore;
        }

        // Partial scoring logic
        const correctCount = userSelectedOptions.filter(opt => 
            correctOptions.includes(opt)
        ).length;

        const incorrectCount = userSelectedOptions.filter(opt => 
            !correctOptions.includes(opt)
        ).length;

        // Implement negative marking if configured
        const negativeMarkingFactor = questionAttempt.test.testConfig.negativeMarkingFactor || 0.25;
        const partialScore = (correctCount / correctOptions.length) * question.maxScore;
        const negativeScore = incorrectCount * (negativeMarkingFactor * question.maxScore);

        return Math.max(0, partialScore - negativeScore);
    }

    // Evaluate Coding Questions
    static async evaluateCodingQuestion(question, questionAttempt) {
        const userCode = questionAttempt.submittedCode;
        let totalScore = 0;

        for (const testCase of question.content.testCases) {
            try {
                // In a real-world scenario, this would use a secure code execution service
                const result = await this.runCodeTestCase(userCode, testCase);
                
                if (result.passed) {
                    totalScore += testCase.points || 1;
                }
            } catch (error) {
                // Handle execution errors
                console.error('Test case execution error:', error);
            }
        }

        // Normalize score
        return Math.min(totalScore, question.maxScore);
    }

    // Placeholder for code execution (would be replaced by actual code runner)
    static async runCodeTestCase(code, testCase) {
        // Simulated code execution
        // In production, this would use a secure sandboxed environment
        return {
            passed: code.includes(testCase.expectedOutput),
            output: testCase.expectedOutput
        };
    }

    // Evaluate True/False Questions
    static evaluateTrueFalse(question, questionAttempt) {
        const correctAnswer = question.content.options.find(opt => opt.isCorrect).text;
        const userAnswer = questionAttempt.selectedOptions[0];

        return correctAnswer === userAnswer ? question.maxScore : 0;
    }

    // Evaluate Subjective Questions (AI-assisted)
    static async evaluateSubjective(question, questionAttempt) {
        const userResponse = questionAttempt.submittedText;

        // In a real-world scenario, this would use an AI service for evaluation
        const aiEvaluationScore = await this.aiEvaluateSubjectiveResponse(
            userResponse, 
            question.content.question
        );

        return Math.min(aiEvaluationScore, question.maxScore);
    }

    // Placeholder for AI-assisted subjective evaluation
    static async aiEvaluateSubjectiveResponse(response, question) {
        // Simulated AI evaluation
        // In production, this would call an external AI service
        const responseLength = response.length;
        const maxScore = 10;

        // Basic heuristics
        if (responseLength < 50) return 2;
        if (responseLength < 100) return 5;
        if (responseLength < 200) return 7;
        return maxScore;
    }

    // Generate detailed performance insights
    static generatePerformanceInsights(testAttempt) {
        const weakAreas = testAttempt.detailedResults
            .filter(result => result.obtainedScore / result.maxScore < 0.5)
            .map(result => ({
                questionId: result.questionId,
                scorePercentage: (result.obtainedScore / result.maxScore) * 100
            }));

        return {
            overallPerformance: testAttempt.scorePercentage,
            weakAreas,
            timeSpent: testAttempt.timeSpent,
            recommendedStudyAreas: weakAreas.map(area => 
                `Improve performance in question ${area.questionId}`
            )
        };
    }
}

module.exports = TestEvaluationService;
