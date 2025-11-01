const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const USER_EMAIL = process.env.USER_EMAIL;

// OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // redirect URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

async function sendOTP(toEmail, otpCode) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const currentTime = new Date();
    const expirationTime = new Date(currentTime.getTime() + 30 * 60 * 1000); 
    const expirationTimeString = expirationTime.toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'short',
      timeStyle: 'medium'
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: USER_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    const mailOptions = {
      from: `iBanking OTP <${USER_EMAIL}>`,
      to: toEmail,
      subject: 'iBanking Transaction OTP',
      text: `Your OTP code is: ${otpCode}. This code expires at ${expirationTimeString} (UTC). Please use this code to complete your transaction.`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif; line-height:1.6">
          <h2>iBanking Transaction Verification</h2>
          <p>Your one-time password (OTP) is:</p>
          <h1 style="color:#2e86de">${otpCode}</h1>
          <p>This code expires at <strong>${expirationTimeString} (UTC)</strong>.</p>
          <div id="countdown" style="font-size: 16px; color: #d63031; font-weight: bold;">
            Time remaining: <span id="timer">30:00</span>
          </div>
          <p>This code is valid for 30 minutes. Do not share it with anyone.</p>
          <p>If you did not request this, please ignore this email.</p>
          <script>
            function startCountdown() {
              let timeLeft = 30 * 60; // 30 minutes in seconds
              const timerElement = document.getElementById('timer');
              if (!timerElement) return;

              const countdown = setInterval(() => {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerElement.textContent = \`\${minutes}:\${seconds < 10 ? '0' : ''}\${seconds}\`;
                timeLeft--;
                if (timeLeft < 0) {
                  clearInterval(countdown);
                  timerElement.textContent = 'Expired';
                }
              }, 1000);
            }
            window.onload = startCountdown;
          </script>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (err) {
    console.error('Error sending OTP email:', err);
    throw err;
  }
}

/**
 * Gửi email thông báo giao dịch thành công
 * @param {string} toEmail Email người nhận
 * @param {object} details Chi tiết giao dịch { transactionId, tuitionId, amount, date }
 */
async function sendSuccessEmail(toEmail, details) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: USER_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });

    // Định dạng ngày và số tiền cho đẹp
    const formattedDate = details.date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(details.amount);

    const mailOptions = {
      from: `iBanking Notifications <${USER_EMAIL}>`,
      to: toEmail,
      subject: 'Transaction Successful - Your Payment Has Been Confirmed',
      text: `Your payment was successful.
             Transaction ID: ${details.transactionId}
             Tuition ID: ${details.tuitionId}
             Amount: ${formattedAmount}
             Date: ${formattedDate}
             Thank you for using our service.`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif; line-height:1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #27ae60;">Payment Successful!</h2>
          <p>Hello,</p>
          <p>Your payment has been confirmed. Thank you for using iBanking.</p>
          <hr>
          <h3 style="color: #333;">Transaction Details:</h3>
          <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${details.transactionId}</p>
          <p style="margin: 5px 0;"><strong>Tuition ID:</strong> ${details.tuitionId}</p>
          <p style="margin: 5px 0;"><strong>Amount Paid:</strong> <span style="color:#27ae60; font-weight:bold;">${formattedAmount}</span></p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formattedDate} (Vietnam Time)</p>
          <hr>
          <p style="font-size: 0.9em; color: #777;">If you did not make this transaction, please contact our support immediately.</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[MAIL_SUCCESS] Sent success email to ${toEmail} for TxID ${details.transactionId}`);
    return result;
  } catch (err) {
    console.error(`[MAIL_ERROR] Failed to send success email to ${toEmail} for TxID ${details.transactionId}:`, err.message);
  }
}

module.exports = {
  sendOTP,
  sendSuccessEmail
};