/**
 * Action types supported by the parser
 */
const ActionTypes = {
  NAVIGATE: 'goto',
  CLICK: 'click',
  TYPE: 'fill',
  UPLOAD: 'upload',
  WAIT: 'wait',
  ASSERT: 'assert',
  VIEW: 'view',
};

/**
 * Patterns to match different types of actions in step text
 */
const ActionPatterns = {
  NAVIGATE: /Navigate to\s+["']?([^"'\s]+)["']?/i,
  CLICK: /Click\s+(?:the\s+|this\s+)?(.+?)(?:\s*\.|$)/i,
  TYPE: /Type\s+["']([^"']+)["']/i,
  UPLOAD: /Upload\s+(?:the\s+)?["']?([^"']+?)["']?\s*(?:file|spreadsheet)?/i,
  CONFIRM: /Confirm\s+(?:the\s+)?["']?([^"']+?)["']?/i,
  VIEW: /View\s+([^"']+)/i,
  FIELD: /(?:text|password|email|number)\s+field/i,
};

/**
 * Extract action information from step text
 * @param {string} stepText - The text describing the step
 * @returns {Object} Action information containing type, selector, and value
 */
function detectAction(stepText) {
  // Default action structure
  const action = {
    type: 'unknown',
    selector: '',
    value: '',
  };

  // Check for navigation
  const navigateMatch = stepText.match(ActionPatterns.NAVIGATE);
  if (navigateMatch) {
    action.type = ActionTypes.NAVIGATE;
    action.value = navigateMatch[1];
    return action;
  }

  // Check for type actions (must check before click because of field clicks)
  const typeMatch = stepText.match(ActionPatterns.TYPE);
  if (typeMatch) {
    action.type = ActionTypes.TYPE;
    action.value = typeMatch[1];
    // For type actions without explicit field reference, use the previous step's selector
    return action;
  }

  // Check for click actions
  const clickMatch = stepText.match(ActionPatterns.CLICK);
  if (clickMatch) {
    action.type = ActionTypes.CLICK;
    const clickTarget = clickMatch[1].trim();

    // Check if this is a field click
    const fieldMatch = clickTarget.match(ActionPatterns.FIELD);
    if (fieldMatch) {
      const fieldType = fieldMatch[0].toLowerCase().includes('password') ? 'password' : 'text';
      action.selector = `input[type="${fieldType}"]`;
    } else {
      // Remove quotes if present
      action.selector = clickTarget.replace(/^["']|["']$/g, '');
    }
    return action;
  }

  // Check for upload actions
  const uploadMatch = stepText.match(ActionPatterns.UPLOAD);
  if (uploadMatch) {
    action.type = ActionTypes.UPLOAD;
    action.selector = 'input[type="file"]';
    action.value = uploadMatch[1];
    return action;
  }

  // Check for confirm actions (treated as clicks)
  const confirmMatch = stepText.match(ActionPatterns.CONFIRM);
  if (confirmMatch) {
    action.type = ActionTypes.CLICK;
    action.selector = confirmMatch[1];
    return action;
  }

  // Check for view actions
  const viewMatch = stepText.match(ActionPatterns.VIEW);
  if (viewMatch) {
    action.type = ActionTypes.VIEW;
    action.value = viewMatch[1];
    return action;
  }

  return action;
}

module.exports = {
  ActionTypes,
  ActionPatterns,
  detectAction,
}; 