const express = require('express');
const router = express.Router();
const transaction = require('../controllers/transactionController');
const authenticateToken = require('../middleware/authenticateToken');
const idempotencyMiddleware = require('../middleware/idempotency');

router.post('/create', authenticateToken,idempotencyMiddleware, transaction.createTransaction);

router.post('/send', authenticateToken, idempotencyMiddleware, transaction.sendOTP);

router.post('/verify', authenticateToken, idempotencyMiddleware, transaction.verifyOTP);

router.post('/cancel', authenticateToken, transaction.cancelTransaction);

router.get('/', authenticateToken, transaction.getTransactions);

module.exports = router;
