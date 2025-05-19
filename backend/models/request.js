const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  amount: {
    type: Number,
    required: true,
    min: 5000
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  payment: {
    invoiceId: String,
    qrText: String,
    qrImage: String,
    urls: [{
      name: String,
      description: String,
      logo: String,
      link: String
    }],
    status: {
      type: String,
      enum: ['pending', 'paid', 'expired', 'failed'],
      default: 'pending'
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);