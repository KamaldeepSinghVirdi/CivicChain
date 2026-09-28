const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  userCategory: {
    type: String,
    default: ''
  },
  aiCategory: {
    type: String,
    default: ''
  },
  aiCategoryConfidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  urgencyScore: {
    type: Number,
    default: 0.4,
    min: 0,
    max: 1
  },
  sentiment: {
    type: String,
    enum: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'],
    default: 'NEUTRAL'
  },
  sentimentConfidence: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  },
  keyTerms: {
    type: [String],
    default: []
  },
  entities: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  imageAnalysis: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  imageDescription: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  trackingId: {
    type: String,
    unique: true,
    sparse: true
  },
  blockchainHash: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate trackingId - ASYNC VERSION (no next)
grievanceSchema.pre('save', async function() {
  if (!this.trackingId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 10000).toString(36).toUpperCase();
    this.trackingId = `CIVIC-${timestamp}-${random}`;
  }
});

// Indexes for faster queries
grievanceSchema.index({ user: 1, createdAt: -1 });
grievanceSchema.index({ status: 1 });
grievanceSchema.index({ aiCategory: 1 });

module.exports = mongoose.model('Grievance', grievanceSchema);