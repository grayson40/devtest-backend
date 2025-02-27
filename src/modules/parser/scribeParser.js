const { JSDOM } = require('jsdom');
const { detectAction } = require('./utils/actionDetector');
const { generateSelector, optimizeSelector } = require('./utils/selectorExtractor');

class ScribeParser {
  /**
   * Parse Scribe HTML content into a structured test case
   * @param {string} htmlContent - The HTML content from Scribe
   * @returns {Object} Parsed test case data
   */
  static parse(htmlContent) {
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    return {
      title: this.extractTitle(document),
      steps: this.extractSteps(document),
    };
  }

  /**
   * Extract the title from the document
   * @param {Document} document - The DOM document
   * @returns {string} The extracted title
   */
  static extractTitle(document) {
    const titleElement = document.querySelector('.scribe-title');
    return titleElement ? titleElement.textContent.trim() : 'Untitled Test';
  }

  /**
   * Extract all steps from the document
   * @param {Document} document - The DOM document
   * @returns {Array} Array of parsed steps
   */
  static extractSteps(document) {
    const steps = [];
    const stepElements = document.querySelectorAll('.scribe-step');
    let lastClickedSelector = null;

    stepElements.forEach((stepEl, index) => {
      const step = this.parseStep(stepEl, index + 1, lastClickedSelector);

      // Get screenshot from the next element
      const screenshotContainer = stepEl.nextElementSibling;
      if (
        screenshotContainer &&
        screenshotContainer.classList.contains('scribe-screenshot-container')
      ) {
        const screenshotEl = screenshotContainer.querySelector('.scribe-screenshot');
        if (screenshotEl) {
          step.screenshotUrl = screenshotEl.getAttribute('src');
        }
      }

      // Store the selector if this was a click on a field
      if (
        step.action === 'click' &&
        step.selector &&
        (step.selector.toLowerCase().includes('field') ||
          step.description.toLowerCase().includes('field'))
      ) {
        lastClickedSelector = step.selector;
      }

      // If this is a type action without a selector, use the last clicked selector
      if (step.action === 'fill' && !step.selector && lastClickedSelector) {
        step.selector = lastClickedSelector;
      }

      steps.push(step);
    });

    return steps;
  }

  /**
   * Parse a single step element
   * @param {Element} stepElement - The step DOM element
   * @param {number} stepNumber - The step number
   * @param {string} lastClickedSelector - The selector from the last click action
   * @returns {Object} Parsed step data
   */
  static parseStep(stepElement, stepNumber, lastClickedSelector) {
    const stepText = stepElement.querySelector('.scribe-step-text')?.textContent.trim() || '';

    // Remove the step number prefix if present
    const cleanStepText = stepText.replace(/^\d+\.\s*/, '');

    // Detect the action and generate appropriate selector
    const action = detectAction(cleanStepText);

    // If this is a type action without a selector, use the last clicked selector
    if (action.type === 'fill' && !action.selector && lastClickedSelector) {
      action.selector = lastClickedSelector;
    }

    // Optimize the selector based on the action type
    if (action.selector) {
      action.selector = optimizeSelector(action.selector, action.type);
    }

    return {
      number: stepNumber,
      description: cleanStepText,
      action: action.type,
      selector: action.selector,
      value: action.value,
      screenshotUrl: null, // Will be filled later
    };
  }

  /**
   * Validate the parsed test case
   * @param {Object} testCase - The parsed test case
   * @returns {Object} Validation result with success flag and errors
   */
  static validate(testCase) {
    const errors = [];

    if (!testCase.title) {
      errors.push('Test case must have a title');
    }

    if (!Array.isArray(testCase.steps) || testCase.steps.length === 0) {
      errors.push('Test case must have at least one step');
    }

    testCase.steps.forEach((step, index) => {
      if (!step.description) {
        errors.push(`Step ${index + 1} must have a description`);
      }
      if (step.action === 'unknown' && !step.description.toLowerCase().includes('view')) {
        errors.push(`Step ${index + 1} has an unknown action type`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = ScribeParser;
