const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'unithrift_super_secret_jwt_key_2026_campus_auth';

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// In-Memory Storage (Can be connected to DB in production)
const otpStore = new Map(); // key: email, value: { code, expiresAt, role }
const usersStore = new Map(); // key: email, value: { id, email, role, full_name, phone_number, college, is_verified, verification_status }

// Helper: Check if SMTP is configured
function isSmtpConfigured() {
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  return user && pass && user !== 'your_email@gmail.com' && pass !== 'your_gmail_app_password';
}

// Helper: Get Nodemailer Transporter
function getTransporter() {
  if (isSmtpConfigured()) {
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true' && port === 465;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: port,
      secure: secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }
  return null;
}

// Generate HTML Email Template for OTP
function generateOtpEmailHtml(email, otpCode) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f9fb; margin: 0; padding: 20px; color: #191c1e; }
        .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e0e3e5; }
        .logo-container { text-align: center; margin-bottom: 24px; }
        .logo { font-size: 26px; font-weight: 800; color: #006e2f; letter-spacing: -0.5px; text-decoration: none; }
        .title { font-size: 20px; font-weight: 700; color: #0b1c30; margin-bottom: 12px; text-align: center; }
        .subtitle { font-size: 14px; color: #565e74; text-align: center; line-height: 1.5; margin-bottom: 28px; }
        .otp-card { background: #e5eeff; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; border: 1px solid #d3e4fe; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #006e2f; font-family: 'Courier New', monospace; }
        .expiry-note { font-size: 12px; color: #6d7b6c; margin-top: 8px; font-weight: 500; }
        .footer { text-align: center; font-size: 12px; color: #757687; margin-top: 32px; border-top: 1px solid #f2f4f6; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-container">
          <span class="logo">UniThrift</span>
        </div>
        <h2 class="title">Your Verification Code</h2>
        <p class="subtitle">Enter the 6-digit code below to log into your UniThrift campus account. Do not share this code with anyone.</p>
        <div class="otp-card">
          <div class="otp-code">${otpCode}</div>
          <div class="expiry-note">⏳ Valid for 10 minutes</div>
        </div>
        <p class="subtitle" style="font-size: 13px;">If you did not request this verification code, please ignore this email.</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} UniThrift – Campus Marketplace. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
}

// Route: Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'UniThrift Auth Backend Server',
    smtpConfigured: isSmtpConfigured(),
    time: new Date().toISOString()
  });
});

// Route: Send Email OTP
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set 10-minute expiry timestamp
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Save in OTP store
    otpStore.set(cleanEmail, {
      code: otpCode,
      expiresAt: expiresAt,
      role: role || 'customer'
    });

    const transporter = getTransporter();

    if (transporter) {
      // Send real email via Nodemailer SMTP
      const mailOptions = {
        from: process.env.SMTP_FROM || `"UniThrift" <${process.env.SMTP_USER}>`,
        to: cleanEmail,
        subject: `${otpCode} is your UniThrift verification code`,
        html: generateOtpEmailHtml(cleanEmail, otpCode)
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[SMTP EMAIL SENT] OTP code sent successfully to ${cleanEmail}`);

        return res.json({
          success: true,
          message: `Verification code sent to ${cleanEmail}`
        });
      } catch (smtpErr) {
        console.error(`[SMTP ERROR] Failed to send email to ${cleanEmail}:`, smtpErr);
        return res.status(500).json({
          success: false,
          error: `SMTP Error: ${smtpErr.message}`
        });
      }
    } else {
      // Dev Mode: SMTP not configured yet
      console.log(`\n==============================================`);
      console.log(`[DEV MODE OTP GENERATED]`);
      console.log(`Email: ${cleanEmail}`);
      console.log(`OTP Code: ${otpCode}`);
      console.log(`Expires: ${new Date(expiresAt).toLocaleTimeString()}`);
      console.log(`==============================================\n`);

      return res.json({
        success: true,
        message: `[Dev Mode] OTP code generated: ${otpCode} (Logged to terminal)`,
        devOtp: otpCode,
        isDevMode: true
      });
    }
  } catch (err) {
    console.error('[SEND OTP ERROR]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code. ' + (err.message || '')
    });
  }
});

// Route: Verify Email OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP code are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = otpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({ success: false, error: 'No OTP requested for this email or OTP expired. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ success: false, error: 'OTP code has expired. Please request a new code.' });
    }

    if (record.code !== otp.trim()) {
      return res.status(400).json({ success: false, error: 'Invalid verification code. Please check your email and try again.' });
    }

    // OTP Code is valid! Consume it.
    otpStore.delete(cleanEmail);

    // Get or Create User Record
    let user = usersStore.get(cleanEmail);
    if (!user) {
      user = {
        id: 'usr_' + Math.random().toString(36).substring(2, 11),
        email: cleanEmail,
        role: record.role || 'customer',
        full_name: null,
        phone_number: null,
        college: null,
        is_verified: false,
        verification_status: 'unverified',
        created_at: new Date().toISOString()
      };
      usersStore.set(cleanEmail, user);
    }

    // Generate JWT Auth Token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Determine Onboarding Step
    let onboardingStep = 'index';
    if (!user.full_name || !user.phone_number || !user.college) {
      onboardingStep = 'profile_setup';
    } else if (!user.is_verified && user.verification_status !== 'pending') {
      onboardingStep = 'id_verification';
    }

    console.log(`[AUTH SUCCESS] User ${cleanEmail} authenticated successfully. Onboarding step: ${onboardingStep}`);

    res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user,
      onboardingStep
    });
  } catch (err) {
    console.error('[VERIFY OTP ERROR]', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP code. ' + (err.message || '')
    });
  }
});

// Route: Get Current Authenticated User Profile
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = usersStore.get(decoded.email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
});

// Route: Update User Profile
app.post('/api/auth/update-profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = usersStore.get(decoded.email);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const { full_name, phone_number, college, year_of_study, enrollment_number, avatar_url } = req.body;

    user = {
      ...user,
      ...(full_name && { full_name }),
      ...(phone_number && { phone_number }),
      ...(college && { college }),
      ...(year_of_study && { year_of_study }),
      ...(enrollment_number && { enrollment_number }),
      ...(avatar_url && { avatar_url }),
      updated_at: new Date().toISOString()
    };

    usersStore.set(decoded.email, user);

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

// Serve frontend static files if requested
app.use(express.static(path.join(__dirname, '..')));

// Start Express Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 UniThrift Auth Server running on http://localhost:${PORT}`);
  console.log(`📧 SMTP Email Status: ${isSmtpConfigured() ? 'CONFIGURED (Sending live emails)' : 'DEV MODE (Logging OTPs to terminal)'}`);
  console.log(`======================================================\n`);
});
