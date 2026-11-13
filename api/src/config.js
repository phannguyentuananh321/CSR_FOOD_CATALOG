import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const toInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  appBaseUrl: (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  webOrigins: (process.env.WEB_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  databaseUrl: process.env.DATABASE_URL || '',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'dish-images',
  },
  jwt: {
    secret: process.env.JWT_SECRET || process.env.SESSION_SECRET || 'dev_jwt_secret_must_be_very_long_and_secure',
    accessTtlSeconds: 60, // Exact 1-minute expiration requirement
    refreshTtlDays: 7, // 7 days refresh token validity
    issuer: 'am-vi-api',
    audience: 'am-vi-client',
  },
  otp: {
    pepper: process.env.OTP_PEPPER || 'dev_otp_pepper_secret_must_be_at_least_32_characters_long',
    ttlMinutes: 10,
    maxAttempts: 5,
  },
  recaptcha: {
    siteKey: process.env.RECAPTCHA_SITE_KEY || '',
    secretKey: process.env.RECAPTCHA_SECRET_KEY || '',
    verifyUrl: 'https://www.google.com/recaptcha/api/siteverify',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: toInt(process.env.SMTP_PORT, 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || '',
      pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''), // Strip whitespace from Gmail app password if any
    },
    from: process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@amvi.local',
  },
  rateLimit: {
    registrationLimit: toInt(process.env.REGISTRATION_LIMIT, 5),
    registrationWindowMinutes: toInt(process.env.REGISTRATION_WINDOW_MINUTES, 60),
    loginMaxFailuresBeforeCaptcha: 3,
    loginMaxFailuresBeforeLock: 10,
    loginLockMinutes: 5,
    loginWindowMinutes: 15,
  },
  uploadDir: fileURLToPath(new URL('../uploads/', import.meta.url)),
  maxImageSizeBytes: 5 * 1024 * 1024,
};

export const isSupabaseConfigured = Boolean(
  config.supabase.url && config.supabase.serviceRoleKey
);
