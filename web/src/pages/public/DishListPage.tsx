import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import FeaturedCarousel from '../../components/FeaturedCarousel';
import VantaBirdsBackground from '../../components/VantaBirdsBackground';
import { DishCard } from '../../components/cards';
import Pagination from '../../components/Pagination';
import { EmptyState, ErrorPanel, LoadingBlock } from '../../components/States';
import { useFetch } from '../../hooks/useFetch';
import type { Dish } from '../../types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price-asc', label: 'Giá tăng dần' },
  { value: 'price-desc', label: 'Giá giảm dần' },
  { value: 'name-asc', label: 'Tên A - Z' },
  { value: 'name-desc', label: 'Tên Z - A' },
];

export default function DishListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const page = searchParams.get('page') ?? '1';

  const [form, setForm] = useState({ q, category, minPrice, maxPrice, sort });
  // Cập nhật form khi URL đổi (bấm link phân trang, đặt lại...).
  if (
    form.q !== q ||
    form.category !== category ||
    form.minPrice !== minPrice ||
    form.maxPrice !== maxPrice ||
    form.sort !== sort
  ) {
    setForm({ q, category, minPrice, maxPrice, sort });
  }

  const listParams: Record<string, string | number | undefined> = {
    q: q || undefined,
    category: category || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
    sort,
    page,
  };
  const { state, retry } = useFetch(
    () => api.dishes.list(listParams),
    [q, category, minPrice, maxPrice, sort, page]
  );

  const featured = useFetch(() => api.dishes.list({ featured: 1, limit: 4 }), []);
  const featuredDishes: Dish[] =
    featured.state.status === 'success' ? (featured.state.data.data ?? []).slice(0, 4) : [];

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (form.q.trim()) next.set('q', form.q.trim());
    if (form.category) next.set('category', form.category);
    if (form.minPrice) next.set('minPrice', form.minPrice);
    if (form.maxPrice) next.set('maxPrice', form.maxPrice);
    if (form.sort && form.sort !== 'newest') next.set('sort', form.sort);
    setSearchParams(next);
  };

  const makePageLink = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    return `/dishes?${next.toString()}`;
  };

  const categories = state.status === 'success' ? (state.data.meta.categories ?? []) : [];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-sand bg-cream">
        <VantaBirdsBackground />
        <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sand-dark bg-ivory px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-olive">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-terracotta" aria-hidden="true" />
              Tuyển Tập Ẩm Thực Tinh Hoa
            </p>
            <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight text-charcoal sm:text-5xl">
              Hương Vị Bản Địa,{' '}
              <em className="text-olive">Nghệ Thuật Đương Đại</em>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Mỗi món ăn là một bản hòa ca giữa nguyên liệu tươi ngon chọn lọc và niềm say mê của
              những nghệ nhân ẩm thực Việt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#menu-catalog"
                className="rounded-xl bg-olive px-6 py-3 text-sm font-semibold text-white transition hover:bg-olive-dark"
              >
                Khám Phá Thực Đơn
              </a>
              <Link
                to="/chefs"
                className="rounded-xl border border-sand-dark bg-ivory px-6 py-3 text-sm font-semibold text-olive transition hover:bg-sand"
              >
                Gặp Gỡ Đầu Bếp
              </Link>
            </div>
          </div>
          {featuredDishes.length > 0 && (
            <div>
              <FeaturedCarousel dishes={featuredDishes} />
            </div>
          )}
        </div>
      </section>

      {/* Danh mục */}
      <section id="menu-catalog" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-sand bg-ivory p-5 sm:p-6">
          <form
            onSubmit={applyFilters}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto_auto] lg:items-end"
          >
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal">Tìm Kiếm Món Ăn</span>
              <input
                type="text"
                value={form.q}
                onChange={(e) => setForm({ ...form, q: e.target.value })}
                placeholder="Nhập tên món ăn..."
                className="w-full rounded-xl border border-sand-dark bg-ivory px-4 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal">Danh Mục</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-sand-dark bg-ivory px-4 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal">Khoảng Giá (VND)</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.minPrice}
                  onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                  placeholder="Từ..."
                  className="w-full rounded-xl border border-sand-dark bg-ivory px-4 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
                />
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.maxPrice}
                  onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                  placeholder="Đến..."
                  className="w-full rounded-xl border border-sand-dark bg-ivory px-4 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal">Sắp Xếp</span>
              <select
                value={form.sort}
                onChange={(e) => setForm({ ...form, sort: e.target.value })}
                className="w-full rounded-xl border border-sand-dark bg-ivory px-4 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark"
            >
              Áp Dụng Bộ Lọc
            </button>
            <Link
              to="/dishes"
              className="rounded-xl px-2 py-2.5 text-center text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
            >
              Đặt Lại
            </Link>
          </form>
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-charcoal">Danh Sách Món Ăn</h2>
            {state.status === 'success' && (
              <p className="mt-2 text-sm text-muted">{state.data.meta.total} món ăn sẵn sàng phục vụ</p>
            )}
          </div>
        </div>

        {state.status === 'loading' && <LoadingBlock />}
        {state.status === 'error' && (
          <div className="mt-8">
            <ErrorPanel message={state.message} onRetry={retry} />
          </div>
        )}
        {state.status === 'success' && state.data.data.length === 0 && (
          <div className="mt-8">
            <EmptyState
              title="Không Tìm Thấy Món Ăn Phù Hợp"
              description="Không có món ăn nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn. Vui lòng thử tìm với từ khóa khác hoặc đặt lại bộ lọc."
              actionText="Xóa Bộ Lọc & Xem Tất Cả"
              actionLink="/dishes"
            />
          </div>
        )}
        {state.status === 'success' && state.data.data.length > 0 && (
          <>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {state.data.data.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
            <Pagination meta={state.data.meta} makeLink={makePageLink} />
          </>
        )}
      </section>
    </div>
  );
}
