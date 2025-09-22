
const User = require('../models/user')
const bcrypt = require('bcrypt')

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
        // id: user._id,
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
    const { amount } = req.body
    const user = await User.findById(req.user.id)
    user.balance = mongoose.Types.Decimal128.fromString((user.getBalance() + amount).toString())
    await user.save()
    res.json({ balance: user.getBalance() })
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
      const user = await User.findById(req.params.userId)
      if (!user) return res.status(404).json({ message: 'User not found' })
      res.json(user)
    }
    catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
  
  async updateBalance(req, res) {
    try {
      const { newBalance } = req.body;
      const { userId } = req.params;

      if (newBalance === undefined || isNaN(newBalance)) {
        return res.status(400).json({ message: 'Invalid balance value' });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { balance: mongoose.Types.Decimal128.fromString(newBalance.toString()) },
        { new: true }
      );

      if (!user) return res.status(404).json({ message: 'User not found' });

      return res.json({
        balance: user.getBalance(), 
      });
    } catch (err) {
      console.error('Error updating balance:', err);
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new UserController()
