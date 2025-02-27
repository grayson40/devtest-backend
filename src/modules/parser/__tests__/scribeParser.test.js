const ScribeParser = require('../scribeParser');
const fs = require('fs').promises;
const path = require('path');

describe('ScribeParser', () => {
  let exampleHtml;

  beforeAll(async () => {
    exampleHtml = await fs.readFile(
      path.join(__dirname, '../../../../docs/example-scribe.html'),
      'utf8',
    );
  });

  describe('parse', () => {
    it('should parse the example Scribe HTML correctly', () => {
      const result = ScribeParser.parse(exampleHtml);

      // Check title
      expect(result.title).toBe('How To Log In To DAW Hub');

      // Check steps
      expect(result.steps).toHaveLength(8);

      // Check first step (navigation)
      expect(result.steps[0]).toMatchObject({
        number: 1,
        description: 'Navigate to https://www.dawhub.io/',
        action: 'goto',
        value: 'https://www.dawhub.io/',
      });

      // Check login button click
      expect(result.steps[1]).toMatchObject({
        number: 2,
        description: 'Click "Log in"',
        action: 'click',
        selector: expect.stringContaining('Log in'),
      });

      // Check username input
      expect(result.steps[2]).toMatchObject({
        number: 3,
        description: 'Click this text field.',
        action: 'click',
        selector: 'input[type="text"]',
      });

      // Check username type
      expect(result.steps[3]).toMatchObject({
        number: 4,
        description: 'Type "grayson"',
        action: 'fill',
        value: 'grayson',
        selector: 'input[type="text"]',
      });

      // Check password field click
      expect(result.steps[4]).toMatchObject({
        number: 5,
        description: 'Click this password field.',
        action: 'click',
        selector: 'input[type="password"]',
      });

      // Check password type
      expect(result.steps[5]).toMatchObject({
        number: 6,
        description: 'Type "password"',
        action: 'fill',
        value: 'password',
        selector: 'input[type="password"]',
      });

      // Check login button click
      expect(result.steps[6]).toMatchObject({
        number: 7,
        description: 'Click "Log In"',
        action: 'click',
        selector: expect.stringContaining('Log In'),
      });

      // Check view dashboard
      expect(result.steps[7]).toMatchObject({
        number: 8,
        description: 'View dashboard',
        action: 'view',
        value: 'dashboard',
      });

      // Check screenshots
      result.steps.forEach((step) => {
        if (step.screenshotUrl) {
          expect(step.screenshotUrl).toMatch(/^https:\/\/.*\.jpeg/);
        }
      });
    });
  });

  describe('validate', () => {
    it('should validate a correctly parsed test case', () => {
      const testCase = ScribeParser.parse(exampleHtml);
      const validation = ScribeParser.validate(testCase);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid test cases', () => {
      const invalidTestCase = {
        title: '',
        steps: [],
      };
      const validation = ScribeParser.validate(invalidTestCase);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Test case must have a title');
      expect(validation.errors).toContain('Test case must have at least one step');
    });
  });
});
