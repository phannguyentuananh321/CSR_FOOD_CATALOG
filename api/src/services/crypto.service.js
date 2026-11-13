import argon2 from 'argon2';
import crypto from 'node:crypto';
import { config } from '../config.js';

// Precomputed dummy hash to prevent timing attacks when user does not exist
let dummyHash = null;
(async () => {
  try {
    dummyHash = await argon2.hash('__anti_timing_dummy_password_hash__', {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MiB (OWASP recommended)
      timeCost: 2,
      parallelism: 1,
    });
  } catch (err) {
    console.error('Failed to precompute dummy Argon2 hash:', err);
  }
})();

export async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash, plainPassword) {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch {
    return false;
  }
}

export async function performDummyVerify(plainPassword) {
  if (dummyHash) {
    try {
      await argon2.verify(dummyHash, plainPassword || 'dummy');
    } catch {
      // ignore
    }
  }
}

export function hashOtp(otp) {
  return crypto.createHmac('sha256', config.otp.pepper).update(String(otp)).digest('hex');
}

export function verifyOtpHash(otp, storedHash) {
  const computedHash = hashOtp(otp);
  try {
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}
