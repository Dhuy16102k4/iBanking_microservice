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

    // Calculate expiration time (30 minutes from now)
    const currentTime = new Date();
    const expirationTime = new Date(currentTime.getTime() + 30 * 60 * 1000); // 30 minutes in milliseconds
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
          <!-- Optional JavaScript countdown timer (may not work in most email clients) -->
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
    console.error('Error sending email:', err);
    throw err;
  }
}

module.exports = sendOTP;