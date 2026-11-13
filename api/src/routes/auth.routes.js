import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import {
  hashPassword,
  verifyPassword,
  performDummyVerify,
  hashOtp,
  verifyOtpHash,
  generateOtp,
  generateSecureToken,
  hashToken,
} from '../services/crypto.service.js';
import {
  signAccessToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
} from '../services/token.service.js';
import {
  checkLoginRateLimit,
  recordLoginFailure,
  resetLoginFailures,
  checkRegistrationLimit,
  verifyRecaptcha,
} from '../services/rate-limit.service.js';
import {
  sendActivationEmail,
  sendPasswordResetEmail,
} from '../services/mailer.service.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

// Password strength validator
function isValidPassword(password) {
  if (!password || typeof password !== 'string' || password.length < 8) {
    return false;
  }
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasLower && hasUpper && hasDigit && hasSpecial;
}

// Cookie options for Refresh Token
const REFRESH_COOKIE_NAME = 'refresh_token';
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  maxAge: config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000,
  path: '/',
});
const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  path: '/',
});

/**
 * GET /api/auth/status?email=...
 * Check if the client IP or email is currently locked or requires reCAPTCHA
 */
authRouter.get('/status', async (req, res, next) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const emailNormalized = req.query.email ? String(req.query.email).trim().toLowerCase() : null;
    const status = await checkLoginRateLimit({ ip, emailNormalized });
    return res.json(status);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/register
 */
authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName, recaptchaToken } = req.body || {};
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email không được để trống', code: 'INVALID_EMAIL' });
    }

    const emailNormalized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
      return res.status(400).json({ error: 'Định dạng email không hợp lệ', code: 'INVALID_EMAIL' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Mật khẩu phải có tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt',
        code: 'WEAK_PASSWORD',
      });
    }

    // Verify registration rate limit
    const allowed = await checkRegistrationLimit(ip);
    if (!allowed) {
      return res.status(429).json({
        error: 'Bạn đã đăng ký quá nhiều lần. Vui lòng thử lại sau 1 giờ.',
        code: 'REGISTRATION_RATE_LIMITED',
      });
    }

    // Optional reCAPTCHA verification if token provided
    if (recaptchaToken) {
      const isCaptchaValid = await verifyRecaptcha(recaptchaToken, ip);
      if (!isCaptchaValid) {
        return res.status(400).json({ error: 'Xác thực reCAPTCHA không thành công', code: 'INVALID_CAPTCHA' });
      }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { emailNormalized },
    });

    if (existingUser) {
      if (existingUser.status === 'active') {
        return res.status(409).json({
          error: 'Email này đã được đăng ký và kích hoạt. Vui lòng đăng nhập.',
          code: 'EMAIL_ALREADY_EXISTS',
        });
      }

      // If pending activation, update user password and regenerate challenge
      const passwordHash = await hashPassword(password);
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          displayName: displayName?.trim() || existingUser.displayName,
        },
      });

      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      const expiresAt = new Date(Date.now() + config.otp.ttlMinutes * 60 * 1000);

      await prisma.activationChallenge.upsert({
        where: { userId: existingUser.id },
        create: {
          id: crypto.randomUUID(),
          userId: existingUser.id,
          otpHash,
          expiresAt,
          attempts: 0,
          updatedAt: new Date(),
        },
        update: {
          otpHash,
          expiresAt,
          attempts: 0,
          sendCount: { increment: 1 },
          lastSentAt: new Date(),
          updatedAt: new Date(),
        },
      });

      try {
        await sendActivationEmail(emailNormalized, otp);
      } catch (err) {
        console.error('Lỗi gửi email kích hoạt:', err);
      }

      return res.json({
        message: 'Tài khoản chưa kích hoạt trước đó đã được cập nhật. Mã OTP mới đã gửi đến email.',
        email: emailNormalized,
        requiresActivation: true,
      });
    }

    // Create new user
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: email.trim(),
        emailNormalized,
        displayName: displayName?.trim() || emailNormalized.split('@')[0],
        passwordHash,
        role: 'viewer',
        status: 'pending',
        updatedAt: new Date(),
      },
    });

    // Create activation challenge
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + config.otp.ttlMinutes * 60 * 1000);

    await prisma.activationChallenge.create({
      data: {
        id: crypto.randomUUID(),
        userId: newUser.id,
        otpHash,
        expiresAt,
        attempts: 0,
        updatedAt: new Date(),
      },
    });

    try {
      await sendActivationEmail(emailNormalized, otp);
    } catch (err) {
      console.error('Lỗi gửi email kích hoạt:', err);
    }

    return res.status(201).json({
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP kích hoạt.',
      email: emailNormalized,
      requiresActivation: true,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/activate
 */
authRouter.post('/activate', async (req, res, next) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email và mã OTP là bắt buộc', code: 'INVALID_INPUT' });
    }

    const emailNormalized = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { emailNormalized },
      include: { ActivationChallenge: true },
    });

    if (!user || !user.ActivationChallenge) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu kích hoạt cho tài khoản này', code: 'NOT_FOUND' });
    }

    const challenge = user.ActivationChallenge;

    if (new Date() > challenge.expiresAt) {
      return res.status(400).json({ error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã.', code: 'OTP_EXPIRED' });
    }

    if (challenge.attempts >= config.otp.maxAttempts) {
      return res.status(429).json({
        error: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu gửi mã mới.',
        code: 'TOO_MANY_ATTEMPTS',
      });
    }

    const isValidOtp = verifyOtpHash(String(otp).trim(), challenge.otpHash);
    if (!isValidOtp) {
      await prisma.activationChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 }, updatedAt: new Date() },
      });
      return res.status(400).json({ error: 'Mã OTP không chính xác', code: 'INVALID_OTP' });
    }

    // Activate user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'active',
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Delete activation challenge
    await prisma.activationChallenge.delete({
      where: { id: challenge.id },
    });

    // Issue Refresh Token & Sign Access Token
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    const refreshData = await issueRefreshToken({
      userId: user.id,
      userAgent,
      ipAddress,
    });

    const accessToken = signAccessToken(user);

    // Set HTTP-only Cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshData.rawToken, getRefreshCookieOptions());

    return res.json({
      message: 'Kích hoạt tài khoản thành công',
      accessToken,
      refreshToken: refreshData.rawToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/activate/resend
 */
authRouter.post('/activate/resend', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc', code: 'INVALID_EMAIL' });
    }

    const emailNormalized = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { emailNormalized },
      include: { ActivationChallenge: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Tài khoản không tồn tại', code: 'USER_NOT_FOUND' });
    }

    if (user.status === 'active') {
      return res.status(400).json({ error: 'Tài khoản đã được kích hoạt rồi. Bạn có thể đăng nhập.', code: 'ALREADY_ACTIVATED' });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + config.otp.ttlMinutes * 60 * 1000);

    await prisma.activationChallenge.upsert({
      where: { userId: user.id },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        otpHash,
        expiresAt,
        attempts: 0,
        updatedAt: new Date(),
      },
      update: {
        otpHash,
        expiresAt,
        attempts: 0,
        sendCount: { increment: 1 },
        lastSentAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await sendActivationEmail(emailNormalized, otp);

    return res.json({ message: 'Mã OTP kích hoạt mới đã được gửi vào email của bạn.' });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/login
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password, recaptchaToken } = req.body || {};
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ email và mật khẩu', code: 'MISSING_CREDENTIALS' });
    }

    const emailNormalized = String(email).trim().toLowerCase();

    // Check rate limit & lockout
    const rateStatus = await checkLoginRateLimit({ ip, emailNormalized });
    if (rateStatus.isLocked) {
      return res.status(429).json({
        error: `Tài khoản hoặc địa chỉ IP tạm thời bị khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${rateStatus.remainingSeconds} giây.`,
        code: 'ACCOUNT_LOCKED',
        remainingSeconds: rateStatus.remainingSeconds,
      });
    }

    // If reCAPTCHA is required
    if (rateStatus.requireCaptcha) {
      if (!recaptchaToken) {
        return res.status(400).json({
          error: 'Vui lòng hoàn thành xác thực mã reCAPTCHA',
          code: 'CAPTCHA_REQUIRED',
          requireCaptcha: true,
        });
      }

      const isCaptchaValid = await verifyRecaptcha(recaptchaToken, ip);
      if (!isCaptchaValid) {
        return res.status(400).json({
          error: 'Mã reCAPTCHA không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.',
          code: 'INVALID_CAPTCHA',
          requireCaptcha: true,
        });
      }
    }

    // Lookup user
    const user = await prisma.user.findUnique({
      where: { emailNormalized },
    });

    if (!user) {
      // Anti-timing attack
      await performDummyVerify(password);
      await recordLoginFailure({ ip, emailNormalized });
      const nextStatus = await checkLoginRateLimit({ ip, emailNormalized });
      return res.status(401).json({
        error: 'Email hoặc mật khẩu không chính xác',
        code: 'INVALID_CREDENTIALS',
        requireCaptcha: nextStatus.requireCaptcha,
      });
    }

    // Check status
    if (user.status !== 'active') {
      return res.status(403).json({
        error: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email và nhập mã OTP kích hoạt.',
        code: 'ACCOUNT_NOT_ACTIVATED',
        email: user.email,
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      await recordLoginFailure({ ip, emailNormalized });
      const nextStatus = await checkLoginRateLimit({ ip, emailNormalized });
      return res.status(401).json({
        error: 'Email hoặc mật khẩu không chính xác',
        code: 'INVALID_CREDENTIALS',
        requireCaptcha: nextStatus.requireCaptcha,
      });
    }

    // Successful login: reset failed counters
    await resetLoginFailures({ ip, emailNormalized });

    // Issue Refresh Token & Sign Access Token
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    const refreshData = await issueRefreshToken({
      userId: user.id,
      userAgent,
      ipAddress,
    });

    const accessToken = signAccessToken(user);

    // Set HTTP-only Cookie
    res.cookie(REFRESH_COOKIE_NAME, refreshData.rawToken, getRefreshCookieOptions());

    // Dual delivery: return both tokens in JSON body
    return res.json({
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken: refreshData.rawToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Method B: Reads refresh token from Cookie OR JSON Body
 * Rotates Refresh Token and returns new 60s Access Token
 */
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

    if (!rawToken) {
      return res.status(401).json({
        error: 'Refresh token không được tìm thấy (cần gửi qua Cookie hoặc body.refreshToken)',
        code: 'REFRESH_TOKEN_REQUIRED',
      });
    }

    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    try {
      const result = await rotateRefreshToken(rawToken, { userAgent, ipAddress });

      // Update cookie
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getRefreshCookieOptions());

      return res.json({
        message: 'Làm mới token thành công',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (err) {
      // Clear cookie on any refresh failure
      res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());

      if (err.code === 'REFRESH_TOKEN_REUSED') {
        return res.status(403).json({
          error: 'Cảnh báo bảo mật: Refresh token bị tái sử dụng. Toàn bộ phiên đăng nhập đã bị vô hiệu hóa. Vui lòng đăng nhập lại.',
          code: 'REFRESH_TOKEN_REUSED',
        });
      }

      if (err.code === 'REFRESH_TOKEN_EXPIRED') {
        return res.status(401).json({
          error: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
          code: 'REFRESH_TOKEN_EXPIRED',
        });
      }

      return res.status(401).json({
        error: err.message || 'Refresh token không hợp lệ',
        code: err.code || 'INVALID_REFRESH_TOKEN',
      });
    }
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', async (req, res, next) => {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
    if (rawToken) {
      await revokeRefreshToken(rawToken);
    }

    res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());

    return res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/forgot
 */
authRouter.post('/forgot', async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email là bắt buộc', code: 'INVALID_EMAIL' });
    }

    const emailNormalized = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { emailNormalized },
    });

    if (user && user.status === 'active') {
      const resetToken = generateSecureToken(32);
      const tokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      await prisma.passwordReset.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const resetUrl = `${config.webOrigins[0] || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      try {
        await sendPasswordResetEmail(user.email, resetUrl);
      } catch (err) {
        console.error('Lỗi gửi email reset password:', err);
      }
    }

    // Always respond with identical message to prevent email enumeration
    return res.json({
      message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/auth/reset
 */
authRouter.post('/reset', async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: 'Token và mật khẩu mới là bắt buộc', code: 'INVALID_INPUT' });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: 'Mật khẩu phải có tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt',
        code: 'WEAK_PASSWORD',
      });
    }

    const tokenHash = hashToken(token);
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { tokenHash },
      include: { User: true },
    });

    if (!resetRecord || resetRecord.usedAt || new Date() > resetRecord.expiresAt) {
      return res.status(400).json({
        error: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
        code: 'INVALID_RESET_TOKEN',
      });
    }

    const passwordHash = await hashPassword(password);

    // Update password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    // Mark reset record as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    });

    // SECURITY: Revoke all existing refresh tokens for this user!
    await revokeAllUserTokens(resetRecord.userId);

    // Clear any existing cookie
    res.clearCookie(REFRESH_COOKIE_NAME, getClearCookieOptions());

    return res.json({
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.',
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/auth/me
 */
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng', code: 'USER_NOT_FOUND' });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});
