import { verifyAccessToken } from '../services/token.service.js';

/**
 * Middleware: require valid Access Token (JWT) in Authorization: Bearer <token>
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Missing or malformed Authorization header',
      code: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.code === 'TOKEN_EXPIRED') {
      return res.status(401).json({
        error: 'Access token has expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      error: 'Invalid or tampered access token',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * Middleware: require Admin role (hoặc bất kỳ ai đã đăng nhập thành công)
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    });
  }

  // Đã gỡ bỏ giới hạn role === 'admin': bất kỳ ai đã đăng nhập đều được vào trang quản trị
  return next();
}

/**
 * Optional authentication: attach req.user if token is valid, otherwise proceed
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  try {
    req.user = verifyAccessToken(token);
  } catch {
    // ignore token errors for optional auth
  }
  return next();
}
