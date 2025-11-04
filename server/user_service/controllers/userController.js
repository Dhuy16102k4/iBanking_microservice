
const User = require('../models/user')
const bcrypt = require('bcrypt')
const mongoose = require('mongoose');
class UserController {
  async register(req, res) {
    try {
      const { username, password, fullName, phone, email } = req.body
      if (!username || !password || !fullName || !phone || !email)
        return res.status(400).json({ message: 'All fields are required' })

      const existing = await User.findOne({ $or: [{ username }, { email }] })
      if (existing) return res.status(400).json({ message: 'Username or email exists' })

      const hashed = await bcrypt.hash(password, 10)
      const newUser = new User({ username, password: hashed, fullName, phone, email })
      await newUser.save()

      res.json({ message: 'User registered successfully' })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id)
      if (!user) return res.status(404).json({ message: 'User not found' })

      res.json({
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        balance: user.getBalance()
      })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
  // ko can 
  async updateBalance(req, res) {
    try {

      console.log('Toàn bộ req.body:', JSON.stringify(req.body));

      const { amount } = req.body;
      console.log('Giá trị "amount" nhận được:', amount);
      console.log('Kiểu dữ liệu của "amount":', typeof amount);
 

      const amountToAdd = parseFloat(amount);

      if (isNaN(amountToAdd)) {
        console.error('LỖI: amountToAdd là NaN. Giá trị "amount" không hợp lệ.');
        return res.status(400).json({ message: "Invalid amount value. Must be a number." });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = user.getBalance();
      const newBalance = currentBalance + amountToAdd;

      console.log(`Tính toán: ${currentBalance} (cũ) + ${amountToAdd} (mới) = ${newBalance} (tổng)`);

      user.balance = mongoose.Types.Decimal128.fromString(newBalance.toString());
      await user.save();

      res.json({ balance: user.getBalance() });

    } catch (error) {
      console.error('--- [DEBUG] LỖI TRONG CATCH ---', error.message);
      res.status(500).json({ message: error.message });
    }
  }

  async getUserByUsername(req, res) { //FIX
    try {
      const user = await User.findOne({ username: req.params.username })
      if (!user) return res.status(404).json({ message: 'User not found' })
      res.json(user)
    }
    catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  async getUserbyId(req, res) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        balance: user.getBalance()
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async deductBalance(req, res) {
    const { amountToDeduct, transactionId } = req.body;
    const userId = req.params.id;
    const session = await mongoose.startSession();
    session.startTransaction();

    console.log(`[UserSvc] DEDUCT_START: User: ${userId} | Amount: ${amountToDeduct} | TxID: ${transactionId}`);

    try {
      const amount = parseFloat(amountToDeduct);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid amount");
      }

      const user = await User.findById(userId).session(session);
      if (!user) throw new Error("User not found");

      const currentBalance = user.getBalance(); // Kiểu Number
      const currentBalanceDecimal = user.balance; // Kiểu Decimal128 (Object)

      if (currentBalance < amount) {
        throw new Error("Insufficient balance");
      }

      const newBalance = currentBalance - amount;

      // "Optimistic Lock": Chỉ update nếu `balance` khớp với giá trị đã đọc
      const result = await User.findOneAndUpdate(
        {
          _id: userId,
          balance: currentBalanceDecimal
        },
        {
          $set: {
            balance: mongoose.Types.Decimal128.fromString(newBalance.toString())
          }
        },
        { new: true, session: session }
      );

      if (!result) {
        // Nếu `result` là null -> Race condition đã xảy ra
        throw new Error("Balance update conflict, please try again");
      }

      await session.commitTransaction();

      console.log(`[UserSvc] DEDUCT_SUCCESS: User: ${userId} | NewBalance: ${newBalance} | TxID: ${transactionId}`);
      res.json({ balance: result.getBalance() });

    } catch (err) {
      await session.abortTransaction();
      console.error(`[UserSvc] DEDUCT_FAILED: User: ${userId} | TxID: ${transactionId} | Error: ${err.message}`);

      if (err.message.includes("conflict")) {
        return res.status(409).json({ message: err.message }); // Lỗi 409 Conflict
      }
      if (err.message.includes("Insufficient") || err.message.includes("Invalid")) {
        return res.status(400).json({ message: err.message }); // Lỗi 400 Bad Request
      }
      res.status(500).json({ message: err.message });
    } finally {
      session.endSession();
    }
  }
  async creditBalance(req, res) {
    const { amountToCredit, transactionId } = req.body
    const userId = req.params.id
    const session = await mongoose.startSession()
    session.startTransaction()

    console.log(`[UserSvc] CREDIT_START: User: ${userId} | Amount: ${amountToCredit} | TxID: ${transactionId}`)

    try {
      const amount = parseFloat(amountToCredit)
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Invalid credit amount")
      }

      const user = await User.findById(userId).session(session)
      if (!user) throw new Error("User not found")

      const currentBalance = user.getBalance()
      const currentBalanceDecimal = user.balance
      const newBalance = currentBalance + amount// Phép CỘNG

      const result = await User.findOneAndUpdate(
        {
          _id: userId,
          balance: currentBalanceDecimal
        },
        {
          $set: {
            balance: mongoose.Types.Decimal128.fromString(newBalance.toString())
          }
        },
        { new: true, session: session }
      );

      if (!result) {
        throw new Error("Balance credit conflict, please try again")
      }

      await session.commitTransaction();
      console.log(`[UserSvc] CREDIT_SUCCESS: User: ${userId} | NewBalance: ${newBalance} | TxID: ${transactionId}`)
      res.json({ balance: result.getBalance() })

    } catch (err) {
      await session.abortTransaction();
      console.error(`[UserSvc] CREDIT_FAILED: User: ${userId} | TxID: ${transactionId} | Error: ${err.message}`)
      // Lỗi này nghiêm trọng vì đang hoàn tiền, trả 500
      res.status(500).json({ message: err.message })
    } finally {
      session.endSession()
    }
  };
}

module.exports = new UserController()
