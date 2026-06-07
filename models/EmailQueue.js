const mongoose = require('mongoose');

const EmailQueueSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Recipient email is required'],
    lowercase: true,
    trim: true,
    index: true
  },
  firstName: {
    type: String,
    default: 'Customer'
  },
  flow: {
    type: String,
    required: true,
    enum: [
      'Welcome',
      'Browse Abandonment',
      'Cart Recovery',
      'Post-Purchase',
      'Reorder',
      'Review',
      'Winback'
    ],
    index: true
  },
  step: {
    type: Number,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  scheduledFor: {
    type: Date,
    required: true,
    index: true
  },
  sentAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  error: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EmailQueue', EmailQueueSchema);
