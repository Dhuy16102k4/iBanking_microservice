const Transaction = require('../models/transaction')
const axios = require('axios')
const sendOTPEmail = require('../utils/mailer')

async function getTuition(tuitionId) {
  const res = await axios.get(`http://gateway:4000/tuition/id/${tuitionId}`)
  return res.data
}

async function updateTuition(tuitionId, updateData) {
  await axios.patch(`http://gateway:4000/tuition/${tuitionId}`, updateData)
}

async function getUserInfo(userId) {
  const res = await axios.get(`http://gateway:4000/users/id/${userId}`)
  return res.data
}

async function updateUserBalance(userId, newBalance) {
  await axios.patch(`http://gateway:4000/users/balance/${userId}`, { newBalance })
}

async function revertUserBalance(userId, originalBalance) {
  await axios.patch(`http://gateway:4000/users/balance/${userId}`, { newBalance: originalBalance })
}

async function createOTP(transactionId) {
  const res = await axios.post(`http://gateway:4000/otp/create`, { transactionId })
  return res.data
}

async function verifyOTP(transactionId, code) {
  const res = await axios.post(`http://gateway:4000/otp/verify`, { transactionId, code })
  return res.data
}

class TransactionController {
  // B1: Khởi tạo giao dịch
  async createTransaction(req, res) {
    const { tuitionId } = req.body
    const userId = req.user.id
    try {
      const tuition = await getTuition(tuitionId)
      if (tuition.status !== 'UNPAID')
        return res.status(400).json({ message: 'Tuition already paid' })

      const user = await getUserInfo(userId)
      const amount = parseFloat(tuition.amount)

      if (user.balance < amount)
        return res.status(400).json({ message: 'Insufficient balance' })

      const transaction = new Transaction({ customerId: userId, tuitionId })
      await transaction.save()

      res.status(201).json({ transactionId: transaction._id, message: 'Transaction initiated' })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  // B2: Gửi OTP
  async sendOTP(req, res) {
    const { transactionId } = req.body
    const userId = req.user.id
    try {
      const transaction = await Transaction.findById(transactionId)
      if (!transaction || transaction.customerId.toString() !== userId) {
        return res.status(404).json({ message: 'Transaction not found' })
      }

      if (transaction.status !== 'INITIATED' && transaction.status !== 'OTP_SENT') {
        return res.status(400).json({ message: 'Invalid status for OTP' })
      }

      const otp = await createOTP(transactionId)
      const user = await getUserInfo(userId)
      await sendOTPEmail(user.email, otp.code)

      transaction.status = 'OTP_SENT'
      transaction.otpId = otp.otpId
      await transaction.save()

      res.json({ message: 'OTP sent', otpId: otp.otpId, transactionId, status: transaction.status })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }

  // B3: Xác minh OTP + Thanh toán
  async verifyOTP(req, res) {
    const { transactionId, code } = req.body
    const userId = req.user.id
    let originalBalance

    try {
      const transaction = await Transaction.findById(transactionId)
      if (!transaction || transaction.customerId !== userId) {
        return res.status(404).json({ message: 'Transaction not found' })
      }
      if (transaction.status !== 'OTP_SENT') {
        return res.status(400).json({ message: 'Invalid status for OTP verification' })
      }

      const otpResult = await verifyOTP(transactionId, code)
      if (!otpResult.valid) throw new Error('Invalid or expired OTP')

      transaction.status = 'PENDING'
      await transaction.save()

      const tuition = await getTuition(transaction.tuitionId)
      if (tuition.status !== 'UNPAID')
        throw new Error('Tuition already paid')

      const user = await getUserInfo(userId)
      const amount = parseFloat(tuition.amount)
      if (user.balance < amount) throw new Error('Insufficient balance')

      // Update balance + tuition
      originalBalance = user.balance
      await updateUserBalance(userId, user.balance - amount)
      await updateTuition(tuition._id, { status: 'PAID' })

      transaction.status = 'SUCCESS'
      await transaction.save()

      res.json({ message: 'Payment successful', transactionId })
    } catch (err) {
      // rollback thủ công
      if (originalBalance !== undefined) {
        await revertUserBalance(userId, originalBalance)
      }
      await Transaction.findByIdAndUpdate(transactionId, {
        status: 'FAILED',
        failureReason: err.message
      })
      res.status(400).json({ message: err.message })
    }
  }

  async getTransactions(req, res) {
    const userId = req.user.id
    try {
      const transactions = await Transaction.find({ customerId: userId })
      res.json(transactions)
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
}

module.exports = new TransactionController()
