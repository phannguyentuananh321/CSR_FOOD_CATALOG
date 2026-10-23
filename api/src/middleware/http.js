import { config } from '../config.js';
import { BusinessError } from '../utils/errors.js';

// CORS chỉ cho phép origin của SPA được cấu hình qua WEB_ORIGIN.
export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin && config.webOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    ok: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint không tồn tại.' },
  });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof BusinessError || err?.isBusiness) {
    const body = { ok: false, error: { code: err.code, message: err.message } };
    if (err.fields) body.error.fields = err.fields;
    return res.status(200).json(body);
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      ok: false,
      error: { code: 'BAD_JSON', message: 'Dữ liệu gửi lên không hợp lệ.' },
    });
  }
  console.error('[api] Lỗi không dự kiến:', err);
  return res.status(500).json({
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống.' },
  });
}
