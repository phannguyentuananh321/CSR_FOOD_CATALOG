// Lỗi nghiệp vụ: HTTP 200, ok:false, error:{code,message,fields?}
export class BusinessError extends Error {
  constructor(code, message, fields) {
    super(message);
    this.isBusiness = true;
    this.code = code;
    this.fields = fields;
  }
}

export const notFoundError = (message) => new BusinessError('NOT_FOUND', message);

export const validationError = (
  fields,
  message = 'Vui lòng kiểm tra lại các trường thông tin bị lỗi.'
) => new BusinessError('VALIDATION_FAILED', message, fields);

export const relationNotFoundError = (message) =>
  new BusinessError('RELATION_NOT_FOUND', message);

export const inUseError = (message) => new BusinessError('IN_USE', message);

export const invalidImageTypeError = () =>
  new BusinessError(
    'INVALID_IMAGE_TYPE',
    'Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG, JPEG, PNG, WEBP.'
  );

export const imageTooLargeError = () =>
  new BusinessError('IMAGE_TOO_LARGE', 'Dung lượng ảnh không được vượt quá 5 MB.');

export const ok = (res, data) => res.json({ ok: true, data });

// Bọc async handler để lỗi luôn đi qua error-handling middleware.
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
