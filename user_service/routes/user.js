const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authenticateToken = require('../middleware/authenticateToken')

router.post('/register', userController.register)
router.get('/profile', authenticateToken, userController.getProfile)
//router.post('/balance', authenticateToken, userController.updateBalance)
router.get('/:username', userController.getUserByUsername)

module.exports = router
