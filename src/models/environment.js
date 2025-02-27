const mongoose = require('mongoose');

const environmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Environment name is required'],
      trim: true,
      unique: true,
    },
    baseUrl: {
      type: String,
      required: [true, 'Base URL is required'],
      trim: true,
    },
    variables: {
      type: Map,
      of: String,
      default: new Map(),
    },
    browser: {
      type: String,
      enum: ['chromium', 'firefox', 'webkit'],
      default: 'chromium',
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    auth: {
      type: {
        type: String,
        enum: ['none', 'basic', 'bearer', 'custom'],
        default: 'none',
      },
      username: String,
      password: String,
      token: String,
      custom: Map,
    },
    headers: {
      type: Map,
      of: String,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for faster queries
environmentSchema.index({ name: 1 }, { unique: true });
environmentSchema.index({ status: 1 });
environmentSchema.index({ tags: 1 });

const Environment = mongoose.model('Environment', environmentSchema);

module.exports = Environment; 