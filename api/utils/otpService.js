import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
console.log(process.env.EMAIL_USER);
// Configure transporter with Gmail app password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: "", // Remove spaces from app password
  },
});

// In-memory store (replace with Redis in production)
const otpStore = new Map();

// Generate secure OTP
export const generateSecureOtp = (email, isAdmin = false) => {
  const otp = otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });

  // Create secure payload
  const payload = {
    email,
    timestamp: Date.now(),
    isAdmin,
  };

  // Store with 5-minute expiration
  otpStore.set(otp, {
    payload: encryptPayload(JSON.stringify(payload)),
    expiresAt: Date.now() + 300000, // 5 minutes
  });

  return otp;
};

// Encryption functions
const encryptPayload = (data) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.OTP_ENCRYPTION_KEY, 'hex'),
    iv
  );
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

const decryptPayload = (data) => {
  const [ivHex, encryptedHex] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.OTP_ENCRYPTION_KEY, 'hex'),
    iv
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// Send OTP email
export const sendOtp = async (email, isAdmin = false) => {
    // Validate email format first
    console.log("Admin email being verified:", email);

    if (!isValidEmail(email)) {
        throw new Error('Invalid email address format');
    }

    const otp = generateSecureOtp(email, isAdmin);

    const mailOptions = {
        from: `"InsaneHub" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: isAdmin ? 'Admin Access Verification' : 'Your Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; font-size: 16px;">
            <h2>Welcome to InsaneHub!</h2>
            <p>Your ${isAdmin ? 'Admin' : 'User'} OTP is:</p>
            <h1 style="color: #4CAF50; font-size: 36px;">${otp}</h1>
            <p>This code will expire in 5 minutes. Please do not share it with anyone.</p>
            <br/>
            <p>Regards,<br/>InsaneHub Team</p>
          </div>
        `
      };
      

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        throw new Error('Failed to send verification email. Please try again later.');
    }
};

// Email validation helper
const isValidEmail = (email) => {
    // Remove any trailing invalid characters
    const cleanEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '');
    
    // Basic email regex validation
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(cleanEmail);
};

// Verify OTP
export const verifyOtp = (otp, email) => {
  const otpData = otpStore.get(otp);
  if (!otpData) return false;

  // Clean expired OTPs
  if (Date.now() > otpData.expiresAt) {
    otpStore.delete(otp);
    return false;
  }

  try {
    const payload = JSON.parse(decryptPayload(otpData.payload));
    
    // Verify email matches
    if (payload.email !== email) {
      return false;
    }

    otpStore.delete(otp); // One-time use
    return {
      isValid: true,
      isAdmin: payload.isAdmin,
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    return false;
  }
};