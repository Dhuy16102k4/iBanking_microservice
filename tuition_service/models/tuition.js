const mongoose = require('mongoose')

const tuitionSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  semester: { type: String, required: true },
  amount: { type: mongoose.Decimal128, required: true },
  status: { type: String, enum: ['UNPAID', 'PAID'], default: 'UNPAID' },
  deadline: { type: Date, required: true } 
}, { timestamps: true })

// Format JSON trả về
tuitionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.amount = parseFloat(ret.amount.toString())
    delete ret.__v
    return ret
  }
})

module.exports = mongoose.model('TuitionFee', tuitionSchema)
