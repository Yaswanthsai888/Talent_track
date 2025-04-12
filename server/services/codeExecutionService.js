const Docker = require('dockerode');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

class CodeExecutionService {
  constructor() {
    this.docker = new Docker();
    this.tempDir = path.join(__dirname, '../temp');
    this.maxExecutionTime = 5000; // 5 seconds
    this.maxMemory = '100m'; // 100MB
    this.allowedLanguages = {
      javascript: {
        image: 'node:18',
        command: ['node', '/app/code.js'],
        extension: '.js'
      },
      python: {
        image: 'python:3.9',
        command: ['python', '/app/code.py'],
        extension: '.py'
      },
      java: {
        image: 'openjdk:11',
        command: ['java', '-cp', '/app', 'Main'],
        extension: '.java'
      }
    };
  }

  async ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async createTempFile(code, language) {
    await this.ensureTempDir();
    const extension = this.allowedLanguages[language].extension;
    const fileName = `code-${Date.now()}${extension}`;
    const filePath = path.join(this.tempDir, fileName);
    await writeFile(filePath, code);
    return filePath;
  }

  async executeCode(code, language, input) {
    try {
      const config = this.allowedLanguages[language];
      if (!config) {
        throw new Error('Unsupported programming language');
      }

      const filePath = await this.createTempFile(code, language);
      const containerName = `code-exec-${Date.now()}`;

      const container = await this.docker.createContainer({
        Image: config.image,
        Cmd: config.command,
        HostConfig: {
          Memory: this.maxMemory,
          NetworkMode: 'none',
          ReadOnly: true,
          Binds: [`${filePath}:/app/code${config.extension}`]
        },
        name: containerName
      });

      await container.start();

      const timeout = setTimeout(async () => {
        try {
          await container.stop();
          await container.remove();
          await unlink(filePath);
        } catch (error) {
          console.error('Error cleaning up timed out container:', error);
        }
      }, this.maxExecutionTime);

      const result = await container.wait();
      clearTimeout(timeout);

      const logs = await container.logs({
        stdout: true,
        stderr: true
      });

      await container.remove();
      await unlink(filePath);

      return {
        success: result.StatusCode === 0,
        output: logs.toString(),
        error: result.StatusCode !== 0 ? 'Execution failed' : null
      };
    } catch (error) {
      console.error('Code execution error:', error);
      return {
        success: false,
        output: null,
        error: error.message
      };
    }
  }

  async runTestCases(code, language, testCases) {
    const results = [];
    let totalScore = 0;
    let passedCount = 0;

    for (const testCase of testCases) {
      const result = await this.executeCode(code, language, testCase.input);
      
      const isCorrect = result.success && 
        result.output.trim() === testCase.expectedOutput.trim();
      
      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.output,
        success: isCorrect,
        error: result.error
      });

      if (isCorrect) {
        totalScore += testCase.marks;
        passedCount++;
      }
    }

    return {
      results,
      totalScore,
      passedCount,
      totalTestCases: testCases.length
    };
  }

  calculateScore(testResults) {
    return {
      score: testResults.totalScore,
      percentage: (testResults.passedCount / testResults.totalTestCases) * 100,
      passed: testResults.passedCount === testResults.totalTestCases
    };
  }
}

module.exports = new CodeExecutionService(); 