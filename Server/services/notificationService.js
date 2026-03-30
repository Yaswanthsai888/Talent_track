const nodemailer = require('nodemailer');
const { emailConfig } = require('../config');

const transporter = nodemailer.createTransport(emailConfig);

const sendTestResult = async (userId, testId, result) => {
  const user = await User.findById(userId);
  const test = await Test.findById(testId);

  await transporter.sendMail({
    to: user.email,
    subject: `Test Results: ${test.title}`,
    html: `
      <h2>Your Test Results</h2>
      <p>Score: ${result.score.total}%</p>
      <p>Time Taken: ${result.timeTaken} minutes</p>
      ${result.selectedForNextRound ? '<p>Congratulations! You have been selected for the next round.</p>' : ''}
    `
  });
};

module.exports = {
  sendTestResult
};
