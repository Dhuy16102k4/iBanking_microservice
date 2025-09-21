const mongoose = require('mongoose')

const tuitionSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  semester: { type: String, required: true }, 
  amount: { type: mongoose.Decimal128, required: true }, 
  paidAmount: { type: mongoose.Decimal128, default: "0.00" },
  status: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' }
}, { timestamps: true })

// Method tính còn nợ
tuitionSchema.methods.getRemaining = function () {
  return parseFloat(this.amount.toString()) - parseFloat(this.paidAmount.toString())
}

// Tự động format JSON trả về
tuitionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.amount = parseFloat(ret.amount.toString())
    ret.paidAmount = parseFloat(ret.paidAmount.toString())
    ret.remaining = ret.amount - ret.paidAmount
    delete ret.__v
    return ret
  }
})

module.exports = mongoose.model('TuitionFee', tuitionSchema)
