# DevTest - Context Document

## Project Overview
DevTest is a tool that transforms Scribe documentation into executable test cases with minimal manual intervention. It enables developers to quickly create and run automated tests from visual documentation of workflows.

## Core Concept
1. Import Scribe HTML exports which contain step-by-step guides
2. Parse these guides into structured test steps
3. Convert steps into executable Playwright tests
4. Allow for test sequencing and simple state sharing
5. Execute tests against configured environments
6. Integrate with PractiTest for test management

## Technologies
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Testing Framework**: Playwright
- **Frontend**: Next.js (React) with Tailwind CSS (developed separately)

## Key Requirements
1. Parse Scribe HTML exports to extract steps, actions, and screenshots
2. Generate executable Playwright test scripts
3. Run tests against configurable environments
4. Support basic test sequencing (run tests in specific order)
5. Allow simple state sharing between tests
6. Provide clear test results with screenshots
7. Export tests to PractiTest

## Data Models

### Test Case
```javascript
const TestCaseSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  code: String,
  steps: [{
    number: Number,
    description: String,
    action: String,
    selector: String,
    value: String,
    screenshotUrl: String
  }]
});
```

### Test Sequence
```javascript
const TestSequenceSchema = new mongoose.Schema({
  name: String,
  description: String,
  tests: [{
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' },
    order: Number
  }],
  environment: {
    name: String,
    baseUrl: String,
    browser: String
  }
});
```

### Test Run
```javascript
const TestRunSchema = new mongoose.Schema({
  sequence: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSequence' },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  passed: Boolean,
  results: [{
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCase' },
    passed: Boolean,
    duration: Number,
    screenshots: [String],
    logs: [String]
  }]
});
```

## API Endpoints

### Test Case Management
- `POST /api/tests` - Create new test from Scribe HTML
- `GET /api/tests` - List all tests
- `GET /api/tests/:id` - Get test details
- `PUT /api/tests/:id` - Update test
- `DELETE /api/tests/:id` - Delete test

### Test Sequence Management
- `POST /api/sequences` - Create new test sequence
- `GET /api/sequences` - List all sequences
- `GET /api/sequences/:id` - Get sequence details
- `PUT /api/sequences/:id` - Update sequence
- `DELETE /api/sequences/:id` - Delete sequence

### Test Execution
- `POST /api/run/test/:id` - Run single test
- `POST /api/run/sequence/:id` - Run test sequence
- `GET /api/runs` - List all test runs
- `GET /api/runs/:id` - Get test run details

### Environment Management
- `POST /api/environments` - Create environment
- `GET /api/environments` - List environments
- `PUT /api/environments/:id` - Update environment

### PractiTest Integration
- `POST /api/practitest/export/test/:id` - Export test to PractiTest
- `POST /api/practitest/export/sequence/:id` - Export sequence to PractiTest