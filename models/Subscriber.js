const mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'active'
  }
});

module.exports = mongoose.model('Subscriber', SubscriberSchema);
