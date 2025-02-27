# DevTest Backend Development Plan

## Week 1: Project Setup & HTML Parser

### Day 1-2: Project Initialization
- [ ] Set up Node.js project with Express
- [ ] Configure MongoDB connection with Mongoose
- [ ] Set up basic project structure
- [ ] Create initial models for TestCase, TestSequence, and TestRun
- [ ] Configure ESLint and Prettier
- [ ] Add logging system

### Day 3-4: HTML Parser Implementation
- [ ] Create parser module for Scribe HTML
- [ ] Build DOM processing logic to extract steps
- [ ] Implement action detection (click, navigate, fill)
- [ ] Add extraction of screenshot URLs
- [ ] Create selector extraction logic
- [ ] Build test cases for parser with sample Scribe HTML

### Day 5: API Foundations
- [ ] Set up Express router structure
- [ ] Implement basic CRUD endpoints for TestCase model
- [ ] Add error handling middleware
- [ ] Create validation middleware
- [ ] Add API documentation with Swagger

## Week 2: Test Generation & Basic API

### Day 1-2: Test Generator Implementation
- [ ] Create Playwright test generation module
- [ ] Implement template-based code generation
- [ ] Add support for different action types
- [ ] Build comment generation for readability
- [ ] Create test cases for generator with sample parsed data

### Day 3-4: API Expansion
- [ ] Complete TestCase API endpoints
- [ ] Implement TestSequence API endpoints
- [ ] Add endpoints for Environment management
- [ ] Create upload handler for Scribe HTML files
- [ ] Implement result storage endpoints

### Day 5: Testing & Refinement
- [ ] Write unit tests for all completed modules
- [ ] Set up integration tests for API endpoints
- [ ] Review and refine error handling
- [ ] Document API with examples
- [ ] Set up continuous integration

## Week 3: Test Runner Implementation

### Day 1-2: Playwright Integration
- [ ] Create Playwright runner module
- [ ] Implement test file generation from database
- [ ] Build execution environment configuration
- [ ] Add screenshot capture functionality
- [ ] Create result parsing and storage

### Day 3-4: Test Execution API
- [ ] Implement single test execution endpoint
- [ ] Add test sequence execution capability
- [ ] Create execution queue management
- [ ] Implement result retrieval endpoints
- [ ] Add execution logging

### Day 5: Browser & Environment Management
- [ ] Set up browser management for different environments
- [ ] Implement environment configuration storage
- [ ] Add environment selection for test execution
- [ ] Create clean environment teardown process
- [ ] Test execution in different environments

## Week 4: Test Sequence & State Management

### Day 1-2: Sequence Management
- [ ] Enhance TestSequence model with additional fields
- [ ] Implement sequence execution logic
- [ ] Add sequence validation
- [ ] Create sequence management endpoints
- [ ] Implement sequence result storage

### Day 3-4: State Management
- [ ] Create state passing mechanism between tests
- [ ] Implement variable extraction and storage
- [ ] Add variable injection into test code
- [ ] Create state visualization endpoints
- [ ] Test state passing with sample sequences

### Day 5: Error Handling & Recovery
- [ ] Enhance error reporting for failing tests
- [ ] Implement automatic retry logic
- [ ] Add test result diffing capabilities
- [ ] Create test run comparison endpoints
- [ ] Test failure scenarios and recovery

## Week 5: PractiTest Integration & Refinement

### Day 1-2: PractiTest API Integration
- [ ] Create PractiTest API client
- [ ] Implement test case export functionality
- [ ] Add result synchronization
- [ ] Build mapping between DevTest and PractiTest objects
- [ ] Test PractiTest integration

### Day 3-4: Performance Optimization
- [ ] Analyze and optimize parser performance
- [ ] Add caching for frequently used data
- [ ] Optimize test execution process
- [ ] Implement database query optimization
- [ ] Benchmark and document performance

### Day 5: Final Testing & Documentation
- [ ] Complete comprehensive testing
- [ ] Finalize API documentation
- [ ] Create developer documentation
- [ ] Add example usage scripts
- [ ] Prepare for frontend integration

## Implementation Details

### HTML Parser Module

```javascript
// src/modules/parser/scribeHtmlParser.js
const { JSDOM } = require('jsdom');

/**
 * Parse Scribe HTML content into structured test steps
 * @param {string} htmlContent - The HTML content from Scribe
 * @returns {Object} Parsed test data with title and steps
 */
function parseScribeHtml(htmlContent) {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;
  
  // Get title
  const title = document.querySelector('.scribe-title')?.textContent || 'Untitled Test';
  
  // Extract steps
  const stepElements = document.querySelectorAll('.scribe-step');
  const steps = [];
  
  stepElements.forEach((stepEl, index) => {
    // Get step text
    const stepText = stepEl.querySelector('.scribe-step-text')?.textContent || '';
    
    // Get screenshot if available
    const screenshotContainer = stepEl.nextElementSibling;
    const screenshotUrl = screenshotContainer?.querySelector('.scribe-screenshot')?.getAttribute('src') || null;
    
    // Parse the action from the text
    const actionInfo = extractActionFromText(stepText);
    
    steps.push({
      number: index + 1,
      description: stepText.trim(),
      ...actionInfo,
      screenshotUrl
    });
  });
  
  return {
    title,
    steps
  };
}

/**
 * Extract action type, selector and value from step text
 * @param {string} stepText - The text describing the step
 * @returns {Object} Action information
 */
function extractActionFromText(stepText) {
  let action = 'unknown';
  let selector = '';
  let value = '';
  
  if (stepText.includes('Navigate to')) {
    action = 'goto';
    const urlMatch = stepText.match(/Navigate to\s+([^\s]+)/);
    value = urlMatch ? urlMatch[1] : '';
  } 
  else if (stepText.includes('Click')) {
    action = 'click';
    const clickMatch = stepText.match(/Click\s+(?:the\s+)?["']([^"']+)["']/i);
    selector = clickMatch ? clickMatch[1] : 'element based on screenshot';
  }
  else if (stepText.includes('Type')) {
    action = 'fill';
    const typeMatch = stepText.match(/Type\s+["']([^"']+)["']\s+(?:in|into)\s+(?:the\s+)?["']([^"']+)["']/i);
    if (typeMatch) {
      value = typeMatch[1];
      selector = typeMatch[2];
    }
  }
  
  return { action, selector, value };
}

module.exports = { parseScribeHtml };
```

### Test Generator Module

```javascript
// src/modules/generator/playwrightGenerator.js

/**
 * Convert parsed Scribe data to Playwright test code
 * @param {Object} scribeData - Parsed Scribe data
 * @returns {string} Generated Playwright test code
 */
function generatePlaywrightTest(scribeData) {
  let testCode = `
import { test, expect } from '@playwright/test';

test('${escapeString(scribeData.title || "Test from Scribe")}', async ({ page }) => {
`;

  // Find the first navigation step to use as starting URL
  const firstNavStep = scribeData.steps.find(step => step.action === 'goto');
  if (firstNavStep && firstNavStep.value) {
    testCode += `  await page.goto('${escapeString(firstNavStep.value)}');\n`;
  } else {
    testCode += `  await page.goto('https://your-app-url.com');\n`;
  }

  for (const step of scribeData.steps) {
    // Skip the navigation step we already handled
    if (step.action === 'goto' && step === firstNavStep) continue;
    
    testCode += `  // Step ${step.number}: ${escapeString(step.description)}\n`;
    
    switch (step.action) {
      case 'click':
        if (step.selector) {
          testCode += `  await page.click('${escapeString(step.selector)}');\n`;
        }
        break;
      case 'fill':
        if (step.selector && step.value) {
          testCode += `  await page.fill('${escapeString(step.selector)}', '${escapeString(step.value)}');\n`;
        }
        break;
      // Add more action types as needed
    }
  }
  
  testCode += '});\n';
  return testCode;
}

/**
 * Escape string for safe usage in generated code
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeString(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

module.exports = { generatePlaywrightTest };
```

### Test Runner Module

```javascript
// src/modules/runner/playwrightRunner.js
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Run a Playwright test with given code
 * @param {string} testCode - The Playwright test code
 * @param {Object} environment - Environment configuration
 * @returns {Promise<Object>} Test execution results
 */
async function runPlaywrightTest(testCode, environment) {
  // Create temp directory if it doesn't exist
  const tempDir = path.join(__dirname, '../../temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  // Create unique test file name
  const testFileName = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}.spec.js`;
  const testPath = path.join(tempDir, testFileName);
  
  try {
    // Write test code to file
    await fs.writeFile(testPath, testCode);
    
    // Create playwright config
    const configPath = path.join(tempDir, `playwright.config-${Date.now()}.js`);
    const configContent = generatePlaywrightConfig(environment);
    await fs.writeFile(configPath, configContent);
    
    // Run the test
    const { stdout, stderr } = await execAsync(`npx playwright test ${testPath} --config=${configPath}`);
    
    // Parse results from stdout
    const results = parsePlaywrightResults(stdout, stderr);
    
    // Clean up
    await fs.unlink(testPath);
    await fs.unlink(configPath);
    
    return results;
  } catch (error) {
    // Handle execution errors
    return {
      passed: false,
      error: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

/**
 * Generate Playwright config
 * @param {Object} environment - Environment configuration
 * @returns {string} Playwright config content
 */
function generatePlaywrightConfig(environment) {
  return `
module.exports = {
  use: {
    baseURL: '${environment.baseUrl || "http://localhost:3000"}',
    browserName: '${environment.browser || "chromium"}',
    headless: ${environment.headless !== false},
    screenshot: 'on',
    trace: 'on',
  },
  outputDir: '${path.join(__dirname, '../../temp/results')}',
};
`;
}

/**
 * Parse Playwright execution results
 * @param {string} stdout - Standard output from Playwright
 * @param {string} stderr - Standard error output from Playwright
 * @returns {Object} Parsed results
 */
function parsePlaywrightResults(stdout, stderr) {
  // Basic parsing logic - would need to be enhanced for production
  const passed = !stderr.includes('FAILED') && stdout.includes('1 passed');
  
  return {
    passed,
    output: stdout,
    error: stderr,
    duration: 0, // Would need proper extraction
    screenshots: [] // Would need to collect screenshots
  };
}

module.exports = { runPlaywrightTest };
```

### Project Structure

```
/devtest-backend
├── .eslintrc.js
├── .prettierrc
├── package.json
├── README.md
├── src/
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   │   ├── testController.js
│   │   ├── sequenceController.js
│   │   ├── runController.js
│   │   └── environmentController.js
│   ├── middleware/         # Express middleware
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   └── auth.js
│   ├── models/             # Mongoose models
│   │   ├── testCase.js
│   │   ├── testSequence.js
│   │   └── testRun.js
│   ├── modules/            # Core functionality
│   │   ├── parser/         # HTML parsing
│   │   ├── generator/      # Test generation
│   │   ├── runner/         # Test execution
│   │   └── integrations/   # External integrations
│   ├── routes/             # API routes
│   │   ├── testRoutes.js
│   │   ├── sequenceRoutes.js
│   │   ├── runRoutes.js
│   │   └── environmentRoutes.js
│   ├── utils/              # Utility functions
│   └── services/           # Business logic
├── temp/                   # Temporary files (git ignored)
└── tests/                  # Test files
    ├── unit/
    ├── integration/
    └── fixtures/           # Test fixtures
```
