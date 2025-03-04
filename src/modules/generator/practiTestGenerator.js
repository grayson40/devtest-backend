const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../../utils/logger');
const Anthropic = require('@anthropic-ai/sdk');

class PractiTestGenerator {
  constructor() {
    this.exportsDir = path.join(process.cwd(), 'exports', 'practitest');
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateExport(testCase) {
    try {
      // Ensure exports directory exists
      await fs.mkdir(this.exportsDir, { recursive: true });

      // Create initial export
      const filePath = await this.createInitialExport(testCase);
      
      // Start background enhancement
      setImmediate(async () => {
        try {
          await this.enhanceExportInBackground(testCase, filePath);
          logger.info('Background enhancement completed successfully', {
            testId: testCase._id,
            filePath
          });
        } catch (error) {
          logger.error('Background enhancement failed', {
            testId: testCase._id,
            error: error.message
          });
        }
      });

      return filePath;
    } catch (error) {
      logger.error('Error in generateExport', {
        testId: testCase._id,
        error: error.stack
      });
      throw error;
    }
  }

  async createInitialExport(testCase) {
    try {
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

      // Style headers
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add test info
      worksheet.addRow({
        testName: testCase.title,
        description: testCase.description || '',
      });

      // Add steps with basic content initially
      testCase.steps.forEach(step => {
        worksheet.addRow({
          stepNumber: step.number,
          stepTitle: this.generateStepTitle(step),
          stepDescription: step.description,
          expectedResult: this.generateBasicExpectedResult(step)
        });
      });

      // Apply styling
      this.applyWorksheetStyling(worksheet);

      // Save file
      const sanitizedTitle = testCase.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const filename = `practitest_${sanitizedTitle}_${testCase._id}.xlsx`;
      const filePath = path.join(this.exportsDir, filename);

      await workbook.xlsx.writeFile(filePath);
      logger.info('Created initial PractiTest export', { filePath });
      
      return filePath;
    } catch (error) {
      logger.error('Error creating initial export', { error: error.stack });
      throw error;
    }
  }

  async enhanceExportInBackground(testCase, filePath) {
    try {
      logger.info('Starting AI enhancement', { testId: testCase._id });

      const prompt = `As a QA expert, enhance these test steps with clear descriptions and expected results.
      Consider the UI context and user flow.

      Test Title: ${testCase.title}
      Test Description: ${testCase.description}

      Steps to enhance: ${JSON.stringify(testCase.steps.map(step => ({
        number: step.number,
        action: step.action,
        selector: step.selector,
        value: step.value,
        description: step.description
      })), null, 2)}

      For each step provide:
      1. A clear step description (2-3 bullet points)
      2. Specific expected results that verify:
         - UI response
         - System state
         - Data changes
      
      Format as JSON array:
      [{ 
        "number": 1,
        "description": "• Point 1\\n• Point 2",
        "expectedResult": "• Result 1\\n• Result 2"
      }]`;

      const message = await this.anthropic.messages.create({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }]
      });

      const enhancedSteps = JSON.parse(message.content[0].text);
      
      // Update Excel with enhanced content
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet('Test Case');

      enhancedSteps.forEach((step, index) => {
        const rowIndex = index + 2; // +2 to skip header and test info
        if (step.description) {
          worksheet.getRow(rowIndex).getCell('E').value = step.description;
        }
        if (step.expectedResult) {
          worksheet.getRow(rowIndex).getCell('F').value = step.expectedResult;
        }
      });

      await workbook.xlsx.writeFile(filePath);
      logger.info('Enhanced PractiTest export saved', { 
        testId: testCase._id,
        filePath 
      });
    } catch (error) {
      logger.error('AI enhancement failed', { 
        testId: testCase._id,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  generateStepTitle(step) {
    const action = step.action.toLowerCase();
    const target = step.selector || step.value || 'element';
    return `${action} ${target}`;
  }

  generateBasicExpectedResult(step) {
    switch (step.action.toLowerCase()) {
      case 'click':
        return '• Element clicked\n• Action successful';
      case 'fill':
      case 'type':
        return `• "${step.value}" entered\n• Field updated`;
      case 'goto':
      case 'navigate':
        return `• Page loaded\n• URL: ${step.value}`;
      case 'wait':
        return '• Element visible\n• Ready for interaction';
      case 'assert':
        return '• Element present\n• State verified';
      default:
        return '• Action completed';
    }
  }

  applyWorksheetStyling(worksheet) {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = {
          wrapText: true,
          vertical: 'top'
        };
      });
    });
  }
}

module.exports = new PractiTestGenerator();
