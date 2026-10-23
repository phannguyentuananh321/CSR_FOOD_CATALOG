import { type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import EntityImage from '../../components/EntityImage';
import Pagination from '../../components/Pagination';
import { ErrorPanel, LoadingBlock } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import { formatDate, formatPrice } from '../../utils/format';

export default function AdminDishListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const page = searchParams.get('page') ?? '1';

  const { state, retry } = useFetch(
    () => api.dishes.list({ q: q || undefined, category: category || undefined, page, limit: 10 }),
    [q, category, page]
  );

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const keyword = String(data.get('q') ?? '').trim();
    if (keyword) next.set('q', keyword);
    const cat = String(data.get('category') ?? '');
    if (cat) next.set('category', cat);
    setSearchParams(next);
  };

  const makePageLink = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    return `/admin/dishes?${next.toString()}`;
  };

  const categories = state.status === 'success' ? (state.data.meta.categories ?? []) : [];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-terracotta">Hệ Thống Quản Trị</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-charcoal">Quản Lý Món Ăn</h1>
          {state.status === 'success' && (
            <p className="mt-2 text-sm text-muted">
              Tổng số {state.data.meta.total} món ăn trong cơ sở dữ liệu
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            to="/dishes"
            className="rounded-xl border border-sand-dark bg-ivory px-4 py-2.5 text-sm font-semibold text-olive transition hover:bg-sand"
          >
            👁 Xem Trang Công Khai
          </Link>
          <Link
            to="/admin/dishes/new"
            className="rounded-xl bg-olive px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark"
          >
            + Thêm Món Mới
          </Link>
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Tìm theo tên món..."
          className="w-full max-w-xs rounded-xl border border-sand-dark bg-ivory px-4 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
        />
        <select
          name="category"
          defaultValue={category}
          className="rounded-xl border border-sand-dark bg-ivory px-4 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl bg-olive px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark">
          Lọc
        </button>
        {(q || category) && (
          <Link to="/admin/dishes" className="text-sm font-semibold text-terracotta underline-offset-4 hover:underline">
            Đặt lại
          </Link>
        )}
      </form>

      {state.status === 'loading' && <LoadingBlock />}
      {state.status === 'error' && (
        <div className="mt-8">
          <ErrorPanel message={state.message} onRetry={retry} />
        </div>
      )}
      {state.status === 'success' && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-sand bg-ivory">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-sand bg-cream text-[11px] uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-bold">Hình Ảnh</th>
                <th className="px-4 py-3 font-bold">Tên Món Ăn &amp; ID</th>
                <th className="px-4 py-3 font-bold">Danh Mục</th>
                <th className="px-4 py-3 font-bold">Giá Niêm Yết</th>
                <th className="px-4 py-3 font-bold">Quan Hệ</th>
                <th className="px-4 py-3 font-bold">Cập Nhật</th>
                <th className="px-4 py-3 text-right font-bold">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {state.data.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted">
                    Chưa có món ăn nào trong danh mục hoặc không tìm thấy kết quả phù hợp.
                  </td>
                </tr>
              ) : (
                state.data.data.map((dish) => (
                  <tr key={dish.id} className="border-b border-sand last:border-0 hover:bg-cream/60">
                    <td className="px-4 py-3">
                      <EntityImage src={dish.imagePath} alt={dish.name} className="w-16 rounded-lg" />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-charcoal">{dish.name}</p>
                      <p className="mt-0.5 text-xs text-muted">ID: #{dish.id}</p>
                      {dish.isFeatured && (
                        <span className="mt-1 inline-block rounded-full bg-terracotta/15 px-2 py-0.5 text-[10px] font-bold text-terracotta-dark">
                          Tuyển chọn
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-olive">
                        {dish.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-olive">{formatPrice(dish.price)}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      <p>🥬 {dish.ingredientCount ?? 0} nguyên liệu</p>
                      <p className="mt-1">👨‍🍳 {dish.chefCount ?? 0} đầu bếp</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(dish.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/dishes/${dish.id}/edit`}
                          className="rounded-lg border border-sand-dark px-3 py-1.5 text-xs font-semibold text-olive transition hover:bg-sand"
                        >
                          Sửa
                        </Link>
                        <Link
                          to={`/admin/dishes/${dish.id}/delete`}
                          className="rounded-lg bg-terracotta px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-terracotta-dark"
                        >
                          Xóa
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {state.status === 'success' && <Pagination meta={state.data.meta} makeLink={makePageLink} />}
    </div>
  );
}
