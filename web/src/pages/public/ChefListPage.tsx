import { useMemo, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { ChefCard } from '../../components/cards';
import Fog from '../../components/Fog';
import PaginationControls from '../../components/PaginationControls';
import PaginationModeSelector from '../../components/PaginationModeSelector';
import ShareButton from '../../components/ShareButton';
import { EmptyState, ErrorPanel, LoadingBlock } from '../../components/States';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import type { Chef } from '../../types';

export default function ChefListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';

  const listParams = useMemo(
    () => ({
      q: q || undefined,
    }),
    [q]
  );
  const filterKey = `${q}`;

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
  } = usePaginatedList<Chef>({
    fetchFn: api.chefs.list,
    filterParams: listParams,
    filterKey,
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    const keyword = String(data.get('q') ?? '').trim();
    if (keyword) next.set('q', keyword);
    if (searchParams.get('displayMode')) {
      next.set('displayMode', searchParams.get('displayMode')!);
    }
    setSearchParams(next);
  };

  return (
    <div>
      <section className="relative overflow-hidden border-b border-sand bg-cream">
        <Fog />
        <div className="relative mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-sand-dark bg-ivory px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-olive">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-terracotta" aria-hidden="true" />
            Bàn Tay Tài Hoa
          </p>
          <h1 className="mt-5 font-serif text-4xl font-semibold text-charcoal sm:text-5xl">
            Những Nghệ Nhân Ẩm Thực
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Gặp gỡ những đầu bếp tâm huyết, những người thổi hồn câu chuyện văn hóa vào từng hương
            vị tinh tế của Ấm Vị.
          </p>
          <form onSubmit={submit} className="mt-8 flex max-w-xl flex-wrap gap-3">
            <input
              key={q}
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Tìm theo tên, chức danh, kinh nghiệm, tiểu sử..."
              className="min-w-0 flex-1 rounded-xl border border-sand-dark bg-ivory px-4 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/20"
            />
            <button
              type="submit"
              className="rounded-xl bg-olive px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-dark"
            >
              Tìm Kiếm
            </button>
            {q && (
              <Link
                to="/chefs"
                className="self-center text-sm font-semibold text-terracotta underline-offset-4 hover:underline"
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
                {meta.total} đầu bếp đồng hành cùng Ấm Vị
                {currentMode !== 'numbered' && items.length > 0 && ` • Đang hiển thị ${items.length} đầu bếp`}
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
            title="Không Tìm Thấy Đầu Bếp"
            description="Không có dữ liệu đầu bếp nào khớp với từ khóa tìm kiếm của bạn."
            actionText="Xem Tất Cả Đầu Bếp"
            actionLink="/chefs"
          />
        )}
        {!loading && !error && items.length > 0 && (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((chef) => (
                <ChefCard key={chef.id} chef={chef} />
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
              itemName="đầu bếp"
            />
          </>
        )}
      </section>
    </div>
  );
}
