const exprees  = require('express');
const router = exprees.Router();
const OtpController = require('../controllers/otpController');
const authenticate = require('../middleware/authenticate');


router.post('/create', OtpController.createOtp);

router.post('/verify', OtpController.verifyOTP);

module.exports = router;