const exprees  = require('express');
const router = exprees.Router();
const OtpController = require('../controllers/otpController');
const authenticateToken = require('../middleware/authenticateToken');


router.post('/create', OtpController.createOtp);

router.post('/verify', OtpController.verifyOTP);

module.exports = router;