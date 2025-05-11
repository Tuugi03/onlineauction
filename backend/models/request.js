const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 5000
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
  
},
{ timeStamp : true });

module.exports = mongoose.model('Request', requestSchema);