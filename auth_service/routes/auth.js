const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const authenticateToken = require('../middleware/authenticateToken')

router.post('/login', authController.login)
router.post('/refresh', authController.refresh)
router.post('/logout', authenticateToken, authController.logout)

module.exports = router
