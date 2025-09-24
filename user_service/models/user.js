const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  balance: { type: mongoose.Decimal128, default: "10000.00" }
})

userSchema.index({ username: 1 }, { unique: true });
userSchema.methods.getBalance = function() {
  return parseFloat(this.balance.toString())
}

module.exports = mongoose.model('User', userSchema)