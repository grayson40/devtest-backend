/**
 * Generate the base test file content
 * @param {string} title - Test case title
 * @param {string} description - Test case description
 * @returns {string} Base test file content
 */
function generateBaseTest(title, description = '') {
  return `import { test, expect } from '@playwright/test';

/**
 * ${title}
 * ${description ? '\n * ' + description : ''}
 */
test('${escapeString(title)}', async ({ page }) => {
  // Test steps will be inserted here
});`;
}

/**
 * Generate step comment
 * @param {Object} step - Test step object
 * @returns {string} Step comment
 */
function generateStepComment(step) {
  return `  // Step ${step.number}: ${escapeString(step.description)}`;
}

/**
 * Generate action code for a step
 * @param {Object} step - Test step object
 * @returns {string} Action code
 */
function generateStepAction(step) {
  switch (step.action) {
    case 'goto':
      return `  await page.goto('${escapeString(step.value)}');`;

    case 'click':
      return `  await page.click('${escapeString(step.selector)}');`;

    case 'fill':
      return `  await page.fill('${escapeString(step.selector)}', '${escapeString(step.value)}');`;

    case 'wait':
      return `  await page.waitForTimeout(${parseInt(step.value) || 1000});`;

    case 'assert':
      if (step.value && step.selector) {
        return `  await expect(page.locator('${escapeString(step.selector)}')).toHaveText('${escapeString(step.value)}');`;
      }
      return `  await expect(page.locator('${escapeString(step.selector)}')).toBeVisible();`;

    case 'view':
      // For view actions, we'll add a wait for visibility
      return `  await expect(page.getByText('${escapeString(step.value)}')).toBeVisible();`;

    default:
      return `  // Unsupported action: ${step.action}`;
  }
}

/**
 * Generate screenshot capture code
 * @param {number} stepNumber - Step number
 * @returns {string} Screenshot code
 */
function generateScreenshotCapture(stepNumber) {
  return `  await page.screenshot({ path: 'screenshots/step-${stepNumber}.png' });`;
}

/**
 * Escape special characters in strings
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeString(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

module.exports = {
  generateBaseTest,
  generateStepComment,
  generateStepAction,
  generateScreenshotCapture,
  escapeString,
};
