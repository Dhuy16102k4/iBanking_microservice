const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authenticateToken = require('../middleware/authenticateToken')

router.post('/register', userController.register)
router.get('/profile', authenticateToken, userController.getProfile)
//router.post('/balance', authenticateToken, userController.updateBalance)





//services
router.get('/id/:userId', userController.getUserbyId)        
router.get('/username/:username', userController.getUserByUsername)
router.patch('/balance/:userId', userController.updateBalance)

module.exports = router

