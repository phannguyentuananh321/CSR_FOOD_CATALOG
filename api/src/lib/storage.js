import { createClient } from '@supabase/supabase-js';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config, isSupabaseConfigured } from '../config.js';

// Ảnh dùng Supabase Storage khi đã cấu hình; khi chưa có credential thì dùng
// đĩa cục bộ (api/uploads, phục vụ qua /uploads) để dev/test không phụ thuộc mạng.
const supabase = isSupabaseConfigured
  ? createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

// Ảnh được lưu theo thư mục nghiệp vụ để tránh dồn chung một chỗ.
export const UPLOAD_FOLDERS = ['dishes', 'ingredient', 'chef'];
export const DEFAULT_UPLOAD_FOLDER = 'dishes';

export const isValidUploadFolder = (value) =>
  typeof value === 'string' && UPLOAD_FOLDERS.includes(value);

const SAFE_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const newFileName = (originalName, mimetype) => {
  const ext = EXT_BY_MIME[mimetype] || path.extname(originalName || '').toLowerCase();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
};

const withFolder = (fileName, folder) => (folder ? `${folder}/${fileName}` : fileName);

async function uploadToLocalDisk(buffer, fileName, mimetype, folder) {
  const key = withFolder(fileName, folder);
  const fullPath = path.join(config.uploadDir, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return `${config.appBaseUrl}/uploads/${key}`;
}

export async function uploadImage(buffer, originalName, mimetype, folder = null) {
  const fileName = newFileName(originalName, mimetype);
  const safeFolder = isValidUploadFolder(folder) ? folder : null;
  if (supabase) {
    const key = withFolder(fileName, safeFolder);
    const { error } = await supabase.storage
      .from(config.supabase.bucket)
      .upload(key, buffer, { contentType: mimetype, upsert: false });
    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    const { data } = supabase.storage.from(config.supabase.bucket).getPublicUrl(key);
    return data.publicUrl;
  }
  return uploadToLocalDisk(buffer, fileName, mimetype, safeFolder);
}

function supabaseKeyFromUrl(publicUrl) {
  // publicUrl dạng https://<project>.supabase.co/storage/v1/object/public/<bucket>/<key>
  const marker = `/public/${config.supabase.bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx === -1 ? null : publicUrl.slice(idx + marker.length);
}

function localFileNameFromUrl(publicUrl) {
  const prefix = `${config.appBaseUrl}/uploads/`;
  if (!publicUrl.startsWith(prefix)) return null;
  const key = publicUrl.slice(prefix.length);
  const segments = key.split('/');
  // Ảnh mới: <folder>/<file>; ảnh cũ (trước khi chia thư mục): <file>.
  if (segments.length === 1) return SAFE_FILE_NAME.test(segments[0]) ? segments[0] : null;
  if (
    segments.length === 2 &&
    isValidUploadFolder(segments[0]) &&
    SAFE_FILE_NAME.test(segments[1])
  ) {
    return key;
  }
  return null;
}

// Chỉ cho phép xóa những ảnh do hệ thống này tạo ra.
export function isManagedImage(publicUrl) {
  if (typeof publicUrl !== 'string' || !publicUrl) return false;
  if (supabase) {
    return publicUrl.startsWith(`${config.supabase.url}/storage/`) && Boolean(supabaseKeyFromUrl(publicUrl));
  }
  return Boolean(localFileNameFromUrl(publicUrl));
}

export async function removeImage(publicUrl) {
  if (!isManagedImage(publicUrl)) return false;
  if (supabase) {
    const key = supabaseKeyFromUrl(publicUrl);
    const { error } = await supabase.storage.from(config.supabase.bucket).remove([key]);
    if (error) throw new Error(`Supabase remove failed: ${error.message}`);
    return true;
  }
  const name = localFileNameFromUrl(publicUrl);
  await unlink(path.join(config.uploadDir, name)).catch(() => {
    // Ảnh cũ không còn tồn tại: bỏ qua, không làm hỏng thao tác chính.
  });
  return true;
}
