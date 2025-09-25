const Otp = require('../models/otp')

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

class OtpController {
  async createOtp(req, res) {
    const { transactionId } = req.body
    try {
      const code = generateOtp()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 phút
      const otp = new Otp({ transactionId, code, expiresAt })
      await otp.save()

      res.status(201).json({ message: 'OTP created successfully', otpId: otp._id, code })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: err.message })
    }
  }

  async verifyOTP(req, res) {
    const { transactionId, code } = req.body
    try {
      const otp = await Otp.findOne({ transactionId, code, used: false })
      if (!otp || otp.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Invalid OTP' })
      }

      otp.used = true
      await otp.save()
      res.json({ valid: true, otpId: otp._id })
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: err.message })
    }
  }
}

module.exports = new OtpController()
