const mongoose = require('mongoose')
const Transaction = require('../models/transaction')
const axios = require('axios')
const sendOTPEmail = require ('../utils/mailer')

async function getTuition(tuitionId) {
  try {
    const res = await axios.get(`http://gateway:4000/tuition/id/${tuitionId}`)
    return res.data
  } catch (err) {
    console.error('Error in getTuition:', err)
    throw err
  }
}

async function updateTuition(tuitionId, updateData) {
  await axios.patch(`http://gateway:4000/tuition/${tuitionId}`, updateData)
}

async function getUserInfo(userId) {
  try {
    const res = await axios.get(`http://gateway:4000/users/id/${userId}`)
    return res.data
  } catch (err) {
    console.error('Error in getUserInfo:', err)
    throw err
  }
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

  async sendOTP(req, res) {
    const { transactionId } = req.body
    const userId = req.user.id
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const transaction = await Transaction.findById(transactionId).session(session)
      if (!transaction || transaction.customerId.toString() !== userId) {
        throw new Error('Transaction not found')
      }
      // resend
      if (transaction.status !== 'INITIATED' && transaction.status !== 'OTP_SENT') {
        throw new Error('Invalid status for OTP')
      }

      const otp = await createOTP(transactionId)
      const user = await getUserInfo(userId)
      await sendOTPEmail(user.email, otp.code)
      
      transaction.status = 'OTP_SENT'
      transaction.otpId = otp.otpId
      await transaction.save({ session })

      await session.commitTransaction()
      res.json({ message: 'OTP sent', otpId: otp.otpId, transactionId ,status: transaction.status, otpCode: otp.code})
    } catch (err) {
      await session.abortTransaction()
      res.status(400).json({ message: err.message })
    } finally {
      session.endSession()
    }
  }

  async verifyOTP(req, res) {
    const { transactionId, code } = req.body
    const userId = req.user.id
    const session = await mongoose.startSession()
    let originalBalance
    session.startTransaction()
    try {
      const transaction = await Transaction.findById(transactionId).session(session)
      if (!transaction || transaction.customerId !== userId)
        throw new Error('Transaction not found')
      if (transaction.status !== 'OTP_SENT')
        throw new Error('Invalid status for OTP verification')

      const otpResult = await verifyOTP(transactionId, code)
      if (!otpResult.valid) throw new Error('Invalid or expired OTP')

      transaction.status = 'PENDING'
      await transaction.save({ session })

      const tuition = await getTuition(transaction.tuitionId)
      if (tuition.status !== 'UNPAID')
        throw new Error('Tuition already paid')

      const user = await getUserInfo(userId)
      const amount = parseFloat(tuition.amount)
      if (user.balance < amount) throw new Error('Insufficient balance')

      originalBalance = user.balance
      await updateUserBalance(userId, user.balance - amount)
      await updateTuition(tuition._id, { status: 'PAID' })

      transaction.status = 'SUCCESS'
      await transaction.save({ session })

      await session.commitTransaction()
      res.json({ message: 'Payment successful', transactionId })
    } catch (err) {
      await session.abortTransaction()
      if (originalBalance !== undefined)
        await revertUserBalance(userId, originalBalance)
      await Transaction.findByIdAndUpdate(transactionId, {
        status: 'FAILED',
        failureReason: err.message
      })
      res.status(400).json({ message: err.message })
    } finally {
      session.endSession()
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
