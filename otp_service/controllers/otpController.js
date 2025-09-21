const { AssertionError } = require('assert');
const Otp = require('../services/otpService');
const crypto = require('crypto');

const OtpController = {
    
    async generateOtp(req, res) {
        try {
            const { studentId } = req.body;
            const code = (Math.floor(100000 + Math.random() * 900000)).toString() 
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000) 

            const otp = await Otp.create({ studentId, code, expiresAt })
            console.log(`OTP for ${studentId}: ${code}`)
            res.status(201).json({ message: 'OTP generated and sent' })
        } catch (error) {
            console.error('Error generating OTP:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    
    async verifyOTP(req, res) {
        try {
        const { studentId, code } = req.body
        const otp = await Otp.findOne({ studentId, code }).sort({ createdAt: -1 })

        if (!otp) return res.status(400).json({ message: 'Invalid OTP' })
        if (otp.verified) return res.status(400).json({ message: 'OTP already used' })
        if (otp.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' })

        otp.verified = true
        await otp.save()

        res.json({ message: 'OTP verified successfully' })
        } catch (err) {
        res.status(500).json({ message: err.message })
        }
    }



}
module.exports = OtpController;