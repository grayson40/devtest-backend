const mongoose = require('mongoose');

const testSequenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A test sequence must have a name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tests: [
      {
        testId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TestCase',
          required: [true, 'A test reference is required'],
        },
        order: {
          type: Number,
          default: 0,
        },
        _id: false,
      },
    ],
    environment: {
      type: Map,
      of: String,
      default: new Map(),
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'running', 'completed', 'failed'],
      default: 'active',
    },
    lastRun: {
      type: Date,
    },
    results: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
testSequenceSchema.index({ name: 1 });
testSequenceSchema.index({ status: 1 });
testSequenceSchema.index({ createdAt: -1 });

// Virtual populate for test details
testSequenceSchema.virtual('testDetails', {
  ref: 'TestCase',
  localField: 'tests.testId',
  foreignField: '_id',
});

const TestSequence = mongoose.model('TestSequence', testSequenceSchema);

module.exports = TestSequence;