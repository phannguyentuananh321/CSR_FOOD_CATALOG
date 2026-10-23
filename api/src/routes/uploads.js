import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import {
  DEFAULT_UPLOAD_FOLDER,
  UPLOAD_FOLDERS,
  isValidUploadFolder,
  removeImage,
  uploadImage,
} from '../lib/storage.js';
import {
  h,
  imageTooLargeError,
  invalidImageTypeError,
  ok,
  validationError,
} from '../utils/errors.js';

const router = Router();

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxImageSizeBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = (file.originalname || '').toLowerCase().slice(
      (file.originalname || '').toLowerCase().lastIndexOf('.')
    );
    if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) cb(null, true);
    else cb(invalidImageTypeError());
  },
});

const singleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return next(imageTooLargeError());
    next(err);
  });
};

// POST /api/uploads?folder=dishes — multipart/form-data, field "file"
// folder nhận một trong: dishes | ingredient | chef (mặc định dishes).
router.post(
  '/',
  singleUpload,
  h(async (req, res) => {
    if (!req.file) throw validationError({ file: 'Vui lòng chọn một tệp ảnh.' });

    const rawFolder = req.query?.folder ?? req.body?.folder;
    const folder = Array.isArray(rawFolder) ? rawFolder[0] : rawFolder;
    const targetFolder = folder === undefined || folder === '' ? DEFAULT_UPLOAD_FOLDER : folder;
    if (!isValidUploadFolder(targetFolder)) {
      throw validationError({
        folder: `Thư mục ảnh không hợp lệ. Chỉ chấp nhận: ${UPLOAD_FOLDERS.join(', ')}.`,
      });
    }

    const publicUrl = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      targetFolder
    );
    ok(res, { path: publicUrl });
  })
);

// DELETE /api/uploads — { "path": "<publicUrl>" } dọn ảnh không còn dùng
router.delete(
  '/',
  h(async (req, res) => {
    const path = req.body?.path;
    if (typeof path !== 'string' || !path) {
      throw validationError({ path: 'Đường dẫn ảnh là bắt buộc.' });
    }
    // Chỉ xóa được ảnh do hệ thống quản lý; ảnh khác bỏ qua, vẫn trả thành công.
    await removeImage(path).catch((err) => {
      console.error('[storage] Không xóa được ảnh:', err.message);
    });
    ok(res, null);
  })
);

export default router;
