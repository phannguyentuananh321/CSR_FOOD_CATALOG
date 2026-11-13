import { prisma } from '../prisma.js';
import { config } from '../config.js';

/**
 * Verify Google reCAPTCHA v2 token
 */
export async function verifyRecaptcha(token, remoteIp = null) {
  if (!token) return false;
  if (!config.recaptcha.secretKey) {
    // If reCAPTCHA key is not set, allow for development
    return true;
  }

  try {
    const params = new URLSearchParams({
      secret: config.recaptcha.secretKey,
      response: token,
    });
    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const response = await fetch(config.recaptcha.verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();
    return Boolean(data.success);
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

/**
 * Get or initialize RateLimit record for a given key
 */
async function getRateLimitRecord(key, windowMinutes) {
  const now = new Date();
  const windowMs = windowMinutes * 60 * 1000;

  const record = await prisma.rateLimit.findUnique({
    where: { key },
  });

  if (!record) {
    return {
      key,
      count: 0,
      windowStart: now,
      lockedUntil: null,
      isNew: true,
    };
  }

  // Check if window expired
  if (now.getTime() - record.windowStart.getTime() > windowMs) {
    // Window expired, reset window if not currently locked
    if (!record.lockedUntil || now > record.lockedUntil) {
      await prisma.rateLimit.update({
        where: { key },
        data: {
          count: 0,
          windowStart: now,
          lockedUntil: null,
        },
      });
      return {
        key,
        count: 0,
        windowStart: now,
        lockedUntil: null,
        isNew: false,
      };
    }
  }

  return { ...record, isNew: false };
}

/**
 * Check Login Status: whether locked or captcha required
 */
export async function checkLoginRateLimit({ ip, emailNormalized }) {
  const now = new Date();
  const ipKey = `login:ip:${ip}`;
  const emailKey = emailNormalized ? `login:email:${emailNormalized}` : null;

  const ipRecord = await getRateLimitRecord(ipKey, config.rateLimit.loginWindowMinutes);
  const emailRecord = emailKey ? await getRateLimitRecord(emailKey, config.rateLimit.loginWindowMinutes) : null;

  // Check if locked
  if (ipRecord.lockedUntil && now < ipRecord.lockedUntil) {
    const remainingSeconds = Math.ceil((ipRecord.lockedUntil.getTime() - now.getTime()) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      requireCaptcha: true,
    };
  }

  if (emailRecord && emailRecord.lockedUntil && now < emailRecord.lockedUntil) {
    const remainingSeconds = Math.ceil((emailRecord.lockedUntil.getTime() - now.getTime()) / 1000);
    return {
      isLocked: true,
      remainingSeconds,
      requireCaptcha: true,
    };
  }

  // Check failure counts to require captcha (>= 3 failures)
  const maxCount = Math.max(ipRecord.count || 0, emailRecord?.count || 0);
  const requireCaptcha = maxCount >= config.rateLimit.loginMaxFailuresBeforeCaptcha;

  return {
    isLocked: false,
    remainingSeconds: 0,
    requireCaptcha,
    failedAttempts: maxCount,
  };
}

/**
 * Record a failed login attempt
 */
export async function recordLoginFailure({ ip, emailNormalized }) {
  const now = new Date();
  const keys = [`login:ip:${ip}`];
  if (emailNormalized) keys.push(`login:email:${emailNormalized}`);

  for (const key of keys) {
    const record = await prisma.rateLimit.findUnique({ where: { key } });
    const count = (record ? record.count : 0) + 1;
    let lockedUntil = null;

    if (count >= config.rateLimit.loginMaxFailuresBeforeLock) {
      lockedUntil = new Date(now.getTime() + config.rateLimit.loginLockMinutes * 60 * 1000);
    }

    await prisma.rateLimit.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        windowStart: now,
        lockedUntil,
      },
      update: {
        count,
        lockedUntil: lockedUntil || record?.lockedUntil,
      },
    });
  }
}

/**
 * Reset login failures upon successful login
 */
export async function resetLoginFailures({ ip, emailNormalized }) {
  const keys = [`login:ip:${ip}`];
  if (emailNormalized) keys.push(`login:email:${emailNormalized}`);

  for (const key of keys) {
    await prisma.rateLimit.deleteMany({ where: { key } });
  }
}

/**
 * Check registration limit
 */
export async function checkRegistrationLimit(ip) {
  const key = `reg:ip:${ip}`;
  const now = new Date();
  const record = await getRateLimitRecord(key, config.rateLimit.registrationWindowMinutes);

  if (record.count >= config.rateLimit.registrationLimit) {
    return false;
  }

  await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, windowStart: now },
    update: { count: { increment: 1 } },
  });

  return true;
}
