import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import EntityImage from './EntityImage';

const IMAGE_TYPE_MESSAGE =
  'Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG, JPEG, PNG, WEBP.';
const IMAGE_SIZE_MESSAGE = 'Dung lượng ảnh không được vượt quá 5 MB.';

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, required, error, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-charcoal">
        {label} {required && <span className="text-terracotta">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-semibold text-terracotta-dark">{error}</span>}
    </label>
  );
}

export const inputClass = (error?: string) =>
  `w-full rounded-xl border bg-ivory px-4 py-2.5 text-sm text-charcoal outline-none transition placeholder:text-muted/70 focus:border-olive focus:ring-2 focus:ring-olive/20 ${
    error ? 'border-red-500' : 'border-sand-dark'
  }`;

interface ImageUploadFieldProps {
  label: string;
  alt: string;
  currentImagePath: string | null;
  file: File | null;
  onChange: (file: File | null, error: string | null) => void;
  hint?: string;
}

// Chọn ảnh: kiểm tra định dạng/dung lượng ngay, preview tức thì trong khung 4:3.
export function ImageUploadField({
  label,
  alt,
  currentImagePath,
  file,
  onChange,
  hint,
}: ImageUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (selected: File | null) => {
    setError(null);
    if (!selected) {
      onChange(null, null);
      return;
    }
    const ext = selected.name.toLowerCase().split('.').pop() || '';
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setError(IMAGE_TYPE_MESSAGE);
      onChange(null, IMAGE_TYPE_MESSAGE);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError(IMAGE_SIZE_MESSAGE);
      onChange(null, IMAGE_SIZE_MESSAGE);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    onChange(selected, null);
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-charcoal">{label}</span>
      <div className="flex flex-col gap-4 sm:flex-row">
        <EntityImage src={previewUrl ?? currentImagePath} alt={alt} className="w-full rounded-xl sm:w-64" />
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-olive file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-olive-dark"
          />
          <p className="mt-2 text-xs text-muted">
            {hint || 'Chấp nhận JPG, JPEG, PNG, WEBP — tối đa 5 MB. Ảnh hiển thị theo tỉ lệ 4:3.'}
          </p>
          {error && <p className="mt-2 text-xs font-semibold text-terracotta-dark">{error}</p>}
        </div>
      </div>
    </div>
  );
}

interface RelationChecklistProps {
  title: string;
  emptyMessage: string;
  createLink: string;
  createLabel: string;
  options: { id: number; label: string; sub?: string | null; imagePath?: string | null }[];
  selectedIds: number[];
  onToggle: (id: number, checked: boolean) => void;
}

// Khung checkbox quan hệ cuộn được (nguyên liệu/đầu bếp cho form món ăn).
export function RelationChecklist({
  title,
  emptyMessage,
  createLink,
  createLabel,
  options,
  selectedIds,
  onToggle,
}: RelationChecklistProps) {
  const selected = new Set(selectedIds);
  return (
    <div className="rounded-2xl border border-sand bg-ivory p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-charcoal">{title}</h3>
        <a
          href={createLink}
          className="text-xs font-semibold text-olive underline-offset-4 hover:underline"
        >
          {createLabel}
        </a>
      </div>
      {options.length === 0 ? (
        <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-xs leading-relaxed text-muted">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-sand px-3 py-2 transition hover:bg-cream"
            >
              <input
                type="checkbox"
                checked={selected.has(option.id)}
                onChange={(e) => onToggle(option.id, e.target.checked)}
                className="h-4 w-4 accent-olive"
              />
              {option.imagePath !== undefined && (
                <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-sand">
                  <EntityImage src={option.imagePath} alt={option.label} />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-charcoal">
                  {option.label}
                </span>
                {option.sub && <span className="block text-xs text-muted">{option.sub}</span>}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// Bọc chung cho luồng submit form: upload ảnh (nếu có) → lưu bản ghi → dọn ảnh khi lưu lỗi.
export async function saveWithImageFlow(opts: {
  file: File | null;
  save: (imagePath: string | null) => Promise<unknown>;
  oldImagePath?: string | null;
  upload: (file: File) => Promise<string>;
  removeUploaded: (path: string) => Promise<void>;
}): Promise<{ ok: true } | { ok: false; error: ApiError; cleanupDone: boolean }> {
  const { file, save, oldImagePath, upload, removeUploaded } = opts;
  let uploadedPath: string | null = null;
  try {
    let imagePath: string | null = null;
    if (file) {
      uploadedPath = await upload(file);
      imagePath = uploadedPath;
    } else {
      imagePath = oldImagePath ?? null;
    }
    await save(imagePath);
    // Thay ảnh thành công → xóa ảnh cũ (best effort, sau khi đã lưu).
    if (file && oldImagePath && oldImagePath !== uploadedPath) {
      await removeUploaded(oldImagePath);
    }
    return { ok: true };
  } catch (error) {
    // Lưu bản ghi thất bại sau khi upload → dọn ảnh mới tránh file rác.
    let cleanupDone = false;
    if (uploadedPath) {
      await removeUploaded(uploadedPath);
      cleanupDone = true;
    }
    if (error instanceof ApiError) return { ok: false, error, cleanupDone };
    throw error;
  }
}
