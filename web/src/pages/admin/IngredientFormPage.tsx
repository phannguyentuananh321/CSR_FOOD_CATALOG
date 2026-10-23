import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import Alert from '../../components/Alert';
import { Field, ImageUploadField, inputClass, saveWithImageFlow } from '../../components/form';
import { ErrorPanel, LoadingBlock, NotFoundPanel } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import type { Ingredient } from '../../types';

const GENERAL_VALIDATION_MESSAGE = 'Vui lòng kiểm tra lại các trường thông tin bị lỗi.';
const CATEGORY_SUGGESTIONS = [
  'Gia vị truyền thống',
  'Rau tươi',
  'Nông sản truyền thống',
  'Thịt & Thủy hải sản',
  'Thảo mộc tự nhiên',
];

export default function IngredientFormPage() {
  const { id } = useParams<{ id: string }>();
  const editId = id ? Number(id) : null;
  const isEdit = editId !== null && Number.isInteger(editId) && editId > 0;
  const navigate = useNavigate();

  const detail = useFetch<Ingredient>(() => api.ingredients.detail(editId as number), [editId]);

  const [form, setForm] = useState({ name: '', category: '', unit: '', description: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (isEdit && detail.state.status === 'success' && !hydrated) {
    const ingredient = detail.state.data;
    setForm({
      name: ingredient.name,
      category: ingredient.category ?? '',
      unit: ingredient.unit ?? '',
      description: ingredient.description ?? '',
    });
    setCurrentImagePath(ingredient.imagePath);
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
      category: form.category.trim() === '' ? null : form.category.trim(),
      unit: form.unit.trim() === '' ? null : form.unit.trim(),
      description: form.description.trim() === '' ? null : form.description.trim(),
      imagePath,
    });

    const result = await saveWithImageFlow({
      file: imageFile,
      oldImagePath: currentImagePath,
      upload: (file) => api.uploads.upload(file, 'ingredient'),
      removeUploaded: (path) => api.uploads.remove(path),
      save: async (imagePath) => {
        if (isEdit) {
          await api.ingredients.update(editId as number, payload(imagePath));
        } else {
          await api.ingredients.create(payload(imagePath));
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
        setTopError('Không tìm thấy nguyên liệu. Bản ghi có thể đã bị xóa.');
      } else {
        setTopError(err.message);
      }
      return;
    }

    navigate('/admin/ingredients', {
      state: {
        notice: {
          type: 'success',
          text: isEdit ? 'Đã cập nhật thông tin nguyên liệu thành công!' : 'Đã thêm nguyên liệu mới thành công!',
        },
      },
    });
  };

  if (isEdit && (Number.isNaN(editId as number) || (editId as number) <= 0)) {
    return <NotFoundPanel title="Không Tìm Thấy Nguyên Liệu" />;
  }
  if (isEdit && detail.state.status === 'loading') {
    return <LoadingBlock label="Đang tải dữ liệu nguyên liệu..." />;
  }
  if (isEdit && detail.state.status === 'error') {
    if (detail.state.apiError?.code === 'NOT_FOUND') {
      return <NotFoundPanel title="Không Tìm Thấy Nguyên Liệu" />;
    }
    return (
      <div className="mx-auto max-w-[896px] px-4 py-10">
        <ErrorPanel message={detail.state.message} onRetry={detail.retry} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[896px] px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/admin/ingredients" className="text-sm font-semibold text-olive underline-offset-4 hover:underline">
        ← Quay lại Danh sách Quản trị
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-charcoal">
        {isEdit ? 'Chỉnh Sửa Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}
      </h1>
      <p className="mt-2 text-sm text-muted">Nhập thông tin nông sản, gia vị để đưa vào danh mục.</p>

      {topError && (
        <div className="mt-5">
          <Alert type="error" text={topError} onClose={() => setTopError(null)} />
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border border-sand bg-ivory p-6">
        <Field label="Tên Nguyên Liệu" required error={fieldErrors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ví dụ: Nước Mắm Cốt Cá Cơm Phú Quốc"
            className={inputClass(fieldErrors.name)}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Phân Loại" hint="Có thể chọn từ gợi ý hoặc nhập danh mục mới." error={fieldErrors.category}>
            <input
              type="text"
              list="ingredient-category-suggestions"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Ví dụ: Gia vị truyền thống"
              className={inputClass(fieldErrors.category)}
            />
            <datalist id="ingredient-category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Đơn Vị Tính" error={fieldErrors.unit}>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="Ví dụ: gram, kg, bó, chai 500ml..."
              className={inputClass(fieldErrors.unit)}
            />
          </Field>
        </div>

        <ImageUploadField
          label="Hình Ảnh Nguyên Liệu"
          alt={form.name || 'Hình ảnh nguyên liệu'}
          currentImagePath={imageFile ? null : currentImagePath}
          file={imageFile}
          onChange={(file, fileError) => {
            setImageFile(file);
            if (fileError) setTopError(fileError);
          }}
          hint={
            isEdit
              ? 'Nếu không chọn ảnh mới, hệ thống sẽ giữ nguyên ảnh hiện tại. Nên dùng ảnh tỉ lệ 4:3. JPG, JPEG, PNG, WEBP — tối đa 5 MB.'
              : 'Nên dùng ảnh tỉ lệ 4:3. Chấp nhận JPG, JPEG, PNG, WEBP — tối đa 5 MB.'
          }
        />

        <Field label="Mô Tả" error={fieldErrors.description}>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả ngắn về nguồn gốc, đặc điểm và cách dùng của nguyên liệu..."
            className={inputClass(fieldErrors.description)}
          />
        </Field>

        <div className="flex items-center justify-end gap-3 border-t border-sand pt-5">
          <Link
            to="/admin/ingredients"
            className="rounded-xl border border-sand-dark bg-ivory px-6 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
          >
            Hủy Bỏ
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Đang lưu...' : isEdit ? 'Lưu Thay Đổi' : 'Thêm Nguyên Liệu'}
          </button>
        </div>
      </form>
    </div>
  );
}
