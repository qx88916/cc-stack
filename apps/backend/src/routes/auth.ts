import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { UserModel, hashPassword, verifyPassword } from '../models/User';
import { DriverModel } from '../models/Driver';
import { createToken, authMiddleware, type AuthReq } from '../middleware/auth';
import { createOtp, verifyOtp } from '../services/otp';
import { sendEmailOtp, verifyEmailOtp } from '../services/emailOtp';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Too many attempts. Try again later.' },
});
const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP requests. Try again in a minute.' },
});

authRouter.use(authLimiter);

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

function toUserResponse(user: { 
  _id: unknown; 
  email?: string | null; 
  phone?: string | null; 
  name?: string | null; 
  role?: string | null; 
  profilePhoto?: string | null;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: Date 
}) {
  return {
    id: String(user._id),
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    name: user.name ?? undefined,
    role: user.role ?? 'passenger',
    profilePhoto: user.profilePhoto ?? undefined,
    emailVerified: user.emailVerified ?? false,
    phoneVerified: user.phoneVerified ?? false,
    createdAt: user.createdAt,
  };
}

authRouter.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone, purpose } = req.body || {};
    const raw = String(phone || '').trim();
    if (!raw || raw.length < 10) {
      return res.status(400).json({ message: 'Valid phone number required' });
    }
    const normalized = normalizePhone(raw);
    await createOtp(normalized, purpose === 'login' ? 'login' : 'signup');
    res.json({ success: true, message: 'OTP sent' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

authRouter.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { phone, code, name, password } = req.body || {};
    const raw = String(phone || '').trim();
    const codeStr = String(code || '').trim();
    if (!raw || !codeStr) {
      return res.status(400).json({ message: 'Phone and OTP code required' });
    }
    const normalized = normalizePhone(raw);
    if (!verifyOtp(normalized, codeStr)) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    let user = await UserModel.findOne({ phone: normalized }).lean();
    if (!user) {
      // New user signup — require password for phone signups
      if (password) {
        const passwordStr = String(password).trim();
        if (passwordStr.length < 8) {
          return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }
        user = (await UserModel.create({
          phone: normalized,
          name: (name && String(name).trim()) || '',
          passwordHash: await hashPassword(passwordStr),
          phoneVerified: true,
          role: 'passenger',
        })).toObject();
      } else {
        // Legacy: auto-create without password (for backward compatibility)
        user = (await UserModel.create({
          phone: normalized,
          name: (name && String(name).trim()) || '',
          phoneVerified: true,
          role: 'passenger',
        })).toObject();
      }
    }
    const token = createToken(String(user._id), (user.role as string) ?? 'passenger');
    res.json({
      user: toUserResponse(user),
      token,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Email OTP endpoints for email verification
authRouter.post('/send-email-otp', otpLimiter, async (req, res) => {
  try {
    const { email, purpose } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Check if email already exists - ONLY block for signup/registration, not verification
    if (purpose !== 'verification') {
      const existing = await UserModel.findOne({ email: emailNorm });
      if (existing) {
        return res.status(400).json({ message: 'An account with this email already exists' });
      }
    }
    // For verification purpose, allow sending OTP to existing emails (user is verifying their own email)
    
    const code = await sendEmailOtp(emailNorm, purpose || 'verification');
    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (e: any) {
    console.error(e);
    const msg = e?.message?.includes('email') || e?.message?.includes('Email') || e?.message?.includes('provider')
      ? 'Failed to send verification email. Please try again later.'
      : 'Server error';
    res.status(500).json({ message: msg });
  }
});

authRouter.post('/verify-email-otp', otpLimiter, async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code required' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const codeStr = String(code).trim();
    
    // Validate code format (must be 6 digits)
    if (!/^\d{6}$/.test(codeStr)) {
      return res.status(400).json({ message: 'Code must be 6 digits' });
    }
    
    if (!verifyEmailOtp(emailNorm, codeStr)) {
      return res.status(401).json({ message: 'Invalid or expired verification code' });
    }
    
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    const user = await UserModel.findOne({ email: emailNorm }).lean();
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if ((user as any).isDeleted) {
      return res.status(401).json({ message: 'This account has been deleted' });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const valid = await verifyPassword(String(password), user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = createToken(String(user._id), (user.role as string) ?? 'passenger');
    res.json({
      user: toUserResponse(user),
      token,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

authRouter.post('/login-phone', async (req, res) => {
  try {
    const { phone, password } = req.body || {};
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password required' });
    }
    const normalized = normalizePhone(String(phone).trim());
    
    const user = await UserModel.findOne({ phone: normalized }).lean();
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }
    if ((user as any).isDeleted) {
      return res.status(401).json({ message: 'This account has been deleted' });
    }
    if (!user.passwordHash) {
      return res.status(401).json({ message: 'Account not set up with password. Please sign up.' });
    }
    if (!(user as any).phoneVerified) {
      return res.status(401).json({ message: 'Phone number not verified' });
    }
    const valid = await verifyPassword(String(password), user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }
    const token = createToken(String(user._id), (user.role as string) ?? 'passenger');
    res.json({
      user: toUserResponse(user),
      token,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

authRouter.post('/signup', async (req, res) => {
  try {
    const { email, password, name, role = 'passenger' } = req.body || {};
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // Validate name
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    
    const emailNorm = String(email).trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Validate password length
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Check for duplicate email
    const existing = await UserModel.findOne({ email: emailNorm });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }
    
    const allowedRoles = ['passenger', 'driver', 'admin'];
    const roleNorm = allowedRoles.includes(String(role)) ? role : 'passenger';
    const passwordHash = await hashPassword(String(password));
    const user = await UserModel.create({
      email: emailNorm,
      passwordHash,
      name: String(name).trim(),
      role: roleNorm,
    });
    if (user.role === 'driver') {
      const { vehicleMake, vehicleModel, vehicleYear, vehicleColor, plateNumber, phone } = req.body;
      const vehicleDesc = [vehicleMake, vehicleModel, vehicleYear].filter(Boolean).join(' ').trim() || 'Car';
      await DriverModel.findOneAndUpdate(
        { userId: user._id },
        {
          $setOnInsert: {
            userId: user._id,
            isOnline: false,
            name: String(name).trim(),
            vehicle: vehicleDesc,
            vehicleMake: vehicleMake ? String(vehicleMake).trim() : '',
            vehicleModel: vehicleModel ? String(vehicleModel).trim() : '',
            vehicleYear: vehicleYear ? Number(vehicleYear) : undefined,
            vehicleColor: vehicleColor ? String(vehicleColor).trim() : '',
            plateNumber: plateNumber ? String(plateNumber).trim() : '',
            phone: phone ? String(phone).trim() : '',
          },
        },
        { upsert: true }
      );
    }
    const token = createToken(String(user._id), (user.role as string) ?? 'passenger');
    res.status(201).json({
      user: toUserResponse(user),
      token,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Password reset endpoints
authRouter.post('/request-password-reset', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Check if user exists — product requirement: show "Email not registered" when not found
    const user = await UserModel.findOne({ email: emailNorm });
    if (!user) {
      return res.status(404).json({ message: 'Email not registered' });
    }

    // Send password reset OTP
    await sendEmailOtp(emailNorm, 'password_reset');
    res.json({ success: true, message: 'Password reset code sent to your email' });
  } catch (e: any) {
    console.error(e);
    const msg = e?.message?.includes('email') || e?.message?.includes('Email') || e?.message?.includes('provider')
      ? 'Failed to send reset email. Please try again later.'
      : 'Server error';
    res.status(500).json({ message: msg });
  }
});

authRouter.post('/verify-password-reset', otpLimiter, async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code required' });
    }
    const emailNorm = String(email).trim().toLowerCase();
    const codeStr = String(code).trim();
    
    // Validate code format (must be 6 digits)
    if (!/^\d{6}$/.test(codeStr)) {
      return res.status(400).json({ message: 'Code must be 6 digits' });
    }
    
    if (!verifyEmailOtp(emailNorm, codeStr)) {
      return res.status(401).json({ message: 'Invalid or expired reset code' });
    }
    
    res.json({ success: true, message: 'Code verified successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

authRouter.post('/reset-password', otpLimiter, async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password required' });
    }
    
    const emailNorm = String(email).trim().toLowerCase();
    const codeStr = String(code).trim();
    
    // Validate code format
    if (!/^\d{6}$/.test(codeStr)) {
      return res.status(400).json({ message: 'Code must be 6 digits' });
    }
    
    // Validate new password length
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Verify OTP
    if (!verifyEmailOtp(emailNorm, codeStr)) {
      return res.status(401).json({ message: 'Invalid or expired reset code' });
    }
    
    // Find user
    const user = await UserModel.findOne({ email: emailNorm });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update password
    const passwordHash = await hashPassword(String(newPassword));
    user.passwordHash = passwordHash;
    await user.save();
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

authRouter.post('/logout', (_req, res) => {
  res.json({});
});

authRouter.get('/session', authMiddleware, async (req: AuthReq, res) => {
  try {
    const user = await UserModel.findById(req.userId).select('email phone name role profilePhoto emailVerified createdAt').lean();
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    res.json({
      user: toUserResponse(user),
      token: req.headers.authorization?.slice(7) || '',
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

authRouter.post('/refresh', authMiddleware, async (req: AuthReq, res) => {
  try {
    // User is already authenticated by authMiddleware
    // Generate a new token with fresh expiry
    const user = await UserModel.findById(req.userId).select('role').lean();
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newToken = createToken(req.userId!, (user.role as string) ?? 'passenger');
    
    res.json({
      token: newToken,
      expiresIn: '7d', // Match JWT expiry from createToken
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});
