
// const mongoose = require('mongoose')

// const transactionSchema = new mongoose.Schema({
//   customerId: { type: String, required: true },
//   tuitionId: { type: mongoose.Schema.Types.ObjectId, required: true },
//   amount: { type: Number, required: true },
//   status: {
//     type: String,
//     enum: ['initiated', 'pending', 'success', 'failed', 'rolledback'],
//     default: 'initiated'
//   },
//   paymentRef: String
// }, { timestamps: true })

// module.exports = mongoose.model('Transaction', transactionSchema)
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customerId: { type: String, required: true }, 
  tuitionId: { type: String, required: true }, 
  amount: { type: mongoose.Decimal128, required: true },
  status: {
    type: String,
    enum: ['INITIATED', 'OTP_SENT', 'PENDING', 'SUCCESS', 'FAILED'], // Added OTP_SENT, removed rolledback
    default: 'INITIATED'
  },
  failureReason: { type: String }, 
  otpId: { type: String }, 
  paymentRef: { type: String },
}, { timestamps: true });

transactionSchema.index({ customerId: 1 });
transactionSchema.index({ tuitionId: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);