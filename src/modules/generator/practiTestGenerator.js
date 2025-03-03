const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../../utils/logger');

class PractiTestGenerator {
  constructor() {
    this.exportsDir = path.join(process.cwd(), 'exports', 'practitest');
  }

  /**
   * Generate a PractiTest compatible Excel file from a test case
   * @param {Object} testCase - The test case object
   * @returns {Promise<string>} - Path to the generated Excel file
   */
  async generateExport(testCase) {
    try {
      // Ensure exports directory exists
      await fs.mkdir(this.exportsDir, { recursive: true });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Test Case');

      // Set up columns
      worksheet.columns = [
        { header: 'Test Name', key: 'testName', width: 30 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Step #', key: 'stepNumber', width: 10 },
        { header: 'Step Title', key: 'stepTitle', width: 30 },
        { header: 'Step Description', key: 'stepDescription', width: 40 },
        { header: 'Expected Result', key: 'expectedResult', width: 40 }
      ];

      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add test case info
      const testInfo = {
        testName: testCase.title,
        description: testCase.description || '',
        stepNumber: '',
        stepTitle: '',
        stepDescription: '',
        expectedResult: ''
      };
      worksheet.addRow(testInfo);

      // Merge cells for test name and description
      worksheet.mergeCells('A2:A3');
      worksheet.mergeCells('B2:B3');

      // Add steps
      let rowIndex = 2;
      testCase.steps.forEach((step, index) => {
        const stepRow = {
          stepNumber: step.number,
          stepTitle: this.generateStepTitle(step),
          stepDescription: step.description,
          expectedResult: this.generateExpectedResult(step)
        };
        worksheet.addRow(stepRow);
        rowIndex++;
      });

      // Apply borders
      for (let i = 1; i <= rowIndex; i++) {
        worksheet.getRow(i).eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }

      // Generate filename
      const sanitizedTitle = testCase.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const filename = `practitest_${sanitizedTitle}_${testCase._id}.xlsx`;
      const filePath = path.join(this.exportsDir, filename);

      // Write to file
      await workbook.xlsx.writeFile(filePath);

      logger.info(`Generated PractiTest export at ${filePath}`, {
        testId: testCase._id,
        filePath
      });

      return filePath;
    } catch (error) {
      logger.error('Error generating PractiTest export', {
        testId: testCase._id,
        error: error.stack
      });
      throw error;
    }
  }

  /**
   * Generate a step title based on the step action
   * @param {Object} step - The step object
   * @returns {string} - The step title
   */
  generateStepTitle(step) {
    switch (step.action.toLowerCase()) {
      case 'click':
        return `Click on element`;
      case 'fill':
      case 'type':
        return `Enter text`;
      case 'goto':
      case 'navigate':
        return `Navigate to URL`;
      case 'wait':
        return `Wait for element`;
      case 'assert':
        return `Verify element`;
      case 'view':
        return `View page`;
      default:
        return `Perform action: ${step.action}`;
    }
  }

  /**
   * Generate expected result based on the step action
   * @param {Object} step - The step object
   * @returns {string} - The expected result
   */
  generateExpectedResult(step) {
    switch (step.action.toLowerCase()) {
      case 'click':
        return `Element is clicked successfully`;
      case 'fill':
      case 'type':
        return `Text "${step.value}" is entered successfully`;
      case 'goto':
      case 'navigate':
        return `Page is loaded successfully`;
      case 'wait':
        return `Element is visible on the page`;
      case 'assert':
        return `Element is visible and matches expected state`;
      case 'view':
        return `Page is displayed correctly`;
      default:
        return `Action completes successfully`;
    }
  }
}

module.exports = new PractiTestGenerator();
