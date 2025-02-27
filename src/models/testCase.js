const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  steps: [{
    number: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: ['click', 'fill', 'goto', 'wait', 'assert', 'unknown', 'view']
    },
    selector: String,
    value: String,
    screenshotUrl: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  playwrightTestPath: {
    type: String,
    default: null
  }
});

// Update the updatedAt timestamp before saving
testCaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TestCase', testCaseSchema); 