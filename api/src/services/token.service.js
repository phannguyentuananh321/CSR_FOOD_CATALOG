import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { hashToken, generateSecureToken } from './crypto.service.js';

/**
 * Sign an Access Token (JWT) with strict 1-minute expiration (60s)
 */
export function signAccessToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    role: user.role,
    type: 'access',
  };

  return jwt.sign(payload, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.accessTtlSeconds, // 60s
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
}

/**
 * Verify Access Token strictly validating signature, alg, iss, aud, exp
 */
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });

    if (decoded.type !== 'access') {
      const err = new Error('Invalid token type');
      err.code = 'INVALID_TOKEN_TYPE';
      throw err;
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Access token has expired');
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }
    const err = new Error('Invalid access token');
    err.code = 'INVALID_TOKEN';
    throw err;
  }
}

/**
 * Issue a new Refresh Token and save hash in database
 */
export async function issueRefreshToken({ userId, family = null, userAgent = null, ipAddress = null }) {
  const rawToken = generateSecureToken(64);
  const tokenHash = hashToken(rawToken);
  const tokenFamily = family || crypto.randomUUID();

  const expiresAt = new Date(Date.now() + config.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash,
      family: tokenFamily,
      expiresAt,
      userAgent: userAgent ? userAgent.substring(0, 500) : null,
      ipAddress: ipAddress ? ipAddress.substring(0, 100) : null,
    },
  });

  return {
    rawToken,
    expiresAt,
    family: tokenFamily,
  };
}

/**
 * Rotate Refresh Token with Automatic Reuse Detection
 */
export async function rotateRefreshToken(rawToken, { userAgent = null, ipAddress = null } = {}) {
  if (!rawToken || typeof rawToken !== 'string') {
    const err = new Error('Refresh token is required');
    err.code = 'REFRESH_TOKEN_REQUIRED';
    throw err;
  }

  const tokenHash = hashToken(rawToken);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { User: true },
  });

  if (!record) {
    const err = new Error('Invalid refresh token');
    err.code = 'INVALID_REFRESH_TOKEN';
    throw err;
  }

  // REUSE DETECTION:
  // If the refresh token was already used, an attacker or compromised party may have obtained it!
  // Invalidate the entire token family immediately to protect the user.
  if (record.usedAt) {
    console.warn(`[SECURITY ALERT] Refresh token reuse detected for user ${record.userId}, family: ${record.family}`);
    await prisma.refreshToken.updateMany({
      where: { family: record.family },
      data: { revokedAt: new Date() },
    });

    const err = new Error('Refresh token reuse detected. All sessions in this chain have been revoked.');
    err.code = 'REFRESH_TOKEN_REUSED';
    throw err;
  }

  // Check if token was manually revoked
  if (record.revokedAt) {
    const err = new Error('Refresh token has been revoked');
    err.code = 'REFRESH_TOKEN_REVOKED';
    throw err;
  }

  // Check if token is expired
  if (new Date() > record.expiresAt) {
    const err = new Error('Refresh token has expired');
    err.code = 'REFRESH_TOKEN_EXPIRED';
    throw err;
  }

  // Check user status
  if (!record.User || record.User.status !== 'active') {
    const err = new Error('User account is not active');
    err.code = 'ACCOUNT_INACTIVE';
    throw err;
  }

  // Mark current token as used
  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  // Issue new refresh token within the same family (Token Family continuity)
  const newRefresh = await issueRefreshToken({
    userId: record.userId,
    family: record.family,
    userAgent,
    ipAddress,
  });

  // Issue new 60-second access token
  const newAccessToken = signAccessToken(record.User);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefresh.rawToken,
    user: {
      id: record.User.id,
      email: record.User.email,
      displayName: record.User.displayName || record.User.email.split('@')[0],
      role: record.User.role,
    },
  };
}

/**
 * Revoke a specific refresh token (used on Logout)
 */
export async function revokeRefreshToken(rawToken) {
  if (!rawToken) return false;
  const tokenHash = hashToken(rawToken);
  try {
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user (e.g. on Password Reset or Compromise)
 */
export async function revokeAllUserTokens(userId) {
  if (!userId) return;
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
