const fs = require('fs').promises;
const path = require('path');
const PlaywrightGenerator = require('../playwrightGenerator');

describe('PlaywrightGenerator', () => {
  const testOutputDir = path.join(__dirname, '../../../../tests/generated');
  const sampleTestCase = {
    title: 'Login Test',
    description: 'Test the login functionality',
    steps: [
      {
        number: 1,
        description: 'Navigate to login page',
        action: 'goto',
        value: 'https://example.com/login',
      },
      {
        number: 2,
        description: 'Enter username',
        action: 'fill',
        selector: 'input[name="username"]',
        value: 'testuser',
      },
      {
        number: 3,
        description: 'Enter password',
        action: 'fill',
        selector: 'input[type="password"]',
        value: 'password123',
      },
      {
        number: 4,
        description: 'Click login button',
        action: 'click',
        selector: 'button[type="submit"]',
      },
      {
        number: 5,
        description: 'Verify dashboard is visible',
        action: 'view',
        value: 'Dashboard',
      },
    ],
  };

  beforeAll(async () => {
    // Ensure output directory exists and is empty
    await fs.rm(testOutputDir, { recursive: true, force: true });
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up generated files
    await fs.rm(testOutputDir, { recursive: true, force: true });
  });

  describe('generateTest', () => {
    it('should generate a valid Playwright test file', async () => {
      const filePath = await PlaywrightGenerator.generateTest(sampleTestCase, {
        outputDir: testOutputDir,
      });

      // Verify file exists
      const fileExists = await fs.access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Read and verify file contents
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check basic structure
      expect(content).toContain("import { test, expect } from '@playwright/test'");
      expect(content).toContain("test('Login Test'");
      
      // Check steps
      expect(content).toContain("await page.goto('https://example.com/login')");
      expect(content).toContain("await page.fill('input[name=\"username\"]', 'testuser')");
      expect(content).toContain("await page.fill('input[type=\"password\"]', 'password123')");
      expect(content).toContain("await page.click('button[type=\"submit\"]')");
      expect(content).toContain("await expect(page.getByText('Dashboard')).toBeVisible()");
      
      // Check comments
      expect(content).toContain('// Step 1: Navigate to login page');
      expect(content).toContain('// Step 2: Enter username');
    });

    it('should generate config file if it does not exist', async () => {
      await PlaywrightGenerator.generateTest(sampleTestCase, {
        outputDir: testOutputDir,
      });

      const configPath = path.join(testOutputDir, '..', 'playwright.config.js');
      const configExists = await fs.access(configPath)
        .then(() => true)
        .catch(() => false);
      
      expect(configExists).toBe(true);

      const configContent = await fs.readFile(configPath, 'utf8');
      expect(configContent).toContain('module.exports = config');
      expect(configContent).toContain('testDir: ');
      expect(configContent).toContain('baseURL: ');
    });
  });

  describe('generateSafeFilename', () => {
    it('should generate a safe filename from test title', () => {
      const cases = [
        ['Simple Test', 'simple-test.spec.js'],
        ['Test with spaces!', 'test-with-spaces.spec.js'],
        ['Test/with/slashes', 'test-with-slashes.spec.js'],
        ['Test with $pecial Ch@rs', 'test-with-pecial-ch-rs.spec.js'],
        ['  Trim  Spaces  ', 'trim-spaces.spec.js'],
      ];

      cases.forEach(([input, expected]) => {
        expect(PlaywrightGenerator.generateSafeFilename(input)).toBe(expected);
      });
    });
  });

  describe('generateTests', () => {
    it('should generate multiple test files', async () => {
      const testCases = [
        { ...sampleTestCase, title: 'Test 1' },
        { ...sampleTestCase, title: 'Test 2' },
      ];

      const filePaths = await PlaywrightGenerator.generateTests(testCases, {
        outputDir: testOutputDir,
      });

      expect(filePaths).toHaveLength(2);
      
      // Verify all files exist
      for (const filePath of filePaths) {
        const fileExists = await fs.access(filePath)
          .then(() => true)
          .catch(() => false);
        expect(fileExists).toBe(true);
      }
    });
  });
}); 