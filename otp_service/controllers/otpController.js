
const Otp = require('../services/otpService');
const mongoose = require('mongoose');

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


class OtpController {

    async createOtp(req, res) {
        const { transactionId } = req.body
        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            const code = generateOtp()
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            const otp = new Otp({ transactionId, code, expiresAt })
            await otp.save({ session })
            await session.commitTransaction()
            res.status(201).json({ message: 'OTP created successfully', otpId: otp._id, code })

        } catch (err) {

            await session.abortTransaction();
            console.error(err);
            return res.status(500).json({ message: err.message })

        } finally {
            session.endSession();
        }

    }

    async verifyOTP(req, res) {

        const { transactionId, code } = req.body
        const session = await mongoose.startSession()
        session.startTransaction()
        try {
            const otp = await Otp.findOne({ transactionId, code, used: false }).session(session)
            if (!otp || otp.expiresAt < new Date()) {
                return res.status(400).json({ message: 'Invalid OTP' })
            }
            otp.used = true
            await otp.save({ session })
            await session.commitTransaction()
            res.json({ valid: true, otpId: otp._id });
        }
        catch (err) {
            await session.abortTransaction();
            console.error(err);
            res.status(500).json({ message: err.message })

        }
        finally {
            session.endSession();
        }
    }
}

module.exports = OtpController;