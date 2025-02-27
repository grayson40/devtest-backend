/**
 * Selector types in order of preference
 */
const SelectorTypes = {
  ID: 'id',
  ROLE_TEXT: 'role-text',
  BUTTON_TEXT: 'button-text',
  LINK_TEXT: 'link-text',
  INPUT_LABEL: 'input-label',
  CLASS_NAME: 'class-name',
};

/**
 * Generate a selector based on the action type and target text
 * @param {string} actionType - The type of action being performed
 * @param {string} targetText - The text to create a selector for
 * @returns {string} The generated selector
 */
function generateSelector(actionType, targetText) {
  if (!targetText) return '';

  // Clean up the target text
  const cleanText = targetText.trim().replace(/["']/g, '');

  switch (actionType) {
    case 'click':
      return generateClickSelector(cleanText);
    case 'fill':
      return generateInputSelector(cleanText);
    case 'upload':
      return 'input[type="file"]';
    default:
      return `text="${cleanText}"`;
  }
}

/**
 * Generate a selector for click actions
 * @param {string} text - The text to create a selector for
 * @returns {string} The generated selector
 */
function generateClickSelector(text) {
  const lowerText = text.toLowerCase();

  // Handle text field clicks
  if (lowerText.includes('text field')) {
    return 'input[type="text"]';
  }

  // Handle password field clicks
  if (lowerText.includes('password field')) {
    return 'input[type="password"]';
  }

  // Handle email field clicks
  if (lowerText.includes('email field')) {
    return 'input[type="email"]';
  }

  // Handle number field clicks
  if (lowerText.includes('number field')) {
    return 'input[type="number"]';
  }

  // Try to identify if it's a button
  if (
    lowerText.includes('button') ||
    text.match(/confirm|submit|save|cancel|ok|yes|no|log\s*in/i)
  ) {
    return `button:has-text("${text}")`;
  }

  // Check if it might be a link
  if (text.match(/^https?:\/\//) || lowerText.includes('link')) {
    return `a:has-text("${text}")`;
  }

  // Handle generic field clicks
  if (lowerText.includes('field')) {
    const fieldType = lowerText.match(/(\w+)\s+field/);
    if (fieldType) {
      return `input[type="${fieldType[1]}"]`;
    }
    return 'input, textarea, select';
  }

  // Generic text selector as fallback
  return `text="${text}"`;
}

/**
 * Generate a selector for input fields
 * @param {string} label - The label text for the input
 * @returns {string} The generated selector
 */
function generateInputSelector(label) {
  const lowerLabel = label.toLowerCase();

  // For password fields
  if (lowerLabel.includes('password')) {
    return 'input[type="password"]';
  }

  // For email fields
  if (lowerLabel.includes('email')) {
    return 'input[type="email"]';
  }

  // For number fields
  if (lowerLabel.includes('number')) {
    return 'input[type="number"]';
  }

  // For text fields
  return `[aria-label="${label}"], input[placeholder="${label}"], textarea[placeholder="${label}"], input[type="text"]`;
}

/**
 * Optimize a selector by making it more specific or reliable
 * @param {string} selector - The initial selector
 * @param {string} actionType - The type of action being performed
 * @returns {string} The optimized selector
 */
function optimizeSelector(selector, actionType) {
  if (!selector) return '';

  // Remove any trailing periods or whitespace
  selector = selector.trim().replace(/\.$/, '');

  // Handle specific action types
  switch (actionType) {
    case 'click':
      // Make button selectors more specific
      if (selector.startsWith('button')) {
        return `${selector}, button:has(${selector})`;
      }
      // Make input selectors more specific
      if (selector.includes('input')) {
        return selector;
      }
      break;
    case 'fill':
      // Make input selectors more reliable
      if (selector.includes('input')) {
        return selector;
      }
      break;
  }

  return selector;
}

module.exports = {
  SelectorTypes,
  generateSelector,
  optimizeSelector,
};
