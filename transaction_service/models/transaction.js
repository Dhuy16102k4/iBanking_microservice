const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  tuitionId: { type: String, required: true },
  status: {
    type: String,
    enum: ['INITIATED', 'OTP_SENT', 'PENDING', 'SUCCESS', 'FAILED'],
    default: 'INITIATED'
  },
  failureReason: String,
  otpId: String,
}, { timestamps: true });

transactionSchema.index({ customerId: 1 });
transactionSchema.index({ tuitionId: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
