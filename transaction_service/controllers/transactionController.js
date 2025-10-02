const Transaction = require('../models/transaction')
const axios = require('axios')
const sendOTPEmail = require('../utils/mailer')
const mongoose = require('mongoose')
const redis = require('redis')
const jwt = require('jsonwebtoken')
const { default: axiosRetry } = require('axios-retry')

// ================= Redis Init =================
let redisClient

async function initRedis() {
  if (!redisClient) {
    // Nếu chạy Docker Compose, service name redis
    redisClient = redis.createClient({ url: 'redis://redis:6379' })

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err)
    })

    await redisClient.connect()
    console.log('✅ Redis connected in Transaction Service')
  }
  return redisClient
}

// ================= Axios Retry Config =================
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status >= 500,
})

// ================= Lock Helpers =================
async function acquireLock(key, ttl = 120000) {
  const client = await initRedis()
  return await client.set(key, 'locked', { NX: true, PX: ttl })
}

async function releaseLock(key) {
  const client = await initRedis()
  await client.del(key)
}



axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500,
})


async function acquireLock(key, ttl = 120000) {
  const client = await initRedis()
  return await client.set(key, 'locked', { NX: true, PX: ttl })
}

async function releaseLock(key) {
  const client = await initRedis()
  await client.del(key)
}



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
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const tuition = await getTuition(tuitionId)

      if (tuition.status !== 'UNPAID') {
        throw new Error('Tuition already paid')
      }
      // check deadline
      if (new Date(tuition.deadline) < new Date()) {
        throw new Error('Tuition payment deadline has passed')
      }

      const user = await getUserInfo(userId)
      const amount = parseFloat(tuition.amount)

      if (user.balance < amount) {
        throw new Error('Insufficient balance')
      }

      const transaction = new Transaction({ customerId: userId, tuitionId })
      await transaction.save({ session })

      // Phát hành JWT cho transaction
      const token = jwt.sign(
        { transactionId: transaction._id.toString(), userId },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
      )

      await session.commitTransaction()
      session.endSession()

      res.status(201).json({
        transactionId: transaction._id,
        token,
        message: 'Transaction initiated'
      })
    } catch (err) {
      await session.abortTransaction()
      session.endSession()
      res.status(500).json({ message: err.message })
    }
  }

  // B2: Gửi OTP
  async sendOTP(req, res) {
    const { transactionId, token } = req.body
    const userId = req.user.id
    try {

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      if (decoded.transactionId !== transactionId || decoded.userId !== userId) {
        return res.status(403).json({ message: 'Invalid token for this transaction' })
      }
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

      res.json({
        message: 'OTP sent',
        otpId: otp.otpId,
        transactionId,
        status: transaction.status
      })
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  }
async verifyOTP(req, res) {
  const { transactionId, code, token } = req.body;
  const userId = req.user.id;
  const session = await mongoose.startSession();
  let lockKey;

  try {
    // ===== 1. Lấy Transaction =====
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) throw new Error('Transaction not found');

    // ===== 2. Redis lock tránh double spend =====
    lockKey = `lock:tuition:${transaction.tuitionId}`;
    const lockAcquired = await acquireLock(lockKey);
    if (!lockAcquired) {
      throw new Error('Another transaction is processing this tuition');
    }

    // ===== 3. Start DB transaction =====
    session.startTransaction();

    // ===== 4. Verify JWT =====
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.transactionId !== transactionId || decoded.userId !== userId) {
      throw new Error('Invalid token for this transaction');
    }

    // ===== 5. Load transaction trong session =====
    const trx = await Transaction.findById(transactionId).session(session);
    if (!trx || trx.customerId.toString() !== userId) throw new Error('Transaction not found');
    if (trx.status !== 'OTP_SENT') throw new Error('Invalid status for OTP verification');

    // ===== 6. Verify OTP =====
    const otpResult = await verifyOTP(transactionId, code);
    if (!otpResult.valid) throw new Error('Invalid or expired OTP');

    trx.status = 'PENDING';
    await trx.save({ session });

    // ===== 7. Check tuition status =====
    const tuition = await getTuition(trx.tuitionId);
    if (tuition.status !== 'UNPAID') throw new Error('Tuition already paid');

    // ===== 8. Check user balance =====
    const user = await getUserInfo(userId);
    const amount = parseFloat(tuition.amount);
    if (user.balance < amount) throw new Error('Insufficient balance');

    // ===== 9. Deduct balance =====
    const originalBalance = user.balance;
    await updateUserBalance(userId, user.balance - amount, transactionId);

    // ===== 10. Update tuition =====
    try {
      await updateTuition(tuition._id, { status: 'PAID' }, transactionId);
    } catch (err) {
      // rollback balance nếu fail
      await revertUserBalance(userId, originalBalance, transactionId);
      throw new Error('Failed to update tuition: ' + err.message);
    }

    // ===== 11. Mark transaction SUCCESS =====
    trx.status = 'SUCCESS';
    await trx.save({ session });

    await session.commitTransaction();

    // ===== 12. Kết quả =====
    const result = { message: 'Payment successful', transactionId };
    if (req.saveIdempotency) {
      // lưu vào Redis để lần sau request lại với cùng IdemKey thì trả luôn
      await req.saveIdempotency(result);
    }

    return res.json(result);

  } catch (err) {
    await session.abortTransaction();

    if (transactionId) {
      await Transaction.findByIdAndUpdate(transactionId, {
        status: 'FAILED',
        failureReason: err.message
      });
    }

    return res.status(400).json({ message: err.message });

  } finally {
    session.endSession();
    if (lockKey) await releaseLock(lockKey);
  }
}

  // B3: Xác minh OTP + Thanh toán
  async verifyOTP(req, res) {
    const { transactionId, code, token } = req.body
    const userId = req.user.id
    const session = await mongoose.startSession()
    let lockKey

    try {
      const transaction = await Transaction.findById(transactionId)
      if (!transaction) throw new Error('Transaction not found')
      // Redis lock tránh double spend
      lockKey = `lock:tuition:${transaction.tuitionId}`
      const lockAcquired = await acquireLock(lockKey)
      if (!lockAcquired) {
        throw new Error('Another transaction is processing this tuition')
      }

      session.startTransaction()

      // Xác minh JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      if (decoded.transactionId !== transactionId || decoded.userId !== userId) {
        throw new Error('Invalid token for this transaction')
      }

      const trx = await Transaction.findById(transactionId).session(session)
      if (!trx || trx.customerId.toString() !== userId) {
        throw new Error('Transaction not found')
      }
      if (trx.status !== 'OTP_SENT') {
        throw new Error('Invalid status for OTP verification')
      }

      const otpResult = await verifyOTP(transactionId, code)
      if (!otpResult.valid) throw new Error('Invalid or expired OTP')

      trx.status = 'PENDING'
      await trx.save({ session })

      const tuition = await getTuition(trx.tuitionId)
      if (tuition.status !== 'UNPAID') {
        throw new Error('Tuition already paid')
      }

      const user = await getUserInfo(userId)
      const amount = parseFloat(tuition.amount)
      if (user.balance < amount) {
        throw new Error('Insufficient balance')
      }

      const originalBalance = user.balance
      await updateUserBalance(userId, user.balance - amount, transactionId)
      try {
        await updateTuition(tuition._id, { status: 'PAID' }, transactionId)
      } catch (err) {
        await revertUserBalance(userId, originalBalance, transactionId)
        throw new Error('Failed to update tuition: ' + err.message)
      }

      trx.status = 'SUCCESS'
      await trx.save({ session })

      await session.commitTransaction()
      res.json({ message: 'Payment successful', transactionId })
    } catch (err) {
      await session.abortTransaction()
      if (transactionId) {
        await Transaction.findByIdAndUpdate(transactionId, {
          status: 'FAILED',
          failureReason: err.message
        })
      }
      res.status(400).json({ message: err.message })
    } finally {
      session.endSession()
      if (lockKey) await releaseLock(lockKey)
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
  //Hủy transaction
  async cancelTransaction(req, res) {
    const { transactionId, token } = req.body
    const userId = req.user.id

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      if (decoded.transactionId !== transactionId || decoded.userId !== userId) {
        return res.status(403).json({ message: 'Invalid token for this transaction' })
      }

      const trx = await Transaction.findById(transactionId)
      if (!trx || trx.customerId.toString() !== userId) {
        return res.status(404).json({ message: 'Transaction not found' })
      }

      // Chỉ cho hủy nếu chưa verify
      if (trx.status !== 'INITIATED' && trx.status !== 'OTP_SENT') {
        return res.status(400).json({ message: 'Transaction cannot be canceled at this stage' })
      }
      if (transaction.status === 'OTP_SENT') {
        return res.status(409).json({ message: 'Another OTP request is already being processed for this tuition' })
      }

      trx.status = 'CANCELED'
      trx.failureReason = 'Canceled by user'
      await trx.save()

      res.json({ message: 'Transaction canceled successfully', transactionId, status: trx.status })
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Transaction token expired' })
      }
      res.status(400).json({ message: err.message })
    }
  }

}


module.exports = new TransactionController()
