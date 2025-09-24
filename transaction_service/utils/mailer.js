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
      text: `Your OTP code is: ${otpCode}. Please use this code to complete your transaction.`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif; line-height:1.6">
          <h2>iBanking Transaction Verification</h2>
          <p>Your one-time password (OTP) is:</p>
          <h1 style="color:#2e86de">${otpCode}</h1>
          <p>This code is valid for a limited time. Do not share it with anyone.</p>
          <p>If you did not request this, please ignore this email.</p>
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
