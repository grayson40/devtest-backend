const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    testCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase',
      required: [true, 'Test case reference is required'],
    },
    sequence: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSequence',
    },
    environment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Environment',
      required: [true, 'Environment reference is required'],
    },
    status: {
      type: String,
      enum: ['passed', 'failed', 'error', 'skipped'],
      required: [true, 'Test status is required'],
    },
    duration: {
      type: Number, // in milliseconds
      required: [true, 'Test duration is required'],
    },
    error: {
      message: String,
      stack: String,
    },
    screenshots: [{
      step: Number,
      path: String,
      timestamp: Date,
    }],
    logs: [{
      level: {
        type: String,
        enum: ['info', 'warn', 'error'],
      },
      message: String,
      timestamp: Date,
    }],
    metadata: {
      browser: {
        type: String,
        enum: ['chromium', 'firefox', 'webkit'],
        required: true,
      },
      viewport: {
        width: Number,
        height: Number,
      },
      userAgent: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster queries
testResultSchema.index({ testCase: 1, createdAt: -1 });
testResultSchema.index({ sequence: 1, createdAt: -1 });
testResultSchema.index({ environment: 1 });
testResultSchema.index({ status: 1 });
testResultSchema.index({ createdAt: 1 });

const TestResult = mongoose.model('TestResult', testResultSchema);

module.exports = TestResult; 