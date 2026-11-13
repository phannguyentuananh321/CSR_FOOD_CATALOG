import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import { removeVietnameseTones } from '../utils/format';
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

export interface RelationOption {
  id: number;
  label: string;
  sub?: string | null;
  imagePath?: string | null;
}

interface RelationChecklistProps {
  title: string;
  emptyMessage: string;
  createLink: string;
  createLabel: string;
  options: RelationOption[];
  selectedIds: number[];
  onToggle: (id: number, checked: boolean) => void;
  searchPlaceholder?: string;
}

// Khung checkbox quan hệ cuộn được với tìm kiếm client-side (nguyên liệu/đầu bếp cho form món ăn).
export function RelationChecklist({
  title,
  emptyMessage,
  createLink,
  createLabel,
  options,
  selectedIds,
  onToggle,
  searchPlaceholder,
}: RelationChecklistProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'selected'>('all');

  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Lọc tìm kiếm bình thường ở client (không phân biệt hoa/thường và dấu tiếng Việt)
  const filteredOptions = useMemo(() => {
    let list = options;

    if (filterMode === 'selected') {
      list = list.filter((o) => selected.has(o.id));
    }

    const trimmed = searchTerm.trim();
    if (trimmed) {
      const termLower = trimmed.toLowerCase();
      const termNoTone = removeVietnameseTones(trimmed);

      list = list.filter((option) => {
        const labelLower = option.label.toLowerCase();
        const labelNoTone = removeVietnameseTones(option.label);
        const subLower = (option.sub ?? '').toLowerCase();
        const subNoTone = removeVietnameseTones(option.sub ?? '');

        return (
          labelLower.includes(termLower) ||
          labelNoTone.includes(termNoTone) ||
          subLower.includes(termLower) ||
          subNoTone.includes(termNoTone)
        );
      });
    }

    // Đưa các mục đã chọn lên đầu, sau đó sắp xếp theo tên A-Z
    return [...list].sort((a, b) => {
      const aSel = selected.has(a.id) ? 1 : 0;
      const bSel = selected.has(b.id) ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;
      return a.label.localeCompare(b.label, 'vi');
    });
  }, [options, searchTerm, filterMode, selected]);

  const selectedCount = selectedIds.length;

  return (
    <div className="flex flex-col rounded-2xl border border-sand bg-ivory p-4">
      {/* Tiêu đề & Link thêm mới */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-charcoal">
          <span>{title}</span>
          {selectedCount > 0 && (
            <span className="rounded-full bg-olive/15 px-2 py-0.5 text-xs font-semibold text-olive">
              {selectedCount} đã chọn
            </span>
          )}
        </h3>
        <a
          href={createLink}
          target="_blank"
          rel="noreferrer"
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
        <>
          {/* Ô tìm kiếm client-side */}
          <div className="relative mt-3">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-muted" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder || 'Tìm kiếm...'}
              className="w-full rounded-xl border border-sand-dark bg-white py-2 pl-8 pr-8 text-xs text-charcoal outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive/30"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs font-bold text-muted transition hover:text-charcoal"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Thanh chuyển tab: Tất cả / Đã chọn */}
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  filterMode === 'all'
                    ? 'bg-sand font-semibold text-charcoal'
                    : 'text-muted hover:text-charcoal'
                }`}
              >
                Tất cả ({options.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('selected')}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  filterMode === 'selected'
                    ? 'bg-olive font-semibold text-white'
                    : selectedCount > 0
                    ? 'text-olive hover:bg-olive/10'
                    : 'cursor-default text-muted/60'
                }`}
                disabled={selectedCount === 0 && filterMode !== 'selected'}
              >
                Đã chọn ({selectedCount})
              </button>
            </div>
            {searchTerm && (
              <span className="text-[11px] text-muted">
                Khớp {filteredOptions.length}
              </span>
            )}
          </div>

          {/* Danh sách cuộn checkbox */}
          <div className="mt-2.5 max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {filteredOptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sand-dark/60 bg-cream/60 px-4 py-6 text-center text-xs text-muted">
                <p>Không tìm thấy mục nào khớp với &ldquo;{searchTerm}&rdquo;.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterMode('all');
                  }}
                  className="mt-2 inline-block font-semibold text-olive underline-offset-2 hover:underline"
                >
                  Xem tất cả
                </button>
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isChecked = selected.has(option.id);
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition ${
                      isChecked
                        ? 'border-olive/40 bg-olive/5 shadow-xs'
                        : 'border-sand hover:bg-cream'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onToggle(option.id, e.target.checked)}
                      className="h-4 w-4 rounded accent-olive"
                    />
                    {option.imagePath !== undefined && (
                      <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-sand">
                        <EntityImage src={option.imagePath} alt={option.label} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${isChecked ? 'font-semibold text-charcoal' : 'font-medium text-charcoal'}`}>
                        {option.label}
                      </span>
                      {option.sub && <span className="block text-xs text-muted">{option.sub}</span>}
                    </div>
                    {isChecked && (
                      <span className="shrink-0 text-xs font-bold text-olive" title="Đã chọn">
                        ✓
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </>
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
