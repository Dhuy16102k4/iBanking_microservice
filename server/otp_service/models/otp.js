
// const mongoose = require('mongoose')

// const otpSchema = new mongoose.Schema({
//   studentId: { type: String, required: true },
//   code: { type: String, required: true },
//   expiresAt: { type: Date, required: true },
//   verified: { type: Boolean, default: false }
// }, { timestamps: true })

// module.exports = mongoose.model('Otp', otpSchema)
// otp-service/models/Otp.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  transactionId: { type: String, required: true }, 
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false } 
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Otp', otpSchema);