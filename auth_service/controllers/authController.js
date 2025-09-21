
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const Token = require('../models/token')
const axios = require('axios')

const JWT_SECRET = process.env.JWT_SECRET || 'secret123'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh123'

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '15m' })
}

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id, username: user.username }, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}

class TokenController {
  async login(req, res) {
    try {
      const { username, password } = req.body
      // gọi sang User Service để lấy user
      const userRes = await axios.get(`http://gateway:4000/users/${username}`)
      const user = userRes.data

      if (!user) return res.status(400).json({ message: 'Invalid credentials' })

      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })

      const accessToken = generateAccessToken(user)
      const refreshToken = generateRefreshToken(user)

      await Token.create({ user: user._id, refreshToken })

      res.json({ accessToken, refreshToken })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }

  async refresh(req, res) {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' })

    const storedToken = await Token.findOne({ refreshToken })
    if (!storedToken) return res.status(403).json({ message: 'Invalid refresh token' })

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid refresh token' })
      const accessToken = generateAccessToken(user)
      res.json({ accessToken })
    })
  }

  async logout(req, res) {
    const { refreshToken } = req.body
    await Token.deleteOne({ refreshToken })
    res.json({ message: 'Logged out successfully' })
  }
}

module.exports = new TokenController()
