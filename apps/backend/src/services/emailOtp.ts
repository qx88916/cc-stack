/**
 * Email OTP service with Brevo integration and Resend backup
 * Uses Redis for production OTP storage, falls back to in-memory for local dev
 */

import * as brevo from '@getbrevo/brevo';
import { Resend } from 'resend';
import { setWithExpiry, get, del, isRedisConnected } from './redis';

// Fallback in-memory storage (only used if Redis unavailable)
const emailOtpStore = new Map<
  string,
  { code: string; expiresAt: number; purpose: 'verification' | 'password_reset' }
>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_TTL_SECONDS = 600; // 10 minutes in seconds for Redis
const OTP_LENGTH = 6;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateCode(): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += digits[Math.floor(Math.random() * 10)];
  }
  return code;
}

async function sendBrevoEmail(to: string, subject: string, htmlContent: string, role: 'passenger' | 'driver' = 'passenger'): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey || apiKey === 'your_brevo_api_key_here') {
    throw new Error('Brevo API key not configured');
  }

  try {
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { 
      name: 'CabConnect', 
      email: process.env.BREVO_SENDER_EMAIL || 'fijicabconnect@gmail.com'
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.tags = [role, 'verification'];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[EMAIL SENT] ${to} via Brevo`);
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
    throw new Error('Failed to send email');
  }
}

async function sendResendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    throw new Error('Resend API key not configured');
  }

  const resend = new Resend(apiKey);
  
  const { data, error } = await resend.emails.send({
    from: `CabConnect <${process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev'}>`,
    to: [to],
    subject,
    html: htmlContent,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
  
  console.log(`[EMAIL SENT] ${to} via Resend (ID: ${data?.id})`);
}

async function sendEmailWithFailover(
  to: string,
  subject: string,
  htmlContent: string,
  role: 'passenger' | 'driver' = 'passenger'
): Promise<void> {
  let brevoError: any;
  
  // Try Brevo first
  try {
    await sendBrevoEmail(to, subject, htmlContent, role);
    return; // Success - no need to try backup
  } catch (error) {
    brevoError = error;
    console.warn(`[EMAIL FAILOVER] Brevo failed: ${brevoError.message}`);
    console.log(`[EMAIL FAILOVER] Attempting Resend as backup...`);
  }

  // Fallback to Resend if Brevo fails
  try {
    await sendResendEmail(to, subject, htmlContent);
    console.log(`[EMAIL FAILOVER] Successfully sent via Resend`);
  } catch (resendError: any) {
    console.error(`[EMAIL FAILOVER] Both providers failed!`);
    console.error(`- Brevo: ${brevoError.message}`);
    console.error(`- Resend: ${resendError.message}`);
    throw new Error('Failed to send email via all providers');
  }
}

/**
 * Store OTP in Redis or fallback to in-memory
 */
async function storeOtp(
  email: string, 
  code: string, 
  purpose: 'verification' | 'password_reset'
): Promise<void> {
  const key = normalizeEmail(email);

  // Try Redis first
  if (isRedisConnected()) {
    const redisKey = `otp:${key}`;
    const otpData = JSON.stringify({ code, purpose });
    const stored = await setWithExpiry(redisKey, otpData, OTP_TTL_SECONDS);
    
    if (stored) {
      console.log(`[OTP REDIS] ${key} -> stored in Redis (expires in ${OTP_TTL_SECONDS}s)`);
      return;
    }
  }

  // Fallback to in-memory if Redis unavailable
  console.warn(`[OTP MEMORY] Redis unavailable, using in-memory storage for ${key}`);
  emailOtpStore.set(key, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    purpose,
  });
}

/**
 * Retrieve OTP from Redis or fallback to in-memory
 */
async function retrieveOtp(email: string): Promise<{ code: string; purpose: 'verification' | 'password_reset' } | null> {
  const key = normalizeEmail(email);

  // Try Redis first
  if (isRedisConnected()) {
    const redisKey = `otp:${key}`;
    const otpData = await get(redisKey);
    
    if (otpData) {
      try {
        return JSON.parse(otpData);
      } catch {
        return null;
      }
    }
  }

  // Fallback to in-memory
  const entry = emailOtpStore.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    emailOtpStore.delete(key);
    return null;
  }

  return { code: entry.code, purpose: entry.purpose };
}

/**
 * Delete OTP from Redis or in-memory
 */
async function deleteOtp(email: string): Promise<void> {
  const key = normalizeEmail(email);

  // Try Redis first
  if (isRedisConnected()) {
    const redisKey = `otp:${key}`;
    await del(redisKey);
  }

  // Also clean in-memory fallback
  emailOtpStore.delete(key);
}

export async function sendEmailOtp(email: string, purpose: 'verification' | 'password_reset' = 'verification', role: 'passenger' | 'driver' = 'passenger'): Promise<string> {
  const key = normalizeEmail(email);

  // SECURITY: Only use mock OTP in development
  const code = (process.env.NODE_ENV === 'development' && process.env.OTP_MOCK_CODE)
    ? process.env.OTP_MOCK_CODE
    : generateCode();

  // Store OTP (Redis or in-memory fallback)
  await storeOtp(email, code, purpose);

  // Log warning if mock OTP is used
  if (process.env.NODE_ENV === 'development' && process.env.OTP_MOCK_CODE) {
    console.log(`⚠️  DEV MODE: Using mock OTP code (${process.env.OTP_MOCK_CODE}) for ${email}`);
  } else if (process.env.NODE_ENV !== 'production') {
    console.log(`[EMAIL OTP] ${key} -> ${code} (purpose: ${purpose}, expires in ${OTP_TTL_MS / 60000} min)`);
  }

  // Send email via Brevo
  const subject = purpose === 'verification' 
    ? `Verify Your ${role === 'driver' ? 'Driver' : 'Passenger'} Account - CabConnect`
    : 'Reset Your Password - CabConnect';
  
  const htmlContent = purpose === 'verification' 
    ? `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .code { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; letter-spacing: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CabConnect</h1>
        </div>
        <div class="content">
          <h2>Your Verification Code</h2>
          <p>Hello,</p>
          <p>Use the following code to verify your ${role} account:</p>
          <div class="code">${code}</div>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 CabConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
    : `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .code { font-size: 32px; font-weight: bold; color: #ef4444; text-align: center; letter-spacing: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CabConnect</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested to reset your password. Use the following code to proceed:</p>
          <div class="code">${code}</div>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
          </div>
        </div>
        <div class="footer">
          <p>&copy; 2026 CabConnect. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const brevoKey = process.env.BREVO_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const hasProvider = (brevoKey && brevoKey !== 'your_brevo_api_key_here') ||
                      (resendKey && resendKey !== 'your_resend_api_key_here');

  if (hasProvider) {
    await sendEmailWithFailover(email, subject, htmlContent, role);
  } else if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.log(`[EMAIL SKIP] No email provider configured. OTP for ${key}: ${code}`);
  } else {
    await deleteOtp(email);
    throw new Error('Email service not configured');
  }

  return code;
}

export async function verifyEmailOtp(email: string, code: string): Promise<boolean> {
  const otpData = await retrieveOtp(email);
  
  if (!otpData || otpData.code !== code) {
    return false;
  }
  
  // Delete OTP after successful verification (one-time use)
  await deleteOtp(email);
  return true;
}

export async function getEmailOtpPurpose(email: string): Promise<'verification' | 'password_reset' | null> {
  const otpData = await retrieveOtp(email);
  return otpData ? otpData.purpose : null;
}
