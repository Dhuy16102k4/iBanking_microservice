const express = require('express');
const router = express.Router();
const transaction = require('../controllers/transactionController');
const authenticateToken = require('../middleware/authenticateToken')


router.post('/create', authenticateToken , transaction.createTransaction);


router.post('/send', authenticateToken , transaction.sendOTP);

router.post('/verify', authenticateToken , transaction.verifyOTP);

router.post('/cancel', authenticateToken, transaction.cancelTransaction)

router.get('/', authenticateToken , transaction.getTransactions);



module.exports = router;
