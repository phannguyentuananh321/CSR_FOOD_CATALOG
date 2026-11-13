import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import Alert from '../../components/Alert';
import { Field, ImageUploadField, RelationChecklist, inputClass, saveWithImageFlow } from '../../components/form';
import { ErrorPanel, LoadingBlock, NotFoundPanel } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import type { Chef, Dish, Ingredient } from '../../types';

const CATEGORY_SUGGESTIONS = [
  'Món nước',
  'Món nướng',
  'Món cuốn',
  'Món chiên',
  'Món xào',
  'Món chính',
  'Tráng miệng',
  'Đồ uống',
];

const GENERAL_VALIDATION_MESSAGE = 'Vui lòng kiểm tra lại các trường thông tin bị lỗi.';

export default function DishFormPage() {
  const { id } = useParams<{ id: string }>();
  const editId = id ? Number(id) : null;
  const isEdit = editId !== null && Number.isInteger(editId) && editId > 0;
  const navigate = useNavigate();

  // Dữ liệu bản ghi khi sửa.
  const detail = useFetch<Dish>(() => api.dishes.detail(editId as number), [editId]);
  // Danh sách lựa chọn quan hệ.
  const ingredientOptions = useFetch(() => api.ingredients.list({ limit: 50 }), []);
  const chefOptions = useFetch(() => api.chefs.list({ limit: 50 }), []);

  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    isFeatured: false,
    description: '',
  });
  const [ingredientIds, setIngredientIds] = useState<number[]>([]);
  const [chefIds, setChefIds] = useState<number[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImagePath, setCurrentImagePath] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Đổ dữ liệu hiện tại vào form (chỉ một lần sau khi tải xong).
  if (isEdit && detail.state.status === 'success' && !hydrated) {
    const dish = detail.state.data;
    setForm({
      name: dish.name,
      category: dish.category,
      price: String(dish.price ?? 0),
      isFeatured: Boolean(dish.isFeatured),
      description: dish.description ?? '',
    });
    setIngredientIds((dish.ingredients ?? []).map((i) => i.id));
    setChefIds((dish.chefs ?? []).map((c) => c.id));
    setCurrentImagePath(dish.imagePath);
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
      category: form.category,
      price: form.price.trim() === '' ? 0 : Number(form.price),
      isFeatured: form.isFeatured,
      description: form.description.trim() === '' ? null : form.description.trim(),
      imagePath,
      ingredientIds,
      chefIds,
    });

    const result = await saveWithImageFlow({
      file: imageFile,
      oldImagePath: currentImagePath,
      upload: (file) => api.uploads.upload(file, 'dishes'),
      removeUploaded: (path) => api.uploads.remove(path),
      save: async (imagePath) => {
        if (isEdit) {
          await api.dishes.update(editId as number, payload(imagePath));
        } else {
          await api.dishes.create(payload(imagePath));
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
        setTopError('Không tìm thấy món ăn. Bản ghi có thể đã bị xóa.');
      } else {
        setTopError(err.message);
      }
      return;
    }

    navigate('/admin/dishes', {
      state: {
        notice: {
          type: 'success',
          text: isEdit
            ? 'Đã cập nhật thông tin món ăn thành công!'
            : 'Đã thêm món ăn mới vào thực đơn thành công!',
        },
      },
    });
  };

  if (isEdit && (Number.isNaN(editId as number) || (editId as number) <= 0)) {
    return <NotFoundPanel title="Không Tìm Thấy Món Ăn" />;
  }
  if (isEdit && detail.state.status === 'loading') {
    return <LoadingBlock label="Đang tải dữ liệu món ăn..." />;
  }
  if (isEdit && detail.state.status === 'error') {
    if (detail.state.apiError?.code === 'NOT_FOUND') {
      return <NotFoundPanel title="Không Tìm Thấy Món Ăn" />;
    }
    return (
      <div className="mx-auto max-w-[896px] px-4 py-10">
        <ErrorPanel message={detail.state.message} onRetry={detail.retry} />
      </div>
    );
  }

  const rawIngredients: Ingredient[] =
    ingredientOptions.state.status === 'success' ? ingredientOptions.state.data.data : [];
  const rawChefs: Chef[] =
    chefOptions.state.status === 'success' ? chefOptions.state.data.data : [];

  const ingredients = useMemo(() => {
    const map = new Map<number, Ingredient>();
    for (const item of rawIngredients) map.set(item.id, item);
    if (isEdit && detail.state.status === 'success' && detail.state.data.ingredients) {
      for (const item of detail.state.data.ingredients) {
        if (!map.has(item.id)) map.set(item.id, item as Ingredient);
      }
    }
    return Array.from(map.values());
  }, [rawIngredients, isEdit, detail.state]);

  const chefs = useMemo(() => {
    const map = new Map<number, Chef>();
    for (const item of rawChefs) map.set(item.id, item);
    if (isEdit && detail.state.status === 'success' && detail.state.data.chefs) {
      for (const item of detail.state.data.chefs) {
        if (!map.has(item.id)) map.set(item.id, item as Chef);
      }
    }
    return Array.from(map.values());
  }, [rawChefs, isEdit, detail.state]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<number[]>>) => (id: number, checked: boolean) =>
    setter((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  return (
    <div className="mx-auto max-w-[896px] px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/admin/dishes" className="text-sm font-semibold text-olive underline-offset-4 hover:underline">
        ← Quay lại Danh sách Quản trị
      </Link>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-charcoal">
        {isEdit ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isEdit
          ? 'Cập nhật thông tin chi tiết và hình ảnh món ăn.'
          : 'Điền các thông tin để bổ sung món mới vào danh mục phục vụ.'}
      </p>

      {topError && (
        <div className="mt-5">
          <Alert type="error" text={topError} onClose={() => setTopError(null)} />
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6 rounded-2xl border border-sand bg-ivory p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Tên Món Ăn" required error={fieldErrors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ví dụ: Phở Bò Tái Lăn Hà Nội"
              className={inputClass(fieldErrors.name)}
            />
          </Field>
          <Field label="Danh Mục Món Ăn" required error={fieldErrors.category}>
            <input
              type="text"
              list="dish-category-suggestions"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Ví dụ: Món nước"
              className={inputClass(fieldErrors.category)}
            />
            <datalist id="dish-category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Giá Niêm Yết (VND)" required error={fieldErrors.price}>
            <input
              type="number"
              min={0}
              step={1000}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Ví dụ: 65000"
              className={inputClass(fieldErrors.price)}
            />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="h-4 w-4 accent-olive"
              />
              <span>
                <span className="block text-sm font-semibold text-charcoal">Đặt làm Món Nổi Bật</span>
                <span className="block text-xs text-muted">Món sẽ xuất hiện trên Hero Slider.</span>
              </span>
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-charcoal">Nguyên Liệu &amp; Đầu Bếp</h2>
          <p className="mt-1 text-xs text-muted">Không bắt buộc — có thể để trống.</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <RelationChecklist
              title="🥬 Nguyên Liệu"
              searchPlaceholder="Tìm tên hoặc đơn vị nguyên liệu..."
              createLink="/admin/ingredients/new"
              createLabel="+ Tạo nguyên liệu"
              emptyMessage="Chưa có nguyên liệu nào trong hệ thống. Hãy tạo nguyên liệu trước khi gán vào món ăn."
              options={ingredients.map((i) => ({
                id: i.id,
                label: i.name,
                sub: i.unit ? `Đơn vị: ${i.unit}` : i.category ?? null,
              }))}
              selectedIds={ingredientIds}
              onToggle={toggle(setIngredientIds)}
            />
            <RelationChecklist
              title="👨‍🍳 Đầu Bếp"
              searchPlaceholder="Tìm tên hoặc chức danh đầu bếp..."
              createLink="/admin/chefs/new"
              createLabel="+ Tạo đầu bếp"
              emptyMessage="Chưa có đầu bếp nào trong hệ thống. Hãy tạo hồ sơ đầu bếp trước khi gán vào món ăn."
              options={chefs.map((c) => ({
                id: c.id,
                label: c.name,
                sub: c.title,
                imagePath: c.imagePath,
              }))}
              selectedIds={chefIds}
              onToggle={toggle(setChefIds)}
            />
          </div>
        </div>

        <ImageUploadField
          label="Hình Ảnh Món Ăn"
          alt={form.name || 'Hình ảnh món ăn'}
          currentImagePath={imageFile ? null : currentImagePath}
          file={imageFile}
          onChange={(file, _error) => {
            setImageFile(file);
            if (_error) setTopError(_error);
          }}
          hint={
            isEdit
              ? 'Nếu không chọn ảnh mới, hệ thống sẽ giữ nguyên ảnh hiện tại. JPG, JPEG, PNG, WEBP — tối đa 5 MB.'
              : 'Chấp nhận JPG, JPEG, PNG, WEBP — tối đa 5 MB. Ảnh hiển thị theo tỉ lệ 4:3.'
          }
        />

        <Field label="Mô Tả Hương Vị & Thành Phần">
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả hương vị, câu chuyện và thành phần nổi bật của món ăn..."
            className={inputClass()}
          />
        </Field>

        <div className="flex items-center justify-end gap-3 border-t border-sand pt-5">
          <Link
            to="/admin/dishes"
            className="rounded-xl border border-sand-dark bg-ivory px-6 py-2.5 text-sm font-semibold text-charcoal transition hover:bg-sand"
          >
            Hủy Bỏ
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Đang lưu...' : isEdit ? 'Lưu Thay Đổi' : 'Thêm Món Ăn'}
          </button>
        </div>
      </form>
    </div>
  );
}
