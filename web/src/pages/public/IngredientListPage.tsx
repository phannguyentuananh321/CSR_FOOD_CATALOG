import { useMemo, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { IngredientCard } from '../../components/cards';
import Fog from '../../components/Fog';
import PaginationControls from '../../components/PaginationControls';
import PaginationModeSelector from '../../components/PaginationModeSelector';
import ShareButton from '../../components/ShareButton';
import { EmptyState, ErrorPanel, LoadingBlock } from '../../components/States';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import type { Ingredient } from '../../types';

export default function IngredientListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const category = searchParams.get('category') ?? '';

  const listParams = useMemo(
    () => ({
      q: q || undefined,
      category: category || undefined,
    }),
    [q, category]
  );
  const filterKey = `${q}|${category}`;

  const {
    items,
    meta,
    loading,
    loadingMore,
    error,
    currentMode,
    currentPage,
    hasMore,
    changeMode,
    loadNextPage,
    makePageLink,
    sentinelRef,
    retry,
  } = usePaginatedList<Ingredient>({
    fetchFn: api.ingredients.list,
    filterParams: listParams,
    filterKey,
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const keyword = String(data.get('q') ?? '').trim();
    if (keyword) next.set('q', keyword);
    const cat = String(data.get('category') ?? '');
    if (cat) next.set('category', cat);
    if (searchParams.get('displayMode')) {
      next.set('displayMode', searchParams.get('displayMode')!);
    }
    setSearchParams(next);
  };

  const categories = meta.categories ?? [];
  const hasFilter = Boolean(q || category);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-sand bg-cream">
        <Fog />
        <div className="relative mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-sand-dark bg-ivory px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-olive">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-terracotta" aria-hidden="true" />
            Hương Vị Bản Địa
          </p>
          <h1 className="mt-5 font-serif text-4xl font-semibold text-charcoal sm:text-5xl">
            Nguyên Liệu Tinh Tuyển
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Từ những cánh rừng thảo mộc Tây Bắc đến vựa muối biển Phú Quốc, khám phá cội nguồn làm
            nên nét đặc trưng của ẩm thực đất Việt.
          </p>
          <form onSubmit={submit} className="mt-8 flex max-w-2xl flex-wrap items-center gap-3">
            <input
              key={q}
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Tìm theo tên, danh mục, đơn vị, mô tả..."
              className="min-w-0 flex-1 rounded-xl border border-sand-dark bg-ivory px-4 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
            />
            <select
              key={category}
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
            <button
              type="submit"
              className="rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark"
            >
              Tìm Kiếm
            </button>
            {hasFilter && (
              <Link
                to="/ingredients"
                className="text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
              >
                Đặt lại
              </Link>
            )}
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            {!loading && (
              <p className="text-sm text-muted">
                {meta.total} nguyên liệu tinh tuyển
                {currentMode !== 'numbered' && items.length > 0 && ` • Đang hiển thị ${items.length} nguyên liệu`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ShareButton label="Chia sẻ trang này" />
            <PaginationModeSelector currentMode={currentMode} onModeChange={changeMode} />
          </div>
        </div>

        {loading && <LoadingBlock />}
        {error && <ErrorPanel message={error} onRetry={retry} />}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            title="Không Tìm Thấy Nguyên Liệu"
            description="Không có nguyên liệu nào khớp với từ khóa hoặc bộ lọc của bạn."
            actionText="Xem Tất Cả Nguyên Liệu"
            actionLink="/ingredients"
          />
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((ingredient) => (
                <IngredientCard key={ingredient.id} ingredient={ingredient} />
              ))}
            </div>
            <PaginationControls
              meta={{ ...meta, page: currentPage }}
              currentMode={currentMode}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadNextPage}
              makeLink={makePageLink}
              sentinelRef={sentinelRef}
              itemName="nguyên liệu"
            />
          </>
        )}
      </section>
    </div>
  );
}
