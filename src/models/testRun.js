const mongoose = require('mongoose');

const testRunSchema = new mongoose.Schema({
  sequence: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestSequence',
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  passed: {
    type: Boolean,
    default: false,
  },
  results: [{
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase',
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    duration: {
      type: Number, // in milliseconds
      required: true,
    },
    error: {
      message: String,
      stack: String,
    },
    screenshots: [{
      type: String,
      trim: true,
    }],
    logs: [{
      timestamp: {
        type: Date,
        default: Date.now,
      },
      level: {
        type: String,
        enum: ['info', 'warn', 'error'],
        default: 'info',
      },
      message: String,
    }],
  }],
  environment: {
    name: String,
    baseUrl: String,
    browser: String,
  },
});

// Calculate total duration
testRunSchema.virtual('duration').get(function() {
  if (!this.endTime) return null;
  return this.endTime - this.startTime;
});

// Calculate pass rate
testRunSchema.virtual('passRate').get(function() {
  if (!this.results || this.results.length === 0) return 0;
  const passedTests = this.results.filter(result => result.passed).length;
  return (passedTests / this.results.length) * 100;
});

// Update status based on results
testRunSchema.pre('save', function(next) {
  if (this.results && this.results.length > 0) {
    this.passed = this.results.every(result => result.passed);
  }
  next();
});

module.exports = mongoose.model('TestRun', testRunSchema); 