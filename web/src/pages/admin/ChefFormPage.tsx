import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import Alert from '../../components/Alert';
import { Field, ImageUploadField, inputClass, saveWithImageFlow } from '../../components/form';
import { ErrorPanel, LoadingBlock, NotFoundPanel } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import type { Chef } from '../../types';

const GENERAL_VALIDATION_MESSAGE = 'Vui lòng kiểm tra lại các trường thông tin bị lỗi.';

export default function ChefFormPage() {
  const { id } = useParams<{ id: string }>();
  const editId = id ? Number(id) : null;
  const isEdit = editId !== null && Number.isInteger(editId) && editId > 0;
  const navigate = useNavigate();

  const detail = useFetch<Chef>(() => api.chefs.detail(editId as number), [editId]);

  const [form, setForm] = useState({ name: '', title: '', experience: '', isFeatured: false, description: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (isEdit && detail.state.status === 'success' && !hydrated) {
    const chef = detail.state.data;
    setForm({
      name: chef.name,
      title: chef.title ?? '',
      experience: chef.experience ?? '',
      isFeatured: Boolean(chef.isFeatured),
      description: chef.description ?? '',
    });
    setCurrentImagePath(chef.imagePath);
    setHydrated(true);
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setTopError(null);
    setFieldErrors({});

    const payload = (imagePath: string | null) => ({
      name: form.name,
      title: form.title.trim() === '' ? null : form.title.trim(),
      experience: form.experience.trim() === '' ? null : form.experience.trim(),
      isFeatured: form.isFeatured,
      description: form.description.trim() === '' ? null : form.description.trim(),
      imagePath,
    });

    const result = await saveWithImageFlow({
      file: imageFile,
      oldImagePath: currentImagePath,
      upload: (file) => api.uploads.upload(file, 'chef'),
      removeUploaded: (path) => api.uploads.remove(path),
      save: async (imagePath) => {
        if (isEdit) {
          await api.chefs.update(editId as number, payload(imagePath));
        } else {
          await api.chefs.create(payload(imagePath));
        }
      },
    });

    setSubmitting(false);

    if (!result.ok) {
      const err = result.error;
      if (err.code === 'VALIDATION_FAILED' && err.fields) {
        setFieldErrors(err.fields);
        setTopError(GENERAL_VALIDATION_MESSAGE);
      } else if (err.code === 'NOT_FOUND' && isEdit) {
        setTopError('Không tìm thấy đầu bếp. Bản ghi có thể đã bị xóa.');
      } else {
        setTopError(err.message);
      }
      return;
    }

    navigate('/admin/chefs', {
      state: {
        notice: {
          type: 'success',
          text: isEdit ? 'Đã cập nhật thông tin đầu bếp thành công!' : 'Đã thêm hồ sơ đầu bếp mới thành công!',
        },
      },
    });
  };

  if (isEdit && (Number.isNaN(editId as number) || (editId as number) <= 0)) {
    return <NotFoundPanel title="Không Tìm Thấy Đầu Bếp" />;
  }
  if (isEdit && detail.state.status === 'loading') {
    return <LoadingBlock label="Đang tải hồ sơ đầu bếp..." />;
  }
  if (isEdit && detail.state.status === 'error') {
    if (detail.state.apiError?.code === 'NOT_FOUND') {
      return <NotFoundPanel title="Không Tìm Thấy Đầu Bếp" />;
    }
    return (
      <div className="mx-auto max-w-[896px] px-4 py-10">
        <ErrorPanel message={detail.state.message} onRetry={detail.retry} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[896px] px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/admin/chefs" className="text-sm font-semibold text-olive underline-offset-4 hover:underline">
        ← Quay lại Danh sách Quản trị
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-charcoal">
        {isEdit ? 'Chỉnh Sửa Hồ Sơ Đầu Bếp' : 'Thêm Đầu Bếp Mới'}
      </h1>
      <p className="mt-2 text-sm text-muted">Tạo hồ sơ nghệ nhân ẩm thực mới cho website.</p>

      {topError && (
        <div className="mt-5">
          <Alert type="error" text={topError} onClose={() => setTopError(null)} />
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border border-sand bg-ivory p-6">
        <Field label="Họ & Tên" required error={fieldErrors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ví dụ: Nguyễn Văn An"
            className={inputClass(fieldErrors.name)}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Chức Danh" error={fieldErrors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ví dụ: Bếp Trưởng Bếp Á"
              className={inputClass(fieldErrors.title)}
            />
          </Field>
          <Field label="Kinh Nghiệm" error={fieldErrors.experience}>
            <input
              type="text"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              placeholder="Ví dụ: 15 năm kinh nghiệm trong ẩm thực Việt"
              className={inputClass(fieldErrors.experience)}
            />
          </Field>
        </div>

        <div className="flex items-center">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
              className="h-4 w-4 accent-olive"
            />
            <span>
              <span className="block text-sm font-semibold text-charcoal">Đặt làm Đầu Bếp Tiêu Biểu</span>
              <span className="block text-xs text-muted">Hồ sơ sẽ được ưu tiên giới thiệu.</span>
            </span>
          </label>
        </div>

        <ImageUploadField
          label="Ảnh Chân Dung"
          alt={form.name || 'Ảnh chân dung đầu bếp'}
          currentImagePath={imageFile ? null : currentImagePath}
          file={imageFile}
          onChange={(file, fileError) => {
            setImageFile(file);
            if (fileError) setTopError(fileError);
          }}
          hint={
            isEdit
              ? 'Nếu không chọn ảnh mới, hệ thống sẽ giữ nguyên ảnh hiện tại. Nên dùng ảnh tỉ lệ 4:3. JPG, JPEG, PNG, WEBP — tối đa 5 MB.'
              : 'Nên dùng ảnh chân dung tỉ lệ 4:3. Chấp nhận JPG, JPEG, PNG, WEBP — tối đa 5 MB.'
          }
        />

        <Field label="Tiểu Sử" error={fieldErrors.description}>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Giới thiệu ngắn về xuất thân, phong cách nấu nướng và thành tựu của đầu bếp..."
            className={inputClass(fieldErrors.description)}
          />
        </Field>

        <div className="flex items-center justify-end gap-3 border-t border-sand pt-5">
          <Link
            to="/admin/chefs"
            className="rounded-xl border border-sand-dark bg-ivory px-6 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
          >
            Hủy Bỏ
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Đang lưu...' : isEdit ? 'Lưu Thay Đổi' : 'Thêm Đầu Bếp'}
          </button>
        </div>
      </form>
    </div>
  );
}
