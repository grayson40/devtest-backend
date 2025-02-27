const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');
const TestCase = require('../../models/testCase');

class PlaywrightGenerator {
  constructor() {
    this.testsDir = path.join(process.cwd(), 'generated-tests');
  }

  async generateTest(testCase) {
    try {
      // Ensure tests directory exists
      await fs.mkdir(this.testsDir, { recursive: true });

      const testContent = this.generateTestContent(testCase);
      const fileName = `${testCase.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${testCase._id}.spec.js`;
      const filePath = path.join(this.testsDir, fileName);

      // Ensure the directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write the test file
      await fs.writeFile(filePath, testContent, 'utf8');
      
      // Update test case with generated file path
      await TestCase.findByIdAndUpdate(testCase._id, {
        playwrightTestPath: filePath
      });

      logger.info(`Generated Playwright test at ${filePath}`, {
        testId: testCase._id,
        filePath
      });

      return filePath;
    } catch (error) {
      logger.error('Error generating Playwright test', {
        testId: testCase._id,
        error: error.stack
      });
      throw error;
    }
  }

  generateTestContent(testCase) {
    const steps = this.generateSteps(testCase.steps);
    
    return `const { test, expect } = require('@playwright/test');

test('${testCase.title}', async ({ page }) => {
  // Test setup
  await page.goto('${testCase.baseUrl || 'http://localhost:3000'}');

${steps}
});`;
  }

  generateSteps(steps) {
    if (!Array.isArray(steps)) {
      logger.warn('Steps is not an array', { steps });
      return '  // No steps provided';
    }

    return steps.map(step => {
      try {
        switch (step.action.toLowerCase()) {
          case 'click':
            return `  await page.click('${step.selector}'); // ${step.description}`;
          case 'fill':
          case 'type':
            return `  await page.fill('${step.selector}', '${step.value}'); // ${step.description}`;
          case 'goto':
          case 'navigate':
            return `  await page.goto('${step.value}'); // ${step.description}`;
          case 'wait':
            return `  await page.waitForSelector('${step.selector}'); // ${step.description}`;
          case 'assert':
            return this.generateAssertion(step);
          case 'view':
            return `  // Viewport action: ${step.description}`;
          default:
            return `  // Unsupported action: ${step.action} - ${step.description}`;
        }
      } catch (error) {
        logger.error('Error generating step', { step, error: error.message });
        return `  // Error generating step: ${error.message}`;
      }
    }).join('\n');
  }

  generateAssertion(step) {
    const selector = step.selector || '';
    const value = step.value || '';
    
    if (!selector) {
      return `  // Missing selector for assertion: ${step.description}`;
    }

    return `  await expect(page.locator('${selector}')).toBeVisible(); // ${step.description}`;
  }
}

module.exports = new PlaywrightGenerator(); 