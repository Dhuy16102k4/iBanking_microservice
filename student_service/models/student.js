const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String },
  phone: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('Student', studentSchema)
